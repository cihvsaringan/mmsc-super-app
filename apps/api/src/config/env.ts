import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../../.env') });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(14000),
  API_HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url().default('postgresql://mmsc:mmsc_dev_password@localhost:15432/mmsc'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:15173'),
  MEDIA_STORAGE_PATH: z.string().default('./data/uploads'),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(12),
  SESSION_COOKIE_SECURE: z.string().default('false').transform((value) => value === 'true'),
  TRUST_PROXY: z.string().default('false').transform((value)=>value==='true'),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_USERNAME: z.string().regex(/^[a-z][a-z0-9._-]{2,79}$/).optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).optional(),
  BOOTSTRAP_ADMIN_NAME: z.string().min(1).max(160).default('MMSC Super Administrator'),
});

export const env = schema.parse(process.env);
