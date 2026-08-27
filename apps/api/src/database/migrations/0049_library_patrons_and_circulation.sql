CREATE TABLE library_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  copy_id uuid NOT NULL REFERENCES library_book_copies(id),
  patron_type varchar(20) NOT NULL CHECK (patron_type IN ('student','employee')),
  student_id uuid REFERENCES students(id),
  employee_id uuid REFERENCES employees(id),
  checkout_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL,
  returned_at timestamptz,
  checkout_operator_id uuid NOT NULL REFERENCES users(id),
  return_operator_id uuid REFERENCES users(id),
  renewal_count integer NOT NULL DEFAULT 0 CHECK (renewal_count >= 0),
  last_renewed_at timestamptz,
  last_renewed_by uuid REFERENCES users(id),
  override_used boolean NOT NULL DEFAULT false,
  override_reason varchar(1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK ((patron_type='student' AND student_id IS NOT NULL AND employee_id IS NULL) OR (patron_type='employee' AND employee_id IS NOT NULL AND student_id IS NULL)),
  CHECK (due_at > checkout_at),
  CHECK (returned_at IS NULL OR returned_at >= checkout_at),
  CHECK ((override_used AND override_reason IS NOT NULL AND char_length(btrim(override_reason)) >= 5) OR (NOT override_used AND override_reason IS NULL))
);

CREATE UNIQUE INDEX library_loans_one_active_copy ON library_loans(copy_id) WHERE returned_at IS NULL;
CREATE INDEX library_loans_student_history ON library_loans(student_id,checkout_at DESC) WHERE student_id IS NOT NULL;
CREATE INDEX library_loans_employee_history ON library_loans(employee_id,checkout_at DESC) WHERE employee_id IS NOT NULL;
CREATE INDEX library_loans_due_active ON library_loans(due_at) WHERE returned_at IS NULL;
CREATE INDEX library_loans_copy_history ON library_loans(copy_id,checkout_at DESC);
