CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL CHECK (code ~ '^[A-Z][A-Z0-9_-]*$'),
  name text NOT NULL,
  legal_name text,
  email text,
  phone text,
  address_line text,
  city text,
  province text,
  country_code char(2) NOT NULL DEFAULT 'PH',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz, version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX schools_code_active_unique ON schools (code) WHERE archived_at IS NULL;

CREATE TABLE campuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  code text NOT NULL CHECK (code ~ '^[A-Z][A-Z0-9_-]*$'), name text NOT NULL,
  address_line text, city text, province text, phone text, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX campuses_code_school_unique ON campuses (school_id, code) WHERE archived_at IS NULL;

CREATE TABLE school_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  name text NOT NULL, starts_on date NOT NULL, ends_on date NOT NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','closed')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0), CHECK (ends_on > starts_on)
);
CREATE UNIQUE INDEX school_years_name_school_unique ON school_years (school_id, name) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX school_years_one_active_per_school ON school_years (school_id) WHERE status = 'active' AND archived_at IS NULL;
CREATE INDEX school_years_dates_idx ON school_years (starts_on, ends_on);

CREATE TABLE academic_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_year_id uuid NOT NULL REFERENCES school_years(id) ON DELETE RESTRICT,
  code text NOT NULL, name text NOT NULL, sequence integer NOT NULL CHECK (sequence > 0),
  starts_on date NOT NULL, ends_on date NOT NULL, status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','closed')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0), CHECK (ends_on >= starts_on)
);
CREATE UNIQUE INDEX academic_terms_code_year_unique ON academic_terms (school_year_id, code) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX academic_terms_sequence_year_unique ON academic_terms (school_year_id, sequence) WHERE archived_at IS NULL;

CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  campus_id uuid REFERENCES campuses(id) ON DELETE RESTRICT, code text NOT NULL, name text NOT NULL,
  category text NOT NULL DEFAULT 'academic' CHECK (category IN ('academic','administrative','support')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX departments_code_school_unique ON departments (school_id, code) WHERE archived_at IS NULL;

CREATE TABLE grade_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  code text NOT NULL, name text NOT NULL, sequence integer NOT NULL CHECK (sequence > 0), education_stage text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX grade_levels_code_school_unique ON grade_levels (school_id, code) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX grade_levels_sequence_school_unique ON grade_levels (school_id, sequence) WHERE archived_at IS NULL;

CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  department_id uuid REFERENCES departments(id) ON DELETE RESTRICT, code text NOT NULL, name text NOT NULL,
  description text, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX subjects_code_school_unique ON subjects (school_id, code) WHERE archived_at IS NULL;

CREATE TABLE classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), campus_id uuid NOT NULL REFERENCES campuses(id) ON DELETE RESTRICT,
  code text NOT NULL, name text NOT NULL, building text, floor text, capacity integer CHECK (capacity IS NULL OR capacity > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX classrooms_code_campus_unique ON classrooms (campus_id, code) WHERE archived_at IS NULL;

CREATE TABLE sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_year_id uuid NOT NULL REFERENCES school_years(id) ON DELETE RESTRICT,
  grade_level_id uuid NOT NULL REFERENCES grade_levels(id) ON DELETE RESTRICT,
  campus_id uuid NOT NULL REFERENCES campuses(id) ON DELETE RESTRICT,
  code text NOT NULL, name text NOT NULL, capacity integer CHECK (capacity IS NULL OR capacity > 0), active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX sections_code_year_unique ON sections (school_year_id, code) WHERE archived_at IS NULL;
CREATE INDEX sections_grade_year_idx ON sections (school_year_id, grade_level_id);

CREATE TABLE academic_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  entity_type text NOT NULL CHECK (entity_type IN ('student','enrollment','term','section')),
  code text NOT NULL, label text NOT NULL, display_order integer NOT NULL DEFAULT 1 CHECK (display_order > 0),
  is_terminal boolean NOT NULL DEFAULT false, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX academic_statuses_code_unique ON academic_statuses (school_id, entity_type, code) WHERE archived_at IS NULL;

CREATE TABLE calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  campus_id uuid REFERENCES campuses(id) ON DELETE RESTRICT, school_year_id uuid REFERENCES school_years(id) ON DELETE RESTRICT,
  academic_term_id uuid REFERENCES academic_terms(id) ON DELETE RESTRICT,
  title text NOT NULL, event_type text NOT NULL CHECK (event_type IN ('academic','holiday','administrative','community','other')),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, all_day boolean NOT NULL DEFAULT false,
  location text, description text, status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','published','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0), CHECK (ends_at >= starts_at)
);
CREATE INDEX calendar_events_school_dates_idx ON calendar_events (school_id, starts_at, ends_at) WHERE archived_at IS NULL;
CREATE INDEX calendar_events_year_idx ON calendar_events (school_year_id) WHERE archived_at IS NULL;
