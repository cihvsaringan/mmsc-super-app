CREATE TABLE grading_periods (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_year_id uuid NOT NULL REFERENCES school_years(id), academic_term_id uuid REFERENCES academic_terms(id),
 code varchar(40) NOT NULL, name varchar(120) NOT NULL, sequence integer NOT NULL CHECK(sequence>0), starts_on date NOT NULL, ends_on date NOT NULL,
 status varchar(20) NOT NULL DEFAULT 'open' CHECK(status IN('planned','open','closed')), weight numeric(6,3) NOT NULL DEFAULT 1 CHECK(weight>0),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),archived_at timestamptz,version integer NOT NULL DEFAULT 1 CHECK(version>0),CHECK(ends_on>=starts_on)
);
CREATE UNIQUE INDEX grading_period_active_key ON grading_periods(school_year_id,code) WHERE archived_at IS NULL;
CREATE INDEX grading_period_year_idx ON grading_periods(school_year_id,sequence) WHERE archived_at IS NULL;

CREATE TABLE gradebooks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),teaching_assignment_id uuid NOT NULL REFERENCES teaching_assignments(id),grading_period_id uuid NOT NULL REFERENCES grading_periods(id),
 status varchar(20) NOT NULL DEFAULT 'draft' CHECK(status IN('draft','submitted','reviewed','published','locked')),submitted_at timestamptz,submitted_by uuid REFERENCES users(id),reviewed_at timestamptz,reviewed_by uuid REFERENCES users(id),published_at timestamptz,published_by uuid REFERENCES users(id),locked_at timestamptz,locked_by uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),version integer NOT NULL DEFAULT 1 CHECK(version>0),UNIQUE(teaching_assignment_id,grading_period_id)
);
CREATE INDEX gradebooks_status_idx ON gradebooks(status,updated_at DESC);

CREATE TABLE student_grades (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),gradebook_id uuid NOT NULL REFERENCES gradebooks(id),enrollment_id uuid NOT NULL REFERENCES enrollments(id),raw_score numeric(8,2) CHECK(raw_score IS NULL OR raw_score>=0),final_grade numeric(5,2) CHECK(final_grade IS NULL OR(final_grade>=0 AND final_grade<=100)),remarks varchar(1000),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),version integer NOT NULL DEFAULT 1 CHECK(version>0),UNIQUE(gradebook_id,enrollment_id)
);
CREATE INDEX student_grades_enrollment_idx ON student_grades(enrollment_id,gradebook_id);

CREATE TABLE grade_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),gradebook_id uuid NOT NULL REFERENCES gradebooks(id),student_grade_id uuid REFERENCES student_grades(id),actor_user_id uuid NOT NULL REFERENCES users(id),action varchar(40) NOT NULL,before_value jsonb,after_value jsonb,reason varchar(1000),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX grade_history_book_idx ON grade_history(gradebook_id,created_at DESC);

CREATE OR REPLACE FUNCTION validate_grade_scope() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE assignment_section uuid;assignment_year uuid;enrollment_section uuid;enrollment_year uuid;period_year uuid; BEGIN
 SELECT ta.section_id,c.school_year_id INTO assignment_section,assignment_year FROM gradebooks gb JOIN teaching_assignments ta ON ta.id=gb.teaching_assignment_id JOIN subject_grade_level_assignments c ON c.id=ta.subject_grade_level_assignment_id WHERE gb.id=NEW.gradebook_id;
 SELECT section_id,school_year_id INTO enrollment_section,enrollment_year FROM enrollments WHERE id=NEW.enrollment_id;
 IF assignment_section IS NULL OR enrollment_section<>assignment_section OR enrollment_year<>assignment_year THEN RAISE EXCEPTION 'Grade enrollment must match gradebook assignment scope' USING ERRCODE='23514'; END IF; RETURN NEW; END $$;
CREATE TRIGGER student_grade_scope BEFORE INSERT OR UPDATE ON student_grades FOR EACH ROW EXECUTE FUNCTION validate_grade_scope();
