ALTER TABLE clinic_appointments ADD COLUMN version integer NOT NULL DEFAULT 1, ADD COLUMN updated_by uuid REFERENCES users(id), ADD COLUMN archived_at timestamptz;
ALTER TABLE clinic_follow_ups ADD COLUMN notes text, ADD COLUMN updated_by uuid REFERENCES users(id), ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN version integer NOT NULL DEFAULT 1, ADD COLUMN archived_at timestamptz;

CREATE TABLE clinic_portal_releases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES students(id), encounter_id uuid REFERENCES clinic_encounters(id),
 appointment_id uuid REFERENCES clinic_appointments(id), follow_up_id uuid REFERENCES clinic_follow_ups(id),
 audience varchar(20) NOT NULL CHECK(audience IN('student','guardians','both')),
 category varchar(40) NOT NULL CHECK(category IN('visit_notice','pickup_request','sent_home','appointment','follow_up','medication_concern','medical_document_request','released_instruction')),
 title varchar(160) NOT NULL, summary varchar(1000) NOT NULL, instructions varchar(2000), status varchar(20) NOT NULL DEFAULT 'draft' CHECK(status IN('draft','published','archived')),
 created_by uuid NOT NULL REFERENCES users(id), published_by uuid REFERENCES users(id), published_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
 CHECK(num_nonnulls(encounter_id,appointment_id,follow_up_id)<=1), CHECK((status='published')=(published_at IS NOT NULL))
);
CREATE INDEX clinic_portal_releases_student_idx ON clinic_portal_releases(student_id,published_at DESC) WHERE status='published';

INSERT INTO permissions(code,description) VALUES('clinic.notifications.send','Release privacy-safe Clinic notices through shared notifications') ON CONFLICT(code) DO UPDATE SET description=excluded.description;
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code IN('clinic_staff','super_administrator') AND p.code='clinic.notifications.send' ON CONFLICT DO NOTHING;
