import { describe, expect, it } from 'vitest';
import { assertStudentLifecycleResetAllowed, studentLifecycleResetConfirmation } from './student-lifecycle-reset-guard.js';

const local = { nodeEnv: 'development', databaseUrl: 'postgresql://mmsc:secret@localhost:15432/mmsc', confirmation: studentLifecycleResetConfirmation };

describe('student lifecycle reset safety', () => {
  it('allows only an explicitly confirmed local MMSC reset', () => expect(() => assertStudentLifecycleResetAllowed(local)).not.toThrow());
  it('refuses production even with confirmation', () => expect(() => assertStudentLifecycleResetAllowed({ ...local, nodeEnv: 'production' })).toThrow(/disabled in production/));
  it('refuses a remote or differently named database', () => expect(() => assertStudentLifecycleResetAllowed({ ...local, databaseUrl: 'postgresql://mmsc:secret@db.example.com/mmsc' })).toThrow(/local MMSC/));
  it('refuses a missing confirmation', () => expect(() => assertStudentLifecycleResetAllowed({ ...local, confirmation: undefined })).toThrow(/MMSC_STUDENT_LIFECYCLE_RESET/));
});
