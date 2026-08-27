import { clinicRepository } from '../clinic/repository.js';
import { pool } from './pool.js';

async function run(){
  const student=await pool.query(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id=s.id JOIN school_years sy ON sy.id=e.school_year_id AND sy.status='active' WHERE s.archived_at IS NULL LIMIT 1`);
  const record=student.rows[0]?await clinicRepository.healthRecord(student.rows[0].id):null;
  const roles=await pool.query(`SELECT r.code,array_agg(p.code ORDER BY p.code) FILTER(WHERE p.code LIKE 'clinic.health_records.%') permissions FROM roles r LEFT JOIN role_permissions rp ON rp.role_id=r.id LEFT JOIN permissions p ON p.id=rp.permission_id WHERE r.code IN ('clinic_staff','school_administrator','super_administrator') GROUP BY r.code ORDER BY r.code`);
  process.stdout.write(JSON.stringify({studentRecordLoaded:!!record,studentNumber:record?.student.studentNumber??null,sections:record?{alerts:record.alerts.length,immunizations:record.immunizations.length,physicalExams:record.physicalExams.length,guardians:record.guardians.length}:null,roles:roles.rows},null,2));
}
run().finally(()=>pool.end()).catch(error=>{console.error(error);process.exitCode=1});
