CREATE OR REPLACE FUNCTION library_validate_classifications() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.category_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM library_classifications WHERE id=NEW.category_id AND school_id=NEW.school_id AND kind='category' AND active AND archived_at IS NULL) THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Invalid Library category'; END IF;
  IF NEW.subject_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM library_classifications WHERE id=NEW.subject_id AND school_id=NEW.school_id AND kind='subject' AND active AND archived_at IS NULL) THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Invalid Library subject'; END IF;
  IF NEW.shelf_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM library_classifications WHERE id=NEW.shelf_id AND school_id=NEW.school_id AND kind='shelf' AND active AND archived_at IS NULL) THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Invalid Library shelf'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION library_validate_copy_shelf() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.shelf_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM library_classifications lc JOIN library_books b ON b.id=NEW.book_id WHERE lc.id=NEW.shelf_id AND lc.school_id=b.school_id AND lc.kind='shelf' AND lc.active AND lc.archived_at IS NULL) THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Invalid Library copy shelf'; END IF;
  RETURN NEW;
END $$;
