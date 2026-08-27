import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { hashPassword } from '../security/crypto.js';
import { securityRepository } from '../security/repository.js';

afterEach(() => vi.restoreAllMocks());

describe('authentication routes', () => {
  it('creates a secure opaque session after valid credentials', async () => {
    vi.spyOn(securityRepository, 'findLoginUser').mockResolvedValue({ id: '08f35c64-1fd8-4c59-abd9-03466935c97b', email: 'admin@mmsc.test',username:'admin',loginIdentifier:'admin',displayName:'Admin',status:'active',accountType:'system',mustChangePassword:false,roles:['super_administrator'],permissions:['dashboard.view'],passwordHash:await hashPassword('a-valid-password'),failedLoginCount:0,lockedUntil:null,eligible:true });
    vi.spyOn(securityRepository, 'registerSuccessfulLogin').mockResolvedValue(); vi.spyOn(securityRepository, 'createSession').mockResolvedValue(); vi.spyOn(securityRepository, 'audit').mockResolvedValue();
    const response = await request(createApp()).post('/api/v1/auth/login').send({ identifier: 'ADMIN', password: 'a-valid-password' });
    expect(response.status).toBe(200); expect(response.body.user.email).toBe('admin@mmsc.test'); expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly'); expect(response.headers['set-cookie']?.[0]).toContain('SameSite=Strict');
  });

  it('returns a generic response and records a failed password', async () => {
    vi.spyOn(securityRepository, 'findLoginUser').mockResolvedValue({ id: '08f35c64-1fd8-4c59-abd9-03466935c97b',email:'admin@mmsc.test',username:'admin',loginIdentifier:'admin',displayName:'Admin',status:'active',accountType:'system',mustChangePassword:false,roles:[],permissions:[],passwordHash:await hashPassword('a-valid-password'),failedLoginCount:0,lockedUntil:null,eligible:true });
    const failed = vi.spyOn(securityRepository, 'registerFailedLogin').mockResolvedValue(); vi.spyOn(securityRepository, 'audit').mockResolvedValue();
    const response = await request(createApp()).post('/api/v1/auth/login').send({ identifier: 'admin', password: 'wrong' });
    expect(response.status).toBe(401); expect(response.body.error.code).toBe('INVALID_CREDENTIALS'); expect(failed).toHaveBeenCalledOnce();
  });

  it('does not accept an email-shaped legacy login payload',async()=>{const response=await request(createApp()).post('/api/v1/auth/login').send({email:'admin@mmsc.test',password:'a-valid-password'});expect(response.status).toBe(400);});

  it('blocks an ineligible linked identity with the same generic failure',async()=>{vi.spyOn(securityRepository,'findLoginUser').mockResolvedValue({id:'08f35c64-1fd8-4c59-abd9-03466935c97b',email:'student@mmsc.test',username:null,loginIdentifier:'2026-0001',displayName:'Student',status:'active',accountType:'student',mustChangePassword:false,roles:['student'],permissions:['student.portal.access'],passwordHash:await hashPassword('Valid-Password7!'),failedLoginCount:0,lockedUntil:null,eligible:false});vi.spyOn(securityRepository,'audit').mockResolvedValue();const response=await request(createApp()).post('/api/v1/auth/login').send({identifier:'2026-0001',password:'Valid-Password7!'});expect(response.status).toBe(401);expect(response.body.error.message).toBe('Invalid login credentials');});
});
