import { z } from 'zod';

const uuid=z.string().uuid(); const optionalText=(max=1000)=>z.string().trim().max(max).nullable().optional();
export const facultyStatus=z.enum(['full_time','part_time','adjunct','substitute','inactive']);
export const teacherProfileSchema=z.object({employeeId:uuid,teacherNumber:optionalText(80),facultyStatus:facultyStatus.default('full_time'),departmentId:uuid.nullable().optional(),teachingLevel:optionalText(120),biography:optionalText(3000)}).strict();
export const teacherProfileUpdateSchema=teacherProfileSchema.omit({employeeId:true});
export const qualificationSchema=z.object({subjectId:uuid,proficiency:z.enum(['qualified','advanced','specialist']).default('qualified'),notes:optionalText()}).strict();
export const yearAssignmentSchema=z.object({schoolYearId:uuid,departmentId:uuid.nullable().optional(),facultyStatus,teachingLevel:optionalText(120),advisorySectionId:uuid.nullable().optional(),homeroomSectionId:uuid.nullable().optional(),maximumLoadUnits:z.number().min(0).max(9999).nullable().optional(),notes:optionalText()}).strict();

export const profileFields={employeeId:'employee_id',teacherNumber:'teacher_number',facultyStatus:'faculty_status',departmentId:'department_id',teachingLevel:'teaching_level',biography:'biography'} as const;
export const qualificationFields={subjectId:'subject_id',proficiency:'proficiency',notes:'notes'} as const;
export const yearAssignmentFields={schoolYearId:'school_year_id',departmentId:'department_id',facultyStatus:'faculty_status',teachingLevel:'teaching_level',advisorySectionId:'advisory_section_id',homeroomSectionId:'homeroom_section_id',maximumLoadUnits:'maximum_load_units',notes:'notes'} as const;
