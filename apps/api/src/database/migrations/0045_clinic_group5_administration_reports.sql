ALTER TABLE clinic_items ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES users(id);
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS clinic_inventory_tx_created_idx ON clinic_inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS clinic_inventory_tx_type_idx ON clinic_inventory_transactions(transaction_type,created_at DESC);
CREATE INDEX IF NOT EXISTS clinic_encounters_reporting_idx ON clinic_encounters(encounter_date,disposition,grade_level_snapshot,section_snapshot);
CREATE INDEX IF NOT EXISTS clinic_appointments_reporting_idx ON clinic_appointments(status,scheduled_at) WHERE archived_at IS NULL;
