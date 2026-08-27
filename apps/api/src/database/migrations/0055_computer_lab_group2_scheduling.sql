CREATE TABLE computer_lab_schedules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), laboratory_id uuid NOT NULL REFERENCES computer_laboratories(id) ON DELETE RESTRICT,
 schedule_type varchar(30) NOT NULL CHECK(schedule_type IN('class','reservation','event','maintenance_block')),
 school_year_id uuid REFERENCES school_years(id) ON DELETE RESTRICT,
 teaching_assignment_id uuid REFERENCES teaching_assignments(id) ON DELETE RESTRICT,
 title varchar(200), description text,
 recurrence_type varchar(20) NOT NULL CHECK(recurrence_type IN('one_time','weekly')),
 schedule_date date, day_of_week smallint, recurrence_start_date date, recurrence_end_date date,
 start_time time NOT NULL, end_time time NOT NULL,
 status varchar(20) NOT NULL DEFAULT 'active' CHECK(status IN('active','cancelled')),
 notes text, created_by_user_id uuid NOT NULL REFERENCES users(id), updated_by_user_id uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),archived_at timestamptz,
 CHECK(start_time<end_time),
 CHECK((recurrence_type='one_time' AND schedule_date IS NOT NULL AND day_of_week IS NULL AND recurrence_start_date IS NULL AND recurrence_end_date IS NULL) OR (recurrence_type='weekly' AND schedule_date IS NULL AND day_of_week BETWEEN 0 AND 6 AND recurrence_start_date IS NOT NULL AND recurrence_end_date>=recurrence_start_date)),
 CHECK((schedule_type='class' AND school_year_id IS NOT NULL AND teaching_assignment_id IS NOT NULL AND title IS NULL) OR (schedule_type<>'class' AND school_year_id IS NULL AND teaching_assignment_id IS NULL AND title IS NOT NULL))
);
CREATE INDEX computer_lab_schedule_lab_range_idx ON computer_lab_schedules(laboratory_id,COALESCE(schedule_date,recurrence_start_date),COALESCE(schedule_date,recurrence_end_date),start_time,end_time) WHERE status='active' AND archived_at IS NULL;
CREATE INDEX computer_lab_schedule_year_assignment_idx ON computer_lab_schedules(school_year_id,teaching_assignment_id) WHERE archived_at IS NULL;
INSERT INTO permissions(code,description)VALUES('computer_lab.schedule.view','View Computer Laboratory schedules'),('computer_lab.schedule.manage','Manage Computer Laboratory schedules')ON CONFLICT(code)DO UPDATE SET description=EXCLUDED.description;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code IN('super_administrator','computer_lab_administrator')AND p.code IN('computer_lab.schedule.view','computer_lab.schedule.manage')ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='computer_lab_staff'AND p.code='computer_lab.schedule.view'ON CONFLICT DO NOTHING;
