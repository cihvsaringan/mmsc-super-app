import { pool } from '../database/pool.js';
import { securityRepository } from '../security/repository.js';

type Context = { actorId: string; requestId: string; ip?: string | undefined };

const one = async <T extends Record<string, unknown>>(sql: string): Promise<T> => {
  const result = await pool.query<T>(sql);
  return result.rows[0] ?? {} as T;
};

export class OperationalRepository {
  async snapshot() {
    const [database, seeds, accounts, sessions, workflows, terminals, storage, failures] = await Promise.all([
      one<{ migration_count: number; latest_migration: string | null; latest_migration_at: Date | null }>(`
        SELECT count(*)::int migration_count, max(name) latest_migration, max(executed_at) latest_migration_at
        FROM schema_migrations`),
      one<{ seed_count: number; latest_seed: string | null; latest_seed_at: Date | null }>(`
        SELECT count(*)::int seed_count, (array_agg(name ORDER BY executed_at DESC))[1] latest_seed,
          max(executed_at) latest_seed_at FROM seed_executions`),
      one<{ active: number; inactive: number; locked: number; password_change_required: number }>(`
        SELECT count(*) FILTER(WHERE status='active')::int active,
          count(*) FILTER(WHERE status='inactive')::int inactive,
          count(*) FILTER(WHERE locked_until>now())::int locked,
          count(*) FILTER(WHERE must_change_password)::int password_change_required
        FROM users WHERE archived_at IS NULL`),
      one<{ active: number; stale: number; revoked: number }>(`
        SELECT count(*) FILTER(WHERE s.revoked_at IS NULL AND s.expires_at>now() AND u.status='active' AND u.archived_at IS NULL)::int active,
          count(*) FILTER(WHERE s.revoked_at IS NULL AND (s.expires_at<=now() OR u.status<>'active' OR u.archived_at IS NOT NULL))::int stale,
          count(*) FILTER(WHERE s.revoked_at IS NOT NULL)::int revoked
        FROM auth_sessions s JOIN users u ON u.id=s.user_id`),
      one<{ admissions: number; gradebooks: number; attendance_exceptions: number; notification_drafts: number; unread_notifications: number }>(`
        SELECT
          (SELECT count(*)::int FROM admission_applications WHERE archived_at IS NULL AND status IN('submitted','under_review','information_requested')) admissions,
          (SELECT count(*)::int FROM gradebooks WHERE status IN('submitted','reviewed')) gradebooks,
          (SELECT count(*)::int FROM attendance_manual_events WHERE exception_status='open') attendance_exceptions,
          (SELECT count(*)::int FROM notifications WHERE status='draft') notification_drafts,
          (SELECT count(*)::int FROM notification_recipients WHERE read_at IS NULL AND archived_at IS NULL) unread_notifications`),
      one<{ active: number; inactive: number; revoked: number; active_sessions: number; rejected_24h: number; stale_active: number }>(`
        SELECT count(*) FILTER(WHERE status='active')::int active,
          count(*) FILTER(WHERE status='inactive')::int inactive,
          count(*) FILTER(WHERE status='revoked')::int revoked,
          (SELECT count(*)::int FROM attendance_terminal_devices WHERE status='active') active_sessions,
          (SELECT count(*)::int FROM attendance_terminal_events WHERE outcome='rejected' AND processed_at>=now()-interval '24 hours') rejected_24h,
          count(*) FILTER(WHERE status='active' AND (last_seen_at IS NULL OR last_seen_at<now()-interval '24 hours'))::int stale_active
        FROM attendance_terminals`),
      one<{ asset_count: number; stored_bytes: number }>(`
        SELECT count(*)::int asset_count, COALESCE(sum(size_bytes),0)::bigint stored_bytes FROM media_assets`),
      pool.query<{ id: string; action: string; actor_name: string | null; occurred_at: Date }>(`
        SELECT ae.id,ae.action,u.display_name actor_name,ae.occurred_at
        FROM audit_events ae LEFT JOIN users u ON u.id=ae.actor_user_id
        WHERE ae.outcome='failure' AND ae.occurred_at>=now()-interval '24 hours'
        ORDER BY ae.occurred_at DESC LIMIT 8`),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      service: { api: 'available' as const, database: 'available' as const },
      database: { migrationCount: database.migration_count, latestMigration: database.latest_migration, latestMigrationAt: database.latest_migration_at, seedCount: seeds.seed_count, latestSeed: seeds.latest_seed, latestSeedAt: seeds.latest_seed_at },
      accounts: { active: accounts.active, inactive: accounts.inactive, locked: accounts.locked, passwordChangeRequired: accounts.password_change_required },
      sessions,
      workflows: { admissions: workflows.admissions, gradebooks: workflows.gradebooks, attendanceExceptions: workflows.attendance_exceptions, notificationDrafts: workflows.notification_drafts, unreadNotifications: workflows.unread_notifications },
      terminals: { active: terminals.active, inactive: terminals.inactive, revoked: terminals.revoked, activeSessions: terminals.active_sessions, rejected24h: terminals.rejected_24h, staleActive: terminals.stale_active },
      storage: { assetCount: storage.asset_count, storedBytes: Number(storage.stored_bytes) },
      recentFailures: failures.rows.map((item) => ({ id: item.id, action: item.action, actorName: item.actor_name, occurredAt: item.occurred_at })),
    };
  }

  async closeStaleSessions(context: Context) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ id: string }>(`
        UPDATE auth_sessions s SET revoked_at=now()
        FROM users u WHERE u.id=s.user_id AND s.revoked_at IS NULL
          AND (s.expires_at<=now() OR u.status<>'active' OR u.archived_at IS NOT NULL)
        RETURNING s.id`);
      await securityRepository.audit({
        actorUserId: context.actorId,
        action: 'administration.sessions.close_stale',
        targetType: 'auth_session',
        outcome: 'success', requestId: context.requestId, ipAddress: context.ip,
        metadata: { affectedCount: result.rowCount ?? 0 },
      }, client);
      await client.query('COMMIT');
      return { affectedCount: result.rowCount ?? 0 };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const operationalRepository = new OperationalRepository();
