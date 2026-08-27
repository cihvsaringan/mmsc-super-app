import { z } from 'zod';

const uuid = z.string().uuid();
const text = (max = 160) => z.string().trim().min(1).max(max);
const nullableText = (max = 500) => z.string().trim().max(max).nullable().optional();
const email = z.union([z.email(), z.literal('')]).transform((value) => value || null).nullable().optional();
export const employmentStatus = z.enum(['active', 'inactive', 'on_leave', 'resigned', 'terminated', 'retired']);

export const employeeSchema = z.object({
  schoolId: uuid, campusId: uuid.nullable().optional(), departmentId: uuid.nullable().optional(),
  positionId: uuid.nullable().optional(), employeeTypeId: uuid.nullable().optional(), userId: uuid.nullable().optional(),
  employeeNumber: text(80), firstName: text(120), middleName: nullableText(120), lastName: text(120),
  suffix: nullableText(40), preferredName: nullableText(120), birthDate: z.iso.date().nullable().optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say', 'unspecified']).nullable().optional(),
  civilStatus: nullableText(40), personalEmail: email, workEmail: email, mobilePhone: nullableText(50), telephone: nullableText(50),
  addressLine1: nullableText(200), addressLine2: nullableText(200), barangay: nullableText(120), city: nullableText(120),
  province: nullableText(120), postalCode: nullableText(20), countryCode: z.string().length(2).toUpperCase().default('PH'),
  hireDate: z.iso.date(), employmentStatus: employmentStatus.default('active'), remarks: nullableText(2000),
}).strict();

export const workforceConfigSchema = z.object({ schoolId: uuid, departmentId: uuid.nullable().optional(), code: text(80), name: text(), description: nullableText(1000), active: z.boolean().default(true) }).strict();
export const employeeTypeSchema = workforceConfigSchema.omit({ departmentId: true });
export const emergencyContactSchema = z.object({ name: text(200), relationship: text(100), phone: text(50), email, address: nullableText(500), isPrimary: z.boolean().default(false) }).strict();
export const identifierSchema = z.object({ identifierType: z.enum(['sss', 'tin', 'philhealth', 'pagibig', 'prc', 'other']), identifierValue: text(160), label: nullableText(120) }).strict();
export const documentSchema = z.object({ documentType: text(80), title: text(200), storageKey: nullableText(500), fileName: nullableText(255), mimeType: nullableText(160), sizeBytes: z.number().int().nonnegative().nullable().optional(), status: z.enum(['pending', 'available']).default('pending') }).strict();
export const statusChangeSchema = z.object({ status: employmentStatus, effectiveOn: z.iso.date(), reason: nullableText(1000) }).strict();

export const employeeFields = {
  schoolId: 'school_id', campusId: 'campus_id', departmentId: 'department_id', positionId: 'position_id', employeeTypeId: 'employee_type_id', userId: 'user_id',
  employeeNumber: 'employee_number', firstName: 'first_name', middleName: 'middle_name', lastName: 'last_name', suffix: 'suffix', preferredName: 'preferred_name',
  birthDate: 'birth_date', gender: 'gender', civilStatus: 'civil_status', personalEmail: 'personal_email', workEmail: 'work_email', mobilePhone: 'mobile_phone', telephone: 'telephone',
  addressLine1: 'address_line1', addressLine2: 'address_line2', barangay: 'barangay', city: 'city', province: 'province', postalCode: 'postal_code', countryCode: 'country_code',
  hireDate: 'hire_date', employmentStatus: 'employment_status', remarks: 'remarks',
} as const;
