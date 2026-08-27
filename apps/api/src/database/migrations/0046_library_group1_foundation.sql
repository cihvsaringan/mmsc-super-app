CREATE TABLE library_settings (
  school_id uuid PRIMARY KEY REFERENCES schools(id),
  default_loan_days integer NOT NULL DEFAULT 14 CHECK (default_loan_days BETWEEN 1 AND 90),
  maximum_renewals integer NOT NULL DEFAULT 1 CHECK (maximum_renewals BETWEEN 0 AND 10),
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO library_settings (school_id)
SELECT id FROM schools
ON CONFLICT (school_id) DO NOTHING;

INSERT INTO permissions (code, description) VALUES
  ('library.portal.access', 'Access the Library operational portal'),
  ('library.dashboard.view', 'View the Library operational dashboard'),
  ('library.catalog.view', 'View the Library catalog'),
  ('library.catalog.manage', 'Manage Library catalog records'),
  ('library.copies.view', 'View Library copy records'),
  ('library.copies.manage', 'Manage Library copy records'),
  ('library.circulation.view', 'View Library circulation activity'),
  ('library.circulation.checkout', 'Check out Library copies'),
  ('library.circulation.checkin', 'Check in Library copies'),
  ('library.circulation.renew', 'Renew Library loans'),
  ('library.circulation.override', 'Override Library circulation restrictions'),
  ('library.patrons.view', 'View least-data Library patron identities'),
  ('library.visitors.view', 'View Library visitor activity'),
  ('library.visitors.log', 'Record Library visitor entry and exit'),
  ('library.visitors.reports', 'View Library visitor reports'),
  ('library.overdue.view', 'View overdue Library loans'),
  ('library.overdue.manage', 'Manage overdue Library loans'),
  ('library.reports.view', 'View Library operational reports'),
  ('library.settings.view', 'View Library settings'),
  ('library.settings.manage', 'Manage Library settings')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO roles (code, name, description, is_system) VALUES
  ('library_administrator', 'Library Administrator', 'Full Library governance and operational access', true),
  ('librarian', 'Librarian', 'Library catalog, circulation, patron, visitor, overdue, and reporting access', true),
  ('library_assistant', 'Library Assistant', 'Least-privilege Library circulation and visitor operations', true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_system = true;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code IN ('super_administrator', 'library_administrator') AND p.code LIKE 'library.%'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'librarian' AND p.code LIKE 'library.%'
  AND p.code NOT IN ('library.settings.manage', 'library.circulation.override')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'library_assistant' AND p.code IN (
  'library.portal.access', 'library.dashboard.view', 'library.catalog.view', 'library.copies.view',
  'library.circulation.view', 'library.circulation.checkout', 'library.circulation.checkin',
  'library.circulation.renew', 'library.patrons.view', 'library.visitors.view',
  'library.visitors.log', 'library.overdue.view'
)
ON CONFLICT DO NOTHING;
