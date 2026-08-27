# Phase 2 — School Structure and Academic Master Data

## Status

Completed

## Objective

Create the reusable, school-year-aware organizational and academic configuration that later HRIS, SIS, enrollment, teaching, grading, attendance, and portal modules will reference.

## Scope

- school profile and campus management
- first-class school years and ordered academic terms/grading periods
- departments, grade levels, sections, subjects, and classrooms
- configurable academic statuses
- school calendar and event foundation
- permission-protected REST APIs, archival workflows, audits, and responsive administration UI
- seed of MMSC organization identity, default campus, Phase 2 permissions, and role grants

## Out of Scope

Employees, teachers, students, guardians, enrollments, teacher/class assignments, attendance records, grades, portals, notifications, and all Phase 3+ functionality.

## Expected Database Changes

Add `schools`, `campuses`, `school_years`, `academic_terms`, `departments`, `grade_levels`, `sections`, `subjects`, `classrooms`, `academic_statuses`, and `calendar_events` with UUID identifiers, foreign keys, uniqueness, date/range constraints, indexes, timestamps, optimistic versions, and archival fields.

## Expected API Work

Validated list/create/update/archive endpoints under `/api/v1/academics`, backed by an allowlisted master-data repository and immutable Phase 1 audit events.

## Expected UI Work

Permission-aware Academics navigation and a responsive configuration workspace for organization, academic structure, yearly placement, and calendar records. Forms must use live relational choices and must not introduce fake domain functionality.

## Permissions

- `academic.config.view`
- `academic.config.manage`
- `academic.calendar.view`
- `academic.calendar.manage`

## Audit Events

Create, update, and archive events for every Phase 2 master-data resource.

## Seed / Sample Data

Seed the real organization identity “My Messiah School of Cavite,” a configurable Main Campus record, Phase 2 permissions, and appropriate grants to existing system roles. Do not seed a fabricated school year or academic records.

## Testing Strategy

Validate migration structure; unit-test strict per-resource schemas and allowlisting; test authentication/permission route boundaries with repository mocking; retain Phase 0/1 regressions; apply migration/seed to the live Docker PostgreSQL service; run typecheck, lint, tests, production builds, image rebuild, and HTTP/database readiness checks.

## Architecture

Phase 2 is a bounded academic master-data module. A hardcoded resource allowlist connects strict Zod schemas to known tables and permissions. Repository transactions couple version-checked creates/updates/archives with immutable audits. School Year owns terms and scopes sections, preventing current-year assumptions.

## Database Changes

- Migration `0004_academic_master_data.sql`
- Added `schools`, `campuses`, `school_years`, `academic_terms`, `departments`, `grade_levels`, `sections`, `subjects`, `classrooms`, `academic_statuses`, and `calendar_events`
- Added ownership/history foreign keys, partial unique indexes, date/status/capacity constraints, query indexes, timestamps, optimistic versions, and archival fields
- Enforced one active school year per school

## Backend Changes

- Added allowlisted GET/POST/PATCH/archival DELETE APIs for all Phase 2 resources
- Added per-resource strict create/update schemas and chronological validation
- Added optimistic conflict responses and database relationship/conflict handling
- Added academic configuration/calendar permission checks and immutable create/update/archive audits

## Frontend Changes

- Added permission-gated Academics navigation and responsive administration workspace
- Added tabs for organization, campus, school years, terms, departments, grade levels, sections, subjects, classrooms, statuses, and calendar
- Added live relational selectors, create/edit forms, record lists, concurrency-aware saves, and archive confirmation
- Updated Dashboard to Phase 2 while keeping Phase 3 functionality hidden

## Permissions

- `academic.config.view`
- `academic.config.manage`
- `academic.calendar.view`
- `academic.calendar.manage`

## Audit Events

Each resource emits `academic.<resource>.create`, `.update`, and `.archive` success events with actor, target, request, IP, and timestamp through the immutable Phase 1 audit table.

## Seed / Sample Data

Seeded the real My Messiah School of Cavite organization and a Main Campus foundation, four permissions, and grants for Super Administrator, School Administrator, Principal, Registrar, and Teacher as appropriate. No school year, grade, section, subject, or event was fabricated.

## Tests

- Resource allowlist excludes later-phase students/grades
- School-year date validation and calendar-event schema validation
- Academic API viewer success, manage denial, and unknown resource handling
- Phase 0/1 health, security crypto, authentication, permission, and frontend regressions

## Verification Results

Executed on 2026-08-18:

| Check | Result |
|---|---|
| Migration file validation | Passed — 4 migrations validated |
| Actual PostgreSQL migration | Passed — `0004_academic_master_data.sql` applied |
| Phase 2 seed | Passed — 1 school, 1 campus, 4 academic permissions, 0 fabricated school years |
| Backend typecheck | Passed |
| Frontend typecheck | Passed |
| Backend lint | Passed |
| Frontend lint | Passed |
| Backend tests | Passed — 14/14 across 6 files |
| Frontend tests | Passed — 1/1 |
| Backend production build | Passed |
| Frontend production build | Passed — 1,690 modules, 263.41 kB JS (82.93 kB gzip) |
| Docker image/Compose runtime | Passed — all three containers rebuilt and running |
| Runtime health | Passed — web HTTP 200, API healthy, database ready |
| Authorization boundary | Passed — anonymous academic request returned 401 |

## Known Limitations

- No bootstrap administrator exists unless credentials are explicitly added to `.env` and the seed rerun; anonymous users see the sign-in page only.
- Academic term dates are individually validated but cross-row overlap and containment inside the school-year range are not database-exclusion constrained.
- Calendar notifications, recurrence, attachments, enrollment, assignments, attendance, and grades remain deferred.
- Advanced search, pagination, and bulk import/export are deferred until data volume warrants them.

## Files Added or Modified

Academic migration, seed, resource definitions/repository/routes/tests, authenticated Academics UI and styles, Dashboard/navigation, version metadata, project/database/security/API/module/architecture/decision/roadmap/changelog documentation.

## Completion Notes

Phase 2 is running in Docker on the dedicated MMSC ports. The live database contains the MMSC organization foundation and no fabricated academic-year records. Historical master data is archived and version-protected.

## Next Phase

Phase 3 — HRIS Core / Workforce Management is planned but has not been started.
