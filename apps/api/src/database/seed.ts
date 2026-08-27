import { pool } from './pool.js';
import { env } from '../config/env.js';
import { hashPassword } from '../security/crypto.js';

const seedName = 'phase-20-library-group2';
await pool.query(
  `INSERT INTO app_metadata (key, value) VALUES ('application', $1::jsonb)
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
  [JSON.stringify({ name: 'MMSC Super App', organization: 'My Messiah School of Cavite', phase: 19 })],
);
await pool.query('INSERT INTO seed_executions (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [seedName]);

const permissions = [
  ['dashboard.view', 'View the authenticated dashboard'],
  ['security.user.view', 'View user accounts and their role assignments'],
  ['security.user.manage', 'Create accounts, change account status, and manage user roles'],
  ['security.user.change_password', 'Administratively replace a centralized user password'],
  ['security.account.provision', 'Provision centralized accounts from authoritative person records'],
  ['security.role.view', 'View roles and permission grants'],
  ['security.role.manage', 'Create roles and manage their permission grants'],
  ['audit.view', 'View security audit events'],
  ['academic.config.view', 'View school structure and academic master data'],
  ['academic.config.manage', 'Create, update, and archive school structure and academic master data'],
  ['academic.calendar.view', 'View the school calendar and events'],
  ['academic.calendar.manage', 'Create, update, and archive school calendar events'],
  ['employee.view', 'View the employee directory and profiles'],
  ['employee.create', 'Create permanent employee identities'],
  ['employee.edit', 'Update employee records, status, and emergency contacts'],
  ['employee.archive', 'Archive employee records without deleting history'],
  ['employee.sensitive.view', 'View employee government and administrative identifiers'],
  ['employee.sensitive.manage', 'Create and archive employee government and administrative identifiers'],
  ['employee.document.view', 'View employee document metadata'],
  ['employee.document.manage', 'Create and archive employee document metadata'],
  ['workforce.config.view', 'View workforce positions and employee types'],
  ['workforce.config.manage', 'Create workforce positions and employee types'],
  ['teacher.profile.view', 'View teacher directory and teaching profiles'],
  ['teacher.profile.manage', 'Create, update, and archive teacher specializations'],
  ['teacher.qualification.view', 'View teacher subject qualifications'],
  ['teacher.qualification.manage', 'Manage teacher subject qualifications'],
  ['teacher.year_assignment.view', 'View teacher school-year faculty placement'],
  ['teacher.year_assignment.manage', 'Manage teacher school-year faculty placement'],
  ['student.profile.view', 'View student directory and profiles'],
  ['student.profile.manage', 'Create and update permanent student profiles'],
  ['student.profile.archive', 'Archive student profiles without deleting history'],
  ['student.sensitive.view', 'View student LRN and specially protected identity fields'],
  ['student.sensitive.manage', 'Create and update student LRN and specially protected identity fields'],
  ['guardian.view', 'View reusable guardian records and student relationships'],
  ['guardian.manage', 'Create, update, and archive reusable guardian records'],
  ['student.guardian.manage', 'Create and archive student guardian relationships'],
  ['enrollment.view', 'View school-year enrollment and student academic history'],
  ['enrollment.manage', 'Create and update school-year enrollment and completion records'],
  ['academic.assignment.view', 'View curriculum, section, and teacher assignments'],
  ['academic.assignment.manage', 'Create and archive curriculum, section, and teacher assignments'],
  ['employee.attendance.view', 'View employee attendance and holiday context'],
  ['employee.attendance.manage', 'Create employee attendance records'],
  ['employee.attendance.correct.request', 'Request employee attendance corrections'],
  ['employee.attendance.adjust', 'Review corrections and administratively adjust attendance'],
  ['student.attendance.view', 'View student attendance in authorized academic scope'],
  ['student.attendance.manage', 'Create student attendance records'],
  ['student.attendance.adjust', 'Administratively correct student attendance with immutable history'],
  ['report.view', 'View operational reports'],
  ['report.export', 'Export operational reports'],
  ['administration.settings.view', 'View centralized application settings'],
  ['administration.settings.manage', 'Create and update centralized application settings'],
  ['administration.operations.view', 'View platform operations, workflow backlogs, and service posture'],
  ['administration.operations.manage', 'Run approved, audited platform maintenance actions'],
  ['teacher.portal.access', 'Access the assignment-scoped Teacher Portal'],
  ['grades.view', 'View gradebooks and grade history'],
  ['grades.encode', 'Encode draft grades for assigned classes'],
  ['grades.submit', 'Submit assigned class grades for review'],
  ['grades.review', 'Review submitted gradebooks'],
  ['grades.publish', 'Publish and lock reviewed gradebooks'],
  ['grades.reopen', 'Reopen gradebooks with an audited reason'],
  ['student.portal.access', 'Access the authenticated student portal'],
  ['attendance.terminal.operate', 'Operate a registered attendance terminal'],
  ['attendance.terminal.manage', 'Register and manage attendance terminals'],
  ['attendance.terminal.installation.view', 'View trusted Attendance Terminal PWA installations'],
  ['attendance.terminal.installation.manage', 'Generate trust codes, assign, and revoke Attendance Terminal PWA installations'],
  ['credential.manage', 'Issue and manage centralized person credentials'],
  ['admission.view', 'View Registration and Admissions applications'],
  ['admission.manage', 'Create and update Registration applications'],
  ['admission.review', 'Review and decide Registration applications'],
  ['admission.convert', 'Convert approved applications into authoritative SIS records'],
  ['parent.portal.access', 'Access the relationship-scoped Parent / Guardian Portal'],
  ['notification.inbox.access', 'Receive and manage personal in-app notifications'],
  ['notification.manage', 'Create and publish targeted in-app notifications'],
  ['attendance.operations.view', 'View manual attendance operations and exception receipts'],
  ['attendance.identity.lookup', 'Perform limited attendance identity verification'],
  ['attendance.manual.capture', 'Record authorized manual attendance check-in and check-out'],
  ['attendance.exception.resolve', 'Resolve or dismiss attendance operation exceptions'],
  ['calendar.experience.access', 'Access the shared published events and calendar experience'],
  ['reference.external_school.view', 'View the shared External Schools directory'],
  ['reference.external_school.manage', 'Create and update shared External School records'],
  ['clinic.portal.access','Access the Clinic operational portal'],['clinic.dashboard.view','View the Clinic operational dashboard'],['clinic.student.lookup','Search eligible students for clinic care'],['clinic.health_records.view','View restricted student health records'],['clinic.health_records.manage','Manage restricted student health records'],['clinic.encounter.view','View clinic encounters'],['clinic.encounter.manage','Create and manage clinic encounters'],['clinic.inventory.view','View clinic inventory'],['clinic.inventory.manage','Manage clinic inventory and stock movements'],['clinic.appointment.view','View clinic appointments'],['clinic.appointment.manage','Manage clinic appointments and follow-ups'],['clinic.follow_up.view','View clinic follow-ups'],['clinic.notifications.send','Release privacy-safe Clinic notices through shared notifications'],['clinic.report.view','View clinic operational reports'],['clinic.config.view','View clinic governance and configuration'],['clinic.config.manage','Manage clinic governance and item master'],
  ['library.portal.access','Access the Library operational portal'],['library.dashboard.view','View the Library operational dashboard'],['library.catalog.view','View the Library catalog'],['library.catalog.manage','Manage Library catalog records'],['library.copies.view','View Library copy records'],['library.copies.manage','Manage Library copy records'],['library.circulation.view','View Library circulation activity'],['library.circulation.checkout','Check out Library copies'],['library.circulation.checkin','Check in Library copies'],['library.circulation.renew','Renew Library loans'],['library.circulation.override','Override Library circulation restrictions'],['library.patrons.view','View least-data Library patron identities'],['library.visitors.view','View Library visitor activity'],['library.visitors.log','Record Library visitor entry and exit'],['library.visitors.reports','View Library visitor reports'],['library.overdue.view','View overdue Library loans'],['library.overdue.manage','Manage overdue Library loans'],['library.reports.view','View Library operational reports'],['library.settings.view','View Library settings'],['library.settings.manage','Manage Library settings'],
  ['computer_lab.access','Access Computer Laboratory operations'],['computer_lab.dashboard.view','View the Computer Laboratory dashboard'],['computer_lab.labs.view','View laboratories'],['computer_lab.labs.manage','Manage laboratories'],['computer_lab.workstations.view','View workstations'],['computer_lab.workstations.manage','Manage workstations'],['computer_lab.schedule.view','View laboratory schedules'],['computer_lab.schedule.manage','Manage laboratory schedules'],['computer_lab.sessions.view','View laboratory sessions'],['computer_lab.sessions.manage','Manage laboratory sessions'],['computer_lab.sessions.override','Override laboratory session restrictions'],['computer_lab.issues.view','View laboratory issues'],['computer_lab.issues.manage','Manage laboratory issues'],['computer_lab.maintenance.view','View laboratory maintenance'],['computer_lab.maintenance.manage','Manage laboratory maintenance'],['computer_lab.equipment.view','View laboratory equipment'],['computer_lab.equipment.manage','Manage laboratory equipment'],['computer_lab.software.view','View laboratory software'],['computer_lab.software.manage','Manage laboratory software'],['computer_lab.reports.view','View Computer Laboratory reports'],['computer_lab.settings.manage','Manage Computer Laboratory settings'],
] as const;
for (const [code, description] of permissions) {
  await pool.query(`INSERT INTO permissions (code, description) VALUES ($1, $2) ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description`, [code, description]);
}

const roles = [
  ['super_administrator', 'Super Administrator'], ['school_administrator', 'School Administrator'],
  ['hr_administrator', 'HR Administrator'], ['hr_staff', 'HR Staff'], ['principal', 'Principal'],
  ['registrar', 'Registrar'], ['teacher', 'Teacher'], ['clinic_staff', 'Clinic Staff'],
  ['library_administrator', 'Library Administrator'], ['librarian', 'Librarian'], ['library_assistant', 'Library Assistant'], ['computer_lab_administrator', 'Computer Laboratory Administrator'], ['computer_lab_staff', 'Computer Laboratory Staff'], ['laboratory_staff', 'Laboratory Staff'], ['canteen_staff', 'Canteen Staff'],
  ['student', 'Student'], ['parent_guardian', 'Parent / Guardian'], ['attendance_operator', 'Attendance Operator'],
] as const;
for (const [code, name] of roles) {
  await pool.query(`INSERT INTO roles (code, name, description, is_system) VALUES ($1, $2, $3, true)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`, [code, name, `Built-in ${name} role`]);
}
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.code = 'super_administrator' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('dashboard.view', 'security.user.view', 'security.role.view', 'academic.config.view', 'academic.config.manage', 'academic.calendar.view', 'academic.calendar.manage')
  WHERE r.code = 'school_administrator' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code = 'dashboard.view'
  WHERE r.code NOT IN ('super_administrator', 'school_administrator') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code='teacher.portal.access' WHERE r.code='teacher' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code IN('grades.view','grades.encode','grades.submit') WHERE r.code='teacher' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code LIKE 'grades.%' WHERE r.code IN('school_administrator','principal') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code='student.portal.access' WHERE r.code='student' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE p.code='notification.inbox.access' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code='notification.manage' WHERE r.code IN('school_administrator','principal') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code IN('attendance.operations.view','attendance.identity.lookup','attendance.manual.capture') WHERE r.code IN('school_administrator','registrar','attendance_operator') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code IN('attendance.operations.view','attendance.exception.resolve') WHERE r.code IN('school_administrator','principal') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE p.code='calendar.experience.access' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code='reference.external_school.view' WHERE r.code IN('school_administrator','registrar','principal') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code='reference.external_school.manage' WHERE r.code IN('school_administrator','registrar') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code IN('administration.operations.view','administration.operations.manage') WHERE r.code='school_administrator' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code='administration.operations.view' WHERE r.code='principal' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code='attendance.terminal.operate' WHERE r.code IN('hr_staff','registrar','attendance_operator') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code IN('attendance.terminal.operate','attendance.terminal.manage','attendance.terminal.installation.view','attendance.terminal.installation.manage','credential.manage') WHERE r.code='school_administrator' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code LIKE 'admission.%' WHERE r.code IN('school_administrator','registrar') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code='parent.portal.access' WHERE r.code='parent_guardian' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='clinic_staff' AND p.code LIKE 'clinic.%' AND p.code<>'clinic.config.manage' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='school_administrator' AND p.code IN('clinic.config.view','clinic.config.manage','clinic.report.view') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='library_administrator' AND p.code LIKE 'library.%' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='librarian' AND p.code LIKE 'library.%' AND p.code NOT IN('library.settings.manage','library.circulation.override') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='library_assistant' AND p.code IN('library.portal.access','library.dashboard.view','library.catalog.view','library.copies.view','library.circulation.view','library.circulation.checkout','library.circulation.checkin','library.circulation.renew','library.patrons.view','library.visitors.view','library.visitors.log','library.overdue.view') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code IN('super_administrator','school_administrator','computer_lab_administrator') AND p.code LIKE 'computer_lab.%' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='computer_lab_staff' AND p.code IN('computer_lab.access','computer_lab.dashboard.view','computer_lab.labs.view','computer_lab.workstations.view','computer_lab.schedule.view','computer_lab.sessions.view','computer_lab.sessions.manage','computer_lab.issues.view','computer_lab.issues.manage','computer_lab.maintenance.view','computer_lab.maintenance.manage','computer_lab.equipment.view','computer_lab.equipment.manage','computer_lab.software.view','computer_lab.reports.view') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('academic.config.view', 'academic.calendar.view')
  WHERE r.code IN ('principal', 'registrar', 'teacher') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('employee.view', 'employee.create', 'employee.edit', 'employee.archive', 'employee.sensitive.view', 'employee.sensitive.manage', 'employee.document.view', 'employee.document.manage', 'workforce.config.view', 'workforce.config.manage')
  WHERE r.code = 'hr_administrator' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('employee.view', 'employee.create', 'employee.edit', 'employee.document.view', 'employee.document.manage', 'workforce.config.view')
  WHERE r.code = 'hr_staff' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('employee.view', 'employee.document.view', 'workforce.config.view')
  WHERE r.code IN ('school_administrator', 'principal') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code LIKE 'teacher.%'
  WHERE r.code IN ('school_administrator', 'principal') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('teacher.profile.view', 'teacher.profile.manage', 'teacher.qualification.view', 'teacher.year_assignment.view')
  WHERE r.code = 'hr_administrator' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('teacher.profile.view', 'teacher.qualification.view', 'teacher.year_assignment.view')
  WHERE r.code IN ('hr_staff', 'registrar') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON (p.code LIKE 'student.%' OR p.code LIKE 'guardian.%')
  WHERE r.code IN ('school_administrator', 'registrar') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('student.profile.view', 'student.sensitive.view', 'guardian.view')
  WHERE r.code = 'principal' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code LIKE 'academic.assignment.%'
  WHERE r.code IN ('school_administrator','principal') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code='academic.assignment.view'
  WHERE r.code IN ('registrar','teacher') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code LIKE 'employee.attendance.%' WHERE r.code IN ('school_administrator','hr_administrator') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code IN ('employee.attendance.view','employee.attendance.manage','employee.attendance.correct.request') WHERE r.code='hr_staff' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code IN ('employee.attendance.view','employee.attendance.correct.request') WHERE r.code IN ('principal','teacher') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code LIKE 'student.attendance.%' WHERE r.code IN ('school_administrator','principal','registrar') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code IN ('student.attendance.view','student.attendance.manage') WHERE r.code='teacher' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code IN ('report.view','report.export','administration.settings.view','administration.settings.manage') WHERE r.code='school_administrator' ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code IN ('report.view','report.export','administration.settings.view') WHERE r.code IN ('principal','registrar','hr_administrator') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code LIKE 'enrollment.%'
  WHERE r.code IN ('school_administrator', 'registrar') ON CONFLICT DO NOTHING`);
