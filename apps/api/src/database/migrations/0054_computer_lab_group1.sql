CREATE TABLE computer_laboratories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id uuid NOT NULL REFERENCES campuses(id) ON DELETE RESTRICT,
  name varchar(160) NOT NULL,
  code varchar(60) NOT NULL,
  location_or_room varchar(160) NOT NULL,
  capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 500),
  description text,
  operational_status varchar(30) NOT NULL DEFAULT 'active' CHECK (operational_status IN ('active','temporarily_closed','maintenance','inactive')),
  walk_in_enabled boolean NOT NULL DEFAULT false,
  walk_in_approval_required boolean NOT NULL DEFAULT false,
  default_max_walk_in_minutes integer CHECK (default_max_walk_in_minutes BETWEEN 1 AND 1440),
  walk_in_cutoff_before_schedule_minutes integer CHECK (walk_in_cutoff_before_schedule_minutes BETWEEN 0 AND 1440),
  notes text,
  created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  CONSTRAINT computer_laboratories_campus_code_unique UNIQUE (campus_id, code)
);

CREATE TABLE computer_lab_workstations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES computer_laboratories(id) ON DELETE RESTRICT,
  workstation_code varchar(60) NOT NULL,
  seat_number varchar(40), computer_name varchar(120), asset_number varchar(100), serial_number varchar(120),
  ip_address inet, mac_address macaddr, operating_system varchar(160), processor varchar(160), ram varchar(100), storage varchar(160),
  operational_status varchar(30) NOT NULL DEFAULT 'available' CHECK (operational_status IN ('available','maintenance','offline','retired')),
  purchase_date date, warranty_expiration_date date, last_maintenance_date date,
  notes text, created_by uuid REFERENCES users(id), updated_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  CONSTRAINT computer_lab_workstations_lab_code_unique UNIQUE (lab_id, workstation_code),
  CONSTRAINT computer_lab_workstations_warranty_order CHECK (warranty_expiration_date IS NULL OR purchase_date IS NULL OR warranty_expiration_date >= purchase_date)
);

CREATE INDEX computer_laboratories_listing_idx ON computer_laboratories (archived_at, operational_status, campus_id, name);
CREATE INDEX computer_lab_workstations_listing_idx ON computer_lab_workstations (archived_at, lab_id, operational_status, workstation_code);

INSERT INTO permissions (code, description) VALUES
 ('computer_lab.access','Access the Computer Laboratory portal'),
 ('computer_lab.labs.view','View computer laboratories'),
 ('computer_lab.labs.manage','Manage computer laboratories'),
 ('computer_lab.workstations.view','View computer laboratory workstations'),
 ('computer_lab.workstations.manage','Manage computer laboratory workstations'),
 ('computer_lab.settings.manage','Manage computer laboratory operational settings')
ON CONFLICT (code) DO UPDATE SET description=EXCLUDED.description;

INSERT INTO roles (code,name,description,is_system) VALUES
 ('computer_lab_administrator','Computer Laboratory Administrator','Full Computer Laboratory configuration and operations',true),
 ('computer_lab_staff','Computer Laboratory Staff','Day-to-day laboratory and workstation access',true)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,is_system=true;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code IN ('super_administrator','computer_lab_administrator') AND p.code LIKE 'computer_lab.%'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code='computer_lab_staff' AND p.code IN ('computer_lab.access','computer_lab.labs.view','computer_lab.workstations.view')
ON CONFLICT DO NOTHING;
