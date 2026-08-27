CREATE TABLE applications (
  key varchar(40) PRIMARY KEY CHECK(key ~ '^[a-z][a-z0-9_]*$'), name varchar(100) NOT NULL UNIQUE,
  route_prefix varchar(120), sort_order integer NOT NULL CHECK(sort_order > 0), active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE user_applications (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_key varchar(40) NOT NULL REFERENCES applications(key), assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,application_key)
);
CREATE INDEX user_applications_application_idx ON user_applications(application_key,user_id);
INSERT INTO applications(key,name,route_prefix,sort_order) VALUES
 ('administration','Administration','/',10),('teacher','Teacher Portal','/teacher',20),
 ('student','Student Portal','/student',30),('parent','Parent Portal','/parent',40),
 ('clinic','Clinic Portal','/clinic',50),('attendance_terminal','Attendance Terminal',NULL,60)
ON CONFLICT(key) DO UPDATE SET name=excluded.name,route_prefix=excluded.route_prefix,sort_order=excluded.sort_order,active=true,updated_at=now();
INSERT INTO user_applications(user_id,application_key) SELECT DISTINCT ur.user_id,'administration' FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.code IN('super_administrator','school_administrator','principal','registrar','hr_administrator','hr_staff') ON CONFLICT DO NOTHING;
INSERT INTO user_applications(user_id,application_key) SELECT DISTINCT ur.user_id,'teacher' FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.code='teacher' ON CONFLICT DO NOTHING;
INSERT INTO user_applications(user_id,application_key) SELECT DISTINCT ur.user_id,'student' FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.code='student' ON CONFLICT DO NOTHING;
INSERT INTO user_applications(user_id,application_key) SELECT DISTINCT ur.user_id,'parent' FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.code='parent_guardian' ON CONFLICT DO NOTHING;
INSERT INTO user_applications(user_id,application_key) SELECT DISTINCT ur.user_id,'clinic' FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.code='clinic_staff' ON CONFLICT DO NOTHING;
INSERT INTO user_applications(user_id,application_key) SELECT DISTINCT ur.user_id,'attendance_terminal' FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.code='attendance_operator' ON CONFLICT DO NOTHING;
