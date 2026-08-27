import{cleanup,fireEvent,render,screen,waitFor}from'@testing-library/react';
import{MemoryRouter}from'react-router-dom';
import{afterEach,describe,expect,it,vi}from'vitest';
import{App}from'./App';

const teacher=(mustChangePassword=false)=>({id:'teacher-1',email:'teacher@mmsc.test',username:null,loginIdentifier:'EMP-001',displayName:'Test Teacher',accountType:'employee',mustChangePassword,roles:['teacher'],permissions:['dashboard.view','teacher.portal.access','notification.inbox.access','calendar.experience.access']});
const dashboard={teacher:{firstName:'Test',lastName:'Teacher',preferredName:null,teacherNumber:'T-001'},schoolYears:[],selectedSchoolYearId:null,placement:null,classes:[],events:[]};
const clinicUser={id:'clinic-1',email:'nurse@mmsc.test',username:'nurse',loginIdentifier:'EMP-019',displayName:'School Nurse',accountType:'employee',mustChangePassword:false,roles:['clinic_staff'],permissions:['clinic.portal.access','clinic.dashboard.view','clinic.student.lookup','clinic.encounter.view','clinic.inventory.view']};
const clinicDashboard={metrics:{todayVisits:0,active:0,completed:0,followUpsDue:0,upcoming:0},queue:[],inventoryAlerts:[]};
const libraryUser={id:'library-1',email:'library@mmsc.test',username:'librarian',loginIdentifier:'EMP-020',displayName:'School Librarian',accountType:'employee',mustChangePassword:false,roles:['librarian'],permissions:['library.portal.access','library.dashboard.view','library.catalog.view']};
const libraryDashboard={metrics:{totalBookCopies:0,available:0,checkedOut:0,overdue:0,visitorsToday:0,currentlyInside:0,borrowedToday:0,returnedToday:0}};

afterEach(()=>{cleanup();vi.unstubAllGlobals()});

describe('application-level routing',()=>{
  it('redirects a teacher away from a direct Administration URL before mounting its shell',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockImplementation(async(input:unknown)=>{const url=String(input);const body=url.endsWith('/auth/me')?{user:teacher()}:url.includes('/teacher-portal/dashboard')?dashboard:{};return{ok:true,status:200,json:async()=>body}}));
    render(<MemoryRouter initialEntries={['/security']}><App/></MemoryRouter>);
    expect(await screen.findByRole('navigation',{name:'Teacher portal'})).toBeInTheDocument();
    expect(screen.queryByRole('navigation',{name:'Administration navigation'})).not.toBeInTheDocument();
    expect(screen.queryByText('Security & Access')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/switch workspace/i)).not.toBeInTheDocument();
    const teacherNav=screen.getByRole('navigation',{name:'Teacher portal'});
    expect(teacherNav).toHaveTextContent('My Classes');expect(teacherNav).toHaveTextContent('Calendar');expect(teacherNav).not.toHaveTextContent('Home');expect(teacherNav).not.toHaveTextContent('Notifications');expect(teacherNav).not.toHaveTextContent('Account');
    expect(screen.getByLabelText('Notifications')).toHaveAttribute('href','/teacher/notifications');expect(screen.getByLabelText('Open Account')).toHaveAttribute('href','/teacher/account');
  });

  it('re-resolves the same default experience after forced password change',async()=>{
    let changed=false;
    vi.stubGlobal('fetch',vi.fn().mockImplementation(async(input:unknown)=>{const url=String(input);if(url.endsWith('/auth/change-password')){changed=true;return{ok:true,status:200,json:async()=>({})}}const body=url.endsWith('/auth/me')?{user:teacher(!changed)}:url.includes('/teacher-portal/dashboard')?dashboard:{};return{ok:true,status:200,json:async()=>body}}));
    render(<MemoryRouter initialEntries={['/']}><App/></MemoryRouter>);
    expect(await screen.findByRole('heading',{name:'Choose a private password'})).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Current password'),{target:{value:'Temporary1!'}});
    fireEvent.change(screen.getByLabelText('New password'),{target:{value:'PrivatePassword1!'}});
    fireEvent.change(screen.getByLabelText('Confirm new password'),{target:{value:'PrivatePassword1!'}});
    fireEvent.click(screen.getByRole('button',{name:'Change password and continue'}));
    expect(await screen.findByRole('navigation',{name:'Teacher portal'})).toBeInTheDocument();
    await waitFor(()=>expect(screen.queryByRole('navigation',{name:'Administration navigation'})).not.toBeInTheDocument());
  });

  it('lands a Clinic-only employee directly in the Clinic portal',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockImplementation(async(input:unknown)=>{const url=String(input);const body=url.endsWith('/auth/me')?{user:clinicUser}:url.includes('/clinic/dashboard')?clinicDashboard:{};return{ok:true,status:200,json:async()=>body}}));
    render(<MemoryRouter initialEntries={['/']}><App/></MemoryRouter>);
    expect(await screen.findByRole('navigation',{name:'Clinic portal'})).toBeInTheDocument();expect(screen.queryByRole('navigation',{name:'Administration navigation'})).not.toBeInTheDocument();expect(await screen.findByRole('heading',{name:'Clinic dashboard'})).toBeInTheDocument();
  });

  it('offers Administration and Clinic to a user authorized for both',async()=>{
    const user={...clinicUser,roles:['school_administrator','clinic_staff']};vi.stubGlobal('fetch',vi.fn().mockImplementation(async(input:unknown)=>{const url=String(input);const body=url.endsWith('/auth/me')?{user}:url.includes('/clinic/dashboard')?clinicDashboard:{};return{ok:true,status:200,json:async()=>body}}));
    render(<MemoryRouter initialEntries={['/clinic/dashboard']}><App/></MemoryRouter>);
    const switcher=await screen.findByLabelText('Switch workspace');expect(switcher).toHaveTextContent('Administration');expect(switcher).toHaveTextContent('Clinic');expect(switcher).toHaveValue('/clinic/dashboard');
  });

  it('lands a Library-only employee directly in Library and rejects unavailable direct routes',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockImplementation(async(input:unknown)=>{const url=String(input);const body=url.endsWith('/auth/me')?{user:libraryUser}:url.includes('/library/dashboard')?libraryDashboard:{};return{ok:true,status:200,json:async()=>body}}));
    render(<MemoryRouter initialEntries={['/']}><App/></MemoryRouter>);expect(await screen.findByRole('navigation',{name:'Library portal'})).toBeInTheDocument();expect(await screen.findByRole('heading',{name:'Library dashboard'})).toBeInTheDocument();expect(screen.queryByRole('navigation',{name:'Administration navigation'})).not.toBeInTheDocument();expect(screen.getByRole('navigation',{name:'Library portal'})).not.toHaveTextContent('Settings');
  });
});
