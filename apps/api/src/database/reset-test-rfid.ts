import 'dotenv/config';
import { env } from '../config/env.js';
import { pool } from './pool.js';
import { assertRfidTestResetAllowed } from './rfid-test-reset-guard.js';

assertRfidTestResetAllowed({nodeEnv:env.NODE_ENV,databaseUrl:env.DATABASE_URL,confirmation:process.env.MMSC_RFID_TEST_RESET});

type Snapshot={students:number;employees:number;studentAttendance:number;employeeAttendance:number;terminalEvents:number;terminals:number;devices:number;installations:number;sessions:number;qrCredentials:number};
async function snapshot(){const result=await pool.query<Snapshot>(`SELECT
 (SELECT count(*)::int FROM students) students,
 (SELECT count(*)::int FROM employees) employees,
 (SELECT count(*)::int FROM student_attendance_records) "studentAttendance",
 (SELECT count(*)::int FROM employee_attendance_records) "employeeAttendance",
 (SELECT count(*)::int FROM attendance_terminal_events) "terminalEvents",
 (SELECT count(*)::int FROM attendance_terminals) terminals,
 (SELECT count(*)::int FROM attendance_terminal_devices) devices,
 (SELECT count(*)::int FROM attendance_terminal_installations) installations,
 (SELECT count(*)::int FROM attendance_terminal_sessions) sessions,
 (SELECT count(*)::int FROM credentials WHERE credential_type<>'rfid') "qrCredentials"`);return result.rows[0]!}

const client=await pool.connect();let studentRfid=0;let employeeRfid=0;
try{
 await client.query('BEGIN');
 await client.query('LOCK TABLE credentials IN SHARE ROW EXCLUSIVE MODE');
 const baseline=await snapshot();
 await client.query(`CREATE TEMP TABLE reset_rfid_credentials ON COMMIT DROP AS SELECT id,subject_type FROM credentials WHERE credential_type='rfid'`);
 await client.query(`UPDATE credentials SET replaced_by_credential_id=NULL WHERE replaced_by_credential_id IN(SELECT id FROM reset_rfid_credentials)`);
 const removed=await client.query<{subject_type:'student'|'employee'}>(`DELETE FROM credentials WHERE id IN(SELECT id FROM reset_rfid_credentials) RETURNING subject_type`);
 studentRfid=removed.rows.filter(row=>row.subject_type==='student').length;
 employeeRfid=removed.rows.filter(row=>row.subject_type==='employee').length;
 const remaining=await client.query(`SELECT count(*)::int count FROM credentials WHERE credential_type='rfid'`);
 if(Number(remaining.rows[0].count)!==0)throw new Error('RFID test reset validation failed: RFID credentials remain');
 const retained=await snapshot();
 for(const key of Object.keys(baseline) as (keyof Snapshot)[])if(baseline[key]!==retained[key])throw new Error(`RFID test reset validation failed: retained ${key} changed from ${baseline[key]} to ${retained[key]}`);
 await client.query('COMMIT');
}catch(error){await client.query('ROLLBACK');throw error}finally{client.release();await pool.end()}

console.log(JSON.stringify({status:'completed',studentRfidRecordsCleared:studentRfid,employeeRfidRecordsCleared:employeeRfid,otherCredentialTypesPreserved:true,attendanceRecordsPreserved:true,trustedPwaPreserved:true,terminalAssignmentPreserved:true},null,2));
