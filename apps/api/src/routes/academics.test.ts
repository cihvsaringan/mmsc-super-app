import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { academicRepository } from '../academics/repository.js';
import { errorHandler } from '../lib/errors.js';
import { requestContext } from '../middleware/request-context.js';
import { academicsRouter } from './academics.js';

function testApp(permissions: string[]) {
  const app = express(); app.use(express.json()); app.use(requestContext); app.use((req, _res, next) => { req.auth = { userId: '08f35c64-1fd8-4c59-abd9-03466935c97b', authenticated: true, sessionId: 'session', email: 'admin@mmsc.test', displayName: 'Admin', roles: ['test'], permissions }; next(); }); app.use('/api/v1', academicsRouter); app.use(errorHandler); return app;
}

afterEach(() => vi.restoreAllMocks());

describe('academic master-data routes', () => {
  it('returns allowlisted resources to a viewer', async () => { vi.spyOn(academicRepository, 'list').mockResolvedValue([{ id: 'school-1', name: 'MMSC' }]); const response = await request(testApp(['academic.config.view'])).get('/api/v1/academics/schools'); expect(response.status).toBe(200); expect(response.body.items[0].name).toBe('MMSC'); });
  it('denies management without the manage permission', async () => { const response = await request(testApp(['academic.config.view'])).post('/api/v1/academics/schools').send({ code: 'MMSC', name: 'MMSC' }); expect(response.status).toBe(403); expect(response.body.error.code).toBe('PERMISSION_DENIED'); });
  it('prevents an authorized administrator from creating another institution', async () => { const response = await request(testApp(['academic.config.manage'])).post('/api/v1/academics/schools').send({ code: 'OTHER', name: 'Other School' }); expect(response.status).toBe(409); expect(response.body.error.code).toBe('INSTITUTION_CREATION_DISABLED'); });
  it('prevents archiving the MMSC institution profile', async () => { const response = await request(testApp(['academic.config.manage'])).delete('/api/v1/academics/schools/08f35c64-1fd8-4c59-abd9-03466935c97b?version=1'); expect(response.status).toBe(409); expect(response.body.error.code).toBe('PRIMARY_INSTITUTION_PROTECTED'); });
  it('automatically associates institution-owned records with MMSC', async () => {
    const schoolId='08f35c64-1fd8-4c59-abd9-03466935c97b'; vi.spyOn(academicRepository,'primaryInstitutionId').mockResolvedValue(schoolId); const create=vi.spyOn(academicRepository,'create').mockResolvedValue({id:'year'});
    const response=await request(testApp(['academic.config.manage'])).post('/api/v1/academics/school-years').send({name:'2027-2028',startsOn:'2027-06-01',endsOn:'2028-03-31',status:'planned'});
    expect(response.status).toBe(201); expect(create).toHaveBeenCalledWith('school-years',expect.objectContaining({schoolId}),expect.any(Object));
  });
  it('always creates a new School Year as Planned', async () => {
    const schoolId='08f35c64-1fd8-4c59-abd9-03466935c97b'; vi.spyOn(academicRepository,'primaryInstitutionId').mockResolvedValue(schoolId); const create=vi.spyOn(academicRepository,'create').mockResolvedValue({id:'year',status:'planned'});
    const response=await request(testApp(['academic.config.manage'])).post('/api/v1/academics/school-years').send({name:'2028-2029',startsOn:'2028-06-01',endsOn:'2029-03-31',status:'active'});
    expect(response.status).toBe(201); expect(create).toHaveBeenCalledWith('school-years',expect.objectContaining({schoolId,status:'planned'}),expect.any(Object));
  });
  it('requires explicit confirmation and management permission for activation', async () => {
    const activate=vi.spyOn(academicRepository,'activateSchoolYear').mockResolvedValue({schoolYear:{id:'year',status:'active'},closedSchoolYear:null});
    const missing=await request(testApp(['academic.config.manage'])).post('/api/v1/academics/school-years/08f35c64-1fd8-4c59-abd9-03466935c97b/activate').send({});
    const denied=await request(testApp(['academic.config.view'])).post('/api/v1/academics/school-years/08f35c64-1fd8-4c59-abd9-03466935c97b/activate').send({confirm:'ACTIVATE'});
    const allowed=await request(testApp(['academic.config.manage'])).post('/api/v1/academics/school-years/08f35c64-1fd8-4c59-abd9-03466935c97b/activate').send({confirm:'ACTIVATE'});
    expect(missing.status).toBe(400);expect(denied.status).toBe(403);expect(allowed.status).toBe(200);expect(activate).toHaveBeenCalledOnce();
  });
  it('scopes School Year history by audit permission',async()=>{
    vi.spyOn(academicRepository,'schoolYearDetail').mockResolvedValue({schoolYear:{id:'year'},terms:[],gradingPeriods:[],sections:[],events:[],currentActive:null,history:[{id:'audit'}]});
    const response=await request(testApp(['academic.config.view'])).get('/api/v1/academics/school-years/08f35c64-1fd8-4c59-abd9-03466935c97b/detail');
    expect(response.status).toBe(200);expect(response.body.history).toEqual([]);
  });
  it('manages grading periods as a distinct School Year resource',async()=>{
    const schoolYearId='08f35c64-1fd8-4c59-abd9-03466935c97b',create=vi.spyOn(academicRepository,'create').mockResolvedValue({id:'period'});
    const response=await request(testApp(['academic.config.manage'])).post('/api/v1/academics/grading-periods').send({schoolYearId,academicTermId:null,code:'Q1',name:'First Grading Period',sequence:1,startsOn:'2026-06-01',endsOn:'2026-08-31',status:'open',weight:1});
    expect(response.status).toBe(201);expect(create).toHaveBeenCalledWith('grading-periods',expect.objectContaining({schoolYearId,academicTermId:null}),expect.any(Object));
  });
  it('returns validation and not-found domain errors for invalid School Year details',async()=>{
    vi.spyOn(academicRepository,'schoolYearDetail').mockResolvedValue(null);
    const invalid=await request(testApp(['academic.config.view'])).get('/api/v1/academics/school-years/not-a-uuid/detail');
    const missing=await request(testApp(['academic.config.view'])).get('/api/v1/academics/school-years/08f35c64-1fd8-4c59-abd9-03466935c97b/detail');
    expect(invalid.status).toBe(400);expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
    expect(missing.status).toBe(404);expect(missing.body.error.code).toBe('SCHOOL_YEAR_NOT_FOUND');
  });
  it('does not expose later-phase resources', async () => { const response = await request(testApp(['academic.config.view'])).get('/api/v1/academics/students'); expect(response.status).toBe(404); expect(response.body.error.code).toBe('ACADEMIC_RESOURCE_NOT_FOUND'); });
});
