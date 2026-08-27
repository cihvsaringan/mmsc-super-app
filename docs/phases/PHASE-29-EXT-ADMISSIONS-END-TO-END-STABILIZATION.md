# Phase 29 Extension — End-to-End Admissions Stabilization

## Status

Completed

## Scope

This extension fixes the public `/register` defects for New Applicants and Returning Students together with the Registrar queue transition defect. No deferred Post-MVP module was started.

## New Applicant

The root public failure was generated SQL containing `is_primary` twice when inserting the submitted guardian. PostgreSQL rejected the statement and the global error boundary safely returned `INTERNAL_ERROR`. Guardian mapping now excludes the service-owned primary flag, so the transaction writes it exactly once. Placement is validated against the active primary MMSC institution, an available School Year, active Grade Level, and matching optional Section before insert. An active same-name/birth-date/year submission returns `DUPLICATE_ACTIVE_APPLICATION` rather than creating a second staged record.

The frontend now creates the secure draft and submits it in the same guarded action, retains the draft credentials if submission needs retrying, prevents in-page repeated actions, and presents applicant name, application number, Submitted status, tracking token, and Registrar-queue instructions on success.

## Returning Student

Returning verification remains intentionally non-enumerable and requires Student Number, birth date, and LRN when provided. It is additionally constrained to the selected MMSC school. After verification, the application links `existing_student_id` and uses authoritative Student identity fields instead of trusting conflicting public name values. Both the service and migration 0030 prevent more than one active application for the same Student and School Year. A repeat submission of the same token is idempotent.

## Registrar Workflow

The Registrar transition query reused one PostgreSQL parameter as both `varchar` and untyped text in several `CASE` expressions, producing SQLSTATE `42P08`. Explicit status typing corrects the query. Public history now uses a nullable actor for genuine public actions; detail reads display `Public applicant`, while authenticated Registrar transitions retain the centralized User actor.

## Data Integrity and Security

- Draft application, guardians, initial history, and audit event commit or roll back together.
- Application numbers remain sequence-generated and unique in the existing `MMREG-YYYY-NNNNNN` format.
- Migration 0030 adds an active-returning partial unique index and permits actorless public history.
- Input schemas, consent, hashed resume tokens, expiry, rate limits, public-safe DTOs, upload signature/size checks, and correlation-aware unexpected-error logging remain intact.
- Public intake creates no permanent Student, Guardian, Enrollment, or portal account.

## Automated Verification

- Backend: 126 tests across 32 files passed, including queue filter, sorting, and pagination coverage plus the public transaction regressions.
- Frontend: 28 tests across 10 files passed, including queue-grid, modal-review, and assisted-registration isolation coverage.
- Backend/frontend typechecks and lint passed.
- Backend/frontend production builds passed; Vite transformed 1,729 modules.
- Host migration execution was attempted and hit the recurring local `uv_os_get_passwd ENOMEM` runtime limitation. Docker migration execution succeeded, applied migration 0030, and validated all 23 migration files.

## End-to-End Verification

Live Docker verification completed this path for both modes:

```text
/register → draft transaction → Submitted → Admissions Queue
→ Application Details → Under Review
```

- New Applicant `MMREG-2026-100075` appeared in the queue with one guardian and Draft/Submitted history, then transitioned to Under Review.
- Returning Student `MMREG-2026-100076` resolved to authoritative Student `MMSC-2026-0002` (`Bayani Castillo`), ignored conflicting public name input, appeared in the same queue, and transitioned to Under Review.
- Repeating submission for `MMREG-2026-100076` returned the existing Submitted result without another history record.
- The live `/register` page loaded at `http://localhost:15173/register` with New, Returning, and Status entry points and no browser console warnings/errors.

## Application Queue UI Refactor

The Registrar workspace now follows the Security & Access Accounts pattern:

```text
Application Queue Grid
→ Search / Filter / Sort / Server Pagination
→ Applicant Review Modal
→ Complete Registration Details and Documents
→ Workflow History
→ Authorized Workflow Actions
```

The default queue shows Submitted, Under Review, and Information Requested applications for the active School Year. Search covers applicant/application number, returning Student Number, and primary contact. The main page no longer renders a selected applicant beside the queue. The large responsive modal displays every applicable persisted registration field; document metadata is shown without exposing storage keys, and file download remains unavailable because no protected administrative download endpoint exists.

The completion gate passed backend/frontend typechecks, lint, 126 backend tests, 28 frontend tests, both production builds, and Docker validation of all 23 migration files. A live authenticated localhost request returned the expected 12 pending-work items, including submitted, under-review, and information-requested records with primary-contact and returning-Student data. Both the API and web containers are running on ports `14000` and `15173`. The in-app browser confirmed that the protected Admissions route redirects unauthenticated sessions to centralized login; visual review behind authentication was not performed because the browser session did not already contain an authorized login.

## Fresh Lifecycle Manual-Test Reset

The local MVP database was reset for a fresh `/register`-first manual cycle. The targeted command cleared 28 Applications, 49 workflow-history rows, 72 Admission document rows, 199 Students, 198 Enrollments and relationships, 114 Guardians, 170 student-attendance records, two student manual-attendance events and histories, and 31 active Student/Guardian portal accounts. It issued safe idempotent deletion for 72 exact Admission upload keys with no cleanup failure (including metadata-only demo keys that may already have been absent) and retained immutable system audit events.

Retained baselines remained unchanged: one MMSC School Year, 14 Grade Levels, 28 Sections, 24 Subjects, 20 Classrooms, 30 Employees, 20 Teachers, 60 Employee Attendance records (30 belonging to Teachers), one Attendance Terminal, seven active administrative/operational accounts, and one active Super Administrator. A second reset deleted zero rows, proving idempotency. Super Admin login, Security & Access, Academics, Teachers, Workforce, zero-state Admissions/Students/Enrollments/Student Attendance, Dashboard, Reports, and public `/register` smoke checks passed. No lifecycle demo records were reseeded.

## Student Master Directory UI Refactor

Students now follows the same operational pattern as Accounts and Admissions: server-side search, School Year/Grade/Section/status filters, sorting, 25-row pagination, a dense directory grid, and modal-only Student review. The modal separates Profile, Enrollment, Guardians, linked Admissions Documents, and Account status. Optimized managed-media thumbnails are used in the grid, while authorized profile-photo changes continue through the existing validated media service.

The former “Activate shown portal accounts” action and its credential-result dialog were removed completely. The Account tab is informational and directs authorized staff to Security & Access → Portal Activation. Formal placement changes remain in Enrollment, and Admissions files are referenced as metadata without copying or exposing storage keys. Student-owned document upload is truthfully unavailable until a protected Student document domain exists.

## Next Phase

Phase 29 extension is complete. The next planned phase is Phase 19, but it has not been started.
