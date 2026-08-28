# Phase 29 Extension — Registration & Admissions Minor Enhancement

## Status

Implemented in source; database migration and authenticated manual acceptance remain pending.

## Existing architecture and impact audit

Public registration already created token-protected Admission drafts, used authoritative School Years and Grade Levels, supported optional protected PDF/JPEG/PNG uploads, and preserved applications through the review and Enrollment handoff. Admission documents already used randomized storage keys in the replaceable managed-storage provider. Admissions used `admission.view`, `admission.manage`, and `admission.review`; no duplicate identity, School Year, file-storage, or RBAC domain was introduced.

This enhancement is a compatible extension to Admissions, public Registration, School Years, managed files, and audit logging. It does not alter Student, Guardian, Enrollment, account activation, portal, Attendance, Clinic, Library, or Computer Laboratory ownership or contracts. Existing applications and tracking remain usable while registration is closed.

## Implementation

Migration `0062_registration_admissions_minor_enhancement.sql` adds one registration-period row per authoritative School Year, a database-enforced single enabled public period, lifecycle timestamps and actor/version metadata, plus soft-removal metadata and an active-document index. An advisory-lock transaction closes the prior period before enabling another and audits open/close actions.

The public context returns only the enabled active/planned School Year and public-safe contact values from the authoritative `schools` record. `/register` remains reachable and shows a branded closed state when disabled. Draft creation independently rejects bypass attempts with `REGISTRATION_CLOSED`; status/resume and staff processing remain available.

New-student public intake exposes one optional supporting-document upload. Staff application and protected document APIs reuse `admission_documents` and managed storage. Protected staff download, upload, soft removal, and Under Review application updates use existing Admissions permissions. Application updates lock immutable identifiers, application type/source/status, reference number, timestamps, audit metadata, and conversion links. Enrollment completion continues reading the latest saved Admission and Guardian values.

## API changes

- `GET/PUT /api/v1/admissions/registration-configuration`
- `PUT /api/v1/admissions/:id`
- `POST /api/v1/admissions/:id/documents`
- `GET/DELETE /api/v1/admissions/:id/documents/:documentId`
- `GET /api/v1/public/admissions/context` adds registration availability and public school contact data.
- `POST /api/v1/public/admissions/drafts` returns `REGISTRATION_CLOSED` when no enabled period matches the submitted School Year.

## Verification

API and Web TypeScript checks passed. Targeted lint passed. Eighteen targeted API tests and two Admissions frontend tests passed. Backend and frontend production builds passed; Vite transformed 1,770 modules. Migration validation could not start because the local TSX runtime returned `uv_os_get_passwd`/`ENOMEM`; migration application and authenticated browser/manual workflows remain pending and are not represented as passed.

## Manual acceptance

Enable an active/planned School Year in Admissions → Registration & Admissions → Activate Registration; verify `/register` accepts new and returning applications, with and without an optional PDF/JPEG/PNG. Disable it and verify the closed state uses School contact data, direct draft creation returns `REGISTRATION_CLOSED`, and status tracking plus existing Admissions records remain accessible. Move an application to Under Review, edit applicant/guardian/placement data, exercise protected document operations, approve it, then complete Enrollment and verify the latest values create/link the authoritative Student, Guardian, and Enrollment once.

This enhancement did not intentionally break or materially alter a completed phase. It extends completed Phase 15 and the post-Phase-29 Admissions/Enrollment stabilization contracts. Remaining risk is the pending database-backed and authenticated manual acceptance.

Phase 29 extension is complete in source. The next planned phase remains unchanged, but it has not been started.

## Manual-testing correction — 2026-08-28

Both reported `INTERNAL_ERROR` responses had the same confirmed database cause: the running API executed the new public/admin registration queries before migration `0062_registration_admissions_minor_enhancement.sql` had been applied, so PostgreSQL could not resolve `registration_periods`. The migration was validated through the repository runner and applied to the configured local database. A live unauthenticated request to `/api/v1/public/admissions/context` changed from HTTP 500 to HTTP 200 and returned the valid empty state `registrationEnabled: false`, an empty enabled-year list, and nullable authoritative School contact values without error.

The missing staff-assisted upload was a frontend omission: the protected shared Admission document endpoint existed, but `AssistedForm` did not render a picker and its create handler discarded the returned Admission ID. The form now renders an optional PDF/JPEG/PNG picker with the existing 8 MB server limit. It creates the Admission first, then uploads the selected file to the same `admission_documents.application_id`; if the optional upload fails, the UI explicitly reports that the application was saved and directs staff to add the file during review instead of hiding an orphan application.

Audit action values remain lowercase dotted strings accepted by the database constraint: `admission.registration.opened`, `admission.registration.closed`, `admission.application.updated`, `admission.document.uploaded`, and `admission.document.removed`. Auditing was not disabled or bypassed.

Correction verification passed: 56 migration files validated; migration `0062` applied; API and Web typechecks passed; targeted API lint and Web lint passed; 20 API tests and three Admissions frontend tests passed; backend and frontend production builds passed; Vite transformed 1,770 modules. Authenticated activation toggling and full browser lifecycle acceptance still require an authorized interactive session.

## Document handling enhancement — 2026-08-28

The document table already supported multiple rows with the same `(application_id, document_type)` and used randomized storage keys, so no schema or constraint change was required. The one-file limitation was entirely in the public/staff file controls and their create handlers. A shared `AdmissionDocumentPicker` now groups selected files by their retained document-type tag, accepts multiple selections, allows repeated additions to the same type, supports additional types, and removes individual pending files before submission. Public, staff-assisted, and Under Review flows upload each file independently through their existing authorization boundary and persist one Admission document row per file.

The protected `GET /api/v1/admissions/:applicationId/documents/:documentId` route now has an explicit Admissions UI action. It requires `admission.view`, validates both application and document IDs in the repository query, reads through the path-confined storage provider, and returns the stored bytes with the recorded MIME type and safe attachment filename. Under Review additionally exposes the shared multi-picker and existing protected removal operation to users with `admission.review`. Each stored file remains a separate visible and downloadable row even when multiple files share one document type.

Enhancement verification passed: API and Web typechecks, targeted lint, 23 API tests, five frontend tests, and both production builds. Vite transformed 1,772 modules. No migration was added for this enhancement.
