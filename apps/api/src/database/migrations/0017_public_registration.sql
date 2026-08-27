ALTER TABLE admission_applications ADD COLUMN source varchar(30) NOT NULL DEFAULT 'staff_assisted' CHECK(source IN('public','staff_assisted','imported'));
ALTER TABLE admission_applications ADD COLUMN resume_token_digest char(64);
ALTER TABLE admission_applications ADD COLUMN resume_token_expires_at timestamptz;
ALTER TABLE admission_applications ADD COLUMN resume_token_revoked_at timestamptz;
ALTER TABLE admission_applications ADD COLUMN privacy_consent_at timestamptz;
ALTER TABLE admission_applications ADD COLUMN privacy_notice_version varchar(40);
ALTER TABLE admission_applications ADD COLUMN applicant_response text;
ALTER TABLE admission_applications ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE admission_applications ALTER COLUMN updated_by DROP NOT NULL;
CREATE UNIQUE INDEX admission_resume_digest_key ON admission_applications(resume_token_digest) WHERE resume_token_digest IS NOT NULL;

ALTER TABLE admission_documents ADD COLUMN storage_key varchar(1000);
ALTER TABLE admission_documents ADD COLUMN original_filename varchar(255);
ALTER TABLE admission_documents ADD COLUMN mime_type varchar(100);
ALTER TABLE admission_documents ADD COLUMN size_bytes integer CHECK(size_bytes IS NULL OR size_bytes>0);
ALTER TABLE admission_documents ADD CONSTRAINT admission_document_storage_check CHECK(media_asset_id IS NOT NULL OR storage_key IS NOT NULL);

ALTER SEQUENCE admission_application_number_seq RESTART WITH 100000;
ALTER TABLE admission_applications ALTER COLUMN application_number SET DEFAULT ('MMREG-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('admission_application_number_seq')::text,6,'0'));
