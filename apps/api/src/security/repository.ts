import type { PoolClient } from 'pg';
import { pool } from '../database/pool.js';

export type UserStatus = 'active' | 'inactive';
export type AccountType = 'system'|'employee'|'student'|'guardian';
export type AuthUser = { id: string; email: string; username: string | null; loginIdentifier: string | null; displayName: string; status: UserStatus; accountType: AccountType; mustChangePassword: boolean; roles: string[]; permissions: string[] };
export type LoginUser = AuthUser & { passwordHash: string; failedLoginCount: number; lockedUntil: Date | null; eligible: boolean };
export type AuditInput = { actorUserId?: string | null | undefined; action: string; targetType?: string | undefined; targetId?: string | undefined; outcome: 'success' | 'failure'; requestId?: string | undefined; ipAddress?: string | undefined; metadata?: Record<string, unknown> | undefined };

const authUserQuery = `
  SELECT u.id, u.email, u.display_name, u.status, u.account_type, u.must_change_password, u.created_at, u.last_login_at, u.locked_until,
    COALESCE(
      (SELECT e.employee_number FROM employees e WHERE e.user_id=u.id AND e.archived_at IS NULL LIMIT 1),
      (SELECT s.student_number FROM students s WHERE s.user_id=u.id AND s.archived_at IS NULL LIMIT 1),
      (SELECT g.guardian_number FROM guardians g WHERE g.user_id=u.id AND g.archived_at IS NULL LIMIT 1)
    ) linked_reference,
    max(li.normalized_value) FILTER(WHERE li.type='username' AND li.active) username,
    COALESCE(max(li.normalized_value) FILTER(WHERE li.type='username' AND li.active),max(li.normalized_value) FILTER(WHERE li.type<>'username' AND li.active)) login_identifier,
    COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') roles,
    COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), '{}') permissions
  FROM users u
  LEFT JOIN user_roles ur ON ur.user_id = u.id
  LEFT JOIN roles r ON r.id = ur.role_id AND r.archived_at IS NULL
  LEFT JOIN role_permissions rp ON rp.role_id = r.id
  LEFT JOIN permissions p ON p.id = rp.permission_id
`;

const mapAuthUser = (row: Record<string, unknown>): AuthUser => ({
  id: String(row.id), email: row.email ? String(row.email) : '', username: row.username ? String(row.username) : null, loginIdentifier: row.login_identifier ? String(row.login_identifier) : null, displayName: String(row.display_name),
  accountType: row.account_type as AccountType, mustChangePassword: Boolean(row.must_change_password),
  status: row.status as UserStatus, roles: row.roles as string[], permissions: row.permissions as string[],
});

