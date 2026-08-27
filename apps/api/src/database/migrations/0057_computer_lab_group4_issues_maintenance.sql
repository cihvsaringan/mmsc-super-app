CREATE TABLE computer_lab_issues(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),laboratory_id uuid NOT NULL REFERENCES computer_laboratories(id) ON DELETE RESTRICT,workstation_id uuid REFERENCES computer_lab_workstations(id) ON DELETE RESTRICT,
 category varchar(30) NOT NULL CHECK(category IN('hardware','software','network','peripheral','power','account_access','environment','other')),priority varchar(20) NOT NULL CHECK(priority IN('low','medium','high','critical')),status varchar(20) NOT NULL DEFAULT'reported' CHECK(status IN('reported','acknowledged','in_progress','resolved','closed','cancelled')),
 title varchar(200) NOT NULL,description text NOT NULL,reported_by_user_id uuid NOT NULL REFERENCES users(id),reported_at timestamptz NOT NULL DEFAULT now(),assigned_to_employee_id uuid REFERENCES employees(id) ON DELETE RESTRICT,assigned_at timestamptz,resolved_at timestamptz,closed_at timestamptz,resolution_notes text,cancellation_reason text,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),archived_at timestamptz,
 CHECK(category<>'other' OR length(trim(description))>=10),CHECK(status<>'resolved' OR length(trim(resolution_notes))>=5),CHECK(status<>'cancelled' OR length(trim(cancellation_reason))>=5)
);
CREATE TABLE computer_lab_maintenance_records(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),laboratory_id uuid NOT NULL REFERENCES computer_laboratories(id) ON DELETE RESTRICT,workstation_id uuid REFERENCES computer_lab_workstations(id) ON DELETE RESTRICT,issue_id uuid REFERENCES computer_lab_issues(id) ON DELETE RESTRICT,
 maintenance_type varchar(30) NOT NULL CHECK(maintenance_type IN('preventive','corrective','inspection','repair','replacement','software_service','network_service','cleaning','other')),description text NOT NULL,performed_by_employee_id uuid REFERENCES employees(id) ON DELETE RESTRICT,performed_by_user_id uuid NOT NULL REFERENCES users(id),performed_at timestamptz NOT NULL,cost numeric(12,2) CHECK(cost>=0),parts_or_materials text,next_recommended_maintenance_at timestamptz,notes text,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),archived_at timestamptz
);
CREATE INDEX computer_lab_issues_ops_idx ON computer_lab_issues(status,priority,laboratory_id,updated_at DESC) WHERE archived_at IS NULL;
CREATE INDEX computer_lab_issues_workstation_idx ON computer_lab_issues(workstation_id,reported_at DESC) WHERE workstation_id IS NOT NULL;
CREATE INDEX computer_lab_maintenance_history_idx ON computer_lab_maintenance_records(laboratory_id,performed_at DESC) WHERE archived_at IS NULL;
CREATE INDEX computer_lab_maintenance_workstation_idx ON computer_lab_maintenance_records(workstation_id,performed_at DESC) WHERE workstation_id IS NOT NULL;
INSERT INTO permissions(code,description)VALUES
('computer_lab.issues.view','View Computer Laboratory issues'),('computer_lab.issues.manage','Manage Computer Laboratory issues'),('computer_lab.maintenance.view','View Computer Laboratory maintenance history'),('computer_lab.maintenance.manage','Manage Computer Laboratory maintenance records')ON CONFLICT(code)DO UPDATE SET description=EXCLUDED.description;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code IN('super_administrator','computer_lab_administrator')AND p.code LIKE'computer_lab.%' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='computer_lab_staff'AND p.code IN('computer_lab.issues.view','computer_lab.issues.manage','computer_lab.maintenance.view','computer_lab.maintenance.manage')ON CONFLICT DO NOTHING;
