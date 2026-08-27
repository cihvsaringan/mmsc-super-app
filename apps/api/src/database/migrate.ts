import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const directory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
if (process.argv.includes('--check')) {
  if (files.length === 0) throw new Error('No migration files found');
  for (const file of files) {
    const sql = await readFile(join(directory, file), 'utf8');
    if (!sql.trim()) throw new Error(`Empty migration: ${file}`);
  }
  console.log(`Validated ${files.length} migration file(s).`);
  process.exit(0);
}

const client = await pool.connect();
try {
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, executed_at timestamptz NOT NULL DEFAULT now())');
  for (const file of files) {
    const sql = await readFile(join(directory, file), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const existing = await client.query<{ checksum: string }>('SELECT checksum FROM schema_migrations WHERE name = $1', [file]);
    if (existing.rowCount) {
      if (existing.rows[0]?.checksum !== checksum) throw new Error(`Applied migration changed: ${file}`);
      continue;
    }
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [file, checksum]);
      await client.query('COMMIT');
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  client.release();
  await pool.end();
}
