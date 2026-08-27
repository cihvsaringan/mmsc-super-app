-- Post-Phase-29 Attendance Terminal Web-2 rebuild.
-- The old session/installation tables remain only as immutable migration-era history;
-- all new runtime state is owned by the device/provisioning tables below.
CREATE TABLE attendance_terminal_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES attendance_terminals(id) ON DELETE RESTRICT,
  device_identifier uuid NOT NULL UNIQUE,
  credential_digest varchar(43) NOT NULL UNIQUE,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK(status IN('active','revoked')),
  application_version varchar(40) NOT NULL,
  provisioned_by uuid NOT NULL REFERENCES users(id),
  provisioned_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  last_sync_at timestamptz,
  last_heartbeat_at timestamptz,
  pending_count integer NOT NULL DEFAULT 0 CHECK(pending_count >= 0),
  failed_count integer NOT NULL DEFAULT 0 CHECK(failed_count >= 0),
  sync_state varchar(24) NOT NULL DEFAULT 'online' CHECK(sync_state IN('online','offline','reconnecting','syncing','failed')),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES users(id),
  revocation_reason varchar(500),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX attendance_terminal_devices_terminal_idx ON attendance_terminal_devices(terminal_id,status);

CREATE TABLE attendance_terminal_provisioning_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES attendance_terminals(id) ON DELETE RESTRICT,
  token_digest varchar(43) NOT NULL UNIQUE,
  display_suffix varchar(8) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK(status IN('active','consumed','expired','revoked')),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  consumed_by_device_id uuid REFERENCES attendance_terminal_devices(id)
);
CREATE INDEX attendance_terminal_provisioning_tokens_expiry_idx ON attendance_terminal_provisioning_tokens(status,expires_at);

ALTER TABLE attendance_terminal_events ADD COLUMN device_id uuid REFERENCES attendance_terminal_devices(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX attendance_terminal_events_device_capture_key ON attendance_terminal_events(device_id,client_event_id) WHERE device_id IS NOT NULL;

INSERT INTO permissions(code,description) VALUES
 ('attendance.terminal.device.view','View provisioned Attendance Terminal devices'),
 ('attendance.terminal.device.manage','Provision and revoke Attendance Terminal devices')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code='school_administrator' AND p.code IN('attendance.terminal.device.view','attendance.terminal.device.manage')
ON CONFLICT DO NOTHING;
