CREATE OR REPLACE FUNCTION validate_grading_period_scope() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  year_start date;
  year_end date;
  term_year uuid;
  term_start date;
  term_end date;
BEGIN
  SELECT starts_on,ends_on INTO year_start,year_end FROM school_years WHERE id=NEW.school_year_id AND archived_at IS NULL;
  IF year_start IS NULL OR NEW.starts_on<year_start OR NEW.ends_on>year_end THEN
    RAISE EXCEPTION 'Grading period dates must be within the selected School Year' USING ERRCODE='23514';
  END IF;
  IF NEW.academic_term_id IS NOT NULL THEN
    SELECT school_year_id,starts_on,ends_on INTO term_year,term_start,term_end FROM academic_terms WHERE id=NEW.academic_term_id AND archived_at IS NULL;
    IF term_year IS NULL OR term_year<>NEW.school_year_id THEN
      RAISE EXCEPTION 'Grading period Term must belong to the selected School Year' USING ERRCODE='23514';
    END IF;
    IF NEW.starts_on<term_start OR NEW.ends_on>term_end THEN
      RAISE EXCEPTION 'Term-linked grading period dates must be within the selected Term' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS grading_period_scope ON grading_periods;
CREATE TRIGGER grading_period_scope BEFORE INSERT OR UPDATE ON grading_periods FOR EACH ROW EXECUTE FUNCTION validate_grading_period_scope();
