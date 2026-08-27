import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../lib/errors.js';
import { requestContext } from '../middleware/request-context.js';
import { teacherRepository } from '../teachers/repository.js';
import { teachersRouter } from './teachers.js';

function app(permissions: string[]) {
  const result = express();
  result.use(express.json());
  result.use(requestContext);
  result.use((req, _res, next) => {
    req.auth = { userId: '08f35c64-1fd8-4c59-abd9-03466935c97b', authenticated: true, sessionId: 'test', email: 'admin@mmsc.test', displayName: 'Admin', roles: ['test'], permissions };
    next();
  });
  result.use('/api/v1', teachersRouter);
  result.use(errorHandler);
  return result;
}

afterEach(() => vi.restoreAllMocks());

describe('Teacher routes', () => {
  it('returns the paginated directory and forwards server filters', async () => {
    const list = vi.spyOn(teacherRepository, 'list').mockResolvedValue({ items: [], total: 0 });
    const response = await request(app(['teacher.profile.view'])).get('/api/v1/teachers?search=Maria&facultyStatus=full_time&limit=25&offset=25');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], total: 0 });
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ search: 'Maria', facultyStatus: 'full_time', limit: 25, offset: 25 }));
  });

  it('searches eligible Employees only for Teacher managers', async () => {
    const eligible = vi.spyOn(teacherRepository, 'eligibleEmployees').mockResolvedValue([]);
    const allowed = await request(app(['teacher.profile.manage'])).get('/api/v1/teachers/eligible-employees?search=EMP-001');
    const denied = await request(app(['teacher.profile.view'])).get('/api/v1/teachers/eligible-employees');
    expect(allowed.status).toBe(200);
    expect(eligible).toHaveBeenCalledWith('EMP-001');
    expect(denied.status).toBe(403);
  });

  it('removes restricted related data from Teacher details', async () => {
    vi.spyOn(teacherRepository, 'detail').mockResolvedValue({ profile: { id: 'x' }, qualifications: [{ id: 'q' }], yearAssignments: [{ id: 'y' }], teachingAssignments: [{ id: 'a' }], history: [{ id: 'h' }] });
    vi.spyOn(teacherRepository, 'access').mockResolvedValue(undefined);
    const response = await request(app(['teacher.profile.view'])).get('/api/v1/teachers/08f35c64-1fd8-4c59-abd9-03466935c97b');
    expect(response.status).toBe(200);
    expect(response.body.qualifications).toEqual([]);
    expect(response.body.yearAssignments).toEqual([]);
    expect(response.body.teachingAssignments).toEqual([]);
    expect(response.body.history).toEqual([]);
  });

  it('denies profile creation without manage permission', async () => {
    const response = await request(app(['teacher.profile.view'])).post('/api/v1/teachers').send({ employeeId: '08f35c64-1fd8-4c59-abd9-03466935c97b' });
    expect(response.status).toBe(403);
  });

  it('keeps year placement behind its own manage permission', async () => {
    const response = await request(app(['teacher.profile.manage'])).post('/api/v1/teachers/08f35c64-1fd8-4c59-abd9-03466935c97b/year-assignments').send({ schoolYearId: '08f35c64-1fd8-4c59-abd9-03466935c97b', facultyStatus: 'full_time' });
    expect(response.status).toBe(403);
  });
});
