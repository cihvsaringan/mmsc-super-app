import { pool } from '../database/pool.js';
import { securityRepository } from '../security/repository.js';
import { AppError } from '../lib/errors.js';
import { resourceDefinitions, type ResourceName } from './resources.js';

const toCamel = (value: string) => value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const mapRow = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [toCamel(key), value]));

export class AcademicRepository {
  async primaryInstitutionId():Promise<string>{const result=await pool.query(`SELECT id FROM schools WHERE is_primary AND archived_at IS NULL AND active LIMIT 1`);if(!result.rows[0])throw new Error('PRIMARY_INSTITUTION_NOT_CONFIGURED');return String(result.rows[0].id)}
  async list(resource: ResourceName): Promise<unknown[]> {
    const { table } = resourceDefinitions[resource];
    if (resource === 'school-years') {
      const result = await pool.query(`SELECT sy.*,
        count(DISTINCT term.id)::int term_count,
        count(DISTINCT period.id)::int grading_period_count,
        count(DISTINCT section.id)::int section_count,
        count(DISTINCT event.id)::int event_count
        FROM school_years sy
        LEFT JOIN academic_terms term ON term.school_year_id=sy.id AND term.archived_at IS NULL
        LEFT JOIN grading_periods period ON period.school_year_id=sy.id AND period.archived_at IS NULL
        LEFT JOIN sections section ON section.school_year_id=sy.id AND section.archived_at IS NULL
        LEFT JOIN calendar_events event ON event.school_year_id=sy.id AND event.archived_at IS NULL
        WHERE sy.archived_at IS NULL
        GROUP BY sy.id
        ORDER BY (sy.status='active') DESC, sy.starts_on DESC, sy.id`);
      return result.rows.map((row) => mapRow(row));
    }
    const order = resource === 'grade-levels' ? 'sequence ASC, name ASC, id ASC' : 'created_at, id';
    const result = await pool.query(`SELECT * FROM ${table} WHERE archived_at IS NULL${resource==='schools'?' AND is_primary':''} ORDER BY ${order}`);
    return result.rows.map((row) => mapRow(row));
  }

  async schoolYearDetail(id: string) {
    const year = await pool.query(`SELECT sy.*,
      count(DISTINCT term.id)::int term_count,
      count(DISTINCT period.id)::int grading_period_count,
      count(DISTINCT section.id)::int section_count,
      count(DISTINCT event.id)::int event_count
      FROM school_years sy
      LEFT JOIN academic_terms term ON term.school_year_id=sy.id AND term.archived_at IS NULL
      LEFT JOIN grading_periods period ON period.school_year_id=sy.id AND period.archived_at IS NULL
      LEFT JOIN sections section ON section.school_year_id=sy.id AND section.archived_at IS NULL
      LEFT JOIN calendar_events event ON event.school_year_id=sy.id AND event.archived_at IS NULL
      WHERE sy.id=$1 AND sy.archived_at IS NULL GROUP BY sy.id`, [id]);
    if (!year.rows[0]) return null;
    const [terms, gradingPeriods, sections, events, active, history] = await Promise.all([
      pool.query('SELECT * FROM academic_terms WHERE school_year_id=$1 AND archived_at IS NULL ORDER BY sequence,name', [id]),
      pool.query(`SELECT period.*,term.name academic_term_name FROM grading_periods period LEFT JOIN academic_terms term ON term.id=period.academic_term_id WHERE period.school_year_id=$1 AND period.archived_at IS NULL ORDER BY period.sequence,period.name`,[id]),
      pool.query(`SELECT section.*,grade.name grade_level_name,campus.name campus_name,
        (SELECT count(*)::int FROM enrollments enrollment WHERE enrollment.section_id=section.id) enrolled_count
        FROM sections section JOIN grade_levels grade ON grade.id=section.grade_level_id JOIN campuses campus ON campus.id=section.campus_id
        WHERE section.school_year_id=$1 AND section.archived_at IS NULL ORDER BY grade.sequence,section.name`, [id]),
      pool.query(`SELECT event.*,term.name academic_term_name,campus.name campus_name FROM calendar_events event
        LEFT JOIN academic_terms term ON term.id=event.academic_term_id LEFT JOIN campuses campus ON campus.id=event.campus_id
        WHERE event.school_year_id=$1 AND event.archived_at IS NULL ORDER BY event.starts_at,event.title`, [id]),
      pool.query(`SELECT id,name FROM school_years WHERE school_id=$1 AND status='active' AND archived_at IS NULL LIMIT 1`, [year.rows[0].school_id]),
      pool.query(`SELECT event.id,event.action,event.occurred_at,event.metadata,"user".display_name actor_name
        FROM audit_events event LEFT JOIN users "user" ON "user".id=event.actor_user_id
        WHERE event.target_type='school-years' AND event.target_id=$1 ORDER BY event.occurred_at DESC LIMIT 50`, [id]),
    ]);
    return { schoolYear: mapRow(year.rows[0]), terms: terms.rows.map(mapRow), gradingPeriods:gradingPeriods.rows.map(mapRow), sections: sections.rows.map(mapRow), events: events.rows.map(mapRow), currentActive: active.rows[0] ? mapRow(active.rows[0]) : null, history: history.rows.map(mapRow) };
  }

