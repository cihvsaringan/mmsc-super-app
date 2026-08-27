import{cleanup,fireEvent,render,screen}from'@testing-library/react';
import{MemoryRouter,useLocation}from'react-router-dom';
import{afterEach,describe,expect,it,vi}from'vitest';

const state=vi.hoisted(()=>({user:{id:'staff-1',email:'nurse@mmsc.test',username:'nurse',loginIdentifier:'EMP-019',displayName:'School Nurse',accountType:'employee' as const,mustChangePassword:false,roles:['school_administrator','clinic_staff'],permissions:['clinic.portal.access']}}));
vi.mock('../auth/AuthContext',()=>({useAuth:()=>({user:state.user})}));
import{ExperienceSwitcher}from'./ExperienceSwitcher';

afterEach(()=>cleanup());

function Location(){return <output aria-label="Current route">{useLocation().pathname}</output>}

describe('ExperienceSwitcher',()=>{
  it('uses the active route for the selected workspace and changes only on a workspace navigation',()=>{
    render(<MemoryRouter initialEntries={['/']}><ExperienceSwitcher/><Location/></MemoryRouter>);
    const switcher=screen.getByLabelText('Switch workspace');
    expect(switcher).toHaveValue('/');
    fireEvent.change(switcher,{target:{value:'/clinic/dashboard'}});
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/clinic/dashboard');
    expect(switcher).toHaveValue('/clinic/dashboard');
  });

  it('keeps Clinic selected on every Clinic child route',()=>{
    render(<MemoryRouter initialEntries={['/clinic/inventory']}><ExperienceSwitcher/><Location/></MemoryRouter>);
    expect(screen.getByLabelText('Switch workspace')).toHaveValue('/clinic/dashboard');
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/clinic/inventory');
  });
});
