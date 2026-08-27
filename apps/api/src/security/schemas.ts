import { z } from 'zod';

export const email = z.string().trim().toLowerCase().email().max(320);
export const password = z.string().min(12).max(256).refine(value=>/[a-z]/.test(value)&&/[A-Z]/.test(value)&&/\d/.test(value)&&/[^A-Za-z0-9]/.test(value),'Password must include uppercase, lowercase, number, and symbol characters');
export const uuid = z.string().uuid();
export const loginIdentifier = z.string().trim().toLowerCase().min(3).max(160);
export const username = z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9._-]{2,79}$/,'Username must start with a letter and use only letters, numbers, dots, underscores, or hyphens');
export const loginSchema = z.object({ identifier: loginIdentifier, password: z.string().min(1).max(256) }).strict();
export const createUserSchema = z.object({ email, displayName: z.string().trim().min(1).max(160), password }).strict();
export const statusSchema = z.object({ status: z.enum(['active', 'inactive']) }).strict();
export const roleAssignmentSchema = z.object({ roleId: uuid }).strict();
export const rolePermissionsSchema = z.object({ permissionIds: z.array(uuid).max(200) }).strict();
export const createRoleSchema = z.object({
  code: z.string().trim().regex(/^[a-z][a-z0-9_]*$/).max(80),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
}).strict();
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(256), newPassword: password }).strict();
export const adminChangePasswordSchema = z.object({ newPassword: password, confirmPassword: z.string().min(1).max(256), requireChange: z.boolean().default(true) }).strict().refine(value=>value.newPassword===value.confirmPassword,{message:'New passwords do not match',path:['confirmPassword']});
export const employeeProvisionSchema = z.object({ employeeId:uuid, username, recoveryEmail:email, roleIds:z.array(uuid).max(30).default([]) }).strict();
export const bulkActivationSchema = z.object({ studentIds:z.array(uuid).min(1).max(200) }).strict();
