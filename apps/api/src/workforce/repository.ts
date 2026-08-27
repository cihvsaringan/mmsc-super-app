import type { PoolClient } from 'pg';
import { pool } from '../database/pool.js';
import { securityRepository } from '../security/repository.js';
import { employeeFields } from './schemas.js';

const camel = (value: string) => value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const map = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [camel(key), value]));
type Context = { actorId: string; requestId: string; ip?: string | undefined };
const audit = (client: PoolClient, context: Context, action: string, targetType: string, targetId: string) => securityRepository.audit({ actorUserId: context.actorId, action, targetType, targetId, outcome: 'success', requestId: context.requestId, ipAddress: context.ip }, client);

const config = {
  positions: { table: 'positions', fields: { schoolId: 'school_id', departmentId: 'department_id', code: 'code', name: 'name', description: 'description', active: 'active' } },
  'employee-types': { table: 'employee_types', fields: { schoolId: 'school_id', code: 'code', name: 'name', description: 'description', active: 'active' } },
} as const;
export type ConfigName = keyof typeof config;

export class WorkforceRepository {
  async context() {
    const [schools, campuses, departments, positions, employeeTypes] = await Promise.all([
      pool.query('SELECT id, code, name FROM schools WHERE archived_at IS NULL AND active ORDER BY name'),
      pool.query('SELECT id, school_id, code, name FROM campuses WHERE archived_at IS NULL AND active ORDER BY name'),
      pool.query('SELECT id, school_id, code, name FROM departments WHERE archived_at IS NULL AND active ORDER BY name'),
      pool.query('SELECT id, school_id, department_id, code, name FROM positions WHERE archived_at IS NULL AND active ORDER BY name'),
      pool.query('SELECT id, school_id, code, name FROM employee_types WHERE archived_at IS NULL AND active ORDER BY name'),
    ]);
    return { schools: schools.rows.map(map), campuses: campuses.rows.map(map), departments: departments.rows.map(map), positions: positions.rows.map(map), employeeTypes: employeeTypes.rows.map(map) };
  }

