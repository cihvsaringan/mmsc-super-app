CREATE TABLE computer_lab_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
 laboratory_id uuid NOT NULL REFERENCES computer_laboratories(id) ON DELETE RESTRICT,
 workstation_id uuid NOT NULL REFERENCES computer_lab_workstations(id) ON DELETE RESTRICT,
 session_type varchar(30) NOT NULL CHECK(session_type IN('scheduled','walk_in','special_event')),
 schedule_id uuid REFERENCES computer_lab_schedules(id) ON DELETE RESTRICT,
 purpose varchar(40) CHECK(purpose IN('research','assignment','project','programming_practice','printing','schoolwork','other')),
 purpose_notes text,
 started_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz,
 expected_end_at timestamptz,
 authorized_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 status varchar(20) NOT NULL DEFAULT 'active' CHECK(status IN('active','completed','cancelled')),
 cancellation_reason text, override_reason text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), cancelled_at timestamptz,
 CHECK((purpose='other' AND length(trim(purpose_notes))>0) OR purpose IS DISTINCT FROM 'other'),
 CHECK((session_type='scheduled' AND schedule_id IS NOT NULL) OR session_type<>'scheduled'),
 CHECK(status='active' OR ended_at IS NOT NULL),
 CHECK(expected_end_at IS NULL OR expected_end_at>started_at),
 CHECK((status='cancelled' AND cancelled_at IS NOT NULL AND length(trim(cancellation_reason))>0) OR status<>'cancelled')
);
CREATE UNIQUE INDEX computer_lab_sessions_one_active_student_idx ON computer_lab_sessions(student_id) WHERE status='active';
CREATE UNIQUE INDEX computer_lab_sessions_one_active_workstation_idx ON computer_lab_sessions(workstation_id) WHERE status='active';
CREATE INDEX computer_lab_sessions_lab_started_idx ON computer_lab_sessions(laboratory_id,started_at DESC);
CREATE INDEX computer_lab_sessions_student_started_idx ON computer_lab_sessions(student_id,started_at DESC);
CREATE INDEX computer_lab_sessions_status_expected_idx ON computer_lab_sessions(status,expected_end_at);

INSERT INTO permissions(code,description) VALUES
 ('computer_lab.sessions.view','View Computer Laboratory student sessions'),
 ('computer_lab.sessions.manage','Start and end Computer Laboratory student sessions'),
 ('computer_lab.sessions.override','Override eligible Computer Laboratory schedule access restrictions')
ON CONFLICT(code) DO UPDATE SET description=EXCLUDED.description;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code IN('super_administrator','computer_lab_administrator') AND p.code LIKE 'computer_lab.sessions.%'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code='computer_lab_staff' AND p.code IN('computer_lab.sessions.view','computer_lab.sessions.manage')
ON CONFLICT DO NOTHING;
