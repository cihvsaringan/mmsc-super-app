import { Router } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { createSessionToken, digestSessionToken, hashPassword, verifyPassword } from '../security/crypto.js';
import { requireAuthentication, sessionCookieName } from '../security/middleware.js';
import { securityRepository } from '../security/repository.js';
import { changePasswordSchema, loginSchema } from '../security/schemas.js';
import { rateLimit } from '../middleware/security-hardening.js';

export const authRouter = Router();
const cookieOptions = () => `Path=/api/v1; HttpOnly; SameSite=Strict; Max-Age=${env.SESSION_TTL_HOURS * 3600}${env.SESSION_COOKIE_SECURE ? '; Secure' : ''}`;
const clearCookie = () => `${sessionCookieName}=; Path=/api/v1; HttpOnly; SameSite=Strict; Max-Age=0${env.SESSION_COOKIE_SECURE ? '; Secure' : ''}`;
const ip = (value: string | undefined) => value?.replace(/^::ffff:/, '');

const loginLimit=rateLimit({name:'auth-login',maximum:10,windowMs:15*60_000,key:req=>`${req.ip}:${String(req.body?.identifier??'').trim().toLowerCase()}`});
authRouter.post('/auth/login',loginLimit, async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await securityRepository.findLoginUser(body.identifier);
    if (!user || user.status !== 'active' || !user.eligible || (user.lockedUntil && user.lockedUntil > new Date())) {
      await securityRepository.audit({ actorUserId: user?.id, action: 'auth.login', targetType: 'user', targetId: user?.id, outcome: 'failure', requestId: String(req.id), ipAddress: ip(req.ip), metadata: { reason: user?.lockedUntil ? 'locked' : 'invalid_credentials' } });
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid login credentials');
    }
    if (!(await verifyPassword(body.password, user.passwordHash))) {
      await securityRepository.registerFailedLogin(user.id);
      await securityRepository.audit({ actorUserId: user.id, action: 'auth.login', targetType: 'user', targetId: user.id, outcome: 'failure', requestId: String(req.id), ipAddress: ip(req.ip), metadata: { reason: 'invalid_credentials' } });
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid login credentials');
    }
    const token = createSessionToken();
    await securityRepository.registerSuccessfulLogin(user.id);
    await securityRepository.createSession({ userId: user.id, digest: digestSessionToken(token), expiresAt: new Date(Date.now() + env.SESSION_TTL_HOURS * 3_600_000), ip: ip(req.ip), userAgent: req.header('user-agent') });
    await securityRepository.audit({ actorUserId: user.id, action: 'auth.login', targetType: 'user', targetId: user.id, outcome: 'success', requestId: String(req.id), ipAddress: ip(req.ip) });
    res.setHeader('set-cookie', `${sessionCookieName}=${encodeURIComponent(token)}; ${cookieOptions()}`);
    res.json({ user: { id:user.id,email:user.email,username:user.username,loginIdentifier:user.loginIdentifier,displayName:user.displayName,accountType:user.accountType,mustChangePassword:user.mustChangePassword,roles:user.roles,permissions:user.permissions } });
  } catch (error) { next(error); }
});

authRouter.post('/auth/forgot-password',async(req,res,next)=>{try{const identifier=String(req.body?.identifier??'').trim().toLowerCase().slice(0,160);await securityRepository.audit({action:'auth.password_reset_requested',targetType:'login_identity',targetId:identifier?'submitted':'missing',outcome:'success',requestId:String(req.id),ipAddress:ip(req.ip),metadata:{delivery:'not_configured'}});res.status(202).json({message:'If the account is eligible for recovery, password-reset instructions will be sent through its configured recovery channel.'});}catch(error){next(error);}});

authRouter.get('/auth/me', requireAuthentication, (req, res) => {
  res.json({ user: { id:req.auth.userId,email:req.auth.email,username:req.auth.username,loginIdentifier:req.auth.loginIdentifier,displayName:req.auth.displayName,accountType:req.auth.accountType,mustChangePassword:req.auth.mustChangePassword,roles:req.auth.roles,permissions:req.auth.permissions } });
});

authRouter.post('/auth/logout', requireAuthentication, async (req, res, next) => {
  try {
    await securityRepository.revokeSession(req.auth.sessionId!);
    await securityRepository.audit({ actorUserId: req.auth.userId, action: 'auth.logout', targetType: 'user', targetId: req.auth.userId!, outcome: 'success', requestId: String(req.id), ipAddress: ip(req.ip) });
    res.setHeader('set-cookie', clearCookie()); res.status(204).end();
  } catch (error) { next(error); }
});

authRouter.post('/auth/change-password', requireAuthentication, async (req, res, next) => {
  try {
    const body = changePasswordSchema.parse(req.body);
    const user = await securityRepository.findPasswordUserById(req.auth.userId!);
    if (!user || !(await verifyPassword(body.currentPassword, user.passwordHash))) throw new AppError(400, 'CURRENT_PASSWORD_INVALID', 'Current password is incorrect');
    await securityRepository.updatePassword({ userId: user.id, passwordHash: await hashPassword(body.newPassword), currentSessionId: req.auth.sessionId! });
    await securityRepository.audit({ actorUserId: user.id, action: 'auth.password_change', targetType: 'user', targetId: user.id, outcome: 'success', requestId: String(req.id), ipAddress: ip(req.ip) });
    res.status(204).end();
  } catch (error) { next(error); }
});
