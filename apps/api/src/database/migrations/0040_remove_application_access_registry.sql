-- Preserve intentional Clinic assignments in the existing role-based model.
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT ua.user_id, r.id, ua.assigned_by
FROM user_applications ua
JOIN roles r ON r.code = 'clinic_staff' AND r.archived_at IS NULL
WHERE ua.application_key = 'clinic'
ON CONFLICT DO NOTHING;

DROP TABLE user_applications;
DROP TABLE applications;
