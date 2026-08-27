ALTER TABLE credentials DROP CONSTRAINT credentials_status_check;
ALTER TABLE credentials
  ADD CONSTRAINT credentials_status_check CHECK (status IN ('active','inactive','lost','replaced','revoked','expired','suspended')),
  ADD COLUMN last_used_at timestamptz,
  ADD COLUMN updated_by uuid REFERENCES users(id),
  ADD COLUMN replaced_by_credential_id uuid REFERENCES credentials(id) ON DELETE RESTRICT;

UPDATE credentials SET updated_by=created_by WHERE updated_by IS NULL;
ALTER TABLE credentials ALTER COLUMN updated_by SET NOT NULL;

CREATE INDEX credentials_changed_idx ON credentials(updated_at,id);
CREATE INDEX credentials_owner_status_idx ON credentials(subject_type,student_id,employee_id,status);

ALTER TABLE attendance_terminal_events
  ADD COLUMN scan_source varchar(24),
  ADD COLUMN synchronized_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN clock_offset_seconds integer;

UPDATE attendance_terminal_events
SET scan_source=CASE capture_method WHEN 'rfid' THEN 'rfid' ELSE 'qr_scanner' END
WHERE scan_source IS NULL;

ALTER TABLE attendance_terminal_events
  ALTER COLUMN scan_source SET NOT NULL,
  ADD CONSTRAINT attendance_terminal_events_scan_source_check
    CHECK (scan_source IN ('rfid','qr_scanner','qr_camera','nfc','barcode'));

CREATE INDEX attendance_terminal_events_source_idx
  ON attendance_terminal_events(scan_source,captured_at DESC);
