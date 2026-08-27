CREATE TABLE clinic_settings (
  school_id uuid PRIMARY KEY REFERENCES schools(id),
  near_expiry_days integer NOT NULL DEFAULT 60 CHECK (near_expiry_days BETWEEN 1 AND 365),
  default_follow_up_days integer NOT NULL DEFAULT 3 CHECK (default_follow_up_days BETWEEN 1 AND 90),
  updated_by uuid REFERENCES users(id), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clinic_health_profiles (
  student_id uuid PRIMARY KEY REFERENCES students(id), blood_type varchar(10),
  past_illnesses text, surgeries_hospitalizations text, long_term_medications text,
  medication_restrictions text, emergency_notes text, physician_recommendations text,
  updated_by uuid NOT NULL REFERENCES users(id), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1
);
CREATE TABLE clinic_health_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES students(id),
  alert_type varchar(30) NOT NULL CHECK(alert_type IN('allergy','medical_condition','medication_restriction','emergency_instruction')),
  severity varchar(20) NOT NULL CHECK(severity IN('low','moderate','high','critical')),
  title varchar(160) NOT NULL, notes text, active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clinic_health_alerts_student_idx ON clinic_health_alerts(student_id) WHERE active;
CREATE TABLE clinic_immunizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES students(id), vaccine_name varchar(160) NOT NULL,
  dose varchar(80), administered_on date NOT NULL, provider varchar(200), notes text, recorded_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clinic_immunizations_student_idx ON clinic_immunizations(student_id,administered_on DESC);
CREATE TABLE clinic_physical_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES students(id), examined_on date NOT NULL,
  height_cm numeric(6,2), weight_kg numeric(6,2), bmi numeric(5,2), temperature_c numeric(4,1), systolic integer, diastolic integer,
  pulse integer, respiratory_rate integer, vision_notes text, hearing_notes text, dental_notes text, findings text, recommendations text,
  examined_by uuid NOT NULL REFERENCES users(id), notes text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clinic_physical_exams_student_idx ON clinic_physical_exams(student_id,examined_on DESC);

CREATE TABLE clinic_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id), code varchar(50) NOT NULL,
  name varchar(180) NOT NULL, generic_name varchar(180), brand_name varchar(180), category varchar(80) NOT NULL,
  description text, unit varchar(40) NOT NULL, reorder_level numeric(12,3) NOT NULL DEFAULT 0 CHECK(reorder_level>=0),
  requires_lot boolean NOT NULL DEFAULT false, active boolean NOT NULL DEFAULT true, notes text,
  created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(school_id,code)
);
CREATE TABLE clinic_inventory_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_id uuid NOT NULL REFERENCES clinic_items(id), lot_number varchar(100), expiration_date date,
  supplier_reference varchar(160), received_on date NOT NULL DEFAULT current_date, quantity_received numeric(12,3) NOT NULL CHECK(quantity_received>0),
  quantity_remaining numeric(12,3) NOT NULL CHECK(quantity_remaining>=0 AND quantity_remaining<=quantity_received), created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(lot_number IS NOT NULL OR expiration_date IS NULL), UNIQUE(item_id,lot_number)
);
CREATE INDEX clinic_lots_dispense_idx ON clinic_inventory_lots(item_id,expiration_date,received_on) WHERE quantity_remaining>0;

