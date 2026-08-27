CREATE TABLE student_attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), enrollment_id uuid NOT NULL REFERENCES enrollments(id),
  attendance_date date NOT NULL, attendance_scope varchar(20) NOT NULL DEFAULT 'campus' CHECK(attendance_scope IN ('campus','class')),
  teaching_assignment_id uuid REFERENCES teaching_assignments(id), time_in timestamptz, time_out timestamptz,
  status varchar(30) NOT NULL CHECK(status IN ('present','late','absent','half_day','excused','on_leave','holiday','rest_day')),
  source varchar(30) NOT NULL CHECK(source IN ('manual','qr_terminal','rfid_terminal','administrative_correction','imported')),
  external_event_id varchar(200), minutes_late integer NOT NULL DEFAULT 0 CHECK(minutes_late>=0), notes varchar(1000),
  created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz, version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(time_out IS NULL OR time_in IS NULL OR time_out>=time_in),
  CHECK((attendance_scope='campus' AND teaching_assignment_id IS NULL) OR (attendance_scope='class' AND teaching_assignment_id IS NOT NULL))
);
CREATE UNIQUE INDEX student_attendance_scope_active_key ON student_attendance_records(enrollment_id,attendance_date,attendance_scope,COALESCE(teaching_assignment_id,'00000000-0000-0000-0000-000000000000'::uuid)) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX student_attendance_external_event_key ON student_attendance_records(source,external_event_id) WHERE external_event_id IS NOT NULL;
CREATE INDEX student_attendance_date_idx ON student_attendance_records(attendance_date,status) WHERE archived_at IS NULL;
CREATE INDEX student_attendance_enrollment_idx ON student_attendance_records(enrollment_id,attendance_date DESC) WHERE archived_at IS NULL;

CREATE TABLE student_attendance_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), attendance_record_id uuid NOT NULL REFERENCES student_attendance_records(id),
  adjusted_by uuid NOT NULL REFERENCES users(id), reason varchar(1000) NOT NULL, before_value jsonb NOT NULL, after_value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX student_attendance_adjustment_record_idx ON student_attendance_adjustments(attendance_record_id,created_at DESC);
CREATE OR REPLACE FUNCTION prevent_student_attendance_adjustment_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'student attendance adjustments are immutable'; END $$;
CREATE TRIGGER student_attendance_adjustments_immutable BEFORE UPDATE OR DELETE ON student_attendance_adjustments FOR EACH ROW EXECUTE FUNCTION prevent_student_attendance_adjustment_mutation();

CREATE OR REPLACE FUNCTION validate_student_attendance_scope() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE enrollment_year uuid; enrollment_section uuid; assignment_year uuid; assignment_section uuid;
BEGIN
  SELECT school_year_id,section_id INTO enrollment_year,enrollment_section FROM enrollments WHERE id=NEW.enrollment_id AND status NOT IN ('cancelled','withdrawn');
  IF enrollment_year IS NULL THEN RAISE EXCEPTION 'Student attendance requires a valid enrollment' USING ERRCODE='23514'; END IF;
  IF NEW.attendance_scope='class' THEN
    SELECT c.school_year_id,a.section_id INTO assignment_year,assignment_section FROM teaching_assignments a JOIN subject_grade_level_assignments c ON c.id=a.subject_grade_level_assignment_id WHERE a.id=NEW.teaching_assignment_id AND a.archived_at IS NULL AND c.archived_at IS NULL;
    IF assignment_year IS NULL OR assignment_year<>enrollment_year OR enrollment_section IS NULL OR assignment_section<>enrollment_section THEN RAISE EXCEPTION 'Class attendance assignment must match enrollment year and section' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER student_attendance_scope_integrity BEFORE INSERT OR UPDATE ON student_attendance_records FOR EACH ROW EXECUTE FUNCTION validate_student_attendance_scope();
