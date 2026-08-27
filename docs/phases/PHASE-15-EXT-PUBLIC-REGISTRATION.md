# Phase 15 Extension — Public Registration and Applicant Intake

> Post-Phase-26 stabilization: an unapproved public application never creates an active Student or Guardian account. Approved conversion establishes authoritative SIS records first; portal eligibility and controlled account activation remain separate.

## Status

Completed

## Objective and Scope

Complete applicant-facing Admissions without starting the Parent Portal. The public `/register` experience supports new-student and controlled returning-student entry, structured mobile-friendly intake, affirmative privacy consent, secure draft credentials, submission, resumption, and status checking. It does not expose the administrative shell or require a staff account.

## Public Architecture

The public API is intentionally separate under `/api/v1/public/admissions`. It exposes only academic intake context, draft creation, token-scoped resume/status, submission/response, and document upload. Public submissions write the existing `admission_applications`, `admission_guardians`, `admission_documents`, and status history. They appear automatically in `/admissions` with source `public` and use the existing Registrar state machine and conversion service.

Public submission never creates Student, Guardian, or Enrollment records. After review and approval, the existing Phase 15 transaction handles duplicate checks, matched returning Students, Guardian reuse/creation, relationships, and Enrollment.

## Application Number and Resume Security

Public references use `MMREG-YYYY-NNNNNN`, backed by a PostgreSQL sequence and separate from UUID primary keys. Creation returns a 256-bit Base64URL resume token once. PostgreSQL stores only SHA-256 digest, expiry, and revocation metadata. Reference alone is insufficient; status and resume require both values and return a generic not-verified response on failure.

## Privacy, Documents, and Anti-Abuse

Submission requires an unchecked affirmative consent control and records consent timestamp plus privacy-notice version. The document endpoint accepts one PDF/JPEG/PNG up to 8 MB, generates a logical server-side storage key, and stores filename/MIME/size metadata without Base64. Documents are never served through a public unscoped URL.

Per-IP/route in-memory counters provide a development and single-instance rate-limit baseline for context, draft, resume/status, submission, and upload. Production must add shared reverse-proxy/edge throttling. Public actions are audited without resume tokens.

## API Changes

- `GET /api/v1/public/admissions/context`
- `POST /api/v1/public/admissions/drafts`
- `POST /api/v1/public/admissions/resume`
- `POST /api/v1/public/admissions/status`
- `POST /api/v1/public/admissions/submit`
- `POST /api/v1/public/admissions/documents`

Administrative `/api/v1/admissions/*` endpoints remain authenticated and permission protected.

## Database

Migration `0017_public_registration.sql` adds application source, token digest/expiry/revocation, privacy consent/version, applicant response, public document storage metadata, and the new application-number default. Existing Admissions tables and conversion relationships are reused.

## Known Limitations and Deferred Work

- The first public UI captures one primary guardian; the API/domain supports up to four submitted guardians.
- Requested-information status and applicant response are supported securely, but field-by-field draft correction and document upload controls are not yet surfaced in the public UI.
- Document review/download remains an administrative API/UI follow-up; protected intake storage is implemented.
- Draft data is captured in one final request after the guided steps; server-side partial-field autosave is not implemented.
- Email/SMS delivery, CAPTCHA, distributed rate limiting, configurable document requirements, and automatic Parent Portal accounts are deferred.
- Phase 16 will invite/link accounts only from authoritative Guardian relationships after approved conversion; applicants are not Parent Portal users.

## Verification

- Migration `0017_public_registration.sql` applied and all 17 migration files validated.
- Backend and frontend production builds passed; Vite transformed 1,709 modules and emitted a 409.70 kB JavaScript bundle (109.47 kB gzip).
- Backend/frontend typechecks and lint passed.
- Backend tests: 79/79 passed across 24 files, including four new public-route tests.
- Frontend tests: 4/4 passed across two files.
- Docker runtime verification is recorded in `DEPLOYMENT.md`.
- `/register`, public context, invalid-token denial, and API readiness were verified. Full live submission was not possible because the local database has no configured School Year or Grade Level; the UI correctly has no fabricated academic choices.

## Next Phase

Phase 15 Extension — Public Registration and Applicant Intake is complete. The next planned phase is Phase 16 — Parent / Guardian Portal, but it has not been started.
