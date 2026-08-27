import{cleanup,render,screen}from'@testing-library/react';
import{MemoryRouter,Route,Routes}from'react-router-dom';
import{afterEach,describe,expect,it,vi}from'vitest';
const state=vi.hoisted(()=>({permissions:new Set<string>()}));
vi.mock('../auth/AuthContext',()=>({useAuth:()=>({user:{displayName:'Lab User'},logout:vi.fn(),has:(permission:string)=>state.permissions.has(permission)})}));
vi.mock('./ExperienceSwitcher',()=>({ExperienceSwitcher:()=>null}));
import{ComputerLabShell}from'./ComputerLabShell';
const all=['computer_lab.dashboard.view','computer_lab.labs.view','computer_lab.workstations.view','computer_lab.schedule.view','computer_lab.sessions.view','computer_lab.issues.view','computer_lab.equipment.view','computer_lab.software.view','computer_lab.reports.view'];
const renderShell=(permissions:string[])=>{state.permissions=new Set(permissions);return render(<MemoryRouter><Routes><Route path="*" element={<ComputerLabShell/>}/></Routes></MemoryRouter>)};
describe('Computer Laboratory navigation',()=>{
afterEach(cleanup);
it('renders all nine administrator workspaces from effective permissions',()=>{renderShell(all);for(const label of ['Dashboard','Laboratories','Workstations','Schedule','Lab Sessions','Issues & Maintenance','Equipment','Software','Reports'])expect(screen.getByRole('link',{name:new RegExp(label,'i')})).toBeInTheDocument()});
it('renders the intended staff workspaces, including Issues & Maintenance',()=>{renderShell(all);for(const label of ['Dashboard','Laboratories','Workstations','Schedule','Lab Sessions','Issues & Maintenance','Equipment','Software','Reports'])expect(screen.getByRole('link',{name:new RegExp(label,'i')})).toBeInTheDocument()});
it('renders only individually authorized workspaces',()=>{renderShell(['computer_lab.labs.view','computer_lab.workstations.view']);expect(screen.getByRole('link',{name:/Laboratories/i})).toBeInTheDocument();expect(screen.getByRole('link',{name:/Workstations/i})).toBeInTheDocument();expect(screen.queryByRole('link',{name:/Dashboard/i})).not.toBeInTheDocument();expect(screen.queryByRole('link',{name:/Issues & Maintenance/i})).not.toBeInTheDocument();expect(screen.queryByRole('link',{name:/Reports/i})).not.toBeInTheDocument()});
it('renders no workspace links without workspace permissions',()=>{renderShell([]);expect(screen.queryByRole('navigation',{name:'Computer Laboratory portal'})?.querySelector('a')).toBeNull()});
});
