INSERT INTO permissions(code,description) VALUES
 ('clinic.dashboard.view','View the Clinic operational dashboard'),
 ('clinic.appointment.view','View clinic appointments'),
 ('clinic.follow_up.view','View clinic follow-ups')
ON CONFLICT(code) DO UPDATE SET description=excluded.description;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code='clinic_staff' AND p.code IN('clinic.dashboard.view','clinic.appointment.view','clinic.follow_up.view')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code='super_administrator' AND p.code IN('clinic.dashboard.view','clinic.appointment.view','clinic.follow_up.view')
ON CONFLICT DO NOTHING;
