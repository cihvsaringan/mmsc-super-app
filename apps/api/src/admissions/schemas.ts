import { z } from 'zod';

const uuid = z.string().uuid();
const text = (max: number) => z.string().trim().max(max).nullable().optional();
export const admissionStatus = z.enum(['draft','submitted','under_review','information_requested','approved','rejected','converted','withdrawn']);
export const guardianSchema = z.object({
  firstName: z.string().trim().min(1).max(120), middleName: text(120), lastName: z.string().trim().min(1).max(120), suffix: text(40),
  relationshipType: z.enum(['mother','father','guardian','legal_guardian','emergency_contact']), email: z.email().nullable().optional(),
  mobilePhone: z.string().trim().min(5).max(50), occupation: text(160), employer: text(200), isPrimary: z.boolean().default(true), receivesCommunications: z.boolean().default(true),
}).strict();
export const admissionCreateSchema = z.object({
  schoolId: uuid, applicationType: z.enum(['new_student','returning_student']), existingStudentId: uuid.nullable().optional(), schoolYearId: uuid, gradeLevelId: uuid, sectionId: uuid.nullable().optional(),
  firstName: z.string().trim().min(1).max(120), middleName: text(120), lastName: z.string().trim().min(1).max(120), suffix: text(40), preferredName: text(120), birthDate: z.iso.date(),
  gender: z.enum(['male','female','non_binary','prefer_not_to_say','unspecified']).nullable().optional(), learnerReferenceNumber: z.string().regex(/^\d{12}$/).nullable().optional(),
  personalEmail: z.email().nullable().optional(), mobilePhone: text(50), addressLine1: text(200), barangay: text(120), city: text(120), province: text(120), postalCode: text(20), previousSchoolId:uuid.nullable().optional(),previousSchool: text(300), applicantNotes: z.string().trim().max(5000).nullable().optional(),
  guardian: guardianSchema,
}).strict().superRefine((value, context) => {
  if (value.applicationType === 'returning_student' && !value.existingStudentId) context.addIssue({ code: 'custom', path: ['existingStudentId'], message: 'Returning students must be matched to an existing Student record' });
});
export const admissionTransitionSchema = z.object({
  version: z.number().int().positive(), status: z.enum(['submitted','under_review','information_requested','approved','rejected','withdrawn']), reason: z.string().trim().max(5000).nullable().optional(), registrarNotes: z.string().trim().max(5000).nullable().optional(),
}).strict();
