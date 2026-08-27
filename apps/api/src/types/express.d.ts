declare global {
  namespace Express {
    interface Request {
      id: string;
      auth: {
        userId: string | null;
        authenticated: boolean;
        sessionId: string | null;
        email: string | null;
        username?: string | null;
        loginIdentifier?: string | null;
        displayName: string | null;
        accountType?: 'system'|'employee'|'student'|'guardian'|null;
        mustChangePassword?: boolean;
        roles: string[];
        permissions: string[];
        installationId?: string | null;
        deviceId?: string | null;
        terminalId?: string | null;
      };
    }
  }
}
export {};
