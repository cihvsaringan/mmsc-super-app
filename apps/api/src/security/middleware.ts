import type { RequestHandler } from 'express';
import { AppError } from '../lib/errors.js';
import { digestSessionToken } from './crypto.js';
import { securityRepository } from './repository.js';

export const sessionCookieName = 'mmsc_session';

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const pair of header.split(';')) {
    const [key, ...value] = pair.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return null;
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const cookieToken = readCookie(req.header('cookie'), sessionCookieName);
    const bearer = req.header('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    const token = cookieToken ?? bearer;
    if (!token) { next(); return; }
    const user = await securityRepository.findBySessionDigest(digestSessionToken(token));
    if (!user) { next(); return; }
    req.auth = { userId: user.id, authenticated: true, sessionId: user.sessionId, email: user.email, username:user.username, loginIdentifier:user.loginIdentifier, displayName: user.displayName, accountType:user.accountType, mustChangePassword:user.mustChangePassword, roles: user.roles, permissions: user.permissions };
    void securityRepository.touchSession(user.sessionId);
    next();
  } catch (error) { next(error); }
};

export const requireAuthentication: RequestHandler = (req, _res, next) => {
  if (!req.auth.authenticated) { next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')); return; }
  next();
};

export const requirePermission = (permission: string): RequestHandler => (req, _res, next) => {
  if (!req.auth.authenticated) { next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')); return; }
  if (!req.auth.permissions.includes(permission)) { next(new AppError(403, 'PERMISSION_DENIED', 'You do not have permission to perform this action')); return; }
  next();
};

export const requirePasswordReady: RequestHandler = (req,_res,next) => {
  if(req.auth.authenticated&&req.auth.mustChangePassword){next(new AppError(403,'PASSWORD_CHANGE_REQUIRED','Change your temporary password before continuing'));return;}
  next();
};
