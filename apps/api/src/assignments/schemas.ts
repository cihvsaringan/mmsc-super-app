import { z } from 'zod';
const uuid=z.string().uuid(); const note=z.string().trim().max(1000).nullable().optional();
export const curriculumSchema=z.object({schoolYearId:uuid,gradeLevelId:uuid,subjectId:uuid,academicTermId:uuid.nullable().optional(),loadUnits:z.coerce.number().positive().max(9999),required:z.boolean().default(true),notes:note}).strict();
export const curriculumUpdateSchema=z.object({loadUnits:z.coerce.number().positive().max(9999),required:z.boolean(),notes:note}).strict();
export const teachingSchema=z.object({curriculumAssignmentId:uuid,sectionId:uuid,teacherYearAssignmentId:uuid,role:z.enum(['primary','assistant','substitute']).default('primary'),notes:note}).strict();
export const teachingUpdateSchema=z.object({teacherYearAssignmentId:uuid,role:z.enum(['primary','assistant','substitute']),notes:note}).strict();
export const curriculumBulkSchema=z.object({schoolYearId:uuid,gradeLevelId:uuid,subjectIds:z.array(uuid).max(200)}).strict();
export const teachingBulkSchema=z.object({schoolYearId:uuid,assignments:z.array(z.object({curriculumAssignmentId:uuid,teacherYearAssignmentId:uuid.nullable()}).strict()).max(200)}).strict();
export const copySchema=z.object({sourceSchoolYearId:uuid,targetSchoolYearId:uuid,confirm:z.literal('COPY_MISSING').optional()}).strict();