CREATE TABLE clinic_encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), encounter_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  student_id uuid NOT NULL REFERENCES students(id), school_year_id uuid NOT NULL REFERENCES school_years(id),
  encounter_date date NOT NULL DEFAULT current_date, time_in timestamptz NOT NULL DEFAULT now(), time_out timestamptz,
  grade_level_snapshot varchar(120), section_snapshot varchar(120), source varchar(40) NOT NULL,
  chief_complaint text NOT NULL, symptoms text[] NOT NULL DEFAULT '{}', temperature_c numeric(4,1), blood_pressure varchar(20),
  pulse integer, respiratory_rate integer, oxygen_saturation numeric(5,2), weight_kg numeric(6,2), assessment text, diagnosis text,
  treatment text, observation_notes text, clinical_notes text, disposition varchar(40), queue_status varchar(30) NOT NULL DEFAULT 'waiting'
    CHECK(queue_status IN('waiting','in_consultation','under_observation','ready_for_disposition','completed')),
  follow_up_required boolean NOT NULL DEFAULT false, parent_contact_required boolean NOT NULL DEFAULT false,
  clinic_staff_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK((queue_status='completed')=(time_out IS NOT NULL))
);
CREATE INDEX clinic_encounters_queue_idx ON clinic_encounters(encounter_date,queue_status) WHERE queue_status<>'completed';
CREATE INDEX clinic_encounters_student_idx ON clinic_encounters(student_id,encounter_date DESC,time_in DESC);
CREATE TABLE clinic_interventions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), encounter_id uuid NOT NULL REFERENCES clinic_encounters(id), intervention_type varchar(60) NOT NULL,
 notes text, performed_by uuid NOT NULL REFERENCES users(id), performed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE clinic_inventory_transactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_id uuid NOT NULL REFERENCES clinic_items(id), lot_id uuid REFERENCES clinic_inventory_lots(id),
 encounter_id uuid REFERENCES clinic_encounters(id), transaction_type varchar(30) NOT NULL CHECK(transaction_type IN('stock_in','dispense','adjustment_increase','adjustment_decrease','expired','damaged','disposal','return','other')),
 quantity numeric(12,3) NOT NULL CHECK(quantity>0), dose varchar(100), route varchar(80), instructions text, reason text,
 performed_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clinic_inventory_tx_item_idx ON clinic_inventory_transactions(item_id,created_at DESC);
CREATE TABLE clinic_appointments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES students(id), appointment_type varchar(100) NOT NULL,
 scheduled_at timestamptz NOT NULL, reason text NOT NULL, assigned_user_id uuid REFERENCES users(id), status varchar(20) NOT NULL DEFAULT 'scheduled'
 CHECK(status IN('scheduled','completed','cancelled','missed','rescheduled')), encounter_id uuid REFERENCES clinic_encounters(id), notes text,
 created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clinic_appointments_schedule_idx ON clinic_appointments(scheduled_at,status);
CREATE TABLE clinic_follow_ups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES students(id), originating_encounter_id uuid NOT NULL REFERENCES clinic_encounters(id),
 due_date date NOT NULL, reason text NOT NULL, instructions text, status varchar(20) NOT NULL DEFAULT 'pending' CHECK(status IN('pending','completed','cancelled','overdue')),
 assigned_user_id uuid REFERENCES users(id), completion_encounter_id uuid REFERENCES clinic_encounters(id), created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clinic_followups_due_idx ON clinic_follow_ups(due_date,status);
CREATE TABLE clinic_guardian_contacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES students(id), encounter_id uuid REFERENCES clinic_encounters(id),
 guardian_id uuid NOT NULL REFERENCES guardians(id), contacted_at timestamptz NOT NULL DEFAULT now(), method varchar(30) NOT NULL,
 reason text NOT NULL, result text, acknowledged boolean NOT NULL DEFAULT false, notes text, contacted_by uuid NOT NULL REFERENCES users(id)
);

INSERT INTO permissions(code,description) VALUES
('clinic.portal.access','Access the Clinic operational portal'),('clinic.student.lookup','Search eligible students for clinic care'),
('clinic.ehr.view','View restricted student health records'),('clinic.ehr.manage','Manage restricted student health records'),
('clinic.encounter.view','View clinic encounters'),('clinic.encounter.manage','Create and manage clinic encounters'),
('clinic.inventory.view','View clinic inventory'),('clinic.inventory.manage','Manage clinic inventory and stock movements'),
('clinic.appointment.manage','Manage clinic appointments and follow-ups'),('clinic.report.view','View clinic operational reports'),
('clinic.config.view','View clinic governance and configuration'),('clinic.config.manage','Manage clinic governance and item master')
ON CONFLICT(code) DO UPDATE SET description=excluded.description;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='clinic_staff' AND p.code LIKE 'clinic.%' AND p.code NOT IN('clinic.config.manage') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='school_administrator' AND p.code IN('clinic.config.view','clinic.config.manage','clinic.report.view') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='super_administrator' AND p.code LIKE 'clinic.%' ON CONFLICT DO NOTHING;
