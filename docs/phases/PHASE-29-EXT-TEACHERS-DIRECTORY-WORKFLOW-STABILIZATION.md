# Phase 29 Extension — Teachers Directory and Workflow Stabilization

Status: Completed on 2026-08-23

## Scope

This focused post-Phase-29 extension refactors School Management → Teachers into an operational directory and stabilizes the existing Employee-to-Teacher specialization workflow. Deferred Phases 19–23 were not started.

## Implemented

- Replaced oversized Teacher cards and persistent details with a keyboard-operable table and large responsive details modal.
- Added server-side name, Employee Number, email, Department, and position search; Department, faculty status, employment status, Grade Level, Section, and Subject filters; sorting; totals; and 25-row pagination.
- Added list-level current-assignment class, section, and subject counts without persisting duplicate workload data.
- Added modal sections for Teacher overview, read-only Workforce-owned Employee profile, authoritative Academic Assignments, qualifications, School Year placement, centralized portal/account state, and audit history.
- Simplified Add Teacher to a manager-only, searchable eligible-Employee selector followed by Teacher-only setup fields.
- Rejected inactive/terminated Employees and duplicate Teacher profiles inside the authoritative creation transaction.
- Preserved the existing Employee identity, Employee Number, User link, profile media, contacts, and employment record. Teacher creation does not provision another account.
- Kept Academic Assignment changes in Assignments and portal activation in Security & Access.
- Added responsive table/modal styling, touch targets, visible focus behavior, labeled fields, non-color status text, loading, empty, and error states using the established MMSC visual system.

## API behavior

- `GET /api/v1/teachers` returns `{ items, total }` and accepts server-side directory filters, sorting, `limit`, and `offset`.
- `GET /api/v1/teachers/eligible-employees` requires `teacher.profile.manage`, searches active/on-leave Employees, and identifies Employees already specialized as Teachers.
- `GET /api/v1/teachers/:id` loads full modal detail on demand and independently scopes qualifications, School Year placement, Academic Assignments, and audit history by permission.
- Existing Teacher create/update/archive and related-resource endpoints retain validation, optimistic versioning, RBAC, and audit behavior.

No schema migration was required because `teacher_profiles.employee_id` already has the required one-to-one constraint and the assignment, qualification, placement, User, media, and audit relationships already existed.

## Verification

Completed locally on 2026-08-23:

- migration validation: no new migration required; existing ordered migrations retained
- backend typecheck: passed
- frontend typecheck: passed
- lint: passed for API and web
- API tests: 33 files, 140 tests passed
- frontend tests: 11 files, 37 tests passed
- backend production build: passed
- frontend production build: passed

The automated route regressions specifically verify paginated/filter forwarding, permission-controlled eligible-Employee lookup, and removal of restricted Teacher related data.

Deployment verification also passed:

- Docker API, PostgreSQL, and web containers rebuilt and started on the dedicated MMSC ports `14000`, `15432`, and `15173`.
- `http://localhost:14000/api/v1/health` returned HTTP 200 and `http://localhost:15173/` returned HTTP 200.
- the migration runner completed without error and PostgreSQL reported 24 applied migrations for 24 migration files.
- the live database reported 20 active Teacher profiles linked to 20 distinct Employees and zero duplicate active Employee-to-Teacher relationships.
- deployed repository integration returned all 20 Teacher summaries, a capped 25-row eligible-Employee result, and a complete Teacher detail with live qualification, placement, assignment, Employee identity, and history joins without SQL errors.

## Completion boundary

Phase 29 is complete. The next planned phases are the deferred post-MVP Phases 19–23, but none has been started.
