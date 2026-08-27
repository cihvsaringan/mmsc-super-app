import { pool } from './pool.js';
import { securityRepository } from '../security/repository.js';

const before = process.argv.includes('--before');
if (before) {
  const assignments=await pool.query(`SELECT count(*)::int total,
    count(*) FILTER(WHERE assigned_by IS NOT NULL)::int manual,
    count(*) FILTER(WHERE application_key='clinic')::int clinic
    FROM user_applications`);
  const missing=await pool.query(`SELECT count(*)::int missing FROM user_applications ua
    WHERE ua.application_key='clinic' AND NOT EXISTS(
      SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id
      WHERE ur.user_id=ua.user_id AND r.code='clinic_staff')`);
  console.log({assignments:assignments.rows[0],clinicAssignmentsMissingRole:missing.rows[0]?.missing});
} else {
  const tables=await pool.query(`SELECT to_regclass('public.applications') applications,
    to_regclass('public.user_applications') user_applications`);
  const access=await pool.query(`SELECT r.code,count(DISTINCT ur.user_id)::int users,
    EXISTS(SELECT 1 FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id
      WHERE rp.role_id=r.id AND p.code='clinic.portal.access') portal_permission_present
    FROM roles r LEFT JOIN user_roles ur ON ur.role_id=r.id
    WHERE r.code IN('clinic_staff','super_administrator') GROUP BY r.id,r.code ORDER BY r.code`);
  const users=await securityRepository.listUsers();
  const clinicPermissions=await pool.query(`SELECT r.code,array_agg(p.code ORDER BY p.code) permissions
    FROM roles r JOIN role_permissions rp ON rp.role_id=r.id JOIN permissions p ON p.id=rp.permission_id
    WHERE r.code IN('clinic_staff','super_administrator') AND p.code LIKE 'clinic.%'
    GROUP BY r.code ORDER BY r.code`);
  console.log(JSON.stringify({tables:tables.rows[0],rbac:access.rows,clinicPermissions:clinicPermissions.rows,securityAccountsLoaded:users.length},null,2));
}
await pool.end();
