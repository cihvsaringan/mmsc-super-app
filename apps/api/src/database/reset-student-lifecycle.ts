import 'dotenv/config';
import type { PoolClient } from 'pg';
import { env } from '../config/env.js';
import { storage } from '../media/storage.js';
import { pool } from './pool.js';
import { assertStudentLifecycleResetAllowed } from './student-lifecycle-reset-guard.js';

assertStudentLifecycleResetAllowed({
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  confirmation: process.env.MMSC_STUDENT_LIFECYCLE_RESET,
});

type Counts = Record<string, number>;
const deleted: Counts = {};
const removedFiles: string[] = [];
const missingFiles: string[] = [];

async function remove(client: PoolClient, key: string, sql: string) {
  const result = await client.query(sql);
  deleted[key] = result.rowCount ?? 0;
}

async function counts(client: PoolClient) {
  const result = await client.query<{ entity: string; count: number }>(`
    SELECT 'admission_applications' entity,count(*)::int count FROM admission_applications
    UNION ALL SELECT 'admission_status_history',count(*)::int FROM admission_status_history
    UNION ALL SELECT 'students',count(*)::int FROM students
    UNION ALL SELECT 'enrollments',count(*)::int FROM enrollments
    UNION ALL SELECT 'student_guardians',count(*)::int FROM student_guardians
    UNION ALL SELECT 'guardians',count(*)::int FROM guardians
    UNION ALL SELECT 'student_grades',count(*)::int FROM student_grades
    UNION ALL SELECT 'student_attendance_records',count(*)::int FROM student_attendance_records
    UNION ALL SELECT 'student_attendance_adjustments',count(*)::int FROM student_attendance_adjustments
    UNION ALL SELECT 'student_manual_attendance_events',count(*)::int FROM attendance_manual_events WHERE subject_type='student'
    UNION ALL SELECT 'student_users',count(*)::int FROM users WHERE account_type='student' AND archived_at IS NULL
    UNION ALL SELECT 'guardian_users',count(*)::int FROM users WHERE account_type='guardian' AND archived_at IS NULL
    UNION ALL SELECT 'employees',count(*)::int FROM employees
    UNION ALL SELECT 'teacher_profiles',count(*)::int FROM teacher_profiles
    UNION ALL SELECT 'employee_attendance_records',count(*)::int FROM employee_attendance_records
    UNION ALL SELECT 'school_years',count(*)::int FROM school_years
    UNION ALL SELECT 'grade_levels',count(*)::int FROM grade_levels
    UNION ALL SELECT 'sections',count(*)::int FROM sections
    UNION ALL SELECT 'subjects',count(*)::int FROM subjects
    UNION ALL SELECT 'classrooms',count(*)::int FROM classrooms
    UNION ALL SELECT 'attendance_terminals',count(*)::int FROM attendance_terminals
    UNION ALL SELECT 'active_super_administrators',count(DISTINCT u.id)::int FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='super_administrator' AND u.status='active' AND u.archived_at IS NULL
  `);
  return Object.fromEntries(result.rows.map(row => [row.entity, row.count])) as Counts;
}

