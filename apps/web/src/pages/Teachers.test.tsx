import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ has: () => true }) }));
import { Teachers } from './Teachers';

const teacher = { id: 'teacher', employeeId: 'employee', employeeNumber: 'MMSC-EMP-1', firstName: 'Maria', lastName: 'Santos', facultyStatus: 'full_time', employmentStatus: 'active', version: 1, classCount: 1, sectionCount: 1, subjectCount: 1, portalStatus: 'active' };
const context = { departments: [], schoolYears: [], sections: [], gradeLevels: [], subjects: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Mathematics', code: 'MATH' }] };
const detail = (qualified = false) => ({ profile: teacher, qualifications: qualified ? [{ id: 'qualification', subjectId: context.subjects[0].id, subjectCode: 'MATH', subjectName: 'Mathematics', proficiency: 'qualified' }] : [], yearAssignments: [], teachingAssignments: [], history: [] });

function response(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

function mockRequests(mode: 'success' | 'create-failure' | 'refresh-failure') {
  let detailReads = 0;
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/teachers/context')) return response(context);
    if (url.includes('/teachers?')) return response({ items: [teacher], total: 1 });
    if (url.endsWith('/teachers/teacher/qualifications') && init?.method === 'POST') {
      if (mode === 'create-failure') return response({ error: { code: 'QUALIFICATION_EXISTS', message: 'This Teacher is already qualified for the selected Subject' } }, false, 409);
      return response({ item: { id: 'qualification' } }, true, 201);
    }
    if (url.endsWith('/teachers/teacher')) {
      detailReads += 1;
      if (mode === 'refresh-failure' && detailReads > 1) return response({ error: { code: 'INTERNAL_ERROR', message: 'Unable to load detail' } }, false, 500);
      return response(detail(detailReads > 1));
    }
    throw new Error(`Unexpected request: ${url}`);
  }));
}

async function openQualifications() {
  render(<Teachers />);
  fireEvent.click(await screen.findByRole('button', { name: /view maria santos/i }));
  fireEvent.click(await screen.findByRole('button', { name: 'Qualifications' }));
}

function qualificationControls() {
  const button = screen.getByRole('button', { name: 'Add Qualification' });
  const form = button.closest('form');
  if (!form) throw new Error('Qualification form was not rendered');
  const subject = form.querySelector<HTMLSelectElement>('select[name="subjectId"]');
  if (!subject) throw new Error('Subject selector was not rendered');
  return { button, subject };
}

describe('Teacher qualification workflow', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('recognizes 201 creation, refreshes the list, resets the form, and reports success', async () => {
    mockRequests('success');
    await openQualifications();
    const { button, subject } = qualificationControls();
    fireEvent.change(subject, { target: { value: context.subjects[0].id } });
    fireEvent.click(button);
    expect(await screen.findByText('Qualification added successfully.')).toBeInTheDocument();
    expect(await screen.findByText('MATH · Mathematics')).toBeInTheDocument();
    expect(subject).toHaveValue('');
    expect(screen.queryByText('Unable to add qualification')).not.toBeInTheDocument();
  });

  it('shows the API error and retains form data when creation fails', async () => {
    mockRequests('create-failure');
    await openQualifications();
    const { button, subject } = qualificationControls();
    fireEvent.change(subject, { target: { value: context.subjects[0].id } });
    fireEvent.click(button);
    expect(await screen.findByText('This Teacher is already qualified for the selected Subject')).toBeInTheDocument();
    expect(subject).toHaveValue(context.subjects[0].id);
    expect(screen.queryByText('Qualification added successfully.')).not.toBeInTheDocument();
  });

  it('does not misreport a successful creation when only the detail refresh fails', async () => {
    mockRequests('refresh-failure');
    await openQualifications();
    const { button, subject } = qualificationControls();
    fireEvent.change(subject, { target: { value: context.subjects[0].id } });
    fireEvent.click(button);
    expect(await screen.findByText('Qualification added successfully.')).toBeInTheDocument();
    expect(await screen.findByText(/Qualification was added, but the updated list could not be loaded/)).toBeInTheDocument();
    await waitFor(() => expect(subject).toHaveValue(''));
  });
});
