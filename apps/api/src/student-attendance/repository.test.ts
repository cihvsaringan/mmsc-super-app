import { afterEach, describe, expect, it, vi } from 'vitest';
import { pool } from '../database/pool.js';
import { StudentAttendanceRepository } from './repository.js';

afterEach(() => vi.restoreAllMocks());

describe('StudentAttendanceRepository date filtering', () => {
  it('counts and pages actual attendance transactions for the selected date', async () => {
    const rows = [
      { id: 'time-in-only', attendance_id: 'time-in-only', attendance_date: '2026-08-24', time_in: '2026-08-24T07:00:00.000Z', time_out: null },
      { id: 'time-out-only', attendance_id: 'time-out-only', attendance_date: '2026-08-24', time_in: null, time_out: '2026-08-24T15:00:00.000Z' },
    ];
    const query = vi.spyOn(pool, 'query')
      .mockResolvedValueOnce({ rows: [{ total: 2 }] } as never)
      .mockResolvedValueOnce({ rows } as never);

    const result = await new StudentAttendanceRepository().list({ from: '2026-08-24', to: '2026-08-24', page: 1, limit: 25, sort: 'newest' });

    const countSql = String(query.mock.calls[0]?.[0]);
    const listSql = String(query.mock.calls[1]?.[0]);
    expect(countSql).toContain('FROM student_attendance_records a');
    expect(countSql).toContain('a.attendance_date BETWEEN $1 AND $2');
    expect(listSql).not.toContain('LEFT JOIN LATERAL');
    expect(listSql).not.toContain('not_recorded');
    expect(query.mock.calls[0]?.[1]).toEqual(['2026-08-24', '2026-08-24']);
    expect(query.mock.calls[1]?.[1]).toEqual(['2026-08-24', '2026-08-24', 25, 0]);
    expect(result).toEqual(expect.objectContaining({ total: 2, page: 1, limit: 25 }));
    expect(result.items).toEqual([
      expect.objectContaining({ id: 'time-in-only', timeIn: rows[0]?.time_in, timeOut: null }),
      expect.objectContaining({ id: 'time-out-only', timeIn: null, timeOut: rows[1]?.time_out }),
    ]);
  });

  it('applies identity filters and pagination to the same record set', async () => {
    const query = vi.spyOn(pool, 'query')
      .mockResolvedValueOnce({ rows: [{ total: 0 }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    await new StudentAttendanceRepository().list({ from: '2026-08-01', to: '2026-08-31', search: 'Juan', schoolYearId: 'year', gradeLevelId: 'grade', sectionId: 'section', status: 'late', source: 'qr_terminal', page: 2, limit: 10, sort: 'student_asc' });

    expect(query.mock.calls[0]?.[1]).toEqual(['2026-08-01', '2026-08-31', '%Juan%', 'year', 'grade', 'section', 'late', 'qr_terminal']);
    expect(query.mock.calls[1]?.[1]).toEqual(['2026-08-01', '2026-08-31', '%Juan%', 'year', 'grade', 'section', 'late', 'qr_terminal', 10, 10]);
  });
});
