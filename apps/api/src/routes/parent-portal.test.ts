import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../lib/errors.js';
import { requestContext } from '../middleware/request-context.js';
import { parentPortalRepository } from '../parent-portal/repository.js';
import { parentPortalRouter } from './parent-portal.js';

const userId='08f35c64-1fd8-4c59-abd9-03466935c97b';
function app(permissions:string[]){const value=express();value.use(express.json());value.use(requestContext);value.use((req,_res,next)=>{req.auth={userId,authenticated:true,sessionId:'x',email:'parent@mmsc.test',displayName:'Parent',roles:['parent_guardian'],permissions};next();});value.use('/api/v1',parentPortalRouter);value.use(errorHandler);return value;}
afterEach(()=>vi.restoreAllMocks());
describe('Phase 16 Parent Portal',()=>{
  it('requires portal permission',async()=>{const response=await request(app([])).get('/api/v1/parent-portal/dashboard');expect(response.status).toBe(403);});
  it('passes only authenticated identity and requested child scope',async()=>{const dashboard=vi.spyOn(parentPortalRepository,'dashboard').mockResolvedValue({} as never);const childId='18f35c64-1fd8-4c59-abd9-03466935c97b';const response=await request(app(['parent.portal.access'])).get(`/api/v1/parent-portal/dashboard?studentId=${childId}`);expect(response.status).toBe(200);expect(dashboard).toHaveBeenCalledWith(userId,childId,undefined);});
  it('rejects malformed child identifiers',async()=>{const response=await request(app(['parent.portal.access'])).get('/api/v1/parent-portal/dashboard?studentId=other');expect(response.status).toBe(400);});
});
import{libraryOverdueRepository}from'../library/overdue-repository.js';
describe('Parent Child Library scope',()=>{afterEach(()=>vi.restoreAllMocks());it('passes authenticated guardian and selected child for server relationship enforcement',async()=>{const loans=vi.spyOn(libraryOverdueRepository,'guardian').mockResolvedValue({items:[],current:[],history:[]}),child='18f35c64-1fd8-4c59-abd9-03466935c97b';expect((await request(app(['parent.portal.access'])).get(`/api/v1/parent-portal/library?studentId=${child}`)).status).toBe(200);expect(loans).toHaveBeenCalledWith(userId,child)})});
