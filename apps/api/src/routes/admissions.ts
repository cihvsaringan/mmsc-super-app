import { Router, type Request } from 'express';
import { z } from 'zod';
import { admissionsRepository } from '../admissions/repository.js';
import { admissionCreateSchema, admissionStatus, admissionTransitionSchema } from '../admissions/schemas.js';
import { AppError } from '../lib/errors.js';
import { requirePermission } from '../security/middleware.js';

export const admissionsRouter=Router();
const id=z.string().uuid();
const blank=(value:unknown)=>value===''?undefined:value;
const context=(request:Request)=>({actorId:request.auth.userId!,requestId:String(request.id),ip:request.ip?.replace(/^::ffff:/,'')});

admissionsRouter.get('/admissions/context',requirePermission('admission.view'),async(_request,response,next)=>{try{response.json(await admissionsRepository.context());}catch(error){next(error);}});
admissionsRouter.get('/admissions',requirePermission('admission.view'),async(request,response,next)=>{try{const query=z.object({search:z.preprocess(blank,z.string().trim().max(160).optional()),status:z.preprocess(blank,z.union([admissionStatus,z.literal('pending')]).optional()),applicationType:z.preprocess(blank,z.enum(['new_student','returning_student']).optional()),gradeLevelId:z.preprocess(blank,id.optional()),schoolYearId:z.preprocess(blank,id.optional()),sort:z.enum(['priority','submitted_desc','submitted_asc','applicant_asc']).default('priority'),limit:z.coerce.number().int().min(1).max(100).default(25),offset:z.coerce.number().int().min(0).default(0)}).parse(request.query);response.json(await admissionsRepository.list({limit:query.limit,offset:query.offset,sort:query.sort,...(query.search?{search:query.search}:{}),...(query.status?{status:query.status}:{}),...(query.applicationType?{applicationType:query.applicationType}:{}),...(query.gradeLevelId?{gradeLevelId:query.gradeLevelId}:{}),...(query.schoolYearId?{schoolYearId:query.schoolYearId}:{})}));}catch(error){next(error);}});
admissionsRouter.post('/admissions',requirePermission('admission.manage'),async(request,response,next)=>{try{response.status(201).json({item:await admissionsRepository.create(admissionCreateSchema.parse(request.body),context(request))});}catch(error){next(error);}});
admissionsRouter.get('/admissions/:id',requirePermission('admission.view'),async(request,response,next)=>{try{const applicationId=id.parse(request.params.id);const item=await admissionsRepository.detail(applicationId);if(!item)throw new AppError(404,'ADMISSION_NOT_FOUND','Admission application was not found');response.json({item});}catch(error){next(error);}});
admissionsRouter.post('/admissions/:id/transition',requirePermission('admission.review'),async(request,response,next)=>{try{response.json({item:await admissionsRepository.transition(id.parse(request.params.id),admissionTransitionSchema.parse(request.body),context(request))});}catch(error){next(error);}});
admissionsRouter.post('/admissions/:id/convert',requirePermission('admission.convert'),async(_request,_response,next)=>{next(new AppError(409,'ENROLLMENT_HANDOFF_REQUIRED','Approved applications must be completed from the Enrollment queue'));});
