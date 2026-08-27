# Phase 6 — Enrollment and Student Academic History

## Status

Completed

## Objective

Separate permanent student identity from append-preserved school-year enrollment and placement history.

## Scope

- one Enrollment identity per student and school year
- school year, grade level, section, enrollment status, and enrollment date
- completion, promotion, retention, transfer, and withdrawal information
- remarks, optimistic versioning, immutable audit events, RBAC, and historical student views
- responsive enrollment directory/detail UI and modal-based creation

## Out of Scope

Class/subject/teacher assignment, schedules, attendance, grades, report cards, admissions workflow, portals, fees, and all Phase 7+ behavior.

## Implemented Database Work

Implemented `enrollments` with UUID identity, foreign keys to permanent students and Phase 2 academic master data, one record per student/school year, cross-entity placement integrity, lifecycle constraints, timestamps, versions, and no destructive history replacement.

## Implemented API and Security Work

Implemented validated, versioned `/api/v1/enrollments` context, directory, detail/history, create, and update endpoints with `enrollment.view` and `enrollment.manage` permissions. All authorization and placement integrity remain server-side; mutations and protected detail reads are audited.

## Implemented UI Work

Implemented a permission-aware Enrollments workspace with school-year/status filters, student history, enrollment detail, and shared-modal creation. No Phase 7 assignment controls were added.

## Completion Gate

Validate and apply the migration, run the repeatable seed, typecheck, lint, test, build both applications, deploy Docker, and verify API/database/web behavior. Record results honestly before marking Completed.

## Implementation Summary

- Added migration `0008_enrollment_academic_history.sql` with one permanent enrollment identity per student/school year, academic foreign keys, lifecycle/date constraints, indexes, optimistic versions, and a same-school/matching-section integrity trigger.
- Added strict schemas and `/api/v1/enrollments` context, filtered directory, detail, student-history, create, and versioned update endpoints.
- Added `enrollment.view` and `enrollment.manage`, Registrar/School Administrator management grants, Principal view access, and immutable audit events.
- Added the permission-aware Enrollments navigation/workspace, modal creation, dedicated update surface, filters, detail, and preserved student timeline.
- Updated application packages to version `0.7.0` without adding Phase 7 assignment behavior.

## Verification Results

Executed on 2026-08-18:

| Check | Result |
|---|---|
| Migration validation | Passed — 8 migration files validated |
| PostgreSQL migration | Passed — `0008_enrollment_academic_history.sql` applied transactionally |
| Repeatable seed | Passed — Phase 6 permissions/grants and Superadmin preserved |
| Fabricated data check | Passed — 0 students, 0 enrollments, 0 school years, 0 grade levels, 0 sections |
| Backend typecheck | Passed |
| Frontend typecheck | Passed through production build |
| Backend lint | Passed |
| Frontend lint | Passed |
| Backend tests | Passed — 40/40 across 14 files |
| Frontend tests | Passed — 4/4 across 2 files |
| Backend production build | Passed |
| Frontend production build | Passed — 1,694 modules transformed, 326.51 kB JS (93.92 kB gzip) |
| Live API | Passed — blank-filter directory, permission-aware context, API readiness, and database connectivity |
| Live web | Passed — HTTP 200; Enrollments navigation/page/empty state and accessible Add Enrollment modal verified |

The local database intentionally has no academic configuration or students, so no enrollment was fabricated solely for verification. Cross-entity behavior is enforced by the migration trigger, service validation, schema tests, and route regressions.

## Known Limitations

- A school year, grade level, section, and permanent student must be configured before an enrollment can be created.
- Enrollment status is an administrative lifecycle record; class assignments, attendance, grades, and report cards remain deferred.
- Existing enrollment placement can be corrected with optimistic concurrency, but its permanent student/school-year identity cannot be changed or deleted.

## Next Phase

## Stabilization Extension

Implemented the Phase 6 Student/workforce/media stabilization pass:

