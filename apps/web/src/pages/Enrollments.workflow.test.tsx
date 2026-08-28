import{cleanup,fireEvent,render,screen}from'@testing-library/react';
import{afterEach,beforeEach,describe,expect,it,vi}from'vitest';
vi.mock('../auth/AuthContext',()=>({useAuth:()=>({has:(permission:string)=>permission==='enrollment.manage'||permission==='enrollment.view'})}));
import{Enrollments}from'./Enrollments';

const candidate={id:'application',candidateKind:'admission' as const,admissionId:'application',applicationNumber:'MMREG-2026-100085',applicationType:'new_student',status:'approved',firstName:'April',middleName:'Arnie',lastName:'Flores',schoolYearId:'year',schoolYearName:'SY 2026-2027',gradeLevelId:'grade',gradeLevelName:'Grade 7'};
const detail={candidate,guardians:[],documents:[],admissionHistory:[],enrollmentHistory:[],sections:[{id:'section',name:'Grade 7 – St. Mark',capacity:35,enrolledCount:0}],curriculum:{subjectCount:9,subjects:'English, Mathematics'}};

describe('Enrollment review completion workflow',()=>{
 afterEach(()=>cleanup());
 beforeEach(()=>vi.stubGlobal('fetch',vi.fn().mockImplementation(async(input:unknown,init?:RequestInit)=>{const url=String(input);const body=url.includes('/enrollments/context')?{schoolYears:[{id:'year',name:'SY 2026-2027',status:'active'}],gradeLevels:[{id:'grade',name:'Grade 7'}],sections:[]}:url.includes('/enrollments/candidates/admission/application')?detail:{items:[{...candidate,status:'pending'}],total:1};return{ok:true,status:200,json:async()=>body,requestMethod:init?.method??'GET'}})));

 it('shows confirmation for the canonical approved Admission and closes without submitting',async()=>{
  render(<Enrollments/>);fireEvent.click(await screen.findByRole('button',{name:/review april arnie flores/i}));expect(await screen.findByRole('button',{name:'Review & Confirm'})).toBeEnabled();fireEvent.click(screen.getByRole('button',{name:'Review & Confirm'}));fireEvent.change(screen.getAllByLabelText('Section')[1]!,{target:{value:'section'}});expect(screen.getByRole('button',{name:'Confirm Enrollment'})).toBeEnabled();fireEvent.click(screen.getByRole('button',{name:'Close'}));expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(vi.mocked(fetch).mock.calls.some(([,init])=>init?.method==='POST')).toBe(false);
 });
});
