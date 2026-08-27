import { afterEach, describe, expect, it, vi } from 'vitest';
import { pool } from '../database/pool.js';
import { gradingRepository } from './repository.js';

const userId = 'f273748e-790c-4593-8ced-550d1e36f72d';
const gradebookId = 'dcf3f4ab-7d43-40a4-8797-ac65cf7ec150';
const sectionId = 'e17836c3-7b73-4986-88fb-70a4adb88ae2';
const schoolYearId = '54328783-dbd4-4029-ad07-0af1dbab99bd';

afterEach(() => vi.restoreAllMocks());

describe('gradingRepository.detail', () => {
  it('returns actively enrolled section students even when no grade record exists', async () => {
    const query = vi.spyOn(pool, 'query')
      .mockResolvedValueOnce({ rows: [{ id: gradebookId, section_id: sectionId, school_year_id: schoolYearId, status: 'draft' }] } as never)
      .mockResolvedValueOnce({ rows: [{ enrollment_id: 'enrollment-1', student_id: 'student-1', id: null, student_number: 'MMSC-2026-100082', first_name: 'Helvic', middle_name: 'Palattao', last_name: 'Saringan', raw_score: null, final_grade: null, remarks: null, version: null }] } as never);

    const result = await gradingRepository.detail(userId, gradebookId);

    const authorizationSql = String(query.mock.calls[0]?.[0]);
    const rosterSql = String(query.mock.calls[1]?.[0]);
    expect(authorizationSql).toContain('ta.section_id');
    expect(authorizationSql).toContain('ca.school_year_id');
    expect(authorizationSql).toContain('e.user_id=$2');
    expect(rosterSql).toContain('FROM enrollments en');
    expect(rosterSql).toContain('LEFT JOIN student_grades');
    expect(rosterSql).toContain('en.section_id=$2');
    expect(rosterSql).toContain('en.school_year_id=$3');
    expect(query.mock.calls[1]?.[1]).toEqual([gradebookId, sectionId, schoolYearId]);
    expect(result.rows).toEqual([expect.objectContaining({ enrollmentId: 'enrollment-1', studentId: 'student-1', id: null, finalGrade: null })]);
  });

  it('rejects a gradebook outside the authenticated teacher assignment scope', async () => {
    vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [] } as never);
    await expect(gradingRepository.detail(userId, gradebookId)).rejects.toMatchObject({ status: 404, code: 'GRADEBOOK_NOT_FOUND' });
  });
});
