import { randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import { pool } from '../database/pool.js';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { securityRepository } from '../security/repository.js';
import { credentialDigest, normalizeCredentialValue } from './resolver.js';

export type CredentialOwnerType = 'student' | 'employee';
export type CredentialType = 'rfid' | 'qr';
export type CredentialStatus = 'active' | 'inactive' | 'lost' | 'replaced' | 'revoked';
type Context = { actorId: string; requestId: string };

const camel = (value: string) => value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const map = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [camel(key), value]));

const publicSelect = `c.id,c.subject_type owner_type,c.credential_type,c.display_suffix,c.status,c.issued_at,c.expires_at,c.last_used_at,c.created_at,c.updated_at,c.version`;
const publicReturning = `id,subject_type owner_type,credential_type,display_suffix,status,issued_at,expires_at,last_used_at,created_at,updated_at,version`;
const allowedTransitions: Record<CredentialStatus, readonly CredentialStatus[]> = {
  active: ['inactive', 'lost', 'replaced', 'revoked'],
  inactive: ['active', 'revoked'],
  lost: ['active', 'replaced', 'revoked'],
  replaced: [],
  revoked: [],
};

export class CredentialRepository {
  async list(ownerType: CredentialOwnerType, ownerId: string) {
    const column = ownerType === 'student' ? 'student_id' : 'employee_id';
    const result = await pool.query(`SELECT ${publicSelect} FROM credentials c WHERE c.subject_type=$1 AND c.${column}=$2 ORDER BY c.created_at DESC`, [ownerType, ownerId]);
    return result.rows.map(map);
  }

  private async ensureOwner(client: PoolClient, ownerType: CredentialOwnerType, ownerId: string) {
    const table = ownerType === 'student' ? 'students' : 'employees';
    const result = await client.query(`SELECT id FROM ${table} WHERE id=$1 AND archived_at IS NULL`, [ownerId]);
    if (!result.rowCount) throw new AppError(404, 'CREDENTIAL_OWNER_NOT_FOUND', 'The credential owner was not found');
  }

