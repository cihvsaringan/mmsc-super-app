import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('API foundation', () => {
  it('reports service health and emits a request id', async () => {
    const response = await request(createApp()).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'mmsc-api' });
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('uses the global JSON not-found contract', async () => {
    const response = await request(createApp()).get('/api/v1/missing');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
