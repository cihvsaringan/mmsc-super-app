# Phase 15 — Registration and Admissions

## Status

Completed

## Implementation

Added a permission-gated `/admissions` Registrar workspace with a searchable status queue, structured new- and returning-student intake, authoritative academic placement choices, primary guardian capture, application details, possible Student duplicate matches, workflow history, information-request/rejection reasons, approval, and explicit SIS conversion.

The API supports context, list, create, detail, controlled status transitions, and conversion. Applications begin as drafts and may progress through submission, review, information request, approval/rejection, withdrawal, and conversion. Every transition is version checked, audited, and written to immutable history.

Approved conversion is transactional. Returning applicants use an explicitly matched Student. New applicants are checked by name/birth date or LRN before Student creation. Guardian phone/email matching reuses existing Guardian identities where possible. The transaction creates guardian relationships and one pending Enrollment using the selected School Year, Grade Level, and optional Section, then records the resulting authoritative identifiers on the preserved application.

## Data and Security

Migration `0016_registration_admissions.sql` adds staged applications, submitted guardian information, supporting-document requirement metadata, and immutable status history. Academic placement and returning-Student ownership are protected with foreign keys and a trigger. Separate `admission.view`, `admission.manage`, `admission.review`, and `admission.convert` permissions are granted to Registrar and School Administrator roles; Super Administrator receives them through the existing all-permission grant.

## Known Limitations

- Initial application intake is an authenticated Registrar/administrator workflow; a public applicant self-service experience and applicant account lifecycle are deferred until their security and product boundary is explicitly approved.
- Supporting-document metadata exists, but binary upload, verification UI, and requirement configuration are not exposed in this phase.
- Information requests are recorded in workflow history but are not externally delivered because Notification Center is Phase 17.
- Draft editing and multi-guardian expansion are not exposed in the first Registrar UI; the intake captures one primary guardian and conversion supports all staged guardian rows.
- Student numbers generated during new-student conversion use the current MMSC year/sequence convention; configurable institutional numbering remains Operational Administration.

## Verification

- Migration `0016_registration_admissions.sql` applied and all 16 migrations validated.
- Phase 15 seed completed successfully.
- Backend and frontend typechecks and lint passed.
- Backend tests: 75/75 passed across 23 files, including four Admissions route tests.
- Frontend tests: 4/4 passed across two files.
- Backend and frontend production builds passed; Vite transformed 1,708 modules and emitted a 398.59 kB JavaScript bundle (107.21 kB gzip).
- Docker API, web, and PostgreSQL services are running on isolated ports `14000`, `15173`, and `15432`. `/admissions`, API health, and API readiness returned HTTP 200; the protected Admissions API returned the expected HTTP 401 without a session.

## Next Phase

Phase 15 is complete. The next planned phase is Phase 16 — Parent / Guardian Portal, but it has not been started.
