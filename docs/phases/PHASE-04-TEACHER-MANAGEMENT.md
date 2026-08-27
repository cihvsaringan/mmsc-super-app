# Phase 4 — Teacher Management Extension

## Status

Completed

## Objective

Extend the permanent Phase 3 employee identity for teaching personnel without duplicating employee data, and establish the faculty metadata required by later academic-assignment, schedule, attendance, grading, and portal phases.

## Scope

- one-to-one teacher specialization of an existing employee
- optional distinct teacher number, faculty status, teaching department, and teaching level
- subject qualifications with proficiency and notes
- school-year faculty placement, advisory class, homeroom class, and maximum academic-load foundation
- teacher search, profiles, archival, optimistic concurrency, RBAC, and immutable audits
- permission-aware Teacher Management web workspace

## Out of Scope

Actual class/subject teacher assignments, calculated current teaching load, schedules, grade encoding, attendance, teacher portal, payroll, students, and all Phase 5+ behavior. Class/subject assignments remain Phase 7.

## Expected Database Changes

Add `teacher_profiles` as a one-to-one specialization of `employees`, `teacher_subject_qualifications` for reusable subject capability, and `teacher_school_year_assignments` for year-scoped faculty/advisory/homeroom placement. Use UUID identifiers, foreign keys to Phase 2/3 identities, uniqueness, indexes, timestamps, optimistic versions, and archival fields.

## Expected API Work

Validated teacher context, directory/profile/create/update/archive, subject-qualification, and school-year placement endpoints under `/api/v1/teachers`. Ordinary employee endpoints remain the source of personal and employment data.

## Expected UI Work

Add permission-aware Teachers navigation and a responsive faculty directory/profile workspace that creates a teacher specialization from an eligible employee and manages qualifications and yearly placement using live academic master data.

## Permissions

- `teacher.profile.view`, `teacher.profile.manage`
- `teacher.qualification.view`, `teacher.qualification.manage`
- `teacher.year_assignment.view`, `teacher.year_assignment.manage`

## Audit Events

Audit teacher profile access/create/update/archive, subject qualification changes, and school-year placement changes. Do not duplicate or log sensitive employee identifiers.

## Seed / Sample Data

Seed six Phase 4 permissions and appropriate grants to existing roles. Do not fabricate teachers, qualifications, assignments, school years, subjects, or sections.

## Testing Strategy

Validate migration structure and strict schemas; test one-to-one employee specialization, permission boundaries, later-phase field rejection, and API routes; retain all earlier regressions; then run migration, seed, typecheck, lint, automated tests, production builds, and live Docker verification.

## Implementation Summary

- Added migration `0006_teacher_management.sql` with `teacher_profiles`, `teacher_subject_qualifications`, and `teacher_school_year_assignments`.
- Added `/api/v1/teachers` context, directory/profile, qualification, and school-year-placement APIs with validation, granular permissions, archival, versions, and audit events.
- Enforced the employee specialization relationship and school-year/section consistency for advisory and homeroom placement.
- Added a responsive Teachers workspace with live eligible-employee, department, subject, school-year, and section choices.
- Added six permissions and role grants without creating sample domain records.
- Updated application packages to version `0.5.0`.

## Verification Results

Executed on 2026-08-18:

| Check | Result |
|---|---|
| Migration file validation | Passed — 6 migrations validated |
| Actual PostgreSQL migration | Passed — `0006_teacher_management.sql` applied |
| Phase 4 seed | Passed — 6 teacher permissions; existing Superadmin preserved |
| Fabricated data check | Passed — 0 teachers, 0 qualifications, 0 year assignments |
| Backend typecheck | Passed |
| Frontend typecheck | Passed |
| Backend lint | Passed |
| Frontend lint | Passed |
| Backend tests | Passed — 26/26 across 10 files |
| Frontend tests | Passed — 1/1 |
| Backend production build | Passed |
| Frontend production build | Passed — 1,692 modules, 289.70 kB JS (88.20 kB gzip) |
| Docker runtime | Passed — PostgreSQL, API, and web running on dedicated MMSC ports |
| Runtime health | Passed — web HTTP 200, API healthy/ready, database ready |
| Authorization boundary | Passed — anonymous teacher request returned 401 |

## Known Limitations

- MMSC currently has no configured school years, sections, subjects, or employee records, so teacher profiles and related records must be created from real master data through the UI.
- `maximum_load_units` is a planning limit, not calculated current load; actual assignments and calculated load remain Phase 7.
- Advisory and homeroom uniqueness are enforced, but timetable conflict detection is deferred with scheduling.
- The temporary local Superadmin bootstrap configuration remains in the git-ignored `.env` at the user's request.

## Next Phase

Phase 5 — Student Information System Core is planned but has not been started.
