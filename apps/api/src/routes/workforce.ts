import { Router, type Request, type RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';
import { requirePermission } from '../security/middleware.js';
import { documentSchema, emergencyContactSchema, employeeSchema, employeeTypeSchema, identifierSchema, workforceConfigSchema } from '../workforce/schemas.js';
import { workforceRepository, type ConfigName } from '../workforce/repository.js';

export const workforceRouter = Router();
const id = z.string().uuid(); const version = z.coerce.number().int().positive();
const ip = (value: string | undefined) => value?.replace(/^::ffff:/, '');
const ctx = (req: Request) => ({ actorId: req.auth.userId!, requestId: String(req.id), ip: ip(req.ip) });
const guard = (permission: string, handler: RequestHandler): [RequestHandler, RequestHandler] => [requirePermission(permission), handler];
const stale = () => new AppError(409, 'STALE_RECORD', 'The record changed or no longer exists');

workforceRouter.get('/workforce/context', ...guard('employee.view', async (_req, res, next) => { try { res.json(await workforceRepository.context()); } catch (error) { next(error); } }));

workforceRouter.get('/workforce/employees', ...guard('employee.view', async (req, res, next) => { try { const blank=(value:unknown)=>value===''?undefined:value;const query=z.object({search:z.preprocess(blank,z.string().trim().max(160).optional()),status:z.preprocess(blank,z.enum(['active','inactive','on_leave','resigned','terminated','retired']).optional()),departmentId:z.preprocess(blank,z.string().uuid().optional()),limit:z.coerce.number().int().min(1).max(100).default(25),offset:z.coerce.number().int().min(0).default(0)}).parse(req.query); res.json(await workforceRepository.listEmployees(query)); } catch(error){next(error);} }));
workforceRouter.post('/workforce/employees', ...guard('employee.create', async(req,res,next)=>{try{res.status(201).json({item:await workforceRepository.createEmployee(employeeSchema.parse(req.body),ctx(req))});}catch(error){next(error);}}));
workforceRouter.get('/workforce/employees/:id', ...guard('employee.view', async(req,res,next)=>{try{const employeeId=id.parse(req.params.id);const item=await workforceRepository.detail(employeeId);if(!item)throw new AppError(404,'EMPLOYEE_NOT_FOUND','Employee was not found');await workforceRepository.recordAccess('employee.profile.view',employeeId,ctx(req));res.json(item);}catch(error){next(error);}}));
workforceRouter.patch('/workforce/employees/:id', ...guard('employee.edit', async(req,res,next)=>{try{const body=z.object({version:version,data:employeeSchema,statusEffectiveOn:z.iso.date().optional(),statusReason:z.string().trim().max(1000).nullable().optional()}).strict().parse(req.body);const item=await workforceRepository.updateEmployee(id.parse(req.params.id),body.version,body.data,body.statusEffectiveOn,body.statusReason,ctx(req));if(!item)throw stale();res.json({item});}catch(error){next(error);}}));
workforceRouter.delete('/workforce/employees/:id', ...guard('employee.archive', async(req,res,next)=>{try{if(!await workforceRepository.archiveEmployee(id.parse(req.params.id),version.parse(req.query.version),ctx(req)))throw stale();res.status(204).end();}catch(error){next(error);}}));

for (const name of ['positions','employee-types'] as const) {
  const schema=name==='positions'?workforceConfigSchema:employeeTypeSchema;
  workforceRouter.get(`/workforce/${name}`, ...guard('workforce.config.view', async(_req,res,next)=>{try{res.json({items:await workforceRepository.listConfig(name as ConfigName)});}catch(error){next(error);}}));
  workforceRouter.post(`/workforce/${name}`, ...guard('workforce.config.manage', async(req,res,next)=>{try{res.status(201).json({item:await workforceRepository.createConfig(name as ConfigName,schema.parse(req.body),ctx(req))});}catch(error){next(error);}}));
  workforceRouter.patch(`/workforce/${name}/:id`, ...guard('workforce.config.manage',async(req,res,next)=>{try{const body=z.object({version,data:schema}).strict().parse(req.body);const item=await workforceRepository.updateConfig(name,id.parse(req.params.id),body.version,body.data,ctx(req));if(!item)throw stale();res.json({item});}catch(error){next(error);}}));
  workforceRouter.delete(`/workforce/${name}/:id`, ...guard('workforce.config.manage',async(req,res,next)=>{try{if(!await workforceRepository.archiveConfig(name,id.parse(req.params.id),version.parse(req.query.version),ctx(req)))throw stale();res.status(204).end();}catch(error){next(error);}}));
}

const contactFields={name:'name',relationship:'relationship',phone:'phone',email:'email',address:'address',isPrimary:'is_primary'};
workforceRouter.post('/workforce/employees/:id/emergency-contacts', ...guard('employee.edit',async(req,res,next)=>{try{res.status(201).json({item:await workforceRepository.createRelated('employee_emergency_contacts',id.parse(req.params.id),emergencyContactSchema.parse(req.body),contactFields,'employee.emergency_contact.create',ctx(req))});}catch(error){next(error);}}));
workforceRouter.delete('/workforce/emergency-contacts/:id', ...guard('employee.edit',async(req,res,next)=>{try{if(!await workforceRepository.archiveRelated('employee_emergency_contacts',id.parse(req.params.id),version.parse(req.query.version),'employee.emergency_contact.archive',ctx(req)))throw stale();res.status(204).end();}catch(error){next(error);}}));

const identifierFields={identifierType:'identifier_type',identifierValue:'identifier_value',label:'label'};
workforceRouter.get('/workforce/employees/:id/identifiers', ...guard('employee.sensitive.view',async(req,res,next)=>{try{const employeeId=id.parse(req.params.id);const items=await workforceRepository.listRelated('employee_identifiers',employeeId);await workforceRepository.recordAccess('employee.identifier.view',employeeId,ctx(req));res.json({items});}catch(error){next(error);}}));
workforceRouter.post('/workforce/employees/:id/identifiers', ...guard('employee.sensitive.manage',async(req,res,next)=>{try{res.status(201).json({item:await workforceRepository.createRelated('employee_identifiers',id.parse(req.params.id),identifierSchema.parse(req.body),identifierFields,'employee.identifier.create',ctx(req))});}catch(error){next(error);}}));
workforceRouter.delete('/workforce/identifiers/:id', ...guard('employee.sensitive.manage',async(req,res,next)=>{try{if(!await workforceRepository.archiveRelated('employee_identifiers',id.parse(req.params.id),version.parse(req.query.version),'employee.identifier.archive',ctx(req)))throw stale();res.status(204).end();}catch(error){next(error);}}));

const documentFields={documentType:'document_type',title:'title',storageKey:'storage_key',fileName:'file_name',mimeType:'mime_type',sizeBytes:'size_bytes',status:'status'};
workforceRouter.get('/workforce/employees/:id/documents', ...guard('employee.document.view',async(req,res,next)=>{try{const employeeId=id.parse(req.params.id);const items=await workforceRepository.listRelated('employee_documents',employeeId);await workforceRepository.recordAccess('employee.document.view',employeeId,ctx(req));res.json({items});}catch(error){next(error);}}));
workforceRouter.post('/workforce/employees/:id/documents', ...guard('employee.document.manage',async(req,res,next)=>{try{res.status(201).json({item:await workforceRepository.createRelated('employee_documents',id.parse(req.params.id),documentSchema.parse(req.body),documentFields,'employee.document.create',ctx(req))});}catch(error){next(error);}}));
workforceRouter.delete('/workforce/documents/:id', ...guard('employee.document.manage',async(req,res,next)=>{try{if(!await workforceRepository.archiveRelated('employee_documents',id.parse(req.params.id),version.parse(req.query.version),'employee.document.archive',ctx(req)))throw stale();res.status(204).end();}catch(error){next(error);}}));