await pool.query(`INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code = 'enrollment.view'
  WHERE r.code = 'principal' ON CONFLICT DO NOTHING`);

const school = await pool.query(`INSERT INTO schools (code, name, legal_name, city, province, country_code)
  VALUES ('MMSC', 'My Messiah School of Cavite', 'My Messiah School of Cavite', 'Cavite', 'Cavite', 'PH')
  ON CONFLICT (code) WHERE archived_at IS NULL DO UPDATE SET name = EXCLUDED.name, legal_name = EXCLUDED.legal_name, updated_at = now()
  RETURNING id`);
await pool.query(`UPDATE schools SET is_primary=(id=$1),updated_at=CASE WHEN id=$1 THEN now() ELSE updated_at END WHERE archived_at IS NULL`,[school.rows[0].id]);
await pool.query(`INSERT INTO campuses (school_id, code, name, city, province)
  VALUES ($1, 'MAIN', 'Main Campus', 'Cavite', 'Cavite')
  ON CONFLICT (school_id, code) WHERE archived_at IS NULL DO UPDATE SET name = EXCLUDED.name, updated_at = now()`, [school.rows[0]?.id]);

// Deterministic non-production credentials make attendance demonstrations repeatable.
await pool.query(`WITH actor AS (SELECT id FROM users WHERE archived_at IS NULL ORDER BY created_at LIMIT 1),
student_demo AS (SELECT id,row_number() OVER(ORDER BY created_at) sequence FROM students WHERE archived_at IS NULL ORDER BY created_at LIMIT 4),
employee_demo AS (SELECT id,row_number() OVER(ORDER BY created_at) sequence FROM employees WHERE archived_at IS NULL ORDER BY created_at LIMIT 4),
demo AS (
 SELECT 'student'::text subject_type,id student_id,NULL::uuid employee_id,kind credential_type,format('DEMO-STUDENT-%s-%s',sequence,upper(kind)) raw_value FROM student_demo CROSS JOIN(VALUES('rfid'),('qr'))k(kind)
 UNION ALL
 SELECT 'employee',NULL::uuid,id,kind,format('DEMO-EMPLOYEE-%s-%s',sequence,upper(kind)) FROM employee_demo CROSS JOIN(VALUES('rfid'),('qr'))k(kind)
)
INSERT INTO credentials(subject_type,student_id,employee_id,credential_type,value_digest,display_suffix,created_by,updated_by)
SELECT subject_type,student_id,employee_id,credential_type,encode(sha256(convert_to(raw_value::text,'UTF8')),'hex'),right(raw_value::text,6),actor.id,actor.id FROM demo CROSS JOIN actor
WHERE NOT EXISTS(SELECT 1 FROM credentials c WHERE c.value_digest=encode(sha256(convert_to(raw_value::text,'UTF8')),'hex') AND c.status='active')`);

