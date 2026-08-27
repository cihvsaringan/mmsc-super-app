CREATE TABLE teacher_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL UNIQUE REFERENCES employees(id),
  teacher_number varchar(80),
  faculty_status varchar(30) NOT NULL DEFAULT 'full_time' CHECK (faculty_status IN ('full_time','part_time','adjunct','substitute','inactive')),
  department_id uuid REFERENCES departments(id),
  teaching_level varchar(120),
  biography text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX teacher_profiles_number_active_key ON teacher_profiles (lower(teacher_number)) WHERE teacher_number IS NOT NULL AND archived_at IS NULL;
CREATE INDEX teacher_profiles_department_idx ON teacher_profiles (department_id) WHERE archived_at IS NULL;
CREATE INDEX teacher_profiles_status_idx ON teacher_profiles (faculty_status) WHERE archived_at IS NULL;

CREATE TABLE teacher_subject_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_profile_id uuid NOT NULL REFERENCES teacher_profiles(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  proficiency varchar(30) NOT NULL DEFAULT 'qualified' CHECK (proficiency IN ('qualified','advanced','specialist')),
  notes varchar(1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX teacher_subject_qualification_active_key ON teacher_subject_qualifications (teacher_profile_id, subject_id) WHERE archived_at IS NULL;
CREATE INDEX teacher_subject_qualification_subject_idx ON teacher_subject_qualifications (subject_id) WHERE archived_at IS NULL;

CREATE TABLE teacher_school_year_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_profile_id uuid NOT NULL REFERENCES teacher_profiles(id),
  school_year_id uuid NOT NULL REFERENCES school_years(id),
  department_id uuid REFERENCES departments(id),
  faculty_status varchar(30) NOT NULL CHECK (faculty_status IN ('full_time','part_time','adjunct','substitute','inactive')),
  teaching_level varchar(120),
  advisory_section_id uuid REFERENCES sections(id),
  homeroom_section_id uuid REFERENCES sections(id),
  maximum_load_units numeric(6,2) CHECK (maximum_load_units IS NULL OR maximum_load_units >= 0),
  notes varchar(1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX teacher_school_year_assignment_active_key ON teacher_school_year_assignments (teacher_profile_id, school_year_id) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX teacher_advisory_section_active_key ON teacher_school_year_assignments (school_year_id, advisory_section_id) WHERE advisory_section_id IS NOT NULL AND archived_at IS NULL;
CREATE UNIQUE INDEX teacher_homeroom_section_active_key ON teacher_school_year_assignments (school_year_id, homeroom_section_id) WHERE homeroom_section_id IS NOT NULL AND archived_at IS NULL;
CREATE INDEX teacher_school_year_assignment_year_idx ON teacher_school_year_assignments (school_year_id) WHERE archived_at IS NULL;
