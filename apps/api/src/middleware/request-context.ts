import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export const requestContext: RequestHandler = (req, res, next) => {
  const supplied=req.header('x-request-id');
  req.id = supplied&&/^[A-Za-z0-9._:-]{1,128}$/.test(supplied)?supplied:randomUUID();
  req.auth = { userId: null, authenticated: false, sessionId: null, email: null, username:null, loginIdentifier:null, displayName: null, accountType:null, mustChangePassword:false, roles: [], permissions: [] };
  res.setHeader('x-request-id', req.id);
  next();
};
