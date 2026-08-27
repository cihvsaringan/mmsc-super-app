import{cleanup,render,screen}from'@testing-library/react';
import{MemoryRouter}from'react-router-dom';
import{afterEach,describe,expect,it,vi}from'vitest';
import{ClinicOperationalAlerts}from'./ClinicOperationalAlerts';

afterEach(()=>{cleanup();vi.unstubAllGlobals()});

describe('Clinic operational alerts',()=>{
  it('keeps all operational alert cards inside the responsive alert grid',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({severeHealthAlerts:1,dueToday:2,overdue:3,upcoming:4,outOfStock:5,lowStock:6,nearExpiry:7,expired:8})}));
    render(<MemoryRouter><ClinicOperationalAlerts/></MemoryRouter>);
    const section=await screen.findByRole('region',{name:'Operational alerts'});
    const grid=section.querySelector('.clinic-operational-alert-grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.querySelectorAll('button')).toHaveLength(8);
    expect(grid).toHaveTextContent('Severe health alerts');
    expect(grid).toHaveTextContent('Expired stock');
  });
});
