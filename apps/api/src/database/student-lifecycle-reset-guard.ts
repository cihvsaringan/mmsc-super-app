export const studentLifecycleResetConfirmation = 'RESET_LOCAL_STUDENT_LIFECYCLE';

export function assertStudentLifecycleResetAllowed(input: {
  nodeEnv: string;
  databaseUrl: string;
  confirmation: string | undefined;
}) {
  const database = new URL(input.databaseUrl);
  if (input.nodeEnv === 'production') {
    throw new Error('Student lifecycle reset is disabled in production');
  }
  if (!['localhost', '127.0.0.1', 'postgres'].includes(database.hostname) || database.pathname !== '/mmsc') {
    throw new Error('Student lifecycle reset is restricted to the local MMSC database');
  }
  if (input.confirmation !== studentLifecycleResetConfirmation) {
    throw new Error(`Set MMSC_STUDENT_LIFECYCLE_RESET=${studentLifecycleResetConfirmation} to authorize this destructive local reset`);
  }
}
