# Post-Phase 29 — Enrollment Workflow and Registrar UI Stabilization

## Status

Completed on 2026-08-23. This focused extension does not start deferred Phases 19–23 or another roadmap phase.

## Operational flow

```text
Admissions
   ↓ Approved
Pending Enrollment queue
   ↓ Registrar review
Approved School Year / Grade + valid Section + resolved curriculum
   ↓ Confirm Enrollment
Student created or linked once
   ↓
Permanent Student Number + enrolled Enrollment + Students Directory
```

An approved Admission now appears directly in the Enrollment queue as an actionable candidate. The legacy Admissions conversion API is closed with `ENROLLMENT_HANDOFF_REQUIRED`, and the Admissions UI links the Registrar to Enrollments. Applicant, Guardian, document, approved placement, and workflow context are read through their authoritative relationships; they are not recopied into a second intake form.

## New and returning Students

- New Student: no permanent Student exists at registration or approval. One transaction validates the approved Admission, Section, and configured grade-level curriculum; checks possible duplicates; allocates a concurrency-safe Student Number; creates the Student and enrolled Enrollment; links/reuses Guardians; marks the Admission converted; and writes Admission history plus security audit.
- Returning Student: the approved application must already reference an eligible existing Student. Completion reuses that Student and Student Number, rejects an existing Enrollment for the same School Year, and never creates another Student identity.
- Duplicate processing is serialized with an Admission row lock. An already converted application returns its authoritative result, while the database Student/School-Year unique constraint and active Student Number unique index remain authoritative.
- Legacy pending Enrollments remain processable through the same review modal. Completion is idempotent for an already enrolled record.
- Portal activation remains a separate centralized Security & Access workflow. Enrollment does not create portal-local credentials or bypass controlled provisioning.

## UI implementation

The Enrollments screen now uses the established Accounts, Admissions, and Students workspace language: a dark operational header, server-backed search and filters, a dense table, 25-row pagination, keyboard-operable rows, actionable Pending default, teaching empty state, and a large review modal. The old persistent selected-record panel and manual Add Enrollment form were removed from the primary Registrar workflow.

The modal provides Overview, Enrollment, Student, Guardians, Admission, Documents, and History tabs. Only Enrollment-owned values are editable during completion. School Year and approved Grade are read-only, Section choices are active and scoped to that School Year/Grade, real capacity counts appear when configured, and curriculum is resolved from grade-level subject assignments. The confirmation control is disabled while processing and when no valid Section or curriculum exists.

## Root cause fixed

The previous Admissions conversion action created a prospective Student and pending Enrollment before the Registrar completed academic placement. That contradicted the established lifecycle and left completion as a generic Enrollment edit. The authoritative creation transaction now runs only at Enrollment confirmation, where placement, identity reuse, Student Number generation, Admission lifecycle, Guardian links, and audit are committed or rolled back together.

## Status transitions

- Approved Admission is presented as UI status `Pending`, mapped to the existing actionable handoff and not persisted as a new incompatible enum.
- Successful confirmation creates or changes Enrollment status to existing value `enrolled` and Student status to existing value `enrolled`.
- Existing historical statuses (`completed`, `promoted`, `retained`, `transferred`, `withdrawn`, and `cancelled`) remain unchanged and available in the All/history directory.

## Verification

| Check | Result |
|---|---|
| Migration validation | Passed in Docker — 24 migrations |
| Migration application | Passed — `0031_enrollment_completion_student_numbers.sql` |
| API typecheck / lint / build | Passed |
| Web typecheck / lint / build | Passed — 1,733 modules; Enrollment chunk 15.63 kB / 4.76 kB gzip |
| API tests | Passed — 136 tests across 33 files |
| Web tests | Passed — 30 tests across 11 files |
| Docker rebuild | Passed — API, web, and healthy PostgreSQL running |
| Live HTTP | Passed — API health 200; `http://localhost:15173/enrollments` 200 |
| Live queue SQL | Passed — server pagination query returned the current actionable record |
| Live review SQL | Passed — current pending record resolved 2 valid Sections, 15 curriculum subjects, and 1 Guardian |
| Browser boundary | Passed — protected route correctly presented centralized login without an authenticated in-app-browser session |

The host `tsx` migration check was attempted and hit the existing Windows Node `uv_os_get_passwd` ENOMEM fault. The same validation passed before and after migration inside the deployed API container. A real Enrollment completion was deliberately not submitted during verification because the available pending record is user data; transaction behavior is covered by schemas, protected route tests, database constraints, locking, and the reviewed implementation without mutating that record.

Phase 29 is complete. The next planned phases are the deferred post-MVP Phases 19–23, but none has been started.

## Manual-test confirmation contract correction — 2026-08-23

Manual confirmation of a previously materialized pending Enrollment exposed a response-contract defect. The queue response included `candidateKind: "enrollment"`, but the Enrollment detail selector did not project `candidate_kind`. Opening the modal replaced the complete queue object with this incomplete detail object, so the frontend constructed:

```text
/enrollments/candidates/undefined/:id/complete
```

The strict route parser correctly rejected the `kind` path parameter because it accepts only `admission | enrollment`. The request body (`sectionId`, `enrollmentDate`, and `remarks`) was valid and was not the source of the error.

The detail selector now always returns canonical `candidateKind: "enrollment"`; Admission detail already returned `"admission"`. A shared frontend path builder and runtime discriminator guard prevent another malformed request if a future response drifts. Backend validation was not expanded or weakened.

Regression verification passed with canonical Admission and Enrollment route values and rejection of `student`. The deployed live pending record now preserves `queueKind="enrollment"` through review as `reviewKind="enrollment"`. Read-only integrity queries found zero duplicate Student Numbers, duplicate Student/School-Year Enrollments, partial Admission conversions, or orphan Enrollments. Since route validation occurred before the repository transaction, failed manual attempts created no partial records.

Final correction gate: API 138 tests / 33 files, web 37 tests / 11 files, both typechecks, both lint tasks, both production builds, Docker rebuild, API health 200, and web route 200 passed.

Phase 29 is complete. The next planned phases are the deferred post-MVP Phases 19–23, but none has been started.
