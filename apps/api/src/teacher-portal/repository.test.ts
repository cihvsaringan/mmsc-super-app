import{afterEach,describe,expect,it,vi}from'vitest';
import{pool}from'../database/pool.js';
import{teacherPortalRepository}from'./repository.js';
const teacherId='08f35c64-1fd8-4c59-abd9-03466935c97b',assignmentId='c7681b64-082b-4c66-a7a7-b8df72aac35c',sectionId='4af20f5d-53b8-498f-ac31-518db5ca9f12';
afterEach(()=>vi.restoreAllMocks());
describe('Teacher Portal attendance roster',()=>{
 it('prefers class attendance and falls back to same-day campus attendance without requiring Time Out',async()=>{
  const query=vi.spyOn(pool,'query').mockResolvedValueOnce({rows:[{teacher_profile_id:teacherId}]} as never).mockResolvedValueOnce({rows:[{id:assignmentId,section_id:sectionId,subject_name:'Math'}]} as never).mockResolvedValueOnce({rows:[{enrollment_id:'enrollment',attendance_status:'present',attendance_scope:'campus',time_in:'2026-08-26T07:00:00+08:00',time_out:null}]} as never);
  const result=await teacherPortalRepository.roster(teacherId,assignmentId,'2026-08-26');
  const rosterSql=String(query.mock.calls[2]?.[0]);
  expect(rosterSql).toContain("attendance_scope='campus'");expect(rosterSql).toContain('CASE WHEN teaching_assignment_id=$2 THEN 0 ELSE 1 END');expect(rosterSql).not.toContain('time_out IS NOT NULL');expect(result.students[0]).toMatchObject({attendanceStatus:'present',attendanceScope:'campus',timeOut:null});
 });
});
