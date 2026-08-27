CREATE TABLE subject_grade_level_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year_id uuid NOT NULL REFERENCES school_years(id),
  grade_level_id uuid NOT NULL REFERENCES grade_levels(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  academic_term_id uuid REFERENCES academic_terms(id),
  load_units numeric(6,2) NOT NULL DEFAULT 1 CHECK (load_units > 0),
  required boolean NOT NULL DEFAULT true,
  notes varchar(1000),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz, version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX subject_grade_assignment_active_key ON subject_grade_level_assignments
  (school_year_id, grade_level_id, subject_id, COALESCE(academic_term_id, '00000000-0000-0000-0000-000000000000'::uuid)) WHERE archived_at IS NULL;
CREATE INDEX subject_grade_assignment_year_idx ON subject_grade_level_assignments (school_year_id, grade_level_id) WHERE archived_at IS NULL;

CREATE TABLE teaching_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_grade_level_assignment_id uuid NOT NULL REFERENCES subject_grade_level_assignments(id),
  section_id uuid NOT NULL REFERENCES sections(id),
  teacher_school_year_assignment_id uuid NOT NULL REFERENCES teacher_school_year_assignments(id),
  role varchar(30) NOT NULL DEFAULT 'primary' CHECK (role IN ('primary','assistant','substitute')),
  notes varchar(1000),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz, version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX teaching_assignment_active_key ON teaching_assignments
  (subject_grade_level_assignment_id, section_id, teacher_school_year_assignment_id, role) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX teaching_assignment_primary_active_key ON teaching_assignments
  (subject_grade_level_assignment_id, section_id) WHERE role = 'primary' AND archived_at IS NULL;
CREATE INDEX teaching_assignment_teacher_idx ON teaching_assignments (teacher_school_year_assignment_id) WHERE archived_at IS NULL;
CREATE INDEX teaching_assignment_section_idx ON teaching_assignments (section_id) WHERE archived_at IS NULL;
