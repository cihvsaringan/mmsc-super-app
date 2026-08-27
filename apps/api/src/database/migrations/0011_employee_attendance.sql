CREATE TABLE employee_attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL REFERENCES employees(id),
  attendance_date date NOT NULL, time_in timestamptz, time_out timestamptz,
  status varchar(30) NOT NULL CHECK(status IN ('present','late','absent','half_day','on_leave','holiday','rest_day')),
  source varchar(30) NOT NULL CHECK(source IN ('manual','qr_terminal','rfid_terminal','administrative_correction','imported')),
  external_event_id varchar(200), minutes_late integer NOT NULL DEFAULT 0 CHECK(minutes_late>=0),
  notes varchar(1000), created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz, version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(time_out IS NULL OR time_in IS NULL OR time_out>=time_in)
);
CREATE UNIQUE INDEX employee_attendance_daily_active_key ON employee_attendance_records(employee_id,attendance_date) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX employee_attendance_external_event_key ON employee_attendance_records(source,external_event_id) WHERE external_event_id IS NOT NULL;
CREATE INDEX employee_attendance_date_idx ON employee_attendance_records(attendance_date,status) WHERE archived_at IS NULL;

CREATE TABLE employee_attendance_correction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), attendance_record_id uuid NOT NULL REFERENCES employee_attendance_records(id),
  requested_by uuid NOT NULL REFERENCES users(id), requested_time_in timestamptz, requested_time_out timestamptz,
  requested_status varchar(30) NOT NULL CHECK(requested_status IN ('present','late','absent','half_day','on_leave','holiday','rest_day')),
  reason varchar(1000) NOT NULL, status varchar(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
  reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz, review_notes varchar(1000),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(requested_time_out IS NULL OR requested_time_in IS NULL OR requested_time_out>=requested_time_in)
);
CREATE INDEX employee_attendance_correction_status_idx ON employee_attendance_correction_requests(status,created_at);

CREATE TABLE employee_attendance_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), attendance_record_id uuid NOT NULL REFERENCES employee_attendance_records(id),
  correction_request_id uuid REFERENCES employee_attendance_correction_requests(id), adjusted_by uuid NOT NULL REFERENCES users(id),
  reason varchar(1000) NOT NULL, before_value jsonb NOT NULL, after_value jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX employee_attendance_adjustment_record_idx ON employee_attendance_adjustments(attendance_record_id,created_at DESC);
CREATE OR REPLACE FUNCTION prevent_attendance_adjustment_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'attendance adjustments are immutable'; END $$;
CREATE TRIGGER employee_attendance_adjustments_immutable BEFORE UPDATE OR DELETE ON employee_attendance_adjustments FOR EACH ROW EXECUTE FUNCTION prevent_attendance_adjustment_mutation();
