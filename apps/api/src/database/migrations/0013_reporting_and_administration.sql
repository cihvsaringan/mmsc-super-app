CREATE TABLE application_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid REFERENCES schools(id),
  key varchar(160) NOT NULL CHECK(key ~ '^[a-z][a-z0-9_.]*$'), value jsonb NOT NULL,
  description varchar(1000), is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK(version>0)
);
CREATE UNIQUE INDEX application_settings_scope_key ON application_settings(COALESCE(school_id,'00000000-0000-0000-0000-000000000000'::uuid),key) WHERE archived_at IS NULL;
CREATE INDEX application_settings_school_idx ON application_settings(school_id,key) WHERE archived_at IS NULL;
