import { afterEach, describe, expect, it, vi } from 'vitest';
import { pool } from '../database/pool.js';
import { academicRepository } from './repository.js';

afterEach(() => vi.restoreAllMocks());

const year = (status: 'planned' | 'active' | 'closed') => ({
  id: '08f35c64-1fd8-4c59-abd9-03466935c97b',
  school_id: '18f35c64-1fd8-4c59-abd9-03466935c97b',
  name: `Test ${status}`,
  status,
});

describe('AcademicRepository School Year details', () => {
  it.each(['planned', 'active', 'closed'] as const)('opens an empty %s School Year safely', async (status) => {
    const query = vi.spyOn(pool, 'query').mockImplementation(async (sql: unknown) => {
      const statement = String(sql);
      if (statement.includes('WHERE sy.id=$1')) return { rows: [year(status)] } as never;
      if (statement.includes("status='active'")) return { rows: [] } as never;
      return { rows: [] } as never;
    });

    const result = await academicRepository.schoolYearDetail(year(status).id);

    expect(result?.schoolYear).toEqual(expect.objectContaining({ status }));
    expect(result).toEqual(expect.objectContaining({ terms: [], sections: [], events: [], history: [] }));
    const sectionSql = query.mock.calls.map(([sql]) => String(sql)).find((sql) => sql.includes('enrolled_count'));
    expect(sectionSql).toContain('enrollment.section_id=section.id');
    expect(sectionSql).not.toContain('enrollment.archived_at');
  });

  it('returns configured child collections', async () => {
    vi.spyOn(pool, 'query').mockImplementation(async (sql: unknown) => {
      const statement = String(sql);
      if (statement.includes('WHERE sy.id=$1')) return { rows: [year('active')] } as never;
      if (statement.includes('FROM academic_terms')) return { rows: [{ id: 'term', name: 'Term 1' }] } as never;
      if (statement.includes('FROM sections section')) return { rows: [{ id: 'section', enrolled_count: 2 }] } as never;
      if (statement.includes('FROM calendar_events')) return { rows: [{ id: 'event', title: 'Opening' }] } as never;
      if (statement.includes("status='active'")) return { rows: [{ id: year('active').id, name: 'Test active' }] } as never;
      if (statement.includes('FROM audit_events')) return { rows: [{ id: 'audit', action: 'created' }] } as never;
      return { rows: [] } as never;
    });

    const result = await academicRepository.schoolYearDetail(year('active').id);
    expect(result).toEqual(expect.objectContaining({ terms: [expect.objectContaining({ id: 'term' })], sections: [expect.objectContaining({ id: 'section', enrolledCount: 2 })], events: [expect.objectContaining({ id: 'event' })], history: [expect.objectContaining({ id: 'audit' })] }));
  });

  it('returns null for a missing School Year', async () => {
    vi.spyOn(pool, 'query').mockResolvedValue({ rows: [] } as never);
    await expect(academicRepository.schoolYearDetail(year('planned').id)).resolves.toBeNull();
  });

  it('orders Grade Levels by configured sequence before returning them', async () => {
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows: [] } as never);
    await academicRepository.list('grade-levels');
    expect(String(query.mock.calls[0]?.[0])).toContain('ORDER BY sequence ASC, name ASC, id ASC');
  });
});
