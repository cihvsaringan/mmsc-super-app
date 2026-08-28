CREATE TABLE registration_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year_id uuid NOT NULL UNIQUE REFERENCES school_years(id) ON DELETE RESTRICT,
  is_enabled boolean NOT NULL DEFAULT false,
  opened_at timestamptz,
  closed_at timestamptz,
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK ((is_enabled AND opened_at IS NOT NULL) OR NOT is_enabled)
);

CREATE UNIQUE INDEX registration_periods_one_enabled_key
  ON registration_periods ((is_enabled)) WHERE is_enabled;

CREATE INDEX registration_periods_school_year_idx
  ON registration_periods (school_year_id, updated_at DESC);

ALTER TABLE admission_documents
  ADD COLUMN IF NOT EXISTS removed_at timestamptz,
  ADD COLUMN IF NOT EXISTS removed_by uuid REFERENCES users(id);

CREATE INDEX admission_documents_active_application_idx
  ON admission_documents (application_id, created_at DESC) WHERE removed_at IS NULL;
