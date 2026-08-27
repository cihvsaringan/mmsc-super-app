import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

describe('MMSC application shell', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: unknown) => {
      const body = String(input).endsWith('/auth/me')
        ? { user: { id: '1', email: 'admin@mmsc.test', displayName: 'School Admin', roles: ['super_administrator'], permissions: ['dashboard.view', 'security.user.view', 'academic.config.view', 'employee.view', 'teacher.profile.view', 'student.profile.view', 'reference.external_school.view'] } }
        : {
            asOf: '2026-08-20T00:00:00.000Z',
            schoolYear:{id:'year',name:'2026–2027',startsOn:'2026-06-01',endsOn:'2027-03-31'},
            access:{students:true,studentAttendance:false,employees:false,teachers:false,admissions:false,enrollments:false,attendanceExceptions:false,gradeReview:false},
            students:{byGrade:[],bySection:[]},
          };

      return { ok: true, status: 200, json: async () => body };
    }));
  });

  it('shows authenticated navigation according to permissions', async () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(await screen.findByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /security/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /academics/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /workforce/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /teachers/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /students/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /external schools/i })).toBeInTheDocument();
    expect(screen.getByRole('button',{name:/school management/i})).toHaveAttribute('aria-expanded','true');
    expect(screen.getByRole('button',{name:/people & workforce/i})).toHaveAttribute('aria-expanded','true');
    expect(screen.queryByRole('button',{name:/attendance operations/i})).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/current workspace/i)).not.toBeInTheDocument();
    expect(await screen.findByRole('tab',{name:'Students'})).toHaveAttribute('aria-selected','true');
  });
});
