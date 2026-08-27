import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../lib/errors.js';
import { requestContext } from '../middleware/request-context.js';
import { workforceRepository } from '../workforce/repository.js';
import { workforceRouter } from './workforce.js';

function app(permissions: string[]) { const result=express();result.use(express.json());result.use(requestContext);result.use((req,_res,next)=>{req.auth={userId:'08f35c64-1fd8-4c59-abd9-03466935c97b',authenticated:true,sessionId:'test',email:'hr@mmsc.test',displayName:'HR',roles:['hr_staff'],permissions};next();});result.use('/api/v1',workforceRouter);result.use(errorHandler);return result; }
afterEach(()=>vi.restoreAllMocks());
describe('Phase 3 workforce routes',()=>{
  it('returns the employee directory to a viewer',async()=>{vi.spyOn(workforceRepository,'listEmployees').mockResolvedValue({items:[],total:0});const response=await request(app(['employee.view'])).get('/api/v1/workforce/employees');expect(response.status).toBe(200);expect(response.body.total).toBe(0);});
  it('treats blank optional directory filters as omitted',async()=>{const list=vi.spyOn(workforceRepository,'listEmployees').mockResolvedValue({items:[],total:0});const response=await request(app(['employee.view'])).get('/api/v1/workforce/employees?search=&status=&departmentId=');expect(response.status).toBe(200);expect(list).toHaveBeenCalledWith(expect.objectContaining({search:undefined,status:undefined,departmentId:undefined}));});
  it('keeps identifiers behind the sensitive permission',async()=>{const response=await request(app(['employee.view'])).get('/api/v1/workforce/employees/08f35c64-1fd8-4c59-abd9-03466935c97b/identifiers');expect(response.status).toBe(403);expect(response.body.error.code).toBe('PERMISSION_DENIED');});
  it('does not let an employee editor archive an employee',async()=>{const response=await request(app(['employee.edit'])).delete('/api/v1/workforce/employees/08f35c64-1fd8-4c59-abd9-03466935c97b?version=1');expect(response.status).toBe(403);});
});
