import{beforeEach,describe,expect,it,vi}from'vitest';

const mocks=vi.hoisted(()=>{const client={query:vi.fn(),release:vi.fn()};return{client,connect:vi.fn(async()=>client),audit:vi.fn()}});
vi.mock('../database/pool.js',()=>({pool:{connect:mocks.connect,query:vi.fn()}}));
vi.mock('../security/repository.js',()=>({securityRepository:{audit:mocks.audit}}));

import{EnrollmentRepository}from'./repository.js';

const context={actorId:'10000000-0000-4000-8000-000000000001',requestId:'request'};
const applicationId='20000000-0000-4000-8000-000000000002',studentId='30000000-0000-4000-8000-000000000003',enrollmentId='40000000-0000-4000-8000-000000000004',yearId='50000000-0000-4000-8000-000000000005',gradeId='60000000-0000-4000-8000-000000000006',sectionId='70000000-0000-4000-8000-000000000007';
const completionRow={id:enrollmentId,status:'enrolled',enrollment_id:enrollmentId,student_id:studentId,student_number:'MMSC-2026-000001',admission_id:applicationId,school_year_id:yearId,grade_level_id:gradeId,section_id:sectionId,enrollment_status:'enrolled',source_candidate_kind:'admission',source_candidate_id:applicationId};

describe('Enrollment completion transaction',()=>{
 beforeEach(()=>{vi.resetAllMocks();mocks.connect.mockResolvedValue(mocks.client)});

 it('creates one authoritative Student, Enrollment, Guardian relationship, and traceable result',async()=>{
  mocks.client.query.mockImplementation(async(sql:unknown)=>{const text=String(sql);if(text==='BEGIN'||text==='COMMIT')return{rows:[]};if(text.includes('FROM admission_applications WHERE id=$1'))return{rows:[{id:applicationId,status:'approved',application_type:'new_student',school_id:'school',school_year_id:yearId,grade_level_id:gradeId,first_name:'April',middle_name:'Arnie',last_name:'Flores',birth_date:'1991-03-04',learner_reference_number:null}]};if(text.includes('SELECT 1 FROM sections'))return{rows:[{id:sectionId}]};if(text.includes('count(*)::int total FROM subject_grade_level_assignments'))return{rows:[{total:9}]};if(text.includes('POSSIBLE')||text.includes('lower(first_name)=lower'))return{rows:[]};if(text.includes("nextval('student_number_seq')"))return{rows:[{value:1}]};if(text.startsWith('INSERT INTO students'))return{rows:[{id:studentId}]};if(text.includes('SELECT 1 FROM enrollments WHERE student_id'))return{rows:[]};if(text.startsWith('INSERT INTO enrollments'))return{rows:[{id:enrollmentId,student_id:studentId,school_year_id:yearId,grade_level_id:gradeId,section_id:sectionId,status:'enrolled'}]};if(text.includes('SELECT * FROM admission_guardians'))return{rows:[{first_name:'Helvic',last_name:'Saringan',relationship_type:'father',mobile_phone:'0908',email:null,is_primary:true,receives_communications:true}]};if(text.includes('SELECT id FROM guardians'))return{rows:[]};if(text.startsWith('INSERT INTO guardians'))return{rows:[{id:'80000000-0000-4000-8000-000000000008'}]};if(text.includes('SELECT e.id,e.status'))return{rows:[completionRow]};return{rows:[]}});
  const result=await new EnrollmentRepository().complete('admission',applicationId,{sectionId,enrollmentDate:'2026-08-28'},context);
  const statements=mocks.client.query.mock.calls.map(call=>String(call[0]));
  expect(result).toMatchObject({id:enrollmentId,status:'enrolled',enrollmentId,studentId,studentNumber:'MMSC-2026-000001',admissionId:applicationId,schoolYearId:yearId,gradeLevelId:gradeId,sectionId,enrollmentStatus:'enrolled',sourceCandidateKind:'admission',sourceCandidateId:applicationId});
  expect(statements.filter(sql=>sql.startsWith('INSERT INTO students'))).toHaveLength(1);expect(statements.filter(sql=>sql.startsWith('INSERT INTO enrollments'))).toHaveLength(1);expect(statements.filter(sql=>sql.includes('INSERT INTO student_guardians'))).toHaveLength(1);expect(statements).toContain('COMMIT');
  expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({action:'enrollment.complete',metadata:expect.objectContaining({enrollmentId,studentId,sourceCandidateKind:'admission',sourceCandidateId:applicationId,schoolYearId:yearId,sectionId})}),mocks.client);
 });

 it('returns the same authoritative result on a converted Admission retry without duplicates',async()=>{
  mocks.client.query.mockImplementation(async(sql:unknown)=>{const text=String(sql);if(text.includes('FROM admission_applications WHERE id=$1'))return{rows:[{id:applicationId,status:'converted',converted_enrollment_id:enrollmentId,converted_student_id:studentId}]};if(text.includes('SELECT e.id,e.status'))return{rows:[completionRow]};return{rows:[]}});
  const result=await new EnrollmentRepository().complete('admission',applicationId,{sectionId,enrollmentDate:'2026-08-28'},context);
  const statements=mocks.client.query.mock.calls.map(call=>String(call[0]));
  expect(result).toMatchObject({enrollmentId,studentId,studentNumber:'MMSC-2026-000001'});expect(statements.some(sql=>sql.startsWith('INSERT INTO students'))).toBe(false);expect(statements.some(sql=>sql.startsWith('INSERT INTO enrollments'))).toBe(false);expect(statements).toContain('COMMIT');
 });
});
