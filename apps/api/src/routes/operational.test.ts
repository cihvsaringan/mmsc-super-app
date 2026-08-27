import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { operationalRepository } from '../operational/repository.js';
import { errorHandler } from '../lib/errors.js';
import { requestContext } from '../middleware/request-context.js';
import { operationalRouter } from './operational.js';

const userId = '08f35c64-1fd8-4c59-abd9-03466935c97b';
const app = (permissions: string[]) => {
  const instance = express();
  instance.use(express.json(), requestContext, (req, _res, next) => {
    req.auth = { authenticated: true, userId, sessionId: 'session', email: 'admin@mmsc.test', username: 'admin', loginIdentifier: 'admin', displayName: 'Admin', accountType: 'system', mustChangePassword: false, roles: ['school_administrator'], permissions };
    next();
  });
  instance.use('/api/v1', operationalRouter);
  instance.use(errorHandler);
  return instance;
};

afterEach(() => vi.restoreAllMocks());

describe('Phase 28 operational administration', () => {
  it('protects the operational snapshot with its own permission', async () => {
    expect((await request(app([])).get('/api/v1/administration/operations')).status).toBe(403);
  });

  it('returns the permission-scoped operational read model', async () => {
    vi.spyOn(operationalRepository, 'snapshot').mockResolvedValue({ generatedAt: '2026-08-21T00:00:00.000Z', service: { api: 'available', database: 'available' } } as never);
    const response = await request(app(['administration.operations.view'])).get('/api/v1/administration/operations');
    expect(response.status).toBe(200);
    expect(response.body.service.database).toBe('available');
  });

  it('requires manage permission and explicit confirmation for maintenance', async () => {
    expect((await request(app(['administration.operations.view'])).post('/api/v1/administration/operations/session-maintenance').send({ confirmation: 'CLOSE_STALE_SESSIONS' })).status).toBe(403);
    expect((await request(app(['administration.operations.manage'])).post('/api/v1/administration/operations/session-maintenance').send({ confirmation: 'wrong' })).status).toBe(400);
  });

  it('forwards actor context and returns the affected count', async () => {
    const close = vi.spyOn(operationalRepository, 'closeStaleSessions').mockResolvedValue({ affectedCount: 3 });
    const response = await request(app(['administration.operations.manage'])).post('/api/v1/administration/operations/session-maintenance').send({ confirmation: 'CLOSE_STALE_SESSIONS' });
    expect(response.status).toBe(200);
    expect(response.body.result.affectedCount).toBe(3);
    expect(close.mock.calls[0]?.[0].actorId).toBe(userId);
  });
});
