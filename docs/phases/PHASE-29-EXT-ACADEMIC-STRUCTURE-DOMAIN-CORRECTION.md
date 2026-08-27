# Post-Phase 29 — Academic Structure Domain Correction

## Status

Completed on 2026-08-22. This extension corrects domain boundaries without starting Phases 19–23.

## Implemented

- Established one protected MMSC Institution Profile with multiple campuses.
- Removed routine internal-institution creation/archive and school selectors from institution-owned Academics workflows.
- Added normalized External Schools reference data, RBAC, centralized audit, search, active/inactive management, and Administration navigation.
- Added optional normalized previous-school references for Admissions and Students while preserving legacy free text and backfilling safe exact matches.
- Added directory-backed autocomplete to public Registration and staff-assisted Admissions; exact selections resolve to normalized references while unmatched historical/free-text values remain valid.
- Added regression coverage and updated durable architecture, database, security, API, deployment, development, decision, roadmap, and permanent instruction documents.

## Migration and compatibility

Migration 0022 is additive. It marks MMSC primary, creates the external directory, retains historical strings, backfills exact case-insensitive name matches, and adds compatibility triggers. No existing school, campus, application, student, or enrollment row is deleted.

## Verification

- Migration inventory: 22 non-empty SQL files; migration 0022 applied successfully to the local PostgreSQL database.
- Data verification: one live school remains, code `MMSC`, marked primary; no internal school, campus, Admissions, Student, or Enrollment record was deleted. The current development data contained no previous-school values requiring backfill.
- Repeatable seed: passed and installed two External Schools permissions with seven expected role grants.
- API typecheck: passed.
- Web typecheck: passed.
- API lint and web lint: passed.
- API tests: 120 passed.
- Web tests: 26 passed.
- API production build: passed.
- Web production build: passed.
- Runtime probes: web HTTP 200, API health `ok`, database readiness `connected` on isolated MMSC ports.
- Limitation: the Docker executable was unavailable to this Codex environment, so image rebuild/restart and authenticated browser interaction were not performed. The already-running pre-rebuild services were probed only; source builds and database migration/seed were verified directly.

Phase 29 is complete. The next planned post-MVP phase is Phase 19, but it has not been started.
