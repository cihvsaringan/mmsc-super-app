CREATE SEQUENCE IF NOT EXISTS student_number_seq;

SELECT setval(
  'student_number_seq',
  GREATEST(
    COALESCE((SELECT max((regexp_match(student_number, '([0-9]+)$'))[1]::bigint) FROM students WHERE student_number ~ '[0-9]+$'), 0),
    1
  ),
  true
);

COMMENT ON SEQUENCE student_number_seq IS
  'Concurrency-safe source for permanent Student Numbers generated only when Enrollment is completed.';
