DROP INDEX employee_attendance_daily_active_key;
DROP INDEX student_attendance_scope_active_key;

CREATE INDEX employee_attendance_person_day_idx
  ON employee_attendance_records(employee_id, attendance_date, time_in, created_at)
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX employee_attendance_open_session_key
  ON employee_attendance_records(employee_id, attendance_date)
  WHERE archived_at IS NULL AND time_in IS NOT NULL AND time_out IS NULL;

CREATE INDEX student_attendance_scope_day_idx
  ON student_attendance_records(enrollment_id, attendance_date, attendance_scope, teaching_assignment_id, time_in, created_at)
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX student_attendance_open_campus_session_key
  ON student_attendance_records(enrollment_id, attendance_date)
  WHERE archived_at IS NULL AND attendance_scope='campus' AND time_in IS NOT NULL AND time_out IS NULL;

ALTER TABLE attendance_terminal_events
  ADD COLUMN attendance_direction varchar(12),
  ADD CONSTRAINT attendance_terminal_events_direction_check
    CHECK (attendance_direction IN ('time_in','time_out'));

CREATE INDEX attendance_terminal_person_day_sequence_idx
  ON attendance_terminal_events(subject_type, subject_id, captured_at, processed_at, id)
  WHERE outcome='accepted' AND attendance_direction IS NOT NULL;
