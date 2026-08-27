CREATE SEQUENCE library_accession_sequence AS bigint START WITH 1;

CREATE TABLE library_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id),
  kind varchar(20) NOT NULL CHECK (kind IN ('category','subject','shelf')),
  code varchar(40),
  name varchar(160) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE UNIQUE INDEX library_classifications_name_unique ON library_classifications(school_id,kind,lower(name)) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX library_classifications_code_unique ON library_classifications(school_id,kind,lower(code)) WHERE code IS NOT NULL AND archived_at IS NULL;

CREATE TABLE library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id),
  title varchar(300) NOT NULL,
  subtitle varchar(300),
  isbn varchar(30),
  author varchar(240) NOT NULL,
  additional_authors text[] NOT NULL DEFAULT '{}',
  publisher varchar(240),
  publication_year integer CHECK (publication_year BETWEEN 1000 AND 2200),
  edition varchar(100),
  category_id uuid REFERENCES library_classifications(id),
  subject_id uuid REFERENCES library_classifications(id),
  language varchar(80) NOT NULL DEFAULT 'English',
  description text,
  call_number varchar(100),
  shelf_id uuid REFERENCES library_classifications(id),
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1
);
CREATE INDEX library_books_search_idx ON library_books(lower(title),lower(author)) WHERE archived_at IS NULL;
CREATE INDEX library_books_classification_idx ON library_books(category_id,subject_id,shelf_id) WHERE archived_at IS NULL;
CREATE INDEX library_books_isbn_idx ON library_books(isbn) WHERE isbn IS NOT NULL AND archived_at IS NULL;

CREATE TABLE library_book_copies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES library_books(id),
  accession_number varchar(80) NOT NULL,
  barcode varchar(120) NOT NULL,
  copy_number integer NOT NULL CHECK (copy_number > 0),
  shelf_id uuid REFERENCES library_classifications(id),
  acquisition_date date,
  condition varchar(20) NOT NULL DEFAULT 'good' CHECK (condition IN ('new','good','fair','poor','damaged')),
  status varchar(30) NOT NULL DEFAULT 'available' CHECK (status IN ('available','checked_out','reserved','lost','damaged','under_repair','withdrawn')),
  notes text,
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE(book_id,copy_number)
);
CREATE UNIQUE INDEX library_copies_accession_unique ON library_book_copies(lower(btrim(accession_number)));
CREATE UNIQUE INDEX library_copies_barcode_unique ON library_book_copies(lower(btrim(barcode)));
CREATE INDEX library_copies_barcode_lookup_idx ON library_book_copies(lower(btrim(barcode)));
CREATE INDEX library_copies_book_status_idx ON library_book_copies(book_id,status);

CREATE OR REPLACE FUNCTION library_validate_classifications() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.category_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM library_classifications WHERE id=NEW.category_id AND school_id=NEW.school_id AND kind='category' AND active AND archived_at IS NULL) THEN RAISE EXCEPTION 'Invalid Library category'; END IF;
  IF NEW.subject_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM library_classifications WHERE id=NEW.subject_id AND school_id=NEW.school_id AND kind='subject' AND active AND archived_at IS NULL) THEN RAISE EXCEPTION 'Invalid Library subject'; END IF;
  IF NEW.shelf_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM library_classifications WHERE id=NEW.shelf_id AND school_id=NEW.school_id AND kind='shelf' AND active AND archived_at IS NULL) THEN RAISE EXCEPTION 'Invalid Library shelf'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER library_books_classification_guard BEFORE INSERT OR UPDATE ON library_books FOR EACH ROW EXECUTE FUNCTION library_validate_classifications();

CREATE OR REPLACE FUNCTION library_validate_copy_shelf() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.shelf_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM library_classifications lc JOIN library_books b ON b.id=NEW.book_id WHERE lc.id=NEW.shelf_id AND lc.school_id=b.school_id AND lc.kind='shelf' AND lc.active AND lc.archived_at IS NULL) THEN RAISE EXCEPTION 'Invalid Library copy shelf'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER library_copy_shelf_guard BEFORE INSERT OR UPDATE ON library_book_copies FOR EACH ROW EXECUTE FUNCTION library_validate_copy_shelf();
