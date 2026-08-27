CREATE TABLE positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id),
  department_id uuid REFERENCES departments(id),
  code varchar(80) NOT NULL,
  name varchar(160) NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX positions_school_code_active_key ON positions (school_id, lower(code)) WHERE archived_at IS NULL;
CREATE INDEX positions_department_idx ON positions (department_id) WHERE archived_at IS NULL;

CREATE TABLE employee_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id),
  code varchar(80) NOT NULL,
  name varchar(160) NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX employee_types_school_code_active_key ON employee_types (school_id, lower(code)) WHERE archived_at IS NULL;

CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id),
  campus_id uuid REFERENCES campuses(id),
  department_id uuid REFERENCES departments(id),
  position_id uuid REFERENCES positions(id),
  employee_type_id uuid REFERENCES employee_types(id),
  user_id uuid UNIQUE REFERENCES users(id),
  employee_number varchar(80) NOT NULL,
  first_name varchar(120) NOT NULL,
  middle_name varchar(120),
  last_name varchar(120) NOT NULL,
  suffix varchar(40),
  preferred_name varchar(120),
  birth_date date,
  gender varchar(30) CHECK (gender IS NULL OR gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say', 'unspecified')),
  civil_status varchar(40),
  personal_email varchar(320),
  work_email varchar(320),
  mobile_phone varchar(50),
  telephone varchar(50),
  address_line1 varchar(200),
  address_line2 varchar(200),
  barangay varchar(120),
  city varchar(120),
  province varchar(120),
  postal_code varchar(20),
  country_code char(2) NOT NULL DEFAULT 'PH',
  hire_date date NOT NULL,
  employment_status varchar(30) NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on_leave', 'resigned', 'terminated', 'retired')),
  profile_photo_url varchar(1000),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX employees_school_number_active_key ON employees (school_id, lower(employee_number)) WHERE archived_at IS NULL;
CREATE INDEX employees_name_idx ON employees (school_id, lower(last_name), lower(first_name)) WHERE archived_at IS NULL;
CREATE INDEX employees_status_idx ON employees (school_id, employment_status) WHERE archived_at IS NULL;
CREATE INDEX employees_department_idx ON employees (department_id) WHERE archived_at IS NULL;

CREATE TABLE employee_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  name varchar(200) NOT NULL,
  relationship varchar(100) NOT NULL,
  phone varchar(50) NOT NULL,
  email varchar(320),
  address varchar(500),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX employee_primary_emergency_contact_key ON employee_emergency_contacts (employee_id) WHERE is_primary AND archived_at IS NULL;
CREATE INDEX employee_emergency_contacts_employee_idx ON employee_emergency_contacts (employee_id) WHERE archived_at IS NULL;

CREATE TABLE employee_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  identifier_type varchar(30) NOT NULL CHECK (identifier_type IN ('sss', 'tin', 'philhealth', 'pagibig', 'prc', 'other')),
  identifier_value varchar(160) NOT NULL,
  label varchar(120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE UNIQUE INDEX employee_identifier_type_active_key ON employee_identifiers (employee_id, identifier_type) WHERE archived_at IS NULL;

CREATE TABLE employee_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  from_status varchar(30),
  to_status varchar(30) NOT NULL CHECK (to_status IN ('active', 'inactive', 'on_leave', 'resigned', 'terminated', 'retired')),
  effective_on date NOT NULL,
  reason varchar(1000),
  changed_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX employee_status_history_employee_idx ON employee_status_history (employee_id, effective_on DESC, created_at DESC);
CREATE TRIGGER employee_status_history_immutable BEFORE UPDATE OR DELETE ON employee_status_history
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

CREATE TABLE employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  document_type varchar(80) NOT NULL,
  title varchar(200) NOT NULL,
  storage_key varchar(500),
  file_name varchar(255),
  mime_type varchar(160),
  size_bytes bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  status varchar(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'archived')),
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE INDEX employee_documents_employee_idx ON employee_documents (employee_id) WHERE archived_at IS NULL;
