# Phase 7 — Class, Subject and Teacher Assignments

## Status

Completed

## Objective

Provide one reusable academic assignment engine linking school-year curriculum, grade levels, subjects, sections, terms, and teacher school-year placements.

## Implemented Scope

- Year-scoped subject-to-grade curriculum with optional term scope, required/elective designation, and load units.
- Primary, assistant, and substitute teacher assignments to valid section-subject combinations.
- Existing advisory and homeroom assignments remain owned by teacher school-year placement and are exposed in assignment context.
- Cross-scope database foreign keys and authoritative service validation, unique active primary teachers, archival, optimistic versions, RBAC, and audit events.
- Permission-aware Assignments UI with shared modal creation, filters, directory views, and archival actions.

## Out of Scope

Timetable periods and rooms, attendance, grading, portals, calculated workload enforcement, and all Phase 8+ behavior.

## API

- `GET /api/v1/assignments/context`
- `GET /api/v1/assignments?schoolYearId=`
- `POST /api/v1/assignments/curriculum`
- `POST /api/v1/assignments/teaching`
- `DELETE /api/v1/assignments/{curriculum|teaching}/:id?version=`

## Verification Results

Executed on 2026-08-19:

| Check | Result |
|---|---|
| Migration validation/application | Passed — `0010_academic_assignments.sql` applied transactionally |
| Repeatable seed | Passed — 2 assignment permissions and role grants seeded; Superadmin preserved |
| Backend typecheck | Passed |
| Frontend typecheck | Passed through production build |
| Backend lint | Passed |
| Automated tests | Passed — 51/51 across 15 files |
| Backend production build | Passed |
| Frontend production build | Passed — 1,697 modules; 334.88 kB JavaScript (93.46 kB gzip) |
| Live API | Passed — health `ok`, readiness `ready` on port `14000` |
| Live web | Passed — HTTP 200 on port `15173`, Phase 7 asset `index-MyjNj85z.js` |
| Docker isolation | Passed — web `15173`, API `14000`, PostgreSQL `15432` |

The database contains zero curriculum and zero teaching assignments because no school configuration or assignment records were fabricated solely for verification.

## Next Phase

Phase 8 — HRIS Attendance and Employment Foundation is planned but has not been started.
