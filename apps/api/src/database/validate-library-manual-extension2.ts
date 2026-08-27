import '../config/env.js';
import { credentialRepository } from '../credentials/repository.js';
import { pool } from './pool.js';
import { libraryVisitorRepository } from '../library/visitor-repository.js';

const attendanceCounts=async()=>JSON.stringify((await pool.query(`SELECT (SELECT count(*) FROM student_attendance_records) student,(SELECT count(*) FROM employee_attendance_records) employee,(SELECT count(*) FROM attendance_terminal_events) terminal`)).rows[0]);
const schoolDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

try{
  const actor=(await pool.query(`SELECT id FROM users WHERE archived_at IS NULL ORDER BY created_at LIMIT 1`)).rows[0];
  const student=(await pool.query(`SELECT s.id FROM students s WHERE s.archived_at IS NULL AND s.enrollment_status='enrolled' ORDER BY s.created_at LIMIT 1`)).rows[0];
  const employee=(await pool.query(`SELECT e.id FROM employees e WHERE e.archived_at IS NULL AND e.employment_status='active' ORDER BY e.created_at LIMIT 1`)).rows[0];
  if(!actor||!student||!employee)throw new Error('Active actor, Student, and Employee are required');
  const context={actorId:String(actor.id),requestId:`library-manual-extension2-${Date.now()}`};
  const before=await attendanceCounts();
  const date=schoolDate();
  const existingStudentRfid=process.env.MMSC_LIBRARY_TEST_STUDENT_RFID;
  const existingEmployeeRfid=process.env.MMSC_LIBRARY_TEST_EMPLOYEE_RFID;
  if(!existingStudentRfid||!existingEmployeeRfid)throw new Error('Set MMSC_LIBRARY_TEST_STUDENT_RFID and MMSC_LIBRARY_TEST_EMPLOYEE_RFID to existing application-created credentials');

  // These are existing application-created credentials with revoked historical rows sharing each current digest.
  const existingStudent=await libraryVisitorRepository.scan({mode:'entry',credential:`  ${existingStudentRfid}\r\n`,station:'Extension 2 existing credential'},context);
  if(existingStudent.patron.patronCategory!=='student')throw new Error('Existing current Student RFID did not win over its revoked history');
  const openAnalytics=await libraryVisitorRepository.analytics(date);
  if(Number(openAnalytics.summary.currentlyInside)<1)throw new Error('Open Library visit was not counted as currently inside');
  await libraryVisitorRepository.scan({mode:'exit',credential:existingStudentRfid,station:'Extension 2 existing credential'},context);
  const existingEmployee=await libraryVisitorRepository.scan({mode:'entry',credential:`${existingEmployeeRfid}\r`,station:'Extension 2 existing credential'},context);
  if(!['employee','teacher'].includes(existingEmployee.patron.patronCategory))throw new Error('Existing current Employee RFID did not win over its revoked history');
  await libraryVisitorRepository.scan({mode:'exit',credential:existingEmployeeRfid,station:'Extension 2 existing credential'},context);

  // Mirror Student/Employee Details -> Credentials -> Register Credential through the official repository.
  const suffix=Date.now();
  for(const owner of [{ownerType:'student' as const,ownerId:String(student.id),raw:`00STU${suffix}`},{ownerType:'employee' as const,ownerId:String(employee.id),raw:`00EMP${suffix}`}]){
    const registered=await credentialRepository.register({...owner,credentialType:'rfid' as const,credentialValue:` ${owner.raw}\r\n`},context);
    const item=registered.item as {id:string;version:number};
    const entry=await libraryVisitorRepository.scan({mode:'entry',credential:`${owner.raw}\r\n`,station:'Extension 2 official workflow'},context);
    if(entry.patron.personId!==owner.ownerId)throw new Error(`${owner.ownerType} official-workflow RFID resolved to the wrong identity`);
    await libraryVisitorRepository.scan({mode:'exit',credential:owner.raw,station:'Extension 2 official workflow'},context);
    await credentialRepository.transition(item.id,'revoked',item.version,undefined,context);
  }

  const analytics=await libraryVisitorRepository.analytics(date);
  if(Number(analytics.summary.visitorsToday)<4)throw new Error('Analytics did not include live visits');
  if(!Array.isArray(analytics.visitsByHour)||!Array.isArray(analytics.visitsByGrade)||!Array.isArray(analytics.visitsBySection)||!Array.isArray(analytics.visitsByDay))throw new Error('Analytics series contract is invalid');
  const empty=await libraryVisitorRepository.analytics('2099-01-01');
  if(Number(empty.summary.visitorsToday)!==0||Number(empty.summary.currentlyInside)!==0||Number(empty.summary.averageDurationMinutes)!==0)throw new Error('Empty analytics did not return zero-safe summary values');
  if(await attendanceCounts()!==before)throw new Error('Library Visitor workflows changed an Attendance domain table');
  console.log('Library extension 2 acceptance passed: existing lifecycle-history RFID values and official Student/Employee credential registrations resolved; Entry/Exit, Manila-date analytics, empty analytics, and Attendance isolation passed.');
}finally{await pool.end()}
