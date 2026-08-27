CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id),
  school_year_id uuid NOT NULL REFERENCES school_years(id),
  grade_level_id uuid NOT NULL REFERENCES grade_levels(id),
  section_id uuid REFERENCES sections(id),
  status varchar(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','enrolled','completed','promoted','retained','transferred','withdrawn','cancelled')),
  enrollment_date date NOT NULL,
  completion_date date,
  completion_status varchar(30) CHECK (completion_status IS NULL OR completion_status IN ('completed','promoted','retained')),
  promoted_to_grade_level_id uuid REFERENCES grade_levels(id),
  transfer_withdrawal_date date,
  destination_school varchar(300),
  exit_reason varchar(1000),
  remarks varchar(3000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (student_id, school_year_id),
  CHECK (completion_date IS NULL OR completion_date >= enrollment_date),
  CHECK (transfer_withdrawal_date IS NULL OR transfer_withdrawal_date >= enrollment_date),
  CHECK (completion_status IS NULL OR completion_date IS NOT NULL),
  CHECK (promoted_to_grade_level_id IS NULL OR completion_status = 'promoted')
);

CREATE INDEX enrollments_student_history_idx ON enrollments (student_id, school_year_id);
CREATE INDEX enrollments_school_year_grade_idx ON enrollments (school_year_id, grade_level_id, status);
CREATE INDEX enrollments_section_idx ON enrollments (section_id) WHERE section_id IS NOT NULL;

CREATE OR REPLACE FUNCTION validate_enrollment_placement() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE student_school uuid; year_school uuid; grade_school uuid; section_year uuid; section_grade uuid;
BEGIN
  SELECT school_id INTO student_school FROM students WHERE id = NEW.student_id AND archived_at IS NULL;
  SELECT school_id INTO year_school FROM school_years WHERE id = NEW.school_year_id AND archived_at IS NULL;
  SELECT school_id INTO grade_school FROM grade_levels WHERE id = NEW.grade_level_id AND archived_at IS NULL AND active;
  IF student_school IS NULL OR year_school IS NULL OR grade_school IS NULL OR student_school <> year_school OR student_school <> grade_school THEN
    RAISE EXCEPTION 'Enrollment student, school year, and grade level must be active and belong to the same school' USING ERRCODE = '23514';
  END IF;
  IF NEW.section_id IS NOT NULL THEN
    SELECT school_year_id, grade_level_id INTO section_year, section_grade FROM sections WHERE id = NEW.section_id AND archived_at IS NULL AND active;
    IF section_year IS NULL OR section_year <> NEW.school_year_id OR section_grade <> NEW.grade_level_id THEN
      RAISE EXCEPTION 'Enrollment section must match the selected school year and grade level' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF NEW.promoted_to_grade_level_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM grade_levels WHERE id=NEW.promoted_to_grade_level_id AND school_id=student_school AND archived_at IS NULL) THEN
    RAISE EXCEPTION 'Promotion grade level must belong to the student school' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER enrollment_placement_integrity BEFORE INSERT OR UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION validate_enrollment_placement();
