import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../lib/errors.js';
import { requestContext } from '../middleware/request-context.js';
import { terminalRepository } from '../terminal/repository.js';
import { terminalRouter } from './terminal.js';

const userId='08f35c64-1fd8-4c59-abd9-03466935c97b';
const app=(permissions:string[])=>{const value=express();value.use(express.json(),requestContext,(req,_res,next)=>{req.auth={authenticated:true,userId,sessionId:'session',email:'admin@mmsc.test',displayName:'Admin',roles:['school_administrator'],permissions};next()});value.use('/api/v1',terminalRouter);value.use(errorHandler);return value};
afterEach(()=>vi.restoreAllMocks());

describe('Attendance Terminal Administration separation',()=>{
  it('protects Administration with user RBAC',async()=>{expect((await request(app([])).get('/api/v1/attendance-terminals/admin')).status).toBe(403)});
  it('returns the new Administration read model without device authentication',async()=>{vi.spyOn(terminalRepository,'adminContext').mockResolvedValue({terminals:[],campuses:[],audits:[],devices:[],provisioningTokens:[]});const response=await request(app(['attendance.terminal.manage'])).get('/api/v1/attendance-terminals/admin');expect(response.status).toBe(200);expect(response.body).toEqual({terminals:[],campuses:[],audits:[],devices:[],provisioningTokens:[]})});
  it('requires device-manage permission for provisioning',async()=>{expect((await request(app(['attendance.terminal.manage'])).post(`/api/v1/attendance-terminals/${userId}/provisioning-tokens`).send({})).status).toBe(403)});
  it('keeps runtime bootstrap behind device authentication',async()=>{expect((await request(app(['attendance.terminal.manage'])).get('/api/v1/attendance-terminals/runtime/bootstrap')).status).toBe(401)});
});
