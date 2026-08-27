import { z } from 'zod';

export const librarySettingsSchema = z.object({
  defaultLoanDays: z.number().int().min(1).max(90),
  maximumRenewals: z.number().int().min(0).max(10),
  maximumActiveLoans:z.number().int().min(1).max(100),gracePeriodDays:z.number().int().min(0).max(30),allowBorrowingWithOverdue:z.boolean(),
  overrides:z.array(z.object({patronType:z.enum(['student','teacher','employee']),enabled:z.boolean(),maximumActiveLoans:z.number().int().min(1).max(100),loanPeriodDays:z.number().int().min(1).max(365),maximumRenewals:z.number().int().min(0).max(20),gracePeriodDays:z.number().int().min(0).max(30),allowBorrowingWithOverdue:z.boolean()}).strict()).length(3),
}).strict();

const optionalText=(max:number)=>z.union([z.string().trim().max(max),z.null()]).optional().transform(value=>value===''?null:value);
const uuid=z.string().uuid();
export const librarySchoolDate=(value=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(value);
export const classificationKinds=['category','subject','shelf']as const;
export const copyStatuses=['available','checked_out','reserved','lost','damaged','under_repair','withdrawn']as const;
export const copyConditions=['new','good','fair','poor','damaged']as const;
export const libraryClassificationSchema=z.object({kind:z.enum(classificationKinds),code:optionalText(40),name:z.string().trim().min(1).max(160)}).strict();
const libraryBookFields=z.object({title:z.string().trim().min(1).max(300),subtitle:optionalText(300),isbn:optionalText(30),author:z.string().trim().min(1).max(240),additionalAuthors:z.array(z.string().trim().min(1).max(240)).max(20).optional(),publisher:optionalText(240),publicationYear:z.number().int().min(1000).max(2200).nullable().optional(),edition:optionalText(100),categoryId:uuid.nullable().optional(),subjectId:uuid.nullable().optional(),language:z.string().trim().min(1).max(80).optional(),description:optionalText(5000),callNumber:optionalText(100),shelfId:uuid.nullable().optional()});
export const libraryBookSchema=libraryBookFields.extend({additionalAuthors:z.array(z.string().trim().min(1).max(240)).max(20).default([]),language:z.string().trim().min(1).max(80).default('English')}).strict();
export const libraryBookUpdateSchema=libraryBookFields.partial().extend({version:z.number().int().positive()}).strict();
export const libraryCopyCreateSchema=z.object({quantity:z.number().int().min(1).max(100).default(1),accessionNumber:optionalText(80),barcode:optionalText(120),shelfId:uuid.nullable().optional(),acquisitionDate:z.iso.date().nullable().optional(),condition:z.enum(copyConditions).default('good'),notes:optionalText(2000)}).strict().superRefine((value,ctx)=>{if(value.quantity>1&&(value.accessionNumber||value.barcode))ctx.addIssue({code:'custom',message:'Manual accession or barcode is available only when adding one copy'})});
export const libraryCopyUpdateSchema=z.object({version:z.number().int().positive(),barcode:z.string().trim().min(1).max(120).optional(),shelfId:uuid.nullable().optional(),acquisitionDate:z.iso.date().nullable().optional(),condition:z.enum(copyConditions).optional(),notes:optionalText(2000)}).strict();
export const libraryCopyStatusSchema=z.object({version:z.number().int().positive(),status:z.enum(copyStatuses)}).strict();
export const libraryCatalogQuerySchema=z.object({search:z.string().trim().max(160).optional(),categoryId:uuid.optional(),availability:z.enum(['available','unavailable']).optional(),status:z.enum(copyStatuses).optional(),sort:z.enum(['title_asc','title_desc','author_asc','newest']).default('title_asc'),limit:z.coerce.number().int().min(1).max(100).default(25),offset:z.coerce.number().int().min(0).default(0)});
export const uuidSchema=uuid;
export const libraryPatronRefSchema=z.object({patronType:z.enum(['student','employee']),personId:uuid}).strict();
export const libraryPatronSearchSchema=z.object({search:z.string().trim().min(1).max(160),limit:z.coerce.number().int().min(1).max(50).default(20),offset:z.coerce.number().int().min(0).default(0)});
export const libraryHistoryQuerySchema=z.object({scope:z.enum(['all','active','returned']).default('all'),copyId:uuid.optional(),limit:z.coerce.number().int().min(1).max(100).default(25),offset:z.coerce.number().int().min(0).default(0)});
export const libraryCheckoutSchema=z.object({patron:libraryPatronRefSchema,copyIds:z.array(uuid).min(1).max(20).refine(ids=>new Set(ids).size===ids.length,{message:'The same copy cannot be checked out twice'}),overrideReason:z.string().trim().min(5).max(1000).optional()}).strict();
export const libraryCheckinSchema=z.object({barcode:z.string().trim().min(1).max(500)}).strict();
export const libraryRenewSchema=z.object({version:z.number().int().positive(),overrideReason:z.string().trim().min(5).max(1000).optional()}).strict();
export const libraryVisitorScanSchema=z.object({mode:z.enum(['entry','exit']),credential:z.string().trim().min(1).max(500),station:z.string().trim().min(1).max(120).optional()}).strict();
export const libraryVisitorManualSchema=z.object({mode:z.enum(['entry','exit']),patron:libraryPatronRefSchema,station:z.string().trim().min(1).max(120).optional()}).strict();
export const libraryVisitorQuerySchema=z.object({date:z.iso.date().default(()=>librarySchoolDate()),patronType:z.enum(['student','teacher','employee']).optional(),grade:z.string().trim().max(120).optional(),section:z.string().trim().max(120).optional(),inside:z.enum(['true','false']).transform(v=>v==='true').optional(),limit:z.coerce.number().int().min(1).max(100).default(25),offset:z.coerce.number().int().min(0).default(0)});
export const libraryOverdueQuerySchema=z.object({search:z.string().trim().max(160).optional(),category:z.enum(['due_soon','due_today','overdue_1_7','overdue_8_30','overdue_30_plus']).optional(),patronType:z.enum(['student','teacher','employee']).optional(),grade:z.string().trim().max(120).optional(),section:z.string().trim().max(120).optional(),limit:z.coerce.number().int().min(1).max(100).default(25),offset:z.coerce.number().int().min(0).default(0)});
export const libraryReportQuerySchema=z.object({report:z.enum(['current_loans','overdue','borrowing_history','inventory','exceptions','visitor_logs','visitor_analytics','circulation_summary']),from:z.iso.date(),to:z.iso.date(),patronType:z.enum(['student','teacher','employee']).optional(),grade:z.string().trim().max(120).optional(),section:z.string().trim().max(120).optional(),categoryId:uuid.optional(),copyStatus:z.enum(copyStatuses).optional(),limit:z.coerce.number().int().min(1).max(100).default(25),offset:z.coerce.number().int().min(0).default(0),format:z.enum(['json','csv']).default('json')}).refine(x=>x.from<=x.to,{message:'From date must not be after to date'}).refine(x=>(Date.parse(x.to)-Date.parse(x.from))/86400000<=366,{message:'Library report range cannot exceed 366 days'});
