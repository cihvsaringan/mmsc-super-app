import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../lib/errors.js';
import { requestContext } from '../middleware/request-context.js';
import { requirePasswordReady,requirePermission } from './middleware.js';

function appWithPermissions(permissions: string[]) {
  const app = express(); app.use(requestContext); app.use((req, _res, next) => { req.auth = { userId:'user-1',authenticated:true,sessionId:'session-1',email:'admin@mmsc.test',username:'admin',loginIdentifier:'admin',displayName:'Admin',accountType:'system',mustChangePassword:false,roles:['test'],permissions }; next(); });
  app.get('/protected', requirePermission('security.user.manage'), (_req, res) => res.json({ ok: true })); app.use(errorHandler); return app;
}

describe('permission middleware', () => {
  it('allows an explicitly granted permission', async () => { expect((await request(appWithPermissions(['security.user.manage'])).get('/protected')).status).toBe(200); });
  it('denies a missing permission', async () => { const response = await request(appWithPermissions([])).get('/protected'); expect(response.status).toBe(403); expect(response.body.error.code).toBe('PERMISSION_DENIED'); });
});

it('blocks protected APIs while a password change is required',async()=>{const app=express();app.use(requestContext);app.use((req,_res,next)=>{req.auth={userId:'user-1',authenticated:true,sessionId:'session-1',email:'',username:null,loginIdentifier:'2026-1',displayName:'Student',accountType:'student',mustChangePassword:true,roles:['student'],permissions:[]};next();});app.get('/protected',requirePasswordReady,(_req,res)=>res.json({ok:true}));app.use(errorHandler);const response=await request(app).get('/protected');expect(response.status).toBe(403);expect(response.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');});
