UPDATE permissions SET code='clinic.health_records.view',description='View restricted student health records' WHERE code='clinic.ehr.view';
UPDATE permissions SET code='clinic.health_records.manage',description='Manage restricted student health records' WHERE code='clinic.ehr.manage';

ALTER TABLE clinic_health_alerts ADD COLUMN updated_by uuid REFERENCES users(id), ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE clinic_immunizations ADD COLUMN updated_by uuid REFERENCES users(id), ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN version integer NOT NULL DEFAULT 1, ADD COLUMN archived_at timestamptz;
ALTER TABLE clinic_physical_exams ADD COLUMN updated_by uuid REFERENCES users(id), ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN version integer NOT NULL DEFAULT 1, ADD COLUMN archived_at timestamptz;
ALTER TABLE student_guardians ADD COLUMN is_emergency_contact boolean GENERATED ALWAYS AS (relationship_type='emergency_contact') STORED;

CREATE INDEX clinic_immunizations_active_student_idx ON clinic_immunizations(student_id,administered_on DESC) WHERE archived_at IS NULL;
CREATE INDEX clinic_physical_exams_active_student_idx ON clinic_physical_exams(student_id,examined_on DESC) WHERE archived_at IS NULL;
