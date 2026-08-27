# Phase 5 — Student Information System Core

## Status

Completed

## Phase 5 Extension — Workforce Stabilization and Standardized Create Modals

This bounded extension repairs Workforce employee creation, preserves server validation details in the web client, and standardizes existing Add/New/Create workflows in Workforce, Teachers, Students, Academics, and Security on one accessible application modal. It does not add enrollment, academic-history, or any other Phase 6 behavior.

### Extension completion gate

- Diagnose and verify employee creation against the authoritative API schema.
- Add a reusable, responsive modal with focus, keyboard, backdrop, busy, and error behavior.
- Convert existing create workflows without displacing established detail views.
- Add regression coverage for modal interaction, validation, failures, cancellation, and duplicate submission.
- Run and record the full Phase 5 verification matrix before returning this document to Completed.

### Extension implementation record

- Root cause: Workforce always sent `status=` for its default “All statuses” filter, while the API accepted only a concrete status or an omitted parameter. This made the initial directory request fail and left the create experience in a misleading validation-error state. The API now normalizes blank optional filters to omission. In addition, `apps/web/src/lib/api.ts` had discarded Zod `error.details`; field errors are now preserved and displayed. The normalized employee payload was verified directly against the live API and accepted without database changes.
- Shared UI: one `Modal` component now provides accessible labeling, focus containment/restoration, Escape/backdrop/close behavior, responsive small/medium/large sizing, scrollable content, error presentation, and busy-state protection.
- Converted create flows: Workforce employee, Teacher profile, Student profile, every Academics resource tab, and Security user. Existing profile/detail panels remain in place.
- API/database: the existing Workforce directory endpoint now treats blank optional search/status/department filters as omitted. No employee-create schema, endpoint, migration, or relational schema change was required.
- Regression coverage: normalized web employee payload schema coverage plus modal labeling, required controls, error display, close button, Cancel-equivalent close behavior, Escape, backdrop, and busy/double-submit protection.

### Extension verification results

Executed on 2026-08-18:

| Check | Result |
|---|---|
| Migration validation | Passed — 7 migration files validated |
| Backend typecheck | Passed |
| Frontend typecheck | Passed through production Docker build |
| Backend lint | Passed |
| Frontend lint | Passed |
| Backend tests | Passed — 34/34 across 12 files, including blank filters and normalized employee payload |
| Frontend tests | Passed — 4/4 across 2 files |
| Backend production build | Passed |
| Frontend production build | Passed — 1,693 modules transformed |
| Live employee payload | Passed — created through the API, then archived with audit history preserved |
| Docker runtime | Passed — PostgreSQL, API, and web running on ports 15432, 14000, and 15173 |
| Browser regression | Passed — Workforce loaded with “All statuses” and no alert; Add Employee opened an accessible dialog with six required controls |

The initial local `pnpm` invocation was blocked by its non-interactive modules-purge guard, so all authoritative checks were rerun in clean Docker build/test environments.

## Objective

Create permanent student identities and reusable guardian records with explicit relationships, strict minor-data permissions, durable history, and no duplication of school-year enrollment placement.

## Scope

- permanent student identity, student number, LRN, names, demographic details, contacts, address, profile-photo reference, entry date, previous school, lifecycle status, and notes
- independent reusable guardian records with contact/address details
- typed student/guardian relationships for mother, father, guardian, legal guardian, emergency contact, and authorized pickup
- student and guardian search/profile workflows, archival, optimistic concurrency, RBAC, and immutable audits
- permission-aware Students web workspace

## Out of Scope

School-year Enrollment entities, grade/section placement, academic history, class assignments, attendance, grades, admissions workflow, portals, medical records, document binaries, and all Phase 6+ behavior. The student lifecycle status in Phase 5 is not a substitute for historical Enrollment.

## Expected Database Changes

Add `students`, `guardians`, and `student_guardians` with UUID identifiers, school/account foreign keys, student-number/LRN constraints, reusable guardian identity, typed many-to-many relationships, indexes, timestamps, optimistic versions, and archival fields.

