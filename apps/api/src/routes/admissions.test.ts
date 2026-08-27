import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { admissionsRepository } from '../admissions/repository.js';
import { errorHandler } from '../lib/errors.js';
import { requestContext } from '../middleware/request-context.js';
import { admissionsRouter } from './admissions.js';

const userId='08f35c64-1fd8-4c59-abd9-03466935c97b';
const applicationId='18f35c64-1fd8-4c59-abd9-03466935c97b';
function app(permissions:string[]){const instance=express();instance.use(express.json());instance.use(requestContext);instance.use((req,_res,next)=>{req.auth={userId,authenticated:true,sessionId:'session',email:'registrar@mmsc.test',displayName:'Registrar',roles:['registrar'],permissions};next();});instance.use('/api/v1',admissionsRouter);instance.use(errorHandler);return instance;}
afterEach(()=>vi.restoreAllMocks());
describe('Phase 15 admissions routes',()=>{
  it('protects the application queue',async()=>{const response=await request(app([])).get('/api/v1/admissions');expect(response.status).toBe(403);});
  it('passes queue filters, sorting, and pagination through the protected boundary',async()=>{const list=vi.spyOn(admissionsRepository,'list').mockResolvedValue({items:[],total:0});const response=await request(app(['admission.view'])).get(`/api/v1/admissions?status=pending&applicationType=returning_student&gradeLevelId=${userId}&schoolYearId=${applicationId}&sort=submitted_asc&limit=25&offset=25`);expect(response.status).toBe(200);expect(list).toHaveBeenCalledWith({status:'pending',applicationType:'returning_student',gradeLevelId:userId,schoolYearId:applicationId,sort:'submitted_asc',limit:25,offset:25});});
  it('validates registration input',async()=>{const response=await request(app(['admission.manage'])).post('/api/v1/admissions').send({applicationType:'new_student'});expect(response.status).toBe(400);});
  it('requires a returning application to match an existing Student',async()=>{const response=await request(app(['admission.manage'])).post('/api/v1/admissions').send({schoolId:userId,applicationType:'returning_student',schoolYearId:userId,gradeLevelId:userId,firstName:'Ana',lastName:'Reyes',birthDate:'2015-01-01',guardian:{firstName:'Maria',lastName:'Reyes',relationshipType:'mother',mobilePhone:'09170000000'}});expect(response.status).toBe(400);});
  it('hands approved applications to the Enrollment queue instead of creating Students early',async()=>{const convert=vi.spyOn(admissionsRepository,'convert');const response=await request(app(['admission.convert'])).post(`/api/v1/admissions/${applicationId}/convert`).send({version:1});expect(response.status).toBe(409);expect(response.body.error.code).toBe('ENROLLMENT_HANDOFF_REQUIRED');expect(convert).not.toHaveBeenCalled();});
});