  async listEmployees(query: { search?: string | undefined; status?: string | undefined; departmentId?: string | undefined; limit: number; offset: number }) {
    const values: unknown[] = []; const where = ['e.archived_at IS NULL'];
    if (query.search) { values.push(`%${query.search}%`); where.push(`(e.employee_number ILIKE $${values.length} OR e.first_name ILIKE $${values.length} OR e.last_name ILIKE $${values.length} OR concat_ws(' ', e.first_name, e.middle_name, e.last_name) ILIKE $${values.length})`); }
    if (query.status) { values.push(query.status); where.push(`e.employment_status = $${values.length}`); }
    if (query.departmentId) { values.push(query.departmentId); where.push(`e.department_id = $${values.length}`); }
    const count = await pool.query(`SELECT count(*)::int AS total FROM employees e WHERE ${where.join(' AND ')}`, values);
    values.push(query.limit, query.offset);
    const result = await pool.query(`SELECT e.id, e.employee_number, e.first_name, e.middle_name, e.last_name, e.preferred_name, e.work_email, e.mobile_phone, e.employment_status, e.hire_date, e.profile_photo_asset_id, CASE WHEN e.profile_photo_asset_id IS NOT NULL THEN '/media/'||e.profile_photo_asset_id||'/profile' ELSE e.profile_photo_url END profile_photo_url, CASE WHEN e.profile_photo_asset_id IS NOT NULL THEN '/media/'||e.profile_photo_asset_id||'/thumbnail' END profile_photo_thumbnail_url, e.department_id, e.position_id, e.employee_type_id, e.version, d.name department_name, p.name position_name, et.name employee_type_name FROM employees e LEFT JOIN departments d ON d.id=e.department_id LEFT JOIN positions p ON p.id=e.position_id LEFT JOIN employee_types et ON et.id=e.employee_type_id WHERE ${where.join(' AND ')} ORDER BY lower(e.last_name), lower(e.first_name), e.id LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { items: result.rows.map(map), total: count.rows[0]?.total as number };
  }

  async detail(id: string) {
    const employee = await pool.query(`SELECT e.*, CASE WHEN e.profile_photo_asset_id IS NOT NULL THEN '/media/'||e.profile_photo_asset_id||'/profile' ELSE e.profile_photo_url END profile_photo_url, CASE WHEN e.profile_photo_asset_id IS NOT NULL THEN '/media/'||e.profile_photo_asset_id||'/thumbnail' END profile_photo_thumbnail_url, d.name department_name, p.name position_name, et.name employee_type_name, c.name campus_name FROM employees e LEFT JOIN departments d ON d.id=e.department_id LEFT JOIN positions p ON p.id=e.position_id LEFT JOIN employee_types et ON et.id=e.employee_type_id LEFT JOIN campuses c ON c.id=e.campus_id WHERE e.id=$1 AND e.archived_at IS NULL`, [id]);
    if (!employee.rows[0]) return null;
    const [contacts, history] = await Promise.all([pool.query('SELECT * FROM employee_emergency_contacts WHERE employee_id=$1 AND archived_at IS NULL ORDER BY is_primary DESC, created_at', [id]), pool.query('SELECT * FROM employee_status_history WHERE employee_id=$1 ORDER BY effective_on DESC, created_at DESC', [id])]);
    return { employee: map(employee.rows[0]), emergencyContacts: contacts.rows.map(map), statusHistory: history.rows.map(map) };
  }

  async createEmployee(data: Record<string, unknown>, context: Context) {
    const entries = Object.entries(data).filter(([, value]) => value !== undefined); const columns = entries.map(([key]) => employeeFields[key as keyof typeof employeeFields]); const values = entries.map(([, value]) => value);
    const client = await pool.connect(); try { await client.query('BEGIN'); const result = await client.query(`INSERT INTO employees (${columns.join(',')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`, values); const row = result.rows[0] as Record<string, unknown>; await client.query('INSERT INTO employee_status_history (employee_id, to_status, effective_on, reason, changed_by) VALUES ($1,$2,$3,$4,$5)', [row.id, row.employment_status, row.hire_date, 'Initial employment record', context.actorId]); await audit(client, context, 'employee.create', 'employee', String(row.id)); await client.query('COMMIT'); return map(row); } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async updateEmployee(id: string, version: number, data: Record<string, unknown>, statusEffectiveOn: string | undefined, statusReason: string | null | undefined, context: Context) {
    const entries = Object.entries(data).filter(([, value]) => value !== undefined); const assignments = entries.map(([key], i) => `${employeeFields[key as keyof typeof employeeFields]}=$${i + 1}`); const values = entries.map(([, value]) => value); values.push(id, version);
    const client = await pool.connect(); try { await client.query('BEGIN'); const old = await client.query('SELECT employment_status FROM employees WHERE id=$1 AND archived_at IS NULL FOR UPDATE', [id]); if (!old.rows[0]) { await client.query('ROLLBACK'); return null; } const result = await client.query(`UPDATE employees SET ${assignments.join(',')}, updated_at=now(), version=version+1 WHERE id=$${values.length - 1} AND version=$${values.length} AND archived_at IS NULL RETURNING *`, values); const row = result.rows[0] as Record<string, unknown> | undefined; if (!row) { await client.query('ROLLBACK'); return null; } if (old.rows[0].employment_status !== row.employment_status) await client.query('INSERT INTO employee_status_history (employee_id,from_status,to_status,effective_on,reason,changed_by) VALUES ($1,$2,$3,$4,$5,$6)', [id, old.rows[0].employment_status, row.employment_status, statusEffectiveOn ?? new Date().toISOString().slice(0,10), statusReason ?? null, context.actorId]); await audit(client, context, 'employee.update', 'employee', id); await client.query('COMMIT'); return map(row); } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async archiveEmployee(id: string, version: number, context: Context) { const client=await pool.connect(); try { await client.query('BEGIN'); const result=await client.query("UPDATE employees SET archived_at=now(), employment_status='inactive', updated_at=now(), version=version+1 WHERE id=$1 AND version=$2 AND archived_at IS NULL",[id,version]); if(result.rowCount) await audit(client,context,'employee.archive','employee',id); await client.query('COMMIT'); return Boolean(result.rowCount); } catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();} }

  async listConfig(name: ConfigName) { return (await pool.query(`SELECT * FROM ${config[name].table} WHERE archived_at IS NULL ORDER BY name`)).rows.map(map); }
  async createConfig(name: ConfigName, data: Record<string, unknown>, context: Context) { const def=config[name]; const entries=Object.entries(data).filter(([,v])=>v!==undefined); const columns=entries.map(([k])=>def.fields[k as keyof typeof def.fields]); const values=entries.map(([,v])=>v); const client=await pool.connect(); try{await client.query('BEGIN');const result=await client.query(`INSERT INTO ${def.table} (${columns.join(',')}) VALUES (${values.map((_,i)=>`$${i+1}`).join(',')}) RETURNING *`,values);const row=result.rows[0] as Record<string,unknown>;await audit(client,context,`workforce.${name.replace('-','_')}.create`,name,String(row.id));await client.query('COMMIT');return map(row);}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();} }
  async updateConfig(name:ConfigName,id:string,version:number,data:Record<string,unknown>,context:Context){const def=config[name];const entries=Object.entries(data).filter(([,v])=>v!==undefined);const values=entries.map(([,v])=>v);const assignments=entries.map(([key],i)=>`${def.fields[key as keyof typeof def.fields]}=$${i+1}`);values.push(id,version);const client=await pool.connect();try{await client.query('BEGIN');const result=await client.query(`UPDATE ${def.table} SET ${assignments.join(',')},updated_at=now(),version=version+1 WHERE id=$${values.length-1} AND version=$${values.length} AND archived_at IS NULL RETURNING *`,values);const row=result.rows[0] as Record<string,unknown>|undefined;if(row)await audit(client,context,`workforce.${name.replace('-','_')}.update`,name,id);await client.query('COMMIT');return row?map(row):null;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
  async archiveConfig(name:ConfigName,id:string,version:number,context:Context){const def=config[name];const client=await pool.connect();try{await client.query('BEGIN');const result=await client.query(`UPDATE ${def.table} SET archived_at=now(),active=false,updated_at=now(),version=version+1 WHERE id=$1 AND version=$2 AND archived_at IS NULL`,[id,version]);if(result.rowCount)await audit(client,context,`workforce.${name.replace('-','_')}.archive`,name,id);await client.query('COMMIT');return Boolean(result.rowCount);}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}

  async listRelated(table: 'employee_identifiers'|'employee_documents', employeeId: string) { return (await pool.query(`SELECT * FROM ${table} WHERE employee_id=$1 AND archived_at IS NULL ORDER BY created_at`,[employeeId])).rows.map(map); }
  async recordAccess(action:string,employeeId:string,context:Context){const client=await pool.connect();try{await audit(client,context,action,'employee',employeeId);}finally{client.release();}}
  async createRelated(table: 'employee_emergency_contacts'|'employee_identifiers'|'employee_documents', employeeId:string, data:Record<string,unknown>, fields:Record<string,string>, action:string, context:Context){const entries=Object.entries(data).filter(([,v])=>v!==undefined);const columns=['employee_id',...entries.map(([k])=>fields[k]!)];const values=[employeeId,...entries.map(([,v])=>v)];if(table==='employee_documents'){columns.push('uploaded_by');values.push(context.actorId);}const client=await pool.connect();try{await client.query('BEGIN');const result=await client.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${values.map((_,i)=>`$${i+1}`).join(',')}) RETURNING *`,values);const row=result.rows[0] as Record<string,unknown>;await audit(client,context,action,table,String(row.id));await client.query('COMMIT');return map(row);}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
  async archiveRelated(table:'employee_emergency_contacts'|'employee_identifiers'|'employee_documents', id:string, version:number, action:string, context:Context){const client=await pool.connect();try{await client.query('BEGIN');const result=await client.query(`UPDATE ${table} SET archived_at=now(), updated_at=now(), version=version+1 WHERE id=$1 AND version=$2 AND archived_at IS NULL`,[id,version]);if(result.rowCount)await audit(client,context,action,table,id);await client.query('COMMIT');return Boolean(result.rowCount);}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
}
export const workforceRepository = new WorkforceRepository();
