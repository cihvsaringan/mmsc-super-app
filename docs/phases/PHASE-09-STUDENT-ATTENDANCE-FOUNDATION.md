# Phase 9 — Student Attendance Foundation

## Post-Phase-29 stabilization — roster visibility and INTERNAL_ERROR

The administrative daily list is now driven by authoritative enrolled Student/Enrollment records and left-joins attendance for the requested date. The prior dynamic filters omitted PostgreSQL's `$` parameter marker (for example, generating `e.school_year_id=3`), which caused a UUID-versus-integer database exception and was returned through the centralized error handler as `INTERNAL_ERROR`. Correct placeholders are now used.

Students without attendance are returned as the derived `not_recorded` presentation state; no attendance row is inserted. Active School Year defaulting, roster-level search/filter/count/pagination, pending-applicant exclusion, and enrolled-state validation are enforced server-side. Local inspection on 2026-08-24 found one eligible active enrollment (`MMSC-2026-100082`), zero attendance rows for the date, and zero duplicate active Student/School Year enrollments; the roster query returned that Student as `Not Recorded`.

### Stabilization validation (2026-08-24)

| Check | Result |
|---|---|
| Backend and frontend typecheck | Passed |
| API tests | Passed — 152/152 across 34 files |
| Web tests | Passed — 48/48 across 14 files |
| API production build | Passed |
| Web production build | Passed — 1,737 modules |
| Lint | Passed with one pre-existing `Assignments.tsx` hook warning and no errors |
| Active-roster/no-attendance database check | Passed — one eligible Student returned as `not_recorded`; no attendance record created |
| Duplicate active enrollment check | Passed — zero duplicates |
| Migration runner | Blocked on two attempts by local Node runtime `uv_os_get_passwd` `ENOMEM`; this fix adds no migration and direct PostgreSQL read validation passed |

## Status

Completed

## Objective

Provide audited, enrollment-scoped student attendance independently from employee attendance while preserving a future class and shared-terminal expansion path.

## Post-Phase-29 UI alignment

The administrative Student Attendance page now defaults to today and the active School Year. Its Admissions-style operational grid uses server-side Student name/number search, sequence-ordered Grade Level and dependent Section filters, status/source filters, sorting, and 25-row pagination. Selecting a row opens complete attendance context and immutable correction history in a modal; authorized corrections reuse the existing audited adjustment endpoint. No Student master data, terminal contract, attendance ownership, dashboard, or reporting behavior changed.

Verification on 2026-08-24: API and web typechecks passed; API tests passed (34 files, 152 tests), web tests passed (14 files, 48 tests), lint completed with the previously documented Assignment hook warning only, and API/web production builds passed. No migration was required.

## Implemented Scope

- Campus daily attendance references Enrollment and therefore preserves Student, School Year, grade, and section context.
- Time in/out, status, source, late minutes, notes, optimistic versioning, and one active record per enrollment/date/scope.
- Manual, QR, RFID, administrative correction, and imported source contracts with optional idempotency keys.
- Explicit campus/class scope; future class records must reference a teaching assignment matching enrollment year and section.
- Immutable administrative before/after adjustment history and security audit events.
- Published holiday context and permission-aware Student Attendance workspace with modal entry and filtering.

## Out of Scope

Dedicated terminal/device management, classroom attendance UI, teacher assignment scoping for portal users, notifications, dashboards/reports, and all Phase 10+ behavior.

## API

- `GET /api/v1/attendance/students/context`
- `GET /api/v1/attendance/students`
- `POST /api/v1/attendance/students`
- `GET /api/v1/attendance/students/:id`
- `POST /api/v1/attendance/students/:id/adjustments`

## Verification Results

Executed on 2026-08-19:

| Check | Result |
|---|---|
| Migration validation/application | Passed — `0012_student_attendance.sql` applied transactionally |
| Repeatable seed | Passed — 3 student-attendance permissions and grants seeded; Superadmin preserved |
| Backend typecheck | Passed |
| Frontend typecheck | Passed through production build |
| Backend lint | Passed |
| Automated tests | Passed — 57/57 across 17 files |
| Backend production build | Passed |
| Frontend production build | Passed — 1,699 modules; 346.86 kB JavaScript (94.93 kB gzip) |
| Database invariants | Passed — class-scope and immutable-adjustment triggers installed |
| Live API | Passed — health `ok`, readiness `ready` on port `14000` |
| Live web | Passed — HTTP 200 on port `15173`, Phase 9 asset `index-DZVFfo8C.js` |
| Database state | Passed — migration 0012 latest; records and adjustments intentionally contain 0 rows |
| Docker isolation | Passed — web `15173`, API `14000`, PostgreSQL `15432` |

No student, enrollment, or attendance data was fabricated solely for verification.

## Next Phase

Phase 10 — Dashboards, Reporting and Core Administration is planned but has not been started.
