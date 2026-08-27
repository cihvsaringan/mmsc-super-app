import { describe, expect, it } from 'vitest';
import type { CurrentUser } from './AuthContext';
import { availableExperiences, currentExperience, currentExperiencePath, homePath } from './experiences';

const user = (roles: string[], permissions: string[]): CurrentUser => ({ id: '1', email: '', username: 'person', loginIdentifier: 'person', displayName: 'Person', accountType: 'employee', mustChangePassword: false, roles, permissions });

describe('integrated experience resolution', () => {
  it('does not infer portal eligibility from a super administrator permission grant', () => {
    const result = availableExperiences(user(['super_administrator'], ['dashboard.view', 'teacher.portal.access', 'student.portal.access', 'parent.portal.access']));
    expect(result.map((item) => item.key)).toEqual(['administration']);
    expect(homePath(user(['super_administrator'], ['dashboard.view']))).toBe('/');
  });

  it('offers both valid shells to a staff member who is also a teacher', () => {
    const result = availableExperiences(user(['school_administrator', 'teacher'], ['dashboard.view', 'teacher.portal.access']));
    expect(result.map((item) => item.path)).toEqual(['/', '/teacher']);
    expect(currentExperiencePath('/teacher/grades', result)).toBe('/teacher');
  });

  it('separates employee assignment from explicit Administration access',()=>{
    expect(availableExperiences(user(['teacher'],['teacher.portal.access'])).map(item=>item.key)).toEqual(['teacher']);
    expect(availableExperiences(user(['teacher'],['teacher.portal.access','dashboard.view','notification.inbox.access','calendar.experience.access'])).map(item=>item.key)).toEqual(['teacher']);
    expect(availableExperiences(user(['principal','teacher'],['teacher.portal.access'])).map(item=>item.key)).toEqual(['administration','teacher']);
  });

  it('routes portal accounts while keeping the standalone terminal outside this registry', () => {
    expect(homePath(user(['teacher'], ['teacher.portal.access']))).toBe('/teacher');
    expect(homePath(user(['student'], ['student.portal.access']))).toBe('/student');
    expect(homePath(user(['parent_guardian'], ['parent.portal.access']))).toBe('/parent');
    expect(availableExperiences(user(['attendance_operator'], ['attendance.terminal.operate']))).toEqual([]);
    expect(homePath(user(['attendance_operator'], ['attendance.terminal.operate']))).toBe('/access-denied');
  });

  it('preserves the established Administration landing priority',()=>{
    expect(homePath(user(['hr_staff'],['dashboard.view','employee.view']))).toBe('/');
    expect(homePath(user(['teacher','student'],['teacher.portal.access','student.portal.access']))).toBe('/teacher');
    expect(homePath(user(['school_administrator','teacher'],['dashboard.view','teacher.portal.access']))).toBe('/');
  });

  it('uses the Clinic portal permission without a second application assignment',()=>{
    expect(homePath(user(['clinic_staff'],['clinic.portal.access']))).toBe('/clinic/dashboard');
    expect(availableExperiences(user(['clinic_staff'],['clinic.encounter.manage']))).toEqual([]);
  });

  it('shows Clinic beside Administration when RBAC grants both experiences',()=>{
    const both=availableExperiences(user(['school_administrator','clinic_staff'],['clinic.portal.access']));
    expect(both.map(item=>item.label)).toEqual(['Administration','Clinic']);
    expect(availableExperiences(user(['school_administrator','clinic_staff'],[])).map(item=>item.key)).toEqual(['administration']);
  });

  it('derives the active Clinic workspace from every Clinic route rather than permission order',()=>{
    const both=availableExperiences(user(['school_administrator','clinic_staff'],['clinic.portal.access']));
    for(const path of ['/clinic/dashboard','/clinic/students','/clinic/visits','/clinic/health-records','/clinic/inventory','/clinic/appointments','/clinic/follow-ups','/clinic/reports'])expect(currentExperience(path,both)?.key).toBe('clinic');
    expect(currentExperience('/students',both)?.key).toBe('administration');
  });

  it('discovers Library through centralized RBAC and preserves it across every Library route',()=>{
    expect(homePath(user(['librarian'],['library.portal.access']))).toBe('/library/dashboard');
    expect(availableExperiences(user(['librarian'],['library.dashboard.view']))).toEqual([]);
    const both=availableExperiences(user(['school_administrator','librarian'],['library.portal.access']));
    expect(both.map(item=>item.label)).toEqual(['Administration','Library']);
    for(const path of ['/library/dashboard','/library/checkout','/library/check-in','/library/catalog','/library/patrons','/library/visitors','/library/overdue','/library/reports','/library/settings'])expect(currentExperience(path,both)?.key).toBe('library');
  });

  it('discovers Computer Laboratory through RBAC and preserves its route namespace',()=>{
    expect(homePath(user(['computer_lab_staff'],['computer_lab.access','computer_lab.labs.view']))).toBe('/computer-lab/laboratories');
    expect(availableExperiences(user(['computer_lab_staff'],['computer_lab.labs.view']))).toEqual([]);
    const both=availableExperiences(user(['school_administrator','computer_lab_staff'],['computer_lab.access','computer_lab.dashboard.view']));
    expect(both.map(item=>item.label)).toEqual(['Administration','Computer Laboratory']);
    for(const path of ['/computer-lab/dashboard','/computer-lab/laboratories','/computer-lab/workstations','/computer-lab/schedule','/computer-lab/sessions','/computer-lab/issues','/computer-lab/equipment','/computer-lab/software','/computer-lab/reports'])expect(currentExperience(path,both)?.key).toBe('computer-lab');
  });

  it('selects an authorized Computer Laboratory landing without falling back to the default portal',()=>{
    const legacy=availableExperiences(user(['school_administrator','computer_lab_staff'],['computer_lab.access','computer_lab.labs.view','computer_lab.workstations.view']));
    expect(legacy.find(item=>item.key==='computer-lab')?.path).toBe('/computer-lab/laboratories');
    expect(currentExperience('/computer-lab/workstations',legacy)?.key).toBe('computer-lab');
    const complete=availableExperiences(user(['school_administrator','computer_lab_administrator'],['computer_lab.access','computer_lab.dashboard.view']));
    expect(complete.find(item=>item.key==='computer-lab')?.path).toBe('/computer-lab/dashboard');
  });
});
