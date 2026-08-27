CREATE INDEX computer_lab_sessions_reporting_idx ON computer_lab_sessions(started_at,laboratory_id,session_type,status);
CREATE INDEX computer_lab_issues_reporting_idx ON computer_lab_issues(reported_at,laboratory_id,status,priority)WHERE archived_at IS NULL;
CREATE INDEX computer_lab_equipment_warranty_idx ON computer_lab_equipment(warranty_expiration_date)WHERE archived_at IS NULL AND warranty_expiration_date IS NOT NULL;
CREATE INDEX computer_lab_software_license_expiration_idx ON computer_lab_software(license_expiration_date)WHERE archived_at IS NULL AND status='active'AND license_expiration_date IS NOT NULL;
INSERT INTO permissions(code,description)VALUES('computer_lab.dashboard.view','View Computer Laboratory operational dashboard'),('computer_lab.reports.view','View Computer Laboratory operational reports')ON CONFLICT(code)DO UPDATE SET description=EXCLUDED.description;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code IN('super_administrator','computer_lab_administrator','computer_lab_staff')AND p.code IN('computer_lab.dashboard.view','computer_lab.reports.view')ON CONFLICT DO NOTHING;
