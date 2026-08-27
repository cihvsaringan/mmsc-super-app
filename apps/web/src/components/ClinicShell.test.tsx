import{cleanup,fireEvent,render,screen}from'@testing-library/react';
import{MemoryRouter,Route,Routes}from'react-router-dom';
import{afterEach,describe,expect,it,vi}from'vitest';

const state=vi.hoisted(()=>({permissions:[] as string[]}));
vi.mock('../auth/AuthContext',()=>({useAuth:()=>({user:{displayName:'School Nurse',email:'nurse@mmsc.test'},logout:vi.fn(),has:(permission:string)=>state.permissions.includes(permission)})}));
vi.mock('./ExperienceSwitcher',()=>({ExperienceSwitcher:()=>null}));
vi.mock('./NotificationBell',()=>({NotificationBell:()=>null}));
import{ClinicShell}from'./ClinicShell';

function renderShell(){return render(<MemoryRouter initialEntries={['/clinic/dashboard']}><Routes><Route path="/clinic" element={<ClinicShell/>}><Route path="dashboard" element={<h1>Dashboard content</h1>}/></Route></Routes></MemoryRouter>)}

describe('Clinic portal navigation',()=>{
  afterEach(()=>cleanup());
  it('shows only destinations granted through granular Clinic permissions',()=>{state.permissions=['clinic.dashboard.view','clinic.student.lookup','clinic.health_records.view','clinic.report.view'];renderShell();const nav=screen.getByRole('navigation',{name:'Clinic portal'});expect(nav).toHaveTextContent('Dashboard');expect(nav).toHaveTextContent('Student lookup');expect(nav).toHaveTextContent('Health records');expect(nav).toHaveTextContent('Reports');expect(nav).not.toHaveTextContent('Medicine & supplies');expect(nav).not.toHaveTextContent('Appointments')});
  it('provides an accessible mobile navigation control',()=>{state.permissions=['clinic.dashboard.view'];renderShell();fireEvent.click(screen.getByRole('button',{name:'Open clinic navigation'}));const sidebar=screen.getByRole('complementary');expect(sidebar).toHaveClass('clinic-sidebar--open');fireEvent.click(screen.getByRole('button',{name:'Close clinic navigation'}));expect(sidebar).not.toHaveClass('clinic-sidebar--open')});
});
