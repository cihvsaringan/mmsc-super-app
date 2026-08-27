CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key varchar(500) NOT NULL UNIQUE,
  thumbnail_key varchar(500) NOT NULL UNIQUE,
  original_filename varchar(255) NOT NULL,
  mime_type varchar(100) NOT NULL CHECK (mime_type = 'image/webp'),
  size_bytes integer NOT NULL CHECK (size_bytes > 0),
  width integer NOT NULL CHECK (width > 0),
  height integer NOT NULL CHECK (height > 0),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE employees ADD COLUMN profile_photo_asset_id uuid REFERENCES media_assets(id);
ALTER TABLE students ADD COLUMN profile_photo_asset_id uuid REFERENCES media_assets(id);
CREATE INDEX employees_profile_photo_asset_idx ON employees(profile_photo_asset_id) WHERE profile_photo_asset_id IS NOT NULL;
CREATE INDEX students_profile_photo_asset_idx ON students(profile_photo_asset_id) WHERE profile_photo_asset_id IS NOT NULL;

-- Legacy deployment-specific URLs remain readable during transition, but all new
-- uploads use media_assets and logical storage keys.
