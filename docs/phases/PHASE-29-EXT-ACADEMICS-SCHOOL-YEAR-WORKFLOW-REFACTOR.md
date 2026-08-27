# Phase 29 Extension — Academics School Year Workflow Refactor

Date: 2026-08-24  
Status: Implemented; final verification recorded below

## Scope

This post-Phase-29 stabilization refactors the implemented Academics experience only. It does not start deferred Phases 19–23, duplicate master data, or introduce a new business domain.

## Implemented

- New School Years are always created as Planned; the create form has no status selector and the API overrides supplied creation status.
- A dedicated confirmed activation endpoint accepts only a Planned target, serializes concurrent changes by institution, row-locks lifecycle records, automatically closes the current Active year, activates the target, and audits both changes in the same transaction.
- Generic School Year updates cannot change lifecycle status. Planned and Active School Years cannot be archived.
- School Year list rows include existing Term, Section, and Calendar counts. Detail returns the owning year, scoped nested records, current Active context, and permission-scoped lifecycle history.
- Terms, Sections, and Calendar were removed from top-level navigation and are managed inside a School Year modal without changing their IDs, foreign keys, or APIs.
- Campuses, Departments, Grade Levels, Subjects, Classrooms, and Statuses use searchable 25-row operational tables, responsive controls, keyboard-operable rows, shared add/edit modals, and read-only detail for viewers.
- System School Year statuses are visibly protected and distinguished from configurable domain statuses.

## Data and compatibility

No migration is required. Existing School Year foreign keys, records, stable identifiers, unique constraints, and historical links are preserved. The existing partial unique Active School Year index remains the database-level final guard. Copy Previous Year remains deferred because no approved copy policy exists.

## Verification

Focused verification completed before the final gate:

- Web lint passed without warnings.
- Web regression suite passed: 13 files, 44 tests.
- API typecheck passed.
- Academics regressions cover top-level navigation, Planned-only creation UX, nested year configuration, and explicit activation confirmation.
- API regressions cover forced Planned creation, activation confirmation/permission, and permission-scoped detail history.

Final gate results:

- Root `pnpm typecheck`: passed for API and web.
- Root `pnpm lint`: passed for API and web without warnings.
- Root `pnpm test`: passed — API 33 files/143 tests; web 13 files/44 tests.
- Root `pnpm build`: passed — API TypeScript production build and web Vite production build.
- Docker images rebuilt and services restarted successfully. MMSC remains isolated on web `15173`, API `14000`, and PostgreSQL `15432`.
- Docker migration check passed: 24 migration files validated and 24 applied.
- Live API health returned `ok`; `/academics` returned HTTP 200 and correctly redirected an unauthenticated browser session to centralized login.
- Live database checks found exactly one Active School Year, the expected partial unique Active-year index, and zero orphan Terms, Sections, or Calendar events.
- The existing live academic lifecycle was not changed merely for verification.

## Completion boundary

## Minor stabilization — 2026-08-24

The first deployed detail projection incorrectly filtered its Enrollment count with `enrollment.archived_at IS NULL`, but the historical `enrollments` table has no `archived_at` column. PostgreSQL raised `42703` during the Sections lookup, which the centralized unexpected-error boundary correctly returned as `INTERNAL_ERROR`. The invalid predicate was removed, detail regressions now cover every School Year lifecycle status and empty/configured children, and invalid/missing IDs return validation/not-found domain responses. Academic Structure active tabs now use the scoped semantic `--on-primary` foreground, and canonical Grade Level retrieval is ordered by `sequence ASC, name ASC, id ASC` in the API and related selection contexts.

Final stabilization verification passed: API 34 files/150 tests, web 13 files/45 tests, root typecheck, lint, and production build. Docker was rebuilt successfully. The live Active School Year detail returned HTTP 200 with 4 Terms, 28 Sections, and 10 Calendar events; live Grade Levels returned configured sequence 1–14 with no null or duplicate active order values. Planned and Closed detail behavior is covered by repository regressions because the preserved live demo dataset currently has only one Active School Year.

Phase 29 is complete. The next planned phases are the deferred post-MVP Phases 19–23, but none has been started.