if (Boolean(env.BOOTSTRAP_ADMIN_EMAIL) !== Boolean(env.BOOTSTRAP_ADMIN_PASSWORD)) {
  throw new Error('BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be provided together');
}
if (env.BOOTSTRAP_ADMIN_EMAIL && env.BOOTSTRAP_ADMIN_PASSWORD) {
  const normalizedEmail = env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
  const passwordHash = await hashPassword(env.BOOTSTRAP_ADMIN_PASSWORD);
  const user = await pool.query(`INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3)
    ON CONFLICT (lower(email)) WHERE archived_at IS NULL DO UPDATE SET display_name = users.display_name RETURNING id`, [normalizedEmail, env.BOOTSTRAP_ADMIN_NAME, passwordHash]);
  await pool.query(`INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE code = 'super_administrator' ON CONFLICT DO NOTHING`, [user.rows[0]?.id]);
  const bootstrapUsername=(env.BOOTSTRAP_ADMIN_USERNAME??normalizedEmail.split('@')[0]!).toLowerCase();
  await pool.query(`INSERT INTO login_identities(user_id,type,normalized_value,is_primary) VALUES($1,'username',$2,true) ON CONFLICT(type,user_id) DO UPDATE SET normalized_value=excluded.normalized_value,active=true,updated_at=now()`,[user.rows[0]?.id,bootstrapUsername]);
  console.log('Bootstrap administrator ensured');
}
console.log(`Seed complete: ${seedName}`);
await pool.end();
