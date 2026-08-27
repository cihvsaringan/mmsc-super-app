import { Router, type Request, type RequestHandler } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { publicAdmissionsService } from '../admissions/public.js';
import { guardianSchema } from '../admissions/schemas.js';
import { AppError } from '../lib/errors.js';
import { rateLimit } from '../middleware/security-hardening.js';

export const publicAdmissionsRouter=Router();
const limit=(maximum:number):RequestHandler=>rateLimit({name:'public-admissions',maximum,windowMs:15*60_000,key:request=>`${request.ip}:${request.path}`});
const optional=(max:number)=>z.string().trim().max(max).nullable().optional();const uuid=z.string().uuid();
const publicSchema=z.object({schoolId:uuid,schoolYearId:uuid,gradeLevelId:uuid,sectionId:uuid.nullable().optional(),applicationType:z.enum(['new_student','returning_student']),studentNumber:optional(80),firstName:z.string().trim().min(1).max(120),middleName:optional(120),lastName:z.string().trim().min(1).max(120),suffix:optional(40),preferredName:optional(120),birthDate:z.iso.date(),gender:z.enum(['male','female','non_binary','prefer_not_to_say','unspecified']).nullable().optional(),learnerReferenceNumber:z.string().regex(/^\d{12}$/).nullable().optional(),personalEmail:z.email().nullable().optional(),mobilePhone:optional(50),addressLine1:optional(200),barangay:optional(120),city:optional(120),province:optional(120),postalCode:optional(20),previousSchoolId:uuid.nullable().optional(),previousSchool:optional(300),applicantNotes:optional(5000),guardians:z.array(guardianSchema).min(1).max(4),privacyConsent:z.literal(true),privacyNoticeVersion:z.string().trim().min(1).max(40)}).strict().superRefine((value,ctx)=>{if(value.applicationType==='returning_student'&&!value.studentNumber)ctx.addIssue({code:'custom',path:['studentNumber'],message:'Student Number is required for returning registration'});});
const accessSchema=z.object({applicationNumber:z.string().trim().min(8).max(40),resumeToken:z.string().min(40).max(100)}).strict();
const context=(request:Request)=>({requestId:String(request.id),ip:request.ip?.replace(/^::ffff:/,'')});
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:8*1024*1024,files:1}});

publicAdmissionsRouter.get('/public/admissions/context',limit(60),async(request,response,next)=>{try{response.json(await publicAdmissionsService.context());}catch(error){next(error);}});
publicAdmissionsRouter.post('/public/admissions/drafts',limit(10),async(request,response,next)=>{try{response.status(201).json(await publicAdmissionsService.create(publicSchema.parse(request.body),context(request)));}catch(error){next(error);}});
publicAdmissionsRouter.post('/public/admissions/resume',limit(20),async(request,response,next)=>{try{const body=accessSchema.parse(request.body);response.json(await publicAdmissionsService.view(body.applicationNumber,body.resumeToken,context(request)));}catch(error){next(error);}});
publicAdmissionsRouter.post('/public/admissions/status',limit(20),async(request,response,next)=>{try{const body=accessSchema.parse(request.body);response.json(await publicAdmissionsService.view(body.applicationNumber,body.resumeToken,context(request)));}catch(error){next(error);}});
publicAdmissionsRouter.post('/public/admissions/submit',limit(10),async(request,response,next)=>{try{const body=accessSchema.extend({responseMessage:z.string().trim().max(5000).nullable().optional()}).parse(request.body);response.json(await publicAdmissionsService.submit(body.applicationNumber,body.resumeToken,body.responseMessage??null,context(request)));}catch(error){next(error);}});
publicAdmissionsRouter.post('/public/admissions/documents',limit(20),upload.single('document'),async(request,response,next)=>{try{if(!request.file)throw new AppError(400,'DOCUMENT_REQUIRED','Select a document to upload');const fields=accessSchema.extend({documentType:z.string().trim().min(2).max(60)}).parse(request.body);response.status(201).json({item:await publicAdmissionsService.upload(fields.applicationNumber,fields.resumeToken,request.file,fields.documentType,context(request))});}catch(error){next(error);}});
