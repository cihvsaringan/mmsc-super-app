import { Router } from 'express';
import { z } from 'zod';
import { academicRepository } from '../academics/repository.js';
import { isResourceName, resourceDefinitions, type ResourceName } from '../academics/resources.js';
import { AppError } from '../lib/errors.js';
import { requirePermission } from '../security/middleware.js';

export const academicsRouter = Router();
const id = z.string().uuid();
const version = z.coerce.number().int().positive();
const ip = (value: string | undefined) => value?.replace(/^::ffff:/, '');
const resource = (value: string) => { if (!isResourceName(value)) throw new AppError(404, 'ACADEMIC_RESOURCE_NOT_FOUND', 'Academic resource was not found'); return value; };
const institutionData = async (name: ResourceName, input: unknown) => {
  if (name === 'schools' || !Object.values(resourceDefinitions[name].fields).some((value) => value === 'school_id')) return input;
  return { ...(input as Record<string, unknown>), schoolId: await academicRepository.primaryInstitutionId() };
};

academicsRouter.get('/academics/school-years/:id/detail', requirePermission('academic.config.view'), async (request, response, next) => {
  try {
    const result = await academicRepository.schoolYearDetail(id.parse(request.params.id));
    if (!result) throw new AppError(404, 'SCHOOL_YEAR_NOT_FOUND', 'School Year was not found');
    if (!request.auth.permissions.includes('academic.calendar.view')) result.events = [];
    if (!request.auth.permissions.includes('audit.view')) result.history = [];
    response.json(result);
  } catch (error) { next(error); }
});

academicsRouter.post('/academics/school-years/:id/activate', requirePermission('academic.config.manage'), async (request, response, next) => {
  try {
    const confirmation = z.object({ confirm: z.literal('ACTIVATE') }).strict().parse(request.body);
    void confirmation;
    response.json(await academicRepository.activateSchoolYear(id.parse(request.params.id), { actorId: request.auth.userId!, requestId: String(request.id), ip: ip(request.ip) }));
  } catch (error) { next(error); }
});

academicsRouter.get('/academics/:resource', (request, response, next) => {
  try { const name = resource(request.params.resource); requirePermission(`${resourceDefinitions[name].permission}.view`)(request, response, async (error) => { if (error) { next(error); return; } try { response.json({ items: await academicRepository.list(name) }); } catch (caught) { next(caught); } }); } catch (error) { next(error); }
});
academicsRouter.post('/academics/:resource', (request, response, next) => {
  try { const name = resource(request.params.resource); requirePermission(`${resourceDefinitions[name].permission}.manage`)(request, response, async (error) => { if (error) { next(error); return; } try { if (name === 'schools') throw new AppError(409, 'INSTITUTION_CREATION_DISABLED', 'MMSC is the configured institution; additional internal institutions cannot be created'); const input=name==='school-years'?{...(request.body as Record<string,unknown>),status:'planned'}:request.body; const body = resourceDefinitions[name].schema.parse(await institutionData(name, input)); const item = await academicRepository.create(name, body, { actorId: request.auth.userId!, requestId: String(request.id), ip: ip(request.ip) }); response.status(201).json({ item }); } catch (caught) { next(caught); } }); } catch (error) { next(error); }
});
academicsRouter.patch('/academics/:resource/:id', (request, response, next) => {
  try { const name = resource(request.params.resource); requirePermission(`${resourceDefinitions[name].permission}.manage`)(request, response, async (error) => { if (error) { next(error); return; } try { const envelope = z.object({ version, data: z.unknown() }).strict().parse(request.body); const parsed = resourceDefinitions[name].schema.parse(await institutionData(name, envelope.data)); const data={...parsed} as Record<string,unknown>; if(name==='school-years')delete data.status; const item = await academicRepository.update(name, id.parse(request.params.id), envelope.version, data, { actorId: request.auth.userId!, requestId: String(request.id), ip: ip(request.ip) }); if (!item) throw new AppError(409, 'STALE_RECORD', 'The record changed or no longer exists'); response.json({ item }); } catch (caught) { next(caught); } }); } catch (error) { next(error); }
});
academicsRouter.delete('/academics/:resource/:id', (request, response, next) => {
  try { const name = resource(request.params.resource); requirePermission(`${resourceDefinitions[name].permission}.manage`)(request, response, async (error) => { if (error) { next(error); return; } try { if (name === 'schools') throw new AppError(409, 'PRIMARY_INSTITUTION_PROTECTED', 'The MMSC institution cannot be archived'); if (!await academicRepository.archive(name, id.parse(request.params.id), version.parse(request.query.version), { actorId: request.auth.userId!, requestId: String(request.id), ip: ip(request.ip) })) throw new AppError(409, 'STALE_RECORD', 'The record changed or no longer exists'); response.status(204).end(); } catch (caught) { next(caught); } }); } catch (error) { next(error); }
});