export class SecurityRepository {
  async findPasswordUserById(userId:string):Promise<{id:string;passwordHash:string}|null>{const result=await pool.query('SELECT id,password_hash FROM users WHERE id=$1 AND archived_at IS NULL',[userId]);const row=result.rows[0] as Record<string,unknown>|undefined;return row?{id:String(row.id),passwordHash:String(row.password_hash)}:null;}
  async findLoginUser(identifier: string): Promise<LoginUser | null> {
    const result = await pool.query(`SELECT u.id, u.email, u.display_name, u.status, u.account_type, u.must_change_password, u.password_hash, u.failed_login_count, u.locked_until,
      matched.normalized_value login_identifier, max(li.normalized_value) FILTER(WHERE li.type='username' AND li.active) username,
      COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') roles,
      COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), '{}') permissions,
      CASE u.account_type
       WHEN 'employee' THEN EXISTS(SELECT 1 FROM employees e WHERE e.user_id=u.id AND e.archived_at IS NULL AND e.employment_status IN('active','on_leave'))
       WHEN 'student' THEN EXISTS(SELECT 1 FROM students st JOIN enrollments en ON en.student_id=st.id JOIN school_years sy ON sy.id=en.school_year_id WHERE st.user_id=u.id AND st.archived_at IS NULL AND st.enrollment_status='enrolled' AND en.status IN('pending','enrolled') AND sy.status IN('planned','active'))
       WHEN 'guardian' THEN EXISTS(SELECT 1 FROM guardians g JOIN student_guardians sg ON sg.guardian_id=g.id JOIN students st ON st.id=sg.student_id WHERE g.user_id=u.id AND g.archived_at IS NULL AND sg.archived_at IS NULL AND sg.receives_communications AND st.archived_at IS NULL AND st.enrollment_status='enrolled')
       ELSE true END eligible
      FROM login_identities matched JOIN users u ON u.id=matched.user_id LEFT JOIN login_identities li ON li.user_id=u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id LEFT JOIN roles r ON r.id = ur.role_id AND r.archived_at IS NULL
      LEFT JOIN role_permissions rp ON rp.role_id = r.id LEFT JOIN permissions p ON p.id = rp.permission_id
      WHERE matched.normalized_value = $1 AND matched.active AND u.archived_at IS NULL GROUP BY u.id,matched.normalized_value`, [identifier]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? { ...mapAuthUser(row), passwordHash: String(row.password_hash), failedLoginCount: Number(row.failed_login_count), lockedUntil: row.locked_until as Date | null, eligible: Boolean(row.eligible) } : null;
  }

  async findBySessionDigest(digest: string): Promise<(AuthUser & { sessionId: string }) | null> {
    const result = await pool.query(`SELECT u.id, u.email, u.display_name, u.status, u.account_type, u.must_change_password, s.id session_id,
      max(li.normalized_value) FILTER(WHERE li.type='username' AND li.active) username,
      COALESCE(max(li.normalized_value) FILTER(WHERE li.type='username' AND li.active),max(li.normalized_value) FILTER(WHERE li.type<>'username' AND li.active)) login_identifier,
      COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') roles,
      COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), '{}') permissions
      FROM auth_sessions s JOIN users u ON u.id = s.user_id
      LEFT JOIN login_identities li ON li.user_id=u.id LEFT JOIN user_roles ur ON ur.user_id = u.id LEFT JOIN roles r ON r.id = ur.role_id AND r.archived_at IS NULL
      LEFT JOIN role_permissions rp ON rp.role_id = r.id LEFT JOIN permissions p ON p.id = rp.permission_id
      WHERE s.token_digest = $1 AND s.revoked_at IS NULL AND s.expires_at > now() AND u.status = 'active' AND u.archived_at IS NULL
      GROUP BY u.id, s.id`, [digest]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return { ...mapAuthUser(row), sessionId: String(row.session_id) };
  }

  async registerFailedLogin(userId: string): Promise<void> {
    await pool.query(`UPDATE users SET failed_login_count = failed_login_count + 1,
      locked_until = CASE WHEN failed_login_count + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END,
      updated_at = now(), version = version + 1 WHERE id = $1`, [userId]);
  }

  async registerSuccessfulLogin(userId: string): Promise<void> {
    await pool.query(`UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = now(), updated_at = now(), version = version + 1 WHERE id = $1`, [userId]);
  }

  async createSession(input: { userId: string; digest: string; expiresAt: Date; ip?: string | undefined; userAgent?: string | undefined }): Promise<void> {
    const client=await pool.connect();try{await client.query('BEGIN');await client.query(`INSERT INTO auth_sessions (user_id, token_digest, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)`,[input.userId,input.digest,input.expiresAt,input.ip??null,input.userAgent?.slice(0,500)??null]);await client.query(`UPDATE auth_sessions SET revoked_at=now() WHERE id IN(SELECT id FROM auth_sessions WHERE user_id=$1 AND revoked_at IS NULL AND expires_at>now() ORDER BY created_at DESC OFFSET 5)`,[input.userId]);await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
  }

  async touchSession(sessionId: string): Promise<void> {
    await pool.query(`UPDATE auth_sessions SET last_seen_at = now() WHERE id = $1 AND last_seen_at < now() - interval '5 minutes'`, [sessionId]);
  }

  async revokeSession(sessionId: string): Promise<void> {
    await pool.query('UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE id = $1', [sessionId]);
  }

  async audit(input: AuditInput, client?: PoolClient): Promise<void> {
    const executor = client ?? pool;
    await executor.query(`INSERT INTO audit_events (actor_user_id, action, target_type, target_id, outcome, request_id, ip_address, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`, [input.actorUserId ?? null, input.action, input.targetType ?? null, input.targetId ?? null, input.outcome, input.requestId ?? null, input.ipAddress ?? null, JSON.stringify(input.metadata ?? {})]);
  }

  async listUsers(): Promise<unknown[]> {
    const result = await pool.query(`${authUserQuery} LEFT JOIN login_identities li ON li.user_id=u.id WHERE u.archived_at IS NULL GROUP BY u.id ORDER BY u.display_name`);
    return result.rows.map((row) => ({ ...mapAuthUser(row), createdAt: row.created_at, lastLoginAt: row.last_login_at, lockedUntil: row.locked_until, linkedReference: row.linked_reference }));
  }

  async createUser(input: { email: string; displayName: string; passwordHash: string; actorId: string; requestId: string; ip?: string | undefined }): Promise<AuthUser> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const created = await client.query(`INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, display_name, status`, [input.email, input.displayName, input.passwordHash]);
      const row = created.rows[0] as Record<string, unknown>;
      await this.audit({ actorUserId: input.actorId, action: 'security.user.create', targetType: 'user', targetId: String(row.id), outcome: 'success', requestId: input.requestId, ipAddress: input.ip }, client);
      await client.query('COMMIT');
      return { ...mapAuthUser({ ...row, roles: [], permissions: [] }) };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async setUserStatus(input: { userId: string; status: UserStatus; actorId: string; requestId: string; ip?: string | undefined }): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(`UPDATE users SET status = $2, updated_at = now(), version = version + 1 WHERE id = $1 AND archived_at IS NULL`, [input.userId, input.status]);
      if (input.status === 'inactive') await client.query(`UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE user_id = $1`, [input.userId]);
      if (result.rowCount) await this.audit({ actorUserId: input.actorId, action: 'security.user.status_change', targetType: 'user', targetId: input.userId, outcome: 'success', requestId: input.requestId, ipAddress: input.ip, metadata: { status: input.status } }, client);
      await client.query('COMMIT'); return Boolean(result.rowCount);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async isLastActiveSuperAdministrator(userId: string): Promise<boolean> {
    const result = await pool.query(`SELECT EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1 AND r.code = 'super_administrator'
    ) is_super, (
      SELECT count(*) FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
      WHERE r.code = 'super_administrator' AND u.status = 'active' AND u.archived_at IS NULL
    ) active_count`, [userId]);
    return Boolean(result.rows[0]?.is_super) && Number(result.rows[0]?.active_count) <= 1;
  }

  async roleCode(roleId: string): Promise<string | null> {
    const result = await pool.query<{ code: string }>('SELECT code FROM roles WHERE id = $1 AND archived_at IS NULL', [roleId]);
    return result.rows[0]?.code ?? null;
  }

  async assignRole(input: { userId: string; roleId: string; actorId: string; requestId: string; ip?: string | undefined }): Promise<void> {
    const client = await pool.connect();
    try { await client.query('BEGIN'); await client.query(`INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [input.userId, input.roleId, input.actorId]);
      await this.audit({ actorUserId: input.actorId, action: 'security.user.role_assign', targetType: 'user', targetId: input.userId, outcome: 'success', requestId: input.requestId, ipAddress: input.ip, metadata: { roleId: input.roleId } }, client); await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async removeRole(input: { userId: string; roleId: string; actorId: string; requestId: string; ip?: string | undefined }): Promise<void> {
    const client = await pool.connect();
    try { await client.query('BEGIN'); await client.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [input.userId, input.roleId]);
      await this.audit({ actorUserId: input.actorId, action: 'security.user.role_remove', targetType: 'user', targetId: input.userId, outcome: 'success', requestId: input.requestId, ipAddress: input.ip, metadata: { roleId: input.roleId } }, client); await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async listRoles(): Promise<unknown[]> {
    const result = await pool.query(`SELECT r.id, r.code, r.name, r.description, r.is_system,
      count(DISTINCT ur.user_id)::int "userCount", COALESCE(array_agg(DISTINCT p.code ORDER BY p.code) FILTER (WHERE p.code IS NOT NULL), '{}') permissions
      FROM roles r LEFT JOIN user_roles ur ON ur.role_id=r.id LEFT JOIN role_permissions rp ON rp.role_id = r.id LEFT JOIN permissions p ON p.id = rp.permission_id
      WHERE r.archived_at IS NULL GROUP BY r.id ORDER BY r.name`); return result.rows;
  }

  async listPermissions(): Promise<unknown[]> { return (await pool.query('SELECT id, code, description FROM permissions ORDER BY code')).rows; }

  async createRole(input: { code: string; name: string; description?: string | undefined; actorId: string; requestId: string; ip?: string | undefined }): Promise<unknown> {
    const client = await pool.connect();
    try { await client.query('BEGIN'); const result = await client.query(`INSERT INTO roles (code, name, description) VALUES ($1, $2, $3) RETURNING id, code, name, description, is_system`, [input.code, input.name, input.description ?? null]);
      const role = result.rows[0] as Record<string, unknown>; await this.audit({ actorUserId: input.actorId, action: 'security.role.create', targetType: 'role', targetId: String(role.id), outcome: 'success', requestId: input.requestId, ipAddress: input.ip }, client); await client.query('COMMIT'); return { ...role, permissions: [] };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async setRolePermissions(input: { roleId: string; permissionIds: string[]; actorId: string; requestId: string; ip?: string | undefined }): Promise<void> {
    const client = await pool.connect();
    try { await client.query('BEGIN'); await client.query('DELETE FROM role_permissions WHERE role_id = $1', [input.roleId]);
      for (const permissionId of input.permissionIds) await client.query('INSERT INTO role_permissions (role_id, permission_id, granted_by) VALUES ($1, $2, $3)', [input.roleId, permissionId, input.actorId]);
      await this.audit({ actorUserId: input.actorId, action: 'security.role.permissions_change', targetType: 'role', targetId: input.roleId, outcome: 'success', requestId: input.requestId, ipAddress: input.ip, metadata: { permissionIds: input.permissionIds } }, client); await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async updatePassword(input: { userId: string; passwordHash: string; currentSessionId: string }): Promise<void> {
    const client = await pool.connect();
    try { await client.query('BEGIN'); await client.query(`UPDATE users SET password_hash = $2, must_change_password=false, password_changed_at = now(), failed_login_count = 0, locked_until = NULL, updated_at = now(), version = version + 1 WHERE id = $1`, [input.userId, input.passwordHash]);
      await client.query(`UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE user_id = $1 AND id <> $2`, [input.userId, input.currentSessionId]); await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async listAudit(limit: number): Promise<unknown[]> {
    return (await pool.query(`SELECT ae.id, ae.action, ae.target_type, ae.target_id, ae.outcome, ae.occurred_at, ae.ip_address,
      u.display_name actor_name FROM audit_events ae LEFT JOIN users u ON u.id = ae.actor_user_id ORDER BY ae.occurred_at DESC LIMIT $1`, [limit])).rows;
  }
}

export const securityRepository = new SecurityRepository();
