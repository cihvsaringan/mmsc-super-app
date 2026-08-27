import "dotenv/config";
import { pool } from "./pool.js";

const checks = [
  [
    "one primary institution",
    `SELECT count(*)=1 ok FROM schools WHERE is_primary AND active AND archived_at IS NULL`,
  ],
  [
    "one active super administrator",
    `SELECT count(DISTINCT u.id)=1 ok FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='super_administrator' AND u.status='active' AND u.archived_at IS NULL`,
  ],
  [
    "active demo school year",
    `SELECT count(*)=1 ok FROM school_years WHERE name='SY 2026-2027' AND status='active' AND archived_at IS NULL`,
  ],
  [
    "two sections per grade",
    `SELECT count(*)=14 AND min(section_count)>=2 ok FROM(SELECT g.id,count(s.id)section_count FROM grade_levels g LEFT JOIN sections s ON s.grade_level_id=g.id AND s.archived_at IS NULL WHERE g.archived_at IS NULL GROUP BY g.id)x`,
  ],
  [
    "teachers link to employees",
    `SELECT count(*)>=15 AND count(*)=count(e.id) ok FROM teacher_profiles t LEFT JOIN employees e ON e.id=t.employee_id WHERE t.archived_at IS NULL`,
  ],
  [
    "students are enrolled and placed",
    `SELECT count(*)>=150 AND count(*)=count(e.id) AND count(*)=count(e.section_id) ok FROM students s LEFT JOIN enrollments e ON e.student_id=s.id AND e.status='enrolled' WHERE s.archived_at IS NULL`,
  ],
  [
    "every student has a guardian",
    `SELECT count(*)=(SELECT count(*) FROM students WHERE archived_at IS NULL) ok FROM student_guardians WHERE is_primary AND archived_at IS NULL`,
  ],
  [
    "admission workflow coverage",
    `SELECT count(DISTINCT status)>=7 AND count(*)>=20 ok FROM admission_applications WHERE archived_at IS NULL`,
  ],
  [
    "demo accounts have roles",
    `SELECT count(DISTINCT u.id)>=8 ok FROM users u JOIN user_roles ur ON ur.user_id=u.id WHERE u.email LIKE '%@demo.invalid'`,
  ],
  [
    "dashboards have meaningful data",
    `SELECT (SELECT count(*) FROM employees WHERE archived_at IS NULL)>=25 AND (SELECT count(*) FROM students WHERE archived_at IS NULL)>=150 AND (SELECT count(*) FROM calendar_events WHERE archived_at IS NULL)>=8 ok`,
  ],
  [
    "Clinic Staff has operational RBAC without Administration role",
    `SELECT count(*)=1 AND bool_and(r.code='clinic_staff') ok FROM users u JOIN login_identities li ON li.user_id=u.id JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE li.normalized_value='clinicstaff'`,
  ],
  [
    "Clinic demo EHR and inventory load",
    `SELECT (SELECT count(*) FROM clinic_health_profiles)>=1 AND (SELECT count(*) FROM clinic_health_alerts WHERE active)>=1 AND (SELECT count(*) FROM clinic_immunizations)>=1 AND (SELECT count(*) FROM clinic_physical_exams)>=1 AND (SELECT COALESCE(sum(quantity_remaining),0) FROM clinic_inventory_lots)>0 AND (SELECT count(*) FROM clinic_appointments)>=1 ok`,
  ],
] as const;
let failed = 0;
for (const [name, sql] of checks) {
  const result = await pool.query(sql);
  const ok = Boolean(result.rows[0]?.ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed++;
}
await pool.end();
if (failed) throw new Error(`${failed} demo validation check(s) failed`);
console.log(`Validated ${checks.length} demo-data invariants.`);
