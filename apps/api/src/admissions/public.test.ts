import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks=vi.hoisted(()=>{
  const client={query:vi.fn(),release:vi.fn()};
  return{client,connect:vi.fn(async()=>client),audit:vi.fn()};
});
vi.mock('../database/pool.js',()=>({pool:{connect:mocks.connect,query:vi.fn()}}));
vi.mock('../security/repository.js',()=>({securityRepository:{audit:mocks.audit}}));
vi.mock('../media/storage.js',()=>({storage:{upload:vi.fn(),delete:vi.fn()}}));

import { PublicAdmissionsService } from './public.js';

const base={applicationType:'new_student' as const,schoolId:'school',schoolYearId:'year',gradeLevelId:'grade',sectionId:null,firstName:'Ana',middleName:null,lastName:'Reyes',birthDate:'2018-01-02',gender:null,learnerReferenceNumber:null,personalEmail:null,mobilePhone:null,addressLine1:null,barangay:null,city:null,province:null,postalCode:null,previousSchool:null,guardians:[{firstName:'Maria',lastName:'Reyes',relationshipType:'mother',mobilePhone:'0917',isPrimary:true,receivesCommunications:true}],privacyConsent:true,privacyNoticeVersion:'test'};
const application={id:'application',application_number:'MMREG-2026-100001',status:'draft',application_type:'new_student',existing_student_id:null,first_name:'Ana',last_name:'Reyes',school_year_id:'year',grade_level_id:'grade',version:1};

describe('public Admissions transactions',()=>{
  beforeEach(()=>{vi.resetAllMocks();mocks.connect.mockResolvedValue(mocks.client);});

  it('creates a new-applicant draft with one primary guardian column and initial history',async()=>{
    mocks.client.query.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[{}]}).mockResolvedValueOnce({rows:[{id:'year'}]}).mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[application]}).mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[]});
    const result=await new PublicAdmissionsService().create({...base},{requestId:'request'});
    const guardianSql=String(mocks.client.query.mock.calls[5]?.[0]);
    expect(guardianSql.match(/is_primary/g)).toHaveLength(1);
    expect(result.application).toMatchObject({applicationNumber:'MMREG-2026-100001'});
    expect(mocks.client.query).toHaveBeenCalledWith(expect.stringContaining('Public registration draft created'),['application']);
    expect(mocks.client.query).toHaveBeenLastCalledWith('COMMIT');
  });

  it('rolls back when a child record cannot be created',async()=>{
    mocks.client.query.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[{}]}).mockResolvedValueOnce({rows:[{id:'year'}]}).mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[application]}).mockRejectedValueOnce(new Error('guardian failed')).mockResolvedValueOnce({rows:[]});
    await expect(new PublicAdmissionsService().create({...base},{requestId:'request'})).rejects.toThrow('guardian failed');
    expect(mocks.client.query).toHaveBeenLastCalledWith('ROLLBACK');
  });

  it('rejects direct draft creation while registration is closed',async()=>{mocks.client.query.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[]});await expect(new PublicAdmissionsService().create({...base},{requestId:'request'})).rejects.toMatchObject({code:'REGISTRATION_CLOSED',status:409});expect(mocks.client.query).toHaveBeenLastCalledWith('ROLLBACK');});

  it('rejects a duplicate active returning registration before inserting',async()=>{
    mocks.client.query.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[{}]}).mockResolvedValueOnce({rows:[{id:'year'}]}).mockResolvedValueOnce({rows:[{id:'student',first_name:'Bayani',last_name:'Castillo',birth_date:'2012-02-12'}]}).mockResolvedValueOnce({rows:[{application_number:'existing'}]}).mockResolvedValueOnce({rows:[]});
    const promise=new PublicAdmissionsService().create({...base,applicationType:'returning_student',studentNumber:'MMSC-2026-0002',birthDate:'2012-02-12'},{requestId:'request'});
    await expect(promise).rejects.toMatchObject({code:'DUPLICATE_ACTIVE_APPLICATION',status:409});
    expect(mocks.client.query).toHaveBeenLastCalledWith('ROLLBACK');
  });

  it('treats a repeated submit as idempotent',async()=>{
    const submitted={...application,status:'submitted',submitted_at:new Date()};
    mocks.client.query.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[submitted]}).mockResolvedValueOnce({rows:[submitted]}).mockResolvedValueOnce({rows:[]});
    const result=await new PublicAdmissionsService().submit('MMREG-2026-100001','A'.repeat(43),null,{requestId:'request'});
    expect(result.status).toBe('submitted');
    expect(mocks.client.query).toHaveBeenLastCalledWith('COMMIT');
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});
