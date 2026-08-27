import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../lib/errors.js';
import { requestContext } from '../middleware/request-context.js';
import { externalSchoolsRepository } from '../reference-data/external-schools.js';
import { referenceDataRouter } from './reference-data.js';

function testApp(permissions:string[]){const app=express();app.use(express.json());app.use(requestContext);app.use((req,_res,next)=>{req.auth={userId:'08f35c64-1fd8-4c59-abd9-03466935c97b',authenticated:true,sessionId:'session',email:'admin@mmsc.test',displayName:'Admin',roles:['test'],permissions};next()});app.use('/api/v1',referenceDataRouter);app.use(errorHandler);return app}
afterEach(()=>vi.restoreAllMocks());
describe('external-school reference routes',()=>{
  it('allows authorized search and parses false correctly',async()=>{const list=vi.spyOn(externalSchoolsRepository,'list').mockResolvedValue([]);const response=await request(testApp(['reference.external_school.view'])).get('/api/v1/reference-data/external-schools?includeInactive=false&search=Cavite');expect(response.status).toBe(200);expect(list).toHaveBeenCalledWith('Cavite',false)});
  it('denies mutations without manage permission',async()=>{const response=await request(testApp(['reference.external_school.view'])).post('/api/v1/reference-data/external-schools').send({name:'Cavite School',countryCode:'PH',active:true});expect(response.status).toBe(403)});
  it('creates a normalized reference with manage permission',async()=>{const create=vi.spyOn(externalSchoolsRepository,'create').mockResolvedValue({id:'school-1',name:'Cavite School'});const response=await request(testApp(['reference.external_school.manage'])).post('/api/v1/reference-data/external-schools').send({name:'Cavite School',countryCode:'PH',active:true});expect(response.status).toBe(201);expect(create).toHaveBeenCalledOnce()});
  it('edits and deactivates a reference without deleting it',async()=>{const save=vi.spyOn(externalSchoolsRepository,'save').mockResolvedValue({id:'08f35c64-1fd8-4c59-abd9-03466935c97b',name:'Cavite School',active:false,version:2});const response=await request(testApp(['reference.external_school.manage'])).patch('/api/v1/reference-data/external-schools/08f35c64-1fd8-4c59-abd9-03466935c97b').send({version:1,data:{name:'Cavite School',countryCode:'PH',active:false}});expect(response.status).toBe(200);expect(save).toHaveBeenCalledOnce()});
});
