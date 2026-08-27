import { Router, type Request } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';
import { externalSchoolSchema, externalSchoolsRepository } from '../reference-data/external-schools.js';
import { requirePermission } from '../security/middleware.js';

export const referenceDataRouter = Router();
const id = z.string().uuid();
const version = z.coerce.number().int().positive();
const context = (request: Request) => ({ actorId: request.auth.userId!, requestId: String(request.id), ip: request.ip?.replace(/^::ffff:/, '') });
const listQuery = z.object({
  search: z.string().trim().max(160).default(''),
  includeInactive: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
});

referenceDataRouter.get('/reference-data/external-schools', requirePermission('reference.external_school.view'), async (request, response, next) => {
  try { const query = listQuery.parse(request.query); response.json({ items: await externalSchoolsRepository.list(query.search, query.includeInactive) }); } catch (error) { next(error); }
});
referenceDataRouter.post('/reference-data/external-schools', requirePermission('reference.external_school.manage'), async (request, response, next) => {
  try { const item = await externalSchoolsRepository.create(externalSchoolSchema.parse(request.body), context(request)); response.status(201).json({ item }); } catch (error) { next(error); }
});
referenceDataRouter.patch('/reference-data/external-schools/:id', requirePermission('reference.external_school.manage'), async (request, response, next) => {
  try { const body = z.object({ version, data: externalSchoolSchema }).strict().parse(request.body); const item = await externalSchoolsRepository.save(id.parse(request.params.id), body.version, body.data, context(request)); if (!item) throw new AppError(409, 'STALE_RECORD', 'The External School changed or no longer exists'); response.json({ item }); } catch (error) { next(error); }
});