  async activateSchoolYear(id: string, context: { actorId: string; requestId: string; ip?: string | undefined }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const targetResult = await client.query('SELECT * FROM school_years WHERE id=$1 AND archived_at IS NULL FOR UPDATE', [id]);
      const target = targetResult.rows[0] as Record<string, unknown> | undefined;
      if (!target) throw new AppError(404, 'SCHOOL_YEAR_NOT_FOUND', 'School Year was not found');
      if (target.status !== 'planned') throw new AppError(409, 'INVALID_SCHOOL_YEAR_TRANSITION', 'Only a Planned School Year can be activated');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [String(target.school_id)]);
      const currentResult = await client.query(`SELECT * FROM school_years WHERE school_id=$1 AND status='active' AND archived_at IS NULL FOR UPDATE`, [target.school_id]);
      const current = currentResult.rows[0] as Record<string, unknown> | undefined;
      if (current && String(current.id) !== id) {
        await client.query(`UPDATE school_years SET status='closed',updated_at=now(),version=version+1 WHERE id=$1`, [current.id]);
        await securityRepository.audit({ actorUserId: context.actorId, action: 'academic.school_year.close', targetType: 'school-years', targetId: String(current.id), outcome: 'success', requestId: context.requestId, ipAddress: context.ip, metadata: { previousStatus: 'active', newStatus: 'closed', activatedSchoolYearId: id } }, client);
      }
      const activated = await client.query(`UPDATE school_years SET status='active',updated_at=now(),version=version+1 WHERE id=$1 AND status='planned' RETURNING *`, [id]);
      if (!activated.rows[0]) throw new AppError(409, 'INVALID_SCHOOL_YEAR_TRANSITION', 'School Year is no longer Planned');
      await securityRepository.audit({ actorUserId: context.actorId, action: 'academic.school_year.activate', targetType: 'school-years', targetId: id, outcome: 'success', requestId: context.requestId, ipAddress: context.ip, metadata: { previousStatus: 'planned', newStatus: 'active', closedSchoolYearId: current && String(current.id) !== id ? String(current.id) : null } }, client);
      await client.query('COMMIT');
      return { schoolYear: mapRow(activated.rows[0]), closedSchoolYear: current && String(current.id) !== id ? mapRow({ ...current, status: 'closed' }) : null };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async create(resource: ResourceName, data: Record<string, unknown>, context: { actorId: string; requestId: string; ip?: string | undefined }): Promise<unknown> {
    const definition = resourceDefinitions[resource]; const entries = Object.entries(data).filter(([, value]) => value !== undefined);
    const columns = entries.map(([key]) => definition.fields[key as keyof typeof definition.fields]);
    const values = entries.map(([, value]) => value); const placeholders = values.map((_, index) => `$${index + 1}`);
    const client = await pool.connect();
    try { await client.query('BEGIN'); const result = await client.query(`INSERT INTO ${definition.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`, values); const row = result.rows[0] as Record<string, unknown>;
      await securityRepository.audit({ actorUserId: context.actorId, action: `academic.${resource.replaceAll('-', '_')}.create`, targetType: resource, targetId: String(row.id), outcome: 'success', requestId: context.requestId, ipAddress: context.ip }, client); await client.query('COMMIT'); return mapRow(row);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async update(resource: ResourceName, id: string, version: number, data: Record<string, unknown>, context: { actorId: string; requestId: string; ip?: string | undefined }): Promise<unknown | null> {
    const definition = resourceDefinitions[resource]; const entries = Object.entries(data).filter(([, value]) => value !== undefined);
    const assignments = entries.map(([key], index) => `${definition.fields[key as keyof typeof definition.fields]} = $${index + 1}`);
    const values = entries.map(([, value]) => value); values.push(id, version);
    const client = await pool.connect();
    try { await client.query('BEGIN'); const result = await client.query(`UPDATE ${definition.table} SET ${assignments.join(', ')}, updated_at = now(), version = version + 1 WHERE id = $${values.length - 1} AND version = $${values.length} AND archived_at IS NULL RETURNING *`, values); const row = result.rows[0] as Record<string, unknown> | undefined;
      if (row) await securityRepository.audit({ actorUserId: context.actorId, action: `academic.${resource.replaceAll('-', '_')}.update`, targetType: resource, targetId: id, outcome: 'success', requestId: context.requestId, ipAddress: context.ip }, client); await client.query('COMMIT'); return row ? mapRow(row) : null;
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async archive(resource: ResourceName, id: string, version: number, context: { actorId: string; requestId: string; ip?: string | undefined }): Promise<boolean> {
    const { table } = resourceDefinitions[resource]; const client = await pool.connect();
    const activeAssignment = ['school_years', 'academic_terms', 'grading_periods', 'calendar_events'].includes(table) ? '' : ', active = false';
    const lifecycleGuard = resource === 'school-years' ? " AND status = 'closed'" : '';
    try { await client.query('BEGIN'); const result = await client.query(`UPDATE ${table} SET archived_at = now()${activeAssignment}, updated_at = now(), version = version + 1 WHERE id = $1 AND version = $2 AND archived_at IS NULL${lifecycleGuard}`, [id, version]);
      if (result.rowCount) await securityRepository.audit({ actorUserId: context.actorId, action: `academic.${resource.replaceAll('-', '_')}.archive`, targetType: resource, targetId: id, outcome: 'success', requestId: context.requestId, ipAddress: context.ip }, client); await client.query('COMMIT'); return Boolean(result.rowCount);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
}

export const academicRepository = new AcademicRepository();
