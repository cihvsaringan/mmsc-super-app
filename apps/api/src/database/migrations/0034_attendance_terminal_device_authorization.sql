ALTER TABLE attendance_terminal_sessions
  ADD COLUMN device_token_digest varchar(43),
  ADD COLUMN offline_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN authorization_state varchar(32) NOT NULL DEFAULT 'active'
    CHECK (authorization_state IN ('active','disabled','revoked','reconfiguration_required')),
  ADD COLUMN provisioned_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN last_verified_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN configuration_version integer NOT NULL DEFAULT 1 CHECK (configuration_version > 0);

CREATE UNIQUE INDEX attendance_terminal_sessions_device_token_key
  ON attendance_terminal_sessions(device_token_digest)
  WHERE device_token_digest IS NOT NULL;

DROP INDEX IF EXISTS attendance_terminal_sessions_active_device_key;
CREATE UNIQUE INDEX attendance_terminal_sessions_active_device_key
  ON attendance_terminal_sessions(device_id)
  WHERE status='active';

ALTER TABLE attendance_terminal_events
  ALTER COLUMN credential_digest DROP NOT NULL,
  DROP CONSTRAINT attendance_terminal_events_capture_method_check,
  ADD CONSTRAINT attendance_terminal_events_capture_method_check
    CHECK(capture_method IN('qr','rfid','nfc','barcode','manual_verification')),
  DROP CONSTRAINT attendance_terminal_events_scan_source_check,
  ADD CONSTRAINT attendance_terminal_events_scan_source_check
    CHECK(scan_source IN('rfid','qr_scanner','qr_camera','manual_credential_test','manual_verification','nfc','barcode'));