## Expected API Work

Validated student context, directory/profile/create/update/archive, guardian directory/create/update/archive, and relationship create/archive endpoints under `/api/v1/students`. Standard directory responses must omit LRN and sensitive profile details; detail access and LRN use dedicated permissions and audited reads.

## Expected UI Work

Add permission-aware Students navigation and a responsive SIS directory/profile workspace with student creation/editing, guardian search/reuse/creation, and relationship management. Do not show grade, section, or school-year enrollment controls.

## Permissions

- `student.profile.view`, `student.profile.manage`, `student.profile.archive`
- `student.sensitive.view`, `student.sensitive.manage`
- `guardian.view`, `guardian.manage`
- `student.guardian.manage`

## Audit Events

Audit student profile access/create/update/archive, sensitive LRN access or mutation, guardian access/create/update/archive, and relationship create/archive. Do not copy LRN or private contact values into audit metadata.

## Seed / Sample Data

Seed eight Phase 5 permissions and appropriate grants to existing roles. Do not fabricate students, guardians, relationships, or enrollment records.

## Testing Strategy

Validate migration structure and strict schemas; test permanent-identity and LRN validation, permission/redaction boundaries, reusable guardian relationships, later-phase field rejection, and API routes; retain earlier regressions; then run migration, seed, typecheck, lint, automated tests, production builds, and live Docker verification.

## Implementation Summary

- Added migration `0007_student_information_system_core.sql` with permanent students, reusable guardians, and typed relationship records.
- Added `/api/v1/students` context, directory/profile, guardian search/create/update/archive, and relationship create/archive APIs.
- Added 12-digit LRN validation/uniqueness, dedicated sensitive permissions, redacted directory responses, audited profile/LRN/guardian access, and same-school relationship enforcement.
- Added a responsive Students workspace for protected profiles, guardian creation/reuse, and explicit relationship management.
- Added eight permissions and role grants without creating sample student, guardian, or enrollment records.
- Updated application packages to version `0.6.0`.

## Verification Results

Executed on 2026-08-18:

| Check | Result |
|---|---|
| Migration file validation | Passed — 7 migrations validated |
| Actual PostgreSQL migration | Passed — `0007_student_information_system_core.sql` applied |
| Phase 5 seed | Passed — 8 SIS permissions and 8 Registrar grants; Superadmin preserved |
| Fabricated data check | Passed — 0 students, 0 guardians, 0 relationships |
| Backend typecheck | Passed |
| Frontend typecheck | Passed |
| Backend lint | Passed |
| Frontend lint | Passed |
| Backend tests | Passed — 34/34 across 12 files after the Phase 5 extension |
| Frontend tests | Passed — 4/4 across 2 files after the Phase 5 extension |
| Backend production build | Passed |
| Frontend production build | Passed — 1,693 modules, 303.76 kB JS (90.17 kB gzip) |
| Docker runtime | Passed — PostgreSQL, API, and web running on dedicated MMSC ports |
| Runtime health | Passed — web HTTP 200, API healthy/ready, database ready |
| Authorization boundary | Passed — anonymous student request returned 401 |

## Known Limitations

- Phase 5 lifecycle status is a current summary only; Phase 6 Enrollment will become the authoritative historical record for yearly enrollment and placement.
- Guardian duplicate prevention is workflow-assisted through search/reuse rather than unsafe uniqueness on shared phone numbers or family email addresses.
- Binary profile-photo storage is not implemented; only a URL reference is stored.
- Parent/guardian accounts and self-service access remain deferred to Phase 16 under the roadmap revision after Phase 14 and must use explicit `student_guardians` relationships.
- The temporary local Superadmin bootstrap configuration remains in the git-ignored `.env` at the user's request.

## Next Phase

Phase 6 — Enrollment and Student Academic History is planned but has not been started.

Phase 5 is complete. The next planned phase is Phase 6, but it has not been started.
