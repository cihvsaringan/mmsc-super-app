ALTER TABLE permissions DROP CONSTRAINT permissions_code_check;
ALTER TABLE permissions ADD CONSTRAINT permissions_code_check
  CHECK (code ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$');
