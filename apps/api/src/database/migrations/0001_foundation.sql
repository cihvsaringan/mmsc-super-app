CREATE TABLE IF NOT EXISTS app_metadata (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seed_executions (
  name text PRIMARY KEY,
  executed_at timestamptz NOT NULL DEFAULT now()
);
