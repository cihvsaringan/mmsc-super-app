import{z}from'zod';
const generic=z.enum(['all_users','employees','teachers','students','guardians']);
const keyed=z.enum(['role','grade_level','section','user']);
export const targetSchema=z.union([z.object({type:generic}).strict(),z.object({type:keyed,key:z.string().trim().min(1).max(100)}).strict()]);
export const notificationSchema=z.object({title:z.string().trim().min(1).max(180),body:z.string().trim().min(1).max(5000),category:z.enum(['announcement','academic','attendance','admissions','event','emergency','general']).default('announcement'),priority:z.enum(['normal','important','urgent']).default('normal'),actionUrl:z.union([z.string().trim().max(500).regex(/^\/(?!\/)/),z.literal(''),z.null()]).optional().transform(value=>value||null),expiresAt:z.union([z.iso.datetime({offset:true}),z.literal(''),z.null()]).optional().transform(value=>value||null),targets:z.array(targetSchema).min(1).max(50)}).strict();
