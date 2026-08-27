ALTER TABLE attendance_terminals
  ADD COLUMN campus_id uuid REFERENCES campuses(id) ON DELETE RESTRICT,
  ADD COLUMN description varchar(500),
  ADD COLUMN last_sync_at timestamptz;

CREATE INDEX attendance_terminals_campus_idx ON attendance_terminals(campus_id);

CREATE TABLE attendance_terminal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES attendance_terminals(id) ON DELETE RESTRICT,
  operator_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  device_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  status varchar(20) NOT NULL DEFAULT 'active' CHECK(status IN('active','ended')),
  CHECK((status='active' AND ended_at IS NULL) OR (status='ended' AND ended_at IS NOT NULL))
);

CREATE INDEX attendance_terminal_sessions_terminal_idx ON attendance_terminal_sessions(terminal_id,started_at DESC);
CREATE INDEX attendance_terminal_sessions_operator_idx ON attendance_terminal_sessions(operator_user_id,started_at DESC);
CREATE UNIQUE INDEX attendance_terminal_sessions_active_device_key
  ON attendance_terminal_sessions(operator_user_id,device_id) WHERE status='active';

ALTER TABLE attendance_terminal_events
  ADD COLUMN terminal_session_id uuid REFERENCES attendance_terminal_sessions(id) ON DELETE RESTRICT;

CREATE INDEX attendance_terminal_events_session_idx ON attendance_terminal_events(terminal_session_id);
