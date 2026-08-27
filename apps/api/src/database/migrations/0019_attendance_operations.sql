CREATE TABLE attendance_manual_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES attendance_terminals(id),
  client_event_id uuid NOT NULL,
  subject_type varchar(20) NOT NULL CHECK (subject_type IN ('student','employee')),
  student_id uuid REFERENCES students(id),
  employee_id uuid REFERENCES employees(id),
  captured_at timestamptz NOT NULL,
  direction varchar(20) NOT NULL CHECK (direction IN ('check_in','check_out')),
  capture_method varchar(30) NOT NULL DEFAULT 'manual_lookup' CHECK (capture_method = 'manual_lookup'),
  reason_code varchar(40) NOT NULL CHECK (reason_code IN ('forgotten_credential','lost_credential','damaged_credential','unreadable_credential','reader_failure','awaiting_credential','other')),
  reason_detail varchar(1000),
  requested_status varchar(30) NOT NULL CHECK (requested_status IN ('present','late')),
  requested_minutes_late integer NOT NULL DEFAULT 0 CHECK (requested_minutes_late >= 0),
  outcome varchar(20) NOT NULL CHECK (outcome IN ('accepted','rejected')),
  message varchar(300) NOT NULL,
  attendance_record_type varchar(20) CHECK (attendance_record_type IN ('student','employee')),
  attendance_record_id uuid,
  synchronization_state varchar(20) NOT NULL DEFAULT 'synchronized' CHECK (synchronization_state IN ('queued','synchronized','failed')),
  exception_status varchar(20) NOT NULL CHECK (exception_status IN ('open','resolved','dismissed')),
  resolution_notes varchar(1000),
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (terminal_id, client_event_id),
  CHECK ((subject_type='student' AND student_id IS NOT NULL AND employee_id IS NULL) OR (subject_type='employee' AND employee_id IS NOT NULL AND student_id IS NULL)),
  CHECK ((attendance_record_id IS NULL AND attendance_record_type IS NULL) OR attendance_record_type=subject_type),
  CHECK ((exception_status='open' AND resolved_by IS NULL AND resolved_at IS NULL) OR (exception_status<>'open' AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL))
);
CREATE INDEX attendance_manual_events_time_idx ON attendance_manual_events (captured_at DESC);
CREATE INDEX attendance_manual_events_exception_idx ON attendance_manual_events (exception_status, captured_at DESC);
CREATE INDEX attendance_manual_events_student_idx ON attendance_manual_events (student_id, captured_at DESC) WHERE student_id IS NOT NULL;
CREATE INDEX attendance_manual_events_employee_idx ON attendance_manual_events (employee_id, captured_at DESC) WHERE employee_id IS NOT NULL;

CREATE TABLE attendance_manual_event_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manual_event_id uuid NOT NULL REFERENCES attendance_manual_events(id),
  actor_user_id uuid NOT NULL REFERENCES users(id),
  action varchar(30) NOT NULL CHECK (action IN ('captured','resolved','dismissed')),
  notes varchar(1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX attendance_manual_history_event_idx ON attendance_manual_event_history (manual_event_id, created_at DESC);
CREATE TRIGGER attendance_manual_history_immutable BEFORE UPDATE OR DELETE ON attendance_manual_event_history FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
