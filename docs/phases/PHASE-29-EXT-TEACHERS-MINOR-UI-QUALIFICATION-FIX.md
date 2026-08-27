# Phase 29 Extension — Teachers Minor UI and Qualification Fix

Status: Completed on 2026-08-24

## Scope

This minor stabilization changes only the Teachers Directory heading presentation and Teacher subject-qualification mutation handling. It does not redesign the directory, modal, Employee relationship, Academic Assignments, pagination, filters, or RBAC.

## Teachers header

The Enrollments `.enrollment-queue-heading` implementation was used as the direct source. Teachers now uses the same top alignment, 13px icon gap, 19px/22px padding, white 21px H2 treatment, supporting-copy spacing, and 25px cyan-accent icon treatment. No new shared primitive was extracted for this two-selector CSS-only alignment.

## Qualification root cause and fix

The API utility already accepts every successful `2xx` response, including the endpoint's valid `201 Created`. The backend also inserted the qualification and audit event atomically in one transaction.

The false error occurred afterward in the frontend: `e.currentTarget.reset()` was called after two awaited requests. React's event `currentTarget` was no longer reliable and the reset threw. Because creation, refresh, and reset shared one broad catch, the UI displayed “Unable to add qualification” even though creation and refresh had succeeded.

The handler now captures the form before awaiting, treats creation and detail refresh as separate operations, resets only after confirmed creation, displays “Qualification added successfully,” refreshes the modal list immediately, retains entered data on a genuine create failure, and gives an explicit secondary message if creation succeeds but refresh fails. The same unsafe post-await form access was corrected in School Year placement without otherwise changing that workflow.

## Data integrity

The original migration already enforces one active qualification per Teacher and Subject through `teacher_subject_qualification_active_key`. The repository now checks that same business boundary inside the transaction and returns `409 QUALIFICATION_EXISTS`; the database constraint remains the race-safe final boundary. No new migration was needed.

## Verification

- backend typecheck: passed
- frontend typecheck: passed
- lint: passed
- API tests: 33 files, 140 tests passed
- web tests: 12 files, 40 tests passed
- qualification success/201, create failure with retained input, and post-create refresh failure regressions: passed
- backend production build: passed
- frontend production build: passed

Operational verification also passed:

- Docker web, API, and PostgreSQL services rebuilt and started on ports `15173`, `14000`, and `15432`.
- web root and API health returned HTTP 200.
- migration validation reported 24 applied migrations for the unchanged 24-file migration set.
- live PostgreSQL inspection found zero duplicate active Teacher+Subject qualifications.
- a deployed duplicate retry against an existing active qualification returned `QUALIFICATION_EXISTS` without inserting or modifying data.

## Completion boundary

Phase 29 is complete. The next planned phases are the deferred post-MVP Phases 19–23, but none has been started.
