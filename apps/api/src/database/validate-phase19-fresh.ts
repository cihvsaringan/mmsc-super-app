import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Pool } from 'pg';

const source=new URL(process.env.DATABASE_URL??'postgresql://mmsc:mmsc_dev_password@localhost:15432/mmsc');
if(!['localhost','127.0.0.1','postgres'].includes(source.hostname))throw new Error('Fresh validation is restricted to local PostgreSQL');
const database='mmsc_phase19_validation',adminUrl=new URL(source),fresh=new URL(source);
adminUrl.pathname='/postgres';fresh.pathname=`/${database}`;
const run=(file:string,extra:Record<string,string>={})=>{const result=spawnSync(process.execPath,['--import','tsx',file],{cwd:join(dirname(fileURLToPath(import.meta.url)),'../..'),env:{...process.env,...extra,DATABASE_URL:fresh.toString()},encoding:'utf8'});if(result.status!==0)throw new Error(`${file} failed: ${result.stderr||result.stdout}`);return result.stdout.trim()};
const admin=new Client({connectionString:adminUrl.toString()});await admin.connect();await admin.query(`DROP DATABASE IF EXISTS ${database}`);await admin.query(`CREATE DATABASE ${database}`);await admin.end();
try{
 const migrate=run('src/database/migrate.ts'),seed=run('src/database/seed.ts');
 const demoPassword=`Phase19!${randomUUID()}`;
 const demoReset=run('src/database/demo-reset.ts',{MMSC_DEMO_RESET:'RESET_LOCAL_MMSC_DEMO',MMSC_DEMO_PASSWORD:demoPassword});
 const clinicAcceptance=run('src/database/validate-phase19-clinic-acceptance.ts');
 const demoValidate=run('src/database/demo-validate.ts');
 const verify=new Pool({connectionString:fresh.toString()});
 const result=await verify.query(`SELECT
  (SELECT count(*) FROM schema_migrations)=39 "migrations",
  to_regclass('public.applications') IS NULL AND to_regclass('public.user_applications') IS NULL "registryRemoved",
  to_regclass('public.clinic_encounters') IS NOT NULL "clinicSchema",
  (SELECT count(*)=16 FROM permissions WHERE code LIKE 'clinic.%') "clinicPermissions",
  (SELECT count(*)=1 FROM roles WHERE code='clinic_staff') "clinicRole",
  (SELECT count(*)>=15 FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.code='clinic_staff' AND p.code LIKE 'clinic.%') "clinicGrants",
  (SELECT count(*)=1 FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='super_administrator' AND u.archived_at IS NULL) "superAdmin",
  (SELECT count(*)=1 FROM users u JOIN login_identities li ON li.user_id=u.id JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE li.normalized_value='clinicstaff' AND r.code='clinic_staff') "clinicStaff",
  (SELECT count(*)>=1 FROM clinic_health_profiles) AND (SELECT count(*)>=1 FROM clinic_appointments) AND (SELECT COALESCE(sum(quantity_remaining),0)>0 FROM clinic_inventory_lots) "clinicDemo"`);
 await verify.end();const row=result.rows[0];if(Object.values(row).some(value=>value!==true))throw new Error(`Fresh validation failed: ${JSON.stringify(row)}`);
 console.log(JSON.stringify({migrationCount:39,...row,seed:seed.includes('Seed complete'),demoReset:demoReset.length>0,demoValidation:demoValidate.includes('Validated 12 demo-data invariants.'),clinicAcceptance:clinicAcceptance.includes('INSUFFICIENT_STOCK'),migrationOutput:migrate.includes('0045_clinic_group5')}));
}finally{const cleanup=new Client({connectionString:adminUrl.toString()});await cleanup.connect();await cleanup.query(`DROP DATABASE IF EXISTS ${database} WITH(FORCE)`);await cleanup.end()}
