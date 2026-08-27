import { afterEach, describe, expect, it, vi } from 'vitest';
import { pool } from '../database/pool.js';
import { AttendanceRepository } from './repository.js';

afterEach(() => vi.restoreAllMocks());

describe('AttendanceRepository date filtering', () => {
  it('returns only employee attendance transactions in the selected period', async () => {
    const rows = [
      { id: 'time-in-only', attendance_date: '2026-08-24', time_in: '2026-08-24T07:00:00.000Z', time_out: null },
      { id: 'time-out-only', attendance_date: '2026-08-24', time_in: null, time_out: '2026-08-24T15:00:00.000Z' },
    ];
    const query = vi.spyOn(pool, 'query').mockResolvedValue({ rows } as never);

    const result = await new AttendanceRepository().list({ from: '2026-08-24', to: '2026-08-24', employeeId: 'employee', status: 'present' });

    const sql = String(query.mock.calls[0]?.[0]);
    expect(sql).toContain('FROM employee_attendance_records a JOIN employees e');
    expect(sql).toContain('a.attendance_date BETWEEN $1 AND $2');
    expect(sql).not.toContain('FROM employees e LEFT JOIN');
    expect(query.mock.calls[0]?.[1]).toEqual(['2026-08-24', '2026-08-24', 'employee', 'present']);
    expect(result).toEqual([
      expect.objectContaining({ id: 'time-in-only', timeIn: rows[0]?.time_in, timeOut: null }),
      expect.objectContaining({ id: 'time-out-only', timeIn: null, timeOut: rows[1]?.time_out }),
    ]);
  });
});
