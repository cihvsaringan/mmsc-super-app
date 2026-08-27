import { Router, type Request } from 'express';
import { z } from 'zod';
import { operationalRepository } from '../operational/repository.js';
import { requirePermission } from '../security/middleware.js';

export const operationalRouter = Router();
const context = (request: Request) => ({ actorId: request.auth.userId!, requestId: String(request.id), ip: request.ip?.replace(/^::ffff:/, '') });

operationalRouter.get('/administration/operations', requirePermission('administration.operations.view'), async (_request, response, next) => {
  try { response.json(await operationalRepository.snapshot()); } catch (error) { next(error); }
});

operationalRouter.post('/administration/operations/session-maintenance', requirePermission('administration.operations.manage'), async (request, response, next) => {
  try {
    z.object({ confirmation: z.literal('CLOSE_STALE_SESSIONS') }).strict().parse(request.body);
    response.json({ result: await operationalRepository.closeStaleSessions(context(request)) });
  } catch (error) { next(error); }
});
