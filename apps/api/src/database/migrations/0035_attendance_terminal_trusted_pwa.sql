CREATE TABLE attendance_terminal_installation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_digest varchar(43) NOT NULL UNIQUE,
  display_suffix varchar(8) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK(status IN('active','consumed','expired','revoked')),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  consumed_by_installation_id uuid
);

CREATE INDEX attendance_terminal_installation_codes_expiry_idx
  ON attendance_terminal_installation_codes(status,expires_at);

CREATE TABLE attendance_terminal_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_uuid uuid NOT NULL UNIQUE,
  status varchar(16) NOT NULL DEFAULT 'trusted' CHECK(status IN('trusted','revoked')),
  credential_digest varchar(43) NOT NULL UNIQUE,
  credential_version integer NOT NULL DEFAULT 1 CHECK(credential_version>0),
  registered_by_user_id uuid NOT NULL REFERENCES users(id),
  registered_at timestamptz NOT NULL DEFAULT now(),
  assigned_terminal_id uuid REFERENCES attendance_terminals(id),
  last_seen_at timestamptz,
  last_sync_at timestamptz,
  last_heartbeat_at timestamptz,
  pending_count integer NOT NULL DEFAULT 0 CHECK(pending_count>=0),
  failed_count integer NOT NULL DEFAULT 0 CHECK(failed_count>=0),
  sync_state varchar(24) NOT NULL DEFAULT 'online' CHECK(sync_state IN('online','offline','reconnecting','syncing','failed')),
  application_version varchar(40) NOT NULL DEFAULT '1.0.0',
  revoked_at timestamptz,
  revoked_by_user_id uuid REFERENCES users(id),
  revocation_reason varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE attendance_terminal_installation_codes
  ADD CONSTRAINT attendance_terminal_installation_codes_consumed_by_fk
  FOREIGN KEY(consumed_by_installation_id) REFERENCES attendance_terminal_installations(id);

ALTER TABLE attendance_terminal_sessions
  ADD COLUMN installation_id uuid REFERENCES attendance_terminal_installations(id);

CREATE UNIQUE INDEX attendance_terminal_sessions_active_installation_key
  ON attendance_terminal_sessions(installation_id) WHERE status='active' AND installation_id IS NOT NULL;

INSERT INTO permissions(code,description)
VALUES
 ('attendance.terminal.installation.view','View trusted Attendance Terminal PWA installations'),
 ('attendance.terminal.installation.manage','Generate trust codes, assign, and revoke Attendance Terminal PWA installations')
ON CONFLICT(code) DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code='school_administrator' AND p.code IN('attendance.terminal.installation.view','attendance.terminal.installation.manage')
ON CONFLICT DO NOTHING;
