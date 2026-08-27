ALTER TABLE attendance_terminal_events
  DROP CONSTRAINT attendance_terminal_events_scan_source_check,
  ADD CONSTRAINT attendance_terminal_events_scan_source_check
    CHECK (scan_source IN ('rfid','qr_scanner','qr_camera','manual_credential_test','nfc','barcode'));
