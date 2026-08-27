ALTER TABLE users
  ALTER COLUMN email DROP NOT NULL,
  ADD COLUMN must_change_password boolean NOT NULL DEFAULT false,
  ADD COLUMN account_type varchar(30) NOT NULL DEFAULT 'system'
    CHECK (account_type IN ('system','employee','student','guardian'));

CREATE TABLE login_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(30) NOT NULL CHECK (type IN ('username','employee_number','student_number','guardian_number')),
  normalized_value varchar(160) NOT NULL CHECK (normalized_value = lower(trim(normalized_value)) AND char_length(normalized_value) BETWEEN 3 AND 160),
  is_primary boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type, user_id)
);
CREATE UNIQUE INDEX login_identities_value_active_key ON login_identities(normalized_value) WHERE active;
CREATE INDEX login_identities_user_idx ON login_identities(user_id) WHERE active;

CREATE SEQUENCE guardian_number_sequence;
ALTER TABLE guardians ADD COLUMN guardian_number varchar(40);
UPDATE guardians
SET guardian_number = 'GDN-' || extract(year from created_at)::int || '-' || lpad(nextval('guardian_number_sequence')::text, 6, '0')
WHERE guardian_number IS NULL;
ALTER TABLE guardians ALTER COLUMN guardian_number SET NOT NULL;
ALTER TABLE guardians ALTER COLUMN guardian_number SET DEFAULT ('GDN-' || extract(year from current_date)::int || '-' || lpad(nextval('guardian_number_sequence')::text, 6, '0'));
CREATE UNIQUE INDEX guardians_number_key ON guardians(lower(guardian_number));

INSERT INTO login_identities(user_id,type,normalized_value,is_primary)
SELECT user_id,'employee_number',lower(trim(employee_number)),true FROM employees
WHERE user_id IS NOT NULL AND archived_at IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO login_identities(user_id,type,normalized_value,is_primary)
SELECT user_id,'student_number',lower(trim(student_number)),true FROM students
WHERE user_id IS NOT NULL AND archived_at IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO login_identities(user_id,type,normalized_value,is_primary)
SELECT user_id,'guardian_number',lower(trim(guardian_number)),true FROM guardians
WHERE user_id IS NOT NULL AND archived_at IS NULL
ON CONFLICT DO NOTHING;

WITH candidates AS (
  SELECT u.id,
    CASE
      WHEN regexp_replace(split_part(u.email,'@',1),'[^a-z0-9._-]','','g') ~ '^[a-z][a-z0-9._-]{2,79}$'
        THEN regexp_replace(split_part(u.email,'@',1),'[^a-z0-9._-]','','g')
      ELSE 'user-' || left(u.id::text,8)
    END candidate
  FROM users u WHERE u.archived_at IS NULL
), resolved AS (
  SELECT c.id,
    CASE WHEN EXISTS (SELECT 1 FROM login_identities li WHERE li.normalized_value=c.candidate)
           OR count(*) OVER (PARTITION BY c.candidate) > 1
      THEN left(c.candidate,70) || '-' || left(c.id::text,8)
      ELSE c.candidate END username
  FROM candidates c
)
INSERT INTO login_identities(user_id,type,normalized_value,is_primary)
SELECT id,'username',username,true FROM resolved ON CONFLICT DO NOTHING;

UPDATE users u SET account_type = CASE
  WHEN EXISTS(SELECT 1 FROM employees e WHERE e.user_id=u.id) THEN 'employee'
  WHEN EXISTS(SELECT 1 FROM students s WHERE s.user_id=u.id) THEN 'student'
  WHEN EXISTS(SELECT 1 FROM guardians g WHERE g.user_id=u.id) THEN 'guardian'
  ELSE 'system' END;

CREATE OR REPLACE FUNCTION synchronize_authoritative_login_identity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE alias_type text; alias_value text;
BEGIN
  IF TG_TABLE_NAME='employees' THEN alias_type:='employee_number'; alias_value:=NEW.employee_number;
  ELSIF TG_TABLE_NAME='students' THEN alias_type:='student_number'; alias_value:=NEW.student_number;
  ELSE alias_type:='guardian_number'; alias_value:=NEW.guardian_number;
  END IF;
  IF TG_OP='UPDATE' AND OLD.user_id IS NOT NULL AND (NEW.user_id IS NULL OR NEW.user_id<>OLD.user_id) THEN
    UPDATE login_identities SET active=false,updated_at=now() WHERE user_id=OLD.user_id AND type=alias_type;
  END IF;
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO login_identities(user_id,type,normalized_value,is_primary)
    VALUES(NEW.user_id,alias_type,lower(trim(alias_value)),true)
    ON CONFLICT(type,user_id) DO UPDATE SET normalized_value=excluded.normalized_value,active=true,updated_at=now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER employees_login_identity_sync AFTER INSERT OR UPDATE OF user_id,employee_number ON employees FOR EACH ROW EXECUTE FUNCTION synchronize_authoritative_login_identity();
CREATE TRIGGER students_login_identity_sync AFTER INSERT OR UPDATE OF user_id,student_number ON students FOR EACH ROW EXECUTE FUNCTION synchronize_authoritative_login_identity();
CREATE TRIGGER guardians_login_identity_sync AFTER INSERT OR UPDATE OF user_id,guardian_number ON guardians FOR EACH ROW EXECUTE FUNCTION synchronize_authoritative_login_identity();

INSERT INTO permissions(code,description) VALUES
 ('security.user.change_password','Administratively replace a centralized user password'),
 ('security.account.provision','Provision centralized accounts from authoritative person records')
ON CONFLICT(code) DO UPDATE SET description=excluded.description;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code='super_administrator' AND p.code IN('security.user.change_password','security.account.provision')
ON CONFLICT DO NOTHING;
