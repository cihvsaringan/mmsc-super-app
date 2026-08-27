import'dotenv/config';import{pool}from'./pool.js';const result=await pool.query(`SELECT
 (SELECT count(*) FROM schema_migrations)=39 migrations,
 to_regclass('public.applications') IS NULL AND to_regclass('public.user_applications') IS NULL "registryRemoved",
 (SELECT count(*)>=1 FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='super_administrator' AND u.archived_at IS NULL) "superAdmin",
 (SELECT count(*)>=1 FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='school_administrator' AND u.archived_at IS NULL) admin,
 (SELECT count(*)>=1 FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='teacher' AND u.archived_at IS NULL) teacher,
 (SELECT count(*)>=1 FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='student' AND u.archived_at IS NULL) student,
 (SELECT count(*)>=1 FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='parent_guardian' AND u.archived_at IS NULL) parent,
 (SELECT count(*)>=1 FROM roles WHERE code='attendance_operator') attendance,
 (SELECT count(*)>=1 FROM roles WHERE code='librarian') library,
 (SELECT count(*)=16 FROM permissions WHERE code LIKE 'clinic.%') "clinicPermissions",
 (SELECT count(*)>=15 FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.code='clinic_staff' AND p.code LIKE 'clinic.%') "clinicRbac",
 to_regclass('public.clinic_encounters') IS NOT NULL "clinicSchema"`);await pool.end();const row=result.rows[0];console.log(JSON.stringify(row));if(Object.values(row).some(v=>v!==true))throw new Error('Existing database validation failed');
