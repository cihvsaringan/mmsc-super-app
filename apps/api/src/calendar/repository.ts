import { pool } from '../database/pool.js';

const map = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value]));

export class CalendarRepository {
  async context() {
    const [years, campuses] = await Promise.all([
      pool.query(`SELECT id,school_id,name,status,starts_on,ends_on FROM school_years WHERE archived_at IS NULL ORDER BY starts_on DESC`),
      pool.query(`SELECT id,name FROM campuses WHERE archived_at IS NULL AND active=true ORDER BY name`),
    ]);
    return { schoolYears: years.rows.map(map), campuses: campuses.rows.map(map) };
  }

  async events(input: { from: string; to: string; eventType?: string | undefined; campusId?: string | undefined; schoolYearId?: string | undefined; includeUnpublished: boolean }) {
    const values: unknown[] = [input.from, input.to];
    const clauses = [`e.archived_at IS NULL`, `e.starts_at < $2::date + interval '1 day'`, `e.ends_at >= $1::date`];
    if (!input.includeUnpublished) clauses.push(`e.status = 'published'`);
    if (input.eventType) { values.push(input.eventType); clauses.push(`e.event_type = $${values.length}`); }
    if (input.campusId) { values.push(input.campusId); clauses.push(`(e.campus_id IS NULL OR e.campus_id = $${values.length})`); }
    if (input.schoolYearId) { values.push(input.schoolYearId); clauses.push(`(e.school_year_id IS NULL OR e.school_year_id = $${values.length})`); }
    const result = await pool.query(`SELECT e.id,e.title,e.event_type,e.starts_at,e.ends_at,e.all_day,e.location,e.description,e.status,e.version,e.campus_id,c.name campus_name,e.school_year_id,sy.name school_year_name
      FROM calendar_events e LEFT JOIN campuses c ON c.id=e.campus_id LEFT JOIN school_years sy ON sy.id=e.school_year_id
      WHERE ${clauses.join(' AND ')} ORDER BY e.starts_at,e.title`, values);
    return result.rows.map(map);
  }
}

export const calendarRepository = new CalendarRepository();
