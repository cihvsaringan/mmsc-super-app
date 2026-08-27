import{z}from'zod';
export const labIdQuery=z.object({laboratoryId:z.uuid()}).strict();
export const credentialSchema=z.object({laboratoryId:z.uuid(),credential:z.string().min(1).max(500)}).strict();
const purpose=z.enum(['research','assignment','project','programming_practice','printing','schoolwork','other']);
export const startSessionSchema=z.object({laboratoryId:z.uuid(),workstationId:z.uuid(),credential:z.string().min(1).max(500),purpose:purpose.nullable().optional(),purposeNotes:z.string().trim().max(1000).nullable().optional(),approvalConfirmed:z.boolean().optional(),overrideReason:z.string().trim().min(5).max(1000).optional()}).strict().superRefine((v,c)=>{if(v.purpose==='other'&&!v.purposeNotes)c.addIssue({code:'custom',path:['purposeNotes'],message:'Explain the other purpose'});});
export const sessionQuerySchema=z.object({laboratoryId:z.uuid().optional(),studentId:z.uuid().optional(),status:z.enum(['active','completed','cancelled']).optional(),from:z.iso.date().optional(),to:z.iso.date().optional(),limit:z.coerce.number().int().min(1).max(100).default(25),offset:z.coerce.number().int().min(0).default(0)}).strict().refine(v=>!v.from||!v.to||v.from<=v.to,{path:['to'],message:'To date must not precede from date'});
export const closeSessionSchema=z.object({reason:z.string().trim().min(3).max(1000).optional()}).strict();
export type StartSessionInput=z.infer<typeof startSessionSchema>;
