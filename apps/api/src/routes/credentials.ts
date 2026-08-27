import { Router, type Request } from 'express';
import { z } from 'zod';
import { credentialRepository } from '../credentials/repository.js';
import { requirePermission } from '../security/middleware.js';
import { requireTerminalDevice } from '../terminal/device-auth.js';

export const credentialsRouter = Router();
const uuid = z.string().uuid();
const ownerType = z.enum(['student','employee']);
const context = (request: Request) => ({ actorId: request.auth.userId!, requestId: String(request.id) });

credentialsRouter.get('/credentials', requirePermission('credential.manage'), async (request,response,next) => {
  try { const query=z.object({ownerType,ownerId:uuid}).parse(request.query); response.json({items:await credentialRepository.list(query.ownerType,query.ownerId)}); } catch(error){next(error);}
});
credentialsRouter.post('/credentials', requirePermission('credential.manage'), async (request,response,next) => {
  try { const data=z.object({ownerType,ownerId:uuid,credentialType:z.enum(['rfid','qr']),credentialValue:z.string().trim().min(1).max(500).optional(),generate:z.boolean().optional(),expiresAt:z.iso.datetime({offset:true}).nullable().optional()}).strict().refine(value=>!(value.generate&&value.credentialType!=='qr'),{message:'Only QR credentials can be generated',path:['generate']}).parse(request.body); response.status(201).json(await credentialRepository.register(data,context(request))); } catch(error){next(error);}
});
credentialsRouter.post('/credentials/:id/status', requirePermission('credential.manage'), async (request,response,next) => {
  try { const data=z.object({status:z.enum(['active','inactive','lost','replaced','revoked']),version:z.number().int().positive(),replacementValue:z.string().trim().min(1).max(500).optional()}).strict().parse(request.body); response.json(await credentialRepository.transition(uuid.parse(request.params.id),data.status,data.version,data.replacementValue,context(request))); } catch(error){next(error);}
});
credentialsRouter.get('/attendance-terminals/runtime/credentials', requireTerminalDevice, async (request,response,next) => {
  try { const query=z.object({changedSince:z.iso.datetime({offset:true}).optional()}).parse(request.query); response.json(await credentialRepository.terminalCache(request.auth.terminalId!,request.auth.deviceId!,query.changedSince)); } catch(error){next(error);}
});
