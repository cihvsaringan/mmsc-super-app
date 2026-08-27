import { Router } from 'express';
import { AppError } from '../lib/errors.js';
import { hashPassword } from '../security/crypto.js';
import { provisioningService } from '../security/provisioning.js';
import { requirePermission } from '../security/middleware.js';
import { securityRepository } from '../security/repository.js';
import { adminChangePasswordSchema, bulkActivationSchema, createRoleSchema, employeeProvisionSchema, roleAssignmentSchema, rolePermissionsSchema, statusSchema, uuid } from '../security/schemas.js';

export const securityRouter = Router();
const ip = (value: string | undefined) => value?.replace(/^::ffff:/, '');

securityRouter.get('/security/users', requirePermission('security.user.view'), async (_req, res, next) => {
  try { res.json({ users: await securityRepository.listUsers() }); } catch (error) { next(error); }
});

securityRouter.get('/security/provisioning/employees',requirePermission('security.account.provision'),async(req,res,next)=>{try{const search=String(req.query.search??'').trim().slice(0,160);res.json({items:await provisioningService.employeeCandidates(search)});}catch(error){next(error);}});
securityRouter.get('/security/provisioning/portal-candidates',requirePermission('security.account.provision'),async(_req,res,next)=>{try{res.json({items:await provisioningService.portalCandidates()});}catch(error){next(error);}});
securityRouter.post('/security/provisioning/employees',requirePermission('security.account.provision'),async(req,res,next)=>{try{const body=employeeProvisionSchema.parse(req.body);const activation=await provisioningService.provisionEmployee(body,{actorId:req.auth.userId!,requestId:String(req.id),ip:ip(req.ip)});res.status(201).json({activation});}catch(error){next(error);}});
securityRouter.post('/security/portal/students/bulk-activate',requirePermission('security.account.provision'),async(req,res,next)=>{try{const body=bulkActivationSchema.parse(req.body);res.json(await provisioningService.activateStudents(body.studentIds,{actorId:req.auth.userId!,requestId:String(req.id),ip:ip(req.ip)}));}catch(error){next(error);}});
for(const [path,kind] of [['students','student'],['teachers','teacher'],['guardians','guardian']] as const)securityRouter.post(`/security/portal/${path}/:id/activate`,requirePermission('security.account.provision'),async(req,res,next)=>{try{const activation=await provisioningService.activate(kind,uuid.parse(req.params.id),{actorId:req.auth.userId!,requestId:String(req.id),ip:ip(req.ip)});res.json({activation});}catch(error){next(error);}});
securityRouter.post('/security/users/:userId/change-password',requirePermission('security.user.change_password'),async(req,res,next)=>{try{const body=adminChangePasswordSchema.parse(req.body);await provisioningService.adminChangePassword(uuid.parse(req.params.userId),await hashPassword(body.newPassword),body.requireChange,{actorId:req.auth.userId!,requestId:String(req.id),ip:ip(req.ip)});res.status(204).end();}catch(error){next(error);}});

securityRouter.patch('/security/users/:userId/status', requirePermission('security.user.manage'), async (req, res, next) => {
  try {
    const userId = uuid.parse(req.params.userId); const { status } = statusSchema.parse(req.body);
    if (userId === req.auth.userId && status === 'inactive') throw new AppError(400, 'SELF_DEACTIVATION_DENIED', 'You cannot deactivate your own account');
    if (status === 'inactive' && await securityRepository.isLastActiveSuperAdministrator(userId)) throw new AppError(400, 'LAST_ADMIN_REQUIRED', 'The last active Super Administrator cannot be deactivated');
    if (!(await securityRepository.setUserStatus({ userId, status, actorId: req.auth.userId!, requestId: String(req.id), ip: ip(req.ip) }))) throw new AppError(404, 'USER_NOT_FOUND', 'User was not found');
    res.status(204).end();
  } catch (error) { next(error); }
});

securityRouter.post('/security/users/:userId/roles', requirePermission('security.user.manage'), async (req, res, next) => {
  try { const userId = uuid.parse(req.params.userId); const { roleId } = roleAssignmentSchema.parse(req.body); await securityRepository.assignRole({ userId, roleId, actorId: req.auth.userId!, requestId: String(req.id), ip: ip(req.ip) }); res.status(204).end(); } catch (error) { next(error); }
});

securityRouter.delete('/security/users/:userId/roles/:roleId', requirePermission('security.user.manage'), async (req, res, next) => {
  try { const userId = uuid.parse(req.params.userId); const roleId = uuid.parse(req.params.roleId); if (await securityRepository.roleCode(roleId) === 'super_administrator' && await securityRepository.isLastActiveSuperAdministrator(userId)) throw new AppError(400, 'LAST_ADMIN_REQUIRED', 'The last active Super Administrator must retain that role'); await securityRepository.removeRole({ userId, roleId, actorId: req.auth.userId!, requestId: String(req.id), ip: ip(req.ip) }); res.status(204).end(); } catch (error) { next(error); }
});

securityRouter.get('/security/roles', requirePermission('security.role.view'), async (_req, res, next) => {
  try { res.json({ roles: await securityRepository.listRoles(), permissions: await securityRepository.listPermissions() }); } catch (error) { next(error); }
});

securityRouter.post('/security/roles', requirePermission('security.role.manage'), async (req, res, next) => {
  try { const body = createRoleSchema.parse(req.body); const role = await securityRepository.createRole({ ...body, actorId: req.auth.userId!, requestId: String(req.id), ip: ip(req.ip) }); res.status(201).json({ role }); } catch (error) { next(error); }
});

securityRouter.put('/security/roles/:roleId/permissions', requirePermission('security.role.manage'), async (req, res, next) => {
  try { const roleId = uuid.parse(req.params.roleId); if (await securityRepository.roleCode(roleId) === 'super_administrator') throw new AppError(400, 'SYSTEM_ROLE_PROTECTED', 'Super Administrator permissions are protected'); const { permissionIds } = rolePermissionsSchema.parse(req.body); await securityRepository.setRolePermissions({ roleId, permissionIds: [...new Set(permissionIds)], actorId: req.auth.userId!, requestId: String(req.id), ip: ip(req.ip) }); res.status(204).end(); } catch (error) { next(error); }
});

securityRouter.get('/security/audit-events', requirePermission('audit.view'), async (req, res, next) => {
  try { const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200); res.json({ events: await securityRepository.listAudit(limit) }); } catch (error) { next(error); }
});
