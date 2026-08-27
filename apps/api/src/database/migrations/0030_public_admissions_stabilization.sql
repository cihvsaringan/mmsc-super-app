ALTER TABLE admission_status_history ALTER COLUMN actor_user_id DROP NOT NULL;

CREATE UNIQUE INDEX admission_active_returning_application_key
  ON admission_applications(existing_student_id,school_year_id)
  WHERE archived_at IS NULL
    AND existing_student_id IS NOT NULL
    AND status IN('draft','submitted','under_review','information_requested','approved');