  async register(data: { ownerType: CredentialOwnerType; ownerId: string; credentialType: CredentialType; credentialValue?: string | undefined; generate?: boolean | undefined; expiresAt?: string | null | undefined }, context: Context) {
    const value = data.generate ? `MMSC-QR-${randomBytes(24).toString('base64url')}` : normalizeCredentialValue(data.credentialValue??'');
    if (!value) throw new AppError(400, 'CREDENTIAL_VALUE_REQUIRED', 'Enter or scan a credential value');
    if (data.expiresAt && new Date(data.expiresAt).getTime() <= Date.now()) throw new AppError(400, 'CREDENTIAL_EXPIRATION_INVALID', 'Credential expiration must be in the future');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await this.ensureOwner(client, data.ownerType, data.ownerId);
      const result = await client.query(
        `INSERT INTO credentials(subject_type,student_id,employee_id,credential_type,value_digest,display_suffix,expires_at,created_by,updated_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING ${publicReturning}`,
        [data.ownerType, data.ownerType === 'student' ? data.ownerId : null, data.ownerType === 'employee' ? data.ownerId : null, data.credentialType, credentialDigest(value), value.slice(-6), data.expiresAt ?? null, context.actorId],
      );
      await securityRepository.audit({ actorUserId: context.actorId, action: 'credential.register', targetType: 'identity_credential', targetId: String(result.rows[0].id), outcome: 'success', requestId: context.requestId, metadata: { ownerType: data.ownerType, ownerId: data.ownerId, credentialType: data.credentialType } }, client);
      await client.query('COMMIT');
      return { item: map(result.rows[0]), issuedValue: data.generate ? value : undefined };
    } catch (error) {
      await client.query('ROLLBACK');
      if ((error as { code?: string }).code === '23505') throw new AppError(409, 'CREDENTIAL_ALREADY_ASSIGNED', 'This credential is already assigned to an active identity');
      throw error;
    } finally { client.release(); }
  }

  async transition(id: string, status: CredentialStatus, version: number, replacementValue: string | undefined, context: Context) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query(`SELECT * FROM credentials WHERE id=$1 FOR UPDATE`, [id]);
      if (!current.rows[0]) throw new AppError(404, 'CREDENTIAL_NOT_FOUND', 'Credential was not found');
      if (Number(current.rows[0].version) !== version) throw new AppError(409, 'VERSION_CONFLICT', 'Credential was changed by another user');
      const previousStatus = current.rows[0].status as CredentialStatus;
      if (!allowedTransitions[previousStatus]?.includes(status)) throw new AppError(409, 'CREDENTIAL_TRANSITION_INVALID', `Credential cannot change from ${previousStatus} to ${status}`);
      let replacementId: string | null = null;
      let issuedValue: string | undefined;
      if (status === 'replaced') {
        issuedValue = replacementValue?.trim() || (current.rows[0].credential_type === 'qr' ? `MMSC-QR-${randomBytes(24).toString('base64url')}` : undefined);
        if (!issuedValue) throw new AppError(400, 'REPLACEMENT_VALUE_REQUIRED', 'Scan or enter the replacement RFID value');
        await client.query(`UPDATE credentials SET status='replaced',revoked_at=now(),updated_at=now(),updated_by=$2,version=version+1 WHERE id=$1`, [id, context.actorId]);
        const replacement = await client.query(
          `INSERT INTO credentials(subject_type,student_id,employee_id,credential_type,value_digest,display_suffix,expires_at,created_by,updated_by)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING id`,
          [current.rows[0].subject_type,current.rows[0].student_id,current.rows[0].employee_id,current.rows[0].credential_type,credentialDigest(issuedValue),issuedValue.slice(-6),current.rows[0].expires_at,context.actorId],
        );
        replacementId = String(replacement.rows[0].id);
        await client.query(`UPDATE credentials SET replaced_by_credential_id=$2 WHERE id=$1`, [id, replacementId]);
      } else {
        const result = await client.query(`UPDATE credentials SET status=$2,revoked_at=CASE WHEN $2::varchar='revoked' THEN now() ELSE revoked_at END,updated_at=now(),updated_by=$3,version=version+1 WHERE id=$1 RETURNING id`, [id,status,context.actorId]);
        if (!result.rowCount) throw new AppError(404, 'CREDENTIAL_NOT_FOUND', 'Credential was not found');
      }
      await securityRepository.audit({ actorUserId: context.actorId, action: `credential.${status}`, targetType: 'identity_credential', targetId: id, outcome: 'success', requestId: context.requestId, metadata: { previousStatus, newStatus: status, ...(replacementId ? { replacementId } : {}) } }, client);
      const transitioned = await client.query(`SELECT ${publicSelect} FROM credentials c WHERE c.id=$1`, [id]);
      const item = map(transitioned.rows[0]);
      await client.query('COMMIT');
      return { item, replacementId, issuedValue };
    } catch (error) {
      await client.query('ROLLBACK');
      if ((error as { code?: string }).code === '23505') throw new AppError(409, 'CREDENTIAL_ALREADY_ASSIGNED', 'This credential is already assigned to an active identity');
      if (!(error instanceof AppError)) logger.error({ err:error, requestId:context.requestId, credentialId:id, action:'credential.transition', actorUserId:context.actorId, targetStatus:status, databaseCode:(error as {code?:string}).code }, 'Credential lifecycle transition failed');
      throw error;
    } finally { client.release(); }
  }

  async find(id: string) {
    const result = await pool.query(`SELECT ${publicSelect} FROM credentials c WHERE c.id=$1`, [id]);
    return result.rows[0] ? map(result.rows[0]) : null;
  }

  async terminalCache(terminalId: string, deviceId: string, changedSince?: string) {
    const device = await pool.query(`SELECT 1 FROM attendance_terminal_devices d JOIN attendance_terminals t ON t.id=d.terminal_id WHERE d.id=$1 AND d.terminal_id=$2 AND d.status='active' AND t.status='active'`, [deviceId,terminalId]);
    if (!device.rowCount) throw new AppError(403,'TERMINAL_DEVICE_REVOKED','The attendance terminal device is not active');
    const values: unknown[] = [];
    const changed = changedSince ? (values.push(changedSince), `AND GREATEST(c.updated_at,COALESCE(s.updated_at,'epoch'),COALESCE(e.updated_at,'epoch'),COALESCE(sa.changed_at,'epoch'),COALESCE(ea.changed_at,'epoch'))>$${values.length}`) : '';
    const result = await pool.query(
      `SELECT c.id credential_id,c.value_digest lookup_digest,c.credential_type,c.status credential_status,c.expires_at,GREATEST(c.updated_at,COALESCE(s.updated_at,'epoch'),COALESCE(e.updated_at,'epoch'),COALESCE(sa.changed_at,'epoch'),COALESCE(ea.changed_at,'epoch'),COALESCE(ats.captured_at,'epoch')) updated_at,c.subject_type identity_type,
       COALESCE(c.student_id,c.employee_id) identity_id,COALESCE(s.student_number,e.employee_number) identifier,
       CASE WHEN c.subject_type='student' THEN concat_ws(' ',s.first_name,s.middle_name,s.last_name,s.suffix)
            ELSE concat_ws(' ',e.first_name,e.middle_name,e.last_name,e.suffix) END display_name,
       COALESCE(s.profile_photo_url,e.profile_photo_url) profile_photo_url,
       CASE WHEN c.subject_type='student' THEN s.archived_at IS NULL AND s.enrollment_status='enrolled' AND EXISTS(SELECT 1 FROM enrollments en WHERE en.student_id=s.id AND en.status='enrolled')
            ELSE e.archived_at IS NULL AND e.employment_status='active' END eligible,
       CASE WHEN c.subject_type='student' THEN sa.last_attendance_date ELSE ea.last_attendance_date END last_attendance_date,
       ats.attendance_direction last_attendance_direction,ats.captured_at last_attendance_at
       FROM credentials c LEFT JOIN students s ON s.id=c.student_id LEFT JOIN employees e ON e.id=c.employee_id
       LEFT JOIN LATERAL(SELECT max(ar.attendance_date)::text last_attendance_date,max(ar.updated_at) changed_at FROM student_attendance_records ar JOIN enrollments en ON en.id=ar.enrollment_id WHERE en.student_id=s.id AND ar.attendance_scope='campus' AND ar.archived_at IS NULL)sa ON c.subject_type='student'
       LEFT JOIN LATERAL(SELECT max(ar.attendance_date)::text last_attendance_date,max(ar.updated_at) changed_at FROM employee_attendance_records ar WHERE ar.employee_id=e.id AND ar.archived_at IS NULL)ea ON c.subject_type='employee'
       LEFT JOIN LATERAL(SELECT te.attendance_direction,te.captured_at FROM attendance_terminal_events te WHERE te.subject_type=c.subject_type AND te.subject_id=COALESCE(c.student_id,c.employee_id) AND te.outcome='accepted' AND te.attendance_direction IS NOT NULL ORDER BY te.captured_at DESC,te.processed_at DESC,te.id DESC LIMIT 1)ats ON true
       WHERE c.credential_type IN('qr','rfid') ${changed} ORDER BY c.updated_at,c.id`, values);
    const synchronizedAt = new Date().toISOString();
    await pool.query(`UPDATE attendance_terminals SET last_sync_at=now(),last_seen_at=now() WHERE id=$1`, [terminalId]);
    return { items: result.rows.map(map), synchronizedAt, serverTime: synchronizedAt };
  }
}

export const credentialRepository = new CredentialRepository();
