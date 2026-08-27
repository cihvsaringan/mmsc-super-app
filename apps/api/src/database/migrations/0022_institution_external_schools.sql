ALTER TABLE schools ADD COLUMN is_primary boolean NOT NULL DEFAULT false;
UPDATE schools SET is_primary=true WHERE code='MMSC' AND archived_at IS NULL;
CREATE UNIQUE INDEX schools_one_primary_institution ON schools(is_primary) WHERE is_primary AND archived_at IS NULL;

CREATE TABLE external_schools(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(300) NOT NULL,
  school_type varchar(60), education_level varchar(100), deped_school_id varchar(40),
  address_line varchar(300), barangay varchar(120), city_municipality varchar(120), province varchar(120), region varchar(120),
  country_code char(2) NOT NULL DEFAULT 'PH', contact_number varchar(50), email varchar(320), website varchar(500),
  active boolean NOT NULL DEFAULT true, source varchar(30) NOT NULL DEFAULT 'managed' CHECK(source IN('managed','legacy_admission','legacy_student')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK(version>0)
);
CREATE UNIQUE INDEX external_schools_deped_id_unique ON external_schools(deped_school_id) WHERE deped_school_id IS NOT NULL AND archived_at IS NULL;
CREATE INDEX external_schools_search_idx ON external_schools(lower(name),city_municipality,province) WHERE archived_at IS NULL;

ALTER TABLE admission_applications ADD COLUMN previous_school_id uuid REFERENCES external_schools(id) ON DELETE RESTRICT;
ALTER TABLE students ADD COLUMN previous_school_id uuid REFERENCES external_schools(id) ON DELETE RESTRICT;

INSERT INTO external_schools(name,source)
SELECT min(name),min(source) FROM (
  SELECT trim(previous_school) name,'legacy_admission' source FROM admission_applications WHERE nullif(trim(previous_school),'') IS NOT NULL
  UNION ALL
  SELECT trim(previous_school),'legacy_student' FROM students WHERE nullif(trim(previous_school),'') IS NOT NULL
) legacy GROUP BY lower(name);

UPDATE admission_applications a SET previous_school_id=e.id FROM external_schools e WHERE a.previous_school_id IS NULL AND lower(trim(a.previous_school))=lower(trim(e.name));
UPDATE students s SET previous_school_id=e.id FROM external_schools e WHERE s.previous_school_id IS NULL AND lower(trim(s.previous_school))=lower(trim(e.name));

CREATE FUNCTION resolve_previous_school_reference() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.previous_school_id IS NULL AND nullif(trim(NEW.previous_school),'') IS NOT NULL THEN
    SELECT id INTO NEW.previous_school_id FROM external_schools
    WHERE archived_at IS NULL AND lower(trim(name))=lower(trim(NEW.previous_school))
    ORDER BY active DESC,created_at LIMIT 1;
  ELSIF NEW.previous_school_id IS NOT NULL AND nullif(trim(NEW.previous_school),'') IS NULL THEN
    SELECT name INTO NEW.previous_school FROM external_schools WHERE id=NEW.previous_school_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER admission_previous_school_reference BEFORE INSERT OR UPDATE OF previous_school,previous_school_id ON admission_applications FOR EACH ROW EXECUTE FUNCTION resolve_previous_school_reference();
CREATE TRIGGER student_previous_school_reference BEFORE INSERT OR UPDATE OF previous_school,previous_school_id ON students FOR EACH ROW EXECUTE FUNCTION resolve_previous_school_reference();
CREATE INDEX admission_applications_previous_school_idx ON admission_applications(previous_school_id) WHERE archived_at IS NULL;
CREATE INDEX students_previous_school_idx ON students(previous_school_id) WHERE archived_at IS NULL;