- Root cause: Student status values were duplicated as untyped strings in frontend controls and the API query schema. A centralized frontend label/value contract and shared backend Zod enum now submit and validate only `prospective`, `enrolled`, `not_enrolled`, `inactive`, `graduated`, `transferred`, and `withdrawn`. Browser labels never become payload values, and detailed Zod issues remain visible without closing the modal.
- Existing data: PostgreSQL already has a required check constraint for the same canonical set. The verification query found no legacy invalid values, so no speculative semantic mapping or destructive migration was performed.
- Workforce: Add Position now opens the shared `Modal`, preserves input and API errors on failure, prevents duplicate submissions, closes on success, and refreshes configuration.
- Media: migration `0009_managed_profile_media.sql` adds reusable media metadata and deployment-neutral Employee/Student asset references. Authorized multipart endpoints accept JPEG, PNG, or WebP up to 5 MB, verify decoding, normalize orientation, strip metadata, and write 512px-bounded profile plus 128px thumbnail WebP variants.
- Storage: `StorageProvider` isolates physical persistence. Docker mounts the local provider at `/data/uploads` through the persistent `media_uploads` volume. Unique immutable keys provide cache busting; authenticated media responses have long-lived immutable caching. Replacement commits the new reference before removing old files, and failure cleanup removes new partial files.
- UI: Employee and Student create plus profile-edit workflows provide preview, replace, clear/remove, validation feedback, busy states, lazy thumbnails, and initials fallback. Normal JSON list responses carry only lightweight media URLs/IDs—never Base64 or image binary.
- Future migration: implement another `StorageProvider` for S3/R2/Azure/Spaces and change provider construction/delivery configuration; no Employee or Student business logic or domain records need rewriting.

### API additions

- `POST /api/v1/media/employees/:id/profile-photo`
- `GET /api/v1/media/employees/:id/profile-photo` (permission-protected compatibility read; redirects to the current immutable asset)
- `DELETE /api/v1/media/employees/:id/profile-photo`
- `POST /api/v1/media/students/:id/profile-photo`
- `GET /api/v1/media/students/:id/profile-photo` (permission-protected compatibility read; redirects to the current immutable asset)
- `DELETE /api/v1/media/students/:id/profile-photo`
- `GET /api/v1/media/:id/profile`
- `GET /api/v1/media/:id/thumbnail`

### Known limitations

- Local storage is the only provider implemented in this extension; object-storage providers remain a deployment substitution.
- Legacy absolute `profile_photo_url` values remain readable for backward compatibility but cannot be written by current Employee/Student APIs.

### Extension verification (2026-08-18)

| Check | Result |
|---|---|
| Backend typecheck | Passed |
| Backend production build | Passed |
| Frontend production bundle | Passed — 1,696 modules, 325.91 kB JS (91.95 kB gzip) |
| Frontend TypeScript project references | Attempted; blocked by local pnpm 11 resolving duplicate Vite declarations while the repository is pinned to pnpm 10.14 |
| Lint | Attempted; blocked by the same local package-store corruption (`globals` package missing) |
| Unit/integration tests | Attempted; blocked before collection by a corrupt pnpm 11 `expect-type` package missing its `branding` module |
| Migration validation/application | Attempted; blocked by the desktop Node runtime reporting `uv_os_get_passwd` ENOMEM; Docker CLI/PostgreSQL are unavailable on this execution host |
| Backend/frontend production builds | Passed independently through direct pinned compiler/bundler entrypoints |
| Docker deployment | Compose updated with persistent `media_uploads`; runtime verification unavailable because Docker CLI is not installed on this execution host |

The test/tooling failures are environmental dependency-store failures, not reported as passing tests. Re-run `pnpm install --frozen-lockfile`, the completion-gate commands, migration `0009`, and `docker compose up --build` in the normal project environment before production use.

Phase 7 — Class, Subject and Teacher Assignments is planned but has not been started.

Phase 6 is complete. The next planned phase is Phase 7, but it has not been started.
