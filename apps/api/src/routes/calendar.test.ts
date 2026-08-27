import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { calendarRepository } from '../calendar/repository.js';
import { errorHandler } from '../lib/errors.js';
import { requestContext } from '../middleware/request-context.js';
import { calendarRouter } from './calendar.js';

const app = (permissions:string[]) => { const server=express();server.use(requestContext,(req,_res,next)=>{req.auth={authenticated:true,userId:'08f35c64-1fd8-4c59-abd9-03466935c97b',sessionId:'test',email:'user@mmsc.test',displayName:'User',roles:['student'],permissions};next()});server.use('/api/v1',calendarRouter);server.use(errorHandler);return server };
afterEach(()=>vi.restoreAllMocks());
describe('Phase 24 calendar routes',()=>{
  it('requires calendar experience permission',async()=>expect((await request(app([])).get('/api/v1/calendar/context')).status).toBe(403));
  it('limits ordinary users to published events',async()=>{const spy=vi.spyOn(calendarRepository,'events').mockResolvedValue([]);const response=await request(app(['calendar.experience.access'])).get('/api/v1/calendar/events?from=2026-08-01&to=2026-08-31');expect(response.status).toBe(200);expect(spy).toHaveBeenCalledWith(expect.objectContaining({includeUnpublished:false}))});
  it('allows calendar managers to preview non-published events',async()=>{const spy=vi.spyOn(calendarRepository,'events').mockResolvedValue([]);await request(app(['calendar.experience.access','academic.calendar.manage'])).get('/api/v1/calendar/events?from=2026-08-01&to=2026-08-31');expect(spy).toHaveBeenCalledWith(expect.objectContaining({includeUnpublished:true}))});
  it('rejects an inverted date range',async()=>expect((await request(app(['calendar.experience.access'])).get('/api/v1/calendar/events?from=2026-09-01&to=2026-08-01')).status).toBe(400));
});
