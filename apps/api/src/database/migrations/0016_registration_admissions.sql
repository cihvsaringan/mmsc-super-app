CREATE SEQUENCE admission_application_number_seq START 1;

CREATE TABLE admission_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number varchar(40) NOT NULL UNIQUE DEFAULT ('ADM-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('admission_application_number_seq')::text,6,'0')),
  school_id uuid NOT NULL REFERENCES schools(id),
  application_type varchar(20) NOT NULL CHECK (application_type IN ('new_student','returning_student')),
  existing_student_id uuid REFERENCES students(id),
  school_year_id uuid NOT NULL REFERENCES school_years(id),
  grade_level_id uuid NOT NULL REFERENCES grade_levels(id),
  section_id uuid REFERENCES sections(id),
  status varchar(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','information_requested','approved','rejected','converted','withdrawn')),
  first_name varchar(120) NOT NULL,
  middle_name varchar(120),
  last_name varchar(120) NOT NULL,
  suffix varchar(40),
  preferred_name varchar(120),
  birth_date date NOT NULL,
  gender varchar(30) CHECK (gender IS NULL OR gender IN ('male','female','non_binary','prefer_not_to_say','unspecified')),
  learner_reference_number varchar(12) CHECK (learner_reference_number IS NULL OR learner_reference_number ~ '^[0-9]{12}$'),
  personal_email varchar(320),
  mobile_phone varchar(50),
  address_line1 varchar(200),
  barangay varchar(120),
  city varchar(120),
  province varchar(120),
  postal_code varchar(20),
  previous_school varchar(300),
  applicant_notes text,
  registrar_notes text,
  information_request text,
  decision_reason text,
  submitted_at timestamptz,
  decided_at timestamptz,
  converted_at timestamptz,
  converted_student_id uuid REFERENCES students(id),
  converted_enrollment_id uuid REFERENCES enrollments(id),
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK ((application_type='returning_student' AND existing_student_id IS NOT NULL) OR application_type='new_student'),
  CHECK ((status='converted' AND converted_student_id IS NOT NULL AND converted_enrollment_id IS NOT NULL AND converted_at IS NOT NULL) OR status<>'converted')
);
CREATE INDEX admission_applications_queue_idx ON admission_applications(status,updated_at DESC) WHERE archived_at IS NULL;
CREATE INDEX admission_applications_name_idx ON admission_applications(lower(last_name),lower(first_name),birth_date) WHERE archived_at IS NULL;
CREATE INDEX admission_applications_year_grade_idx ON admission_applications(school_year_id,grade_level_id,status) WHERE archived_at IS NULL;

CREATE TABLE admission_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES admission_applications(id),
  first_name varchar(120) NOT NULL,
  middle_name varchar(120),
  last_name varchar(120) NOT NULL,
  suffix varchar(40),
  relationship_type varchar(40) NOT NULL CHECK (relationship_type IN ('mother','father','guardian','legal_guardian','emergency_contact')),
  email varchar(320),
  mobile_phone varchar(50) NOT NULL,
  occupation varchar(160),
  employer varchar(200),
  is_primary boolean NOT NULL DEFAULT true,
  receives_communications boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX admission_primary_guardian_key ON admission_guardians(application_id) WHERE is_primary;
CREATE INDEX admission_guardian_lookup_idx ON admission_guardians(lower(last_name),mobile_phone);

CREATE TABLE admission_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES admission_applications(id),
  document_type varchar(60) NOT NULL,
  display_name varchar(200) NOT NULL,
  media_asset_id uuid REFERENCES media_assets(id),
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','received','verified','rejected')),
  notes varchar(1000),
  verified_by uuid REFERENCES users(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admission_documents_application_idx ON admission_documents(application_id);

CREATE TABLE admission_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES admission_applications(id),
  from_status varchar(30),
  to_status varchar(30) NOT NULL,
  reason text,
  actor_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admission_history_application_idx ON admission_status_history(application_id,created_at DESC);
CREATE TRIGGER admission_status_history_immutable BEFORE UPDATE OR DELETE ON admission_status_history FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

CREATE OR REPLACE FUNCTION validate_admission_placement() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE year_school uuid; grade_school uuid; section_year uuid; section_grade uuid; student_school uuid;
BEGIN
  SELECT school_id INTO year_school FROM school_years WHERE id=NEW.school_year_id AND archived_at IS NULL;
  SELECT school_id INTO grade_school FROM grade_levels WHERE id=NEW.grade_level_id AND archived_at IS NULL AND active;
  IF year_school IS NULL OR grade_school IS NULL OR NEW.school_id<>year_school OR NEW.school_id<>grade_school THEN
    RAISE EXCEPTION 'Application school, school year, and grade level must match' USING ERRCODE='23514';
  END IF;
  IF NEW.section_id IS NOT NULL THEN
    SELECT school_year_id,grade_level_id INTO section_year,section_grade FROM sections WHERE id=NEW.section_id AND archived_at IS NULL AND active;
    IF section_year IS NULL OR section_year<>NEW.school_year_id OR section_grade<>NEW.grade_level_id THEN RAISE EXCEPTION 'Application section must match year and grade' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.existing_student_id IS NOT NULL THEN
    SELECT school_id INTO student_school FROM students WHERE id=NEW.existing_student_id AND archived_at IS NULL;
    IF student_school IS NULL OR student_school<>NEW.school_id THEN RAISE EXCEPTION 'Existing student must belong to the application school' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER admission_placement_integrity BEFORE INSERT OR UPDATE ON admission_applications FOR EACH ROW EXECUTE FUNCTION validate_admission_placement();