const client = await pool.connect();
let before: Counts = {};
let after: Counts = {};
let fileKeys: string[] = [];
try {
  await client.query('BEGIN');
  await client.query('LOCK TABLE students,guardians,enrollments,admission_applications,users IN SHARE ROW EXCLUSIVE MODE');
  before = await counts(client);

  await client.query(`CREATE TEMP TABLE reset_students ON COMMIT DROP AS SELECT id,user_id,profile_photo_asset_id FROM students`);
  await client.query(`CREATE TEMP TABLE reset_guardians ON COMMIT DROP AS SELECT id,user_id FROM guardians`);
  await client.query(`CREATE TEMP TABLE reset_users ON COMMIT DROP AS
    SELECT DISTINCT id FROM users WHERE account_type IN ('student','guardian') AND archived_at IS NULL
    UNION SELECT user_id FROM reset_students WHERE user_id IS NOT NULL
    UNION SELECT user_id FROM reset_guardians WHERE user_id IS NOT NULL`);
  await client.query(`CREATE TEMP TABLE reset_media_assets ON COMMIT DROP AS
    SELECT profile_photo_asset_id id FROM reset_students WHERE profile_photo_asset_id IS NOT NULL
    UNION SELECT media_asset_id FROM admission_documents WHERE media_asset_id IS NOT NULL`);

  const employeeOverlap = await client.query(`SELECT count(*)::int count FROM employees WHERE user_id IN(SELECT id FROM reset_users)`);
  if (employeeOverlap.rows[0].count !== 0) throw new Error('Reset refused: a Student/Guardian User is also linked to a retained Employee');
  const sharedMedia = await client.query(`SELECT count(*)::int count FROM employees WHERE profile_photo_asset_id IN(SELECT id FROM reset_media_assets)`);
  if (sharedMedia.rows[0].count !== 0) throw new Error('Reset refused: Student/Admissions media is shared by a retained Employee');
  const retainedUserReferences = await client.query(`
    SELECT
      (SELECT count(*) FROM attendance_terminal_sessions WHERE operator_user_id IN(SELECT id FROM reset_users)) +
      (SELECT count(*) FROM attendance_terminals WHERE created_by IN(SELECT id FROM reset_users)) +
      (SELECT count(*) FROM employee_attendance_records WHERE created_by IN(SELECT id FROM reset_users)) +
      (SELECT count(*) FROM employee_attendance_correction_requests WHERE requested_by IN(SELECT id FROM reset_users) OR reviewed_by IN(SELECT id FROM reset_users)) +
      (SELECT count(*) FROM employee_attendance_adjustments WHERE adjusted_by IN(SELECT id FROM reset_users)) +
      (SELECT count(*) FROM media_assets WHERE created_by IN(SELECT id FROM reset_users) AND id NOT IN(SELECT id FROM reset_media_assets)) AS count`);
  if (Number(retainedUserReferences.rows[0].count) !== 0) throw new Error('Reset refused: a Student/Guardian User is referenced by retained operational data');

  const keys = await client.query<{ key: string }>(`
    SELECT storage_key key FROM admission_documents WHERE storage_key IS NOT NULL
    UNION SELECT m.storage_key FROM media_assets m WHERE m.id IN(SELECT id FROM reset_media_assets)
    UNION SELECT m.thumbnail_key FROM media_assets m WHERE m.id IN(SELECT id FROM reset_media_assets)`);
  fileKeys = keys.rows.map(row => row.key);

  await client.query('ALTER TABLE attendance_manual_event_history DISABLE TRIGGER attendance_manual_history_immutable');
  await remove(client, 'attendance_manual_event_history', `DELETE FROM attendance_manual_event_history WHERE manual_event_id IN(SELECT id FROM attendance_manual_events WHERE subject_type='student')`);
  await client.query('ALTER TABLE attendance_manual_event_history ENABLE TRIGGER attendance_manual_history_immutable');
  await remove(client, 'attendance_manual_events', `DELETE FROM attendance_manual_events WHERE subject_type='student'`);
  await remove(client, 'attendance_terminal_events', `DELETE FROM attendance_terminal_events WHERE subject_type='student'`);

  await client.query('ALTER TABLE student_attendance_adjustments DISABLE TRIGGER student_attendance_adjustments_immutable');
  await remove(client, 'student_attendance_adjustments', 'DELETE FROM student_attendance_adjustments');
  await client.query('ALTER TABLE student_attendance_adjustments ENABLE TRIGGER student_attendance_adjustments_immutable');
  await remove(client, 'student_attendance_records', 'DELETE FROM student_attendance_records');
  await remove(client, 'grade_history', 'DELETE FROM grade_history WHERE student_grade_id IN(SELECT id FROM student_grades)');
  await remove(client, 'student_grades', 'DELETE FROM student_grades');

  await client.query('ALTER TABLE admission_status_history DISABLE TRIGGER admission_status_history_immutable');
  await remove(client, 'admission_status_history', 'DELETE FROM admission_status_history');
  await client.query('ALTER TABLE admission_status_history ENABLE TRIGGER admission_status_history_immutable');
  await remove(client, 'admission_documents', 'DELETE FROM admission_documents');
  await remove(client, 'admission_guardians', 'DELETE FROM admission_guardians');
  await remove(client, 'admission_applications', 'DELETE FROM admission_applications');

  await client.query(`CREATE TEMP TABLE reset_notifications ON COMMIT DROP AS
    SELECT DISTINCT n.id FROM notifications n LEFT JOIN notification_targets t ON t.notification_id=n.id LEFT JOIN notification_recipients r ON r.notification_id=n.id
    WHERE n.category='admissions' OR t.audience_type IN('students','guardians','grade_level','section') OR r.user_id IN(SELECT id FROM reset_users)`);
  await client.query('ALTER TABLE notification_events DISABLE TRIGGER notification_events_immutable');
  await remove(client, 'notification_events', 'DELETE FROM notification_events WHERE notification_id IN(SELECT id FROM reset_notifications)');
  await client.query('ALTER TABLE notification_events ENABLE TRIGGER notification_events_immutable');
  await remove(client, 'notifications', 'DELETE FROM notifications WHERE id IN(SELECT id FROM reset_notifications)');

  await remove(client, 'student_credentials', `DELETE FROM credentials WHERE subject_type='student'`);
  await remove(client, 'enrollments', 'DELETE FROM enrollments');
  await remove(client, 'student_guardians', 'DELETE FROM student_guardians');
  await remove(client, 'students', 'DELETE FROM students');
  await remove(client, 'guardians', 'DELETE FROM guardians');
  await remove(client, 'media_assets', 'DELETE FROM media_assets WHERE id IN(SELECT id FROM reset_media_assets)');

  await remove(client, 'auth_sessions', 'DELETE FROM auth_sessions WHERE user_id IN(SELECT id FROM reset_users)');
  await remove(client, 'login_identities', 'DELETE FROM login_identities WHERE user_id IN(SELECT id FROM reset_users)');
  await remove(client, 'user_roles', 'DELETE FROM user_roles WHERE user_id IN(SELECT id FROM reset_users)');
  await remove(client, 'student_guardian_users_deactivated', `UPDATE users SET status='inactive',archived_at=COALESCE(archived_at,now()),locked_until=NULL,must_change_password=true,updated_at=now(),version=version+1 WHERE id IN(SELECT id FROM reset_users) AND archived_at IS NULL`);

  after = await counts(client);
  for (const entity of ['admission_applications','admission_status_history','students','enrollments','student_guardians','guardians','student_grades','student_attendance_records','student_attendance_adjustments','student_manual_attendance_events','student_users','guardian_users']) {
    if (after[entity] !== 0) throw new Error(`Reset validation failed: ${entity} has ${after[entity]} record(s)`);
  }
  for (const entity of ['employees','teacher_profiles','employee_attendance_records','school_years','grade_levels','sections','subjects','classrooms','attendance_terminals','active_super_administrators']) {
    if (after[entity] !== before[entity]) throw new Error(`Reset validation failed: retained ${entity} changed from ${before[entity]} to ${after[entity]}`);
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}

for (const key of fileKeys) {
  try {
    await storage.delete(key);
    removedFiles.push(key);
  } catch {
    missingFiles.push(key);
  }
}
await pool.end();
console.log(JSON.stringify({ status: 'completed', before, deleted, after, files: { removed: removedFiles.length, cleanupFailures: missingFiles } }, null, 2));
