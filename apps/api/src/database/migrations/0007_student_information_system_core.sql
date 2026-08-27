CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id),
  user_id uuid UNIQUE REFERENCES users(id),
  student_number varchar(80) NOT NULL,
  learner_reference_number varchar(12) CHECK (learner_reference_number IS NULL OR learner_reference_number ~ '^[0-9]{12}$'),
  first_name varchar(120) NOT NULL,
  middle_name varchar(120),
  last_name varchar(120) NOT NULL,
  suffix varchar(40),
  preferred_name varchar(120),
  birth_date date NOT NULL,
  gender varchar(30) CHECK (gender IS NULL OR gender IN ('male','female','non_binary','prefer_not_to_say','unspecified')),
  personal_email varchar(320),
  mobile_phone varchar(50),
  telephone varchar(50),
  address_line1 varchar(200),
  address_line2 varchar(200),
  barangay varchar(120),
  city varchar(120),
  province varchar(120),
  postal_code varchar(20),
  country_code char(2) NOT NULL DEFAULT 'PH',
  profile_photo_url varchar(1000),
  enrollment_status varchar(30) NOT NULL DEFAULT 'prospective' CHECK (enrollment_status IN ('prospective','enrolled','not_enrolled','inactive','graduated','transferred','withdrawn')),
  entry_date date NOT NULL,
  previous_school varchar(300),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX students_school_number_active_key ON students (school_id,lower(student_number)) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX students_lrn_active_key ON students (learner_reference_number) WHERE learner_reference_number IS NOT NULL AND archived_at IS NULL;
CREATE INDEX students_name_idx ON students (school_id,lower(last_name),lower(first_name)) WHERE archived_at IS NULL;
CREATE INDEX students_status_idx ON students (school_id,enrollment_status) WHERE archived_at IS NULL;

CREATE TABLE guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id),
  user_id uuid UNIQUE REFERENCES users(id),
  first_name varchar(120) NOT NULL,
  middle_name varchar(120),
  last_name varchar(120) NOT NULL,
  suffix varchar(40),
  email varchar(320),
  mobile_phone varchar(50) NOT NULL,
  telephone varchar(50),
  address_line1 varchar(200),
  address_line2 varchar(200),
  barangay varchar(120),
  city varchar(120),
  province varchar(120),
  postal_code varchar(20),
  country_code char(2) NOT NULL DEFAULT 'PH',
  occupation varchar(160),
  employer varchar(200),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE INDEX guardians_name_idx ON guardians (school_id,lower(last_name),lower(first_name)) WHERE archived_at IS NULL;
CREATE INDEX guardians_phone_idx ON guardians (school_id,mobile_phone) WHERE archived_at IS NULL;
CREATE INDEX guardians_email_idx ON guardians (school_id,lower(email)) WHERE email IS NOT NULL AND archived_at IS NULL;

CREATE TABLE student_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id),
  guardian_id uuid NOT NULL REFERENCES guardians(id),
  relationship_type varchar(40) NOT NULL CHECK (relationship_type IN ('mother','father','guardian','legal_guardian','emergency_contact','authorized_pickup')),
  is_primary boolean NOT NULL DEFAULT false,
  has_legal_custody boolean NOT NULL DEFAULT false,
  receives_communications boolean NOT NULL DEFAULT true,
  notes varchar(1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX student_guardian_relationship_active_key ON student_guardians (student_id,guardian_id,relationship_type) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX student_primary_guardian_active_key ON student_guardians (student_id) WHERE is_primary AND archived_at IS NULL;
CREATE INDEX student_guardians_guardian_idx ON student_guardians (guardian_id) WHERE archived_at IS NULL;
