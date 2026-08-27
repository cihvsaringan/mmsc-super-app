export const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:14000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details: ApiErrorDetail[] = []) { super(message); }
}

export type ApiErrorDetail = { path?: PropertyKey[]; message?: string };

export function apiErrorMessage(cause: unknown, fallback: string) {
  if (!(cause instanceof ApiError)) return fallback;
  const issues = cause.details.map((detail) => {
    const field = detail.path?.length ? String(detail.path.at(-1)).replace(/([A-Z])/g, ' $1').toLowerCase() : '';
    return [field, detail.message].filter(Boolean).join(': ');
  }).filter(Boolean);
  return issues.length ? `${cause.message}. ${issues.join('; ')}` : cause.message;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm=init.body instanceof FormData;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: { ...(isForm?{}:{'content-type':'application/json'}), ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: { code: 'REQUEST_FAILED', message: 'Request failed' } })) as { error?: { code?: string; message?: string; details?: ApiErrorDetail[] } };
    throw new ApiError(response.status, body.error?.code ?? 'REQUEST_FAILED', body.error?.message ?? 'Request failed', body.error?.details ?? []);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
