import { z } from 'zod';
import { pool } from '../database/pool.js';
import { securityRepository } from '../security/repository.js';

const optional = (max: number) => z.string().trim().max(max).nullable().optional();
export const externalSchoolSchema = z.object({
  name: z.string().trim().min(2).max(300), schoolType: optional(60), educationLevel: optional(100), depedSchoolId: optional(40),
  addressLine: optional(300), barangay: optional(120), cityMunicipality: optional(120), province: optional(120), region: optional(120),
  countryCode: z.string().length(2).toUpperCase().default('PH'), contactNumber: optional(50), email: z.email().nullable().optional(),
  website: z.url().max(500).nullable().optional(), active: z.boolean().default(true),
}).strict();
const map = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, character: string) => character.toUpperCase()), value]));
const columns = { name: 'name', schoolType: 'school_type', educationLevel: 'education_level', depedSchoolId: 'deped_school_id', addressLine: 'address_line', barangay: 'barangay', cityMunicipality: 'city_municipality', province: 'province', region: 'region', countryCode: 'country_code', contactNumber: 'contact_number', email: 'email', website: 'website', active: 'active' } as const;
type Context = { actorId: string; requestId: string; ip?: string | undefined };

export const externalSchoolsRepository = {
  async list(search = '', includeInactive = false) {
    const query = `%${search}%`;
    const result = await pool.query(`SELECT * FROM external_schools WHERE archived_at IS NULL AND ($2 OR active) AND ($1='%%' OR name ILIKE $1 OR deped_school_id ILIKE $1 OR city_municipality ILIKE $1 OR province ILIKE $1) ORDER BY active DESC,lower(name) LIMIT 200`, [query, includeInactive]);
    return result.rows.map(map);
  },
  async create(data: z.infer<typeof externalSchoolSchema>, context: Context) { return this.save(undefined, undefined, data, context); },
  async save(id: string | undefined, version: number | undefined, data: z.infer<typeof externalSchoolSchema>, context: Context) {
    const entries = Object.entries(data); const values: unknown[] = entries.map(([, value]) => value); const client = await pool.connect();
    try {
      await client.query('BEGIN'); let result;
      if (id) {
        values.push(id, version);
        result = await client.query(`UPDATE external_schools SET ${entries.map(([key], index) => `${columns[key as keyof typeof columns]}=$${index + 1}`).join(',')},updated_at=now(),version=version+1 WHERE id=$${values.length - 1} AND version=$${values.length} AND archived_at IS NULL RETURNING *`, values);
      } else {
        result = await client.query(`INSERT INTO external_schools(${entries.map(([key]) => columns[key as keyof typeof columns]).join(',')})VALUES(${values.map((_, index) => `$${index + 1}`).join(',')})RETURNING *`, values);
      }
      const row = result.rows[0] as Record<string, unknown> | undefined;
      if (row) await securityRepository.audit({ actorUserId: context.actorId, action: id ? 'reference.external_school.update' : 'reference.external_school.create', targetType: 'external_school', targetId: String(row.id), outcome: 'success', requestId: context.requestId, ipAddress: context.ip }, client);
      await client.query('COMMIT'); return row ? map(row) : null;
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },
};
