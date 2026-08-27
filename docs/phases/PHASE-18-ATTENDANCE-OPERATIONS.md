# Phase 18 — Attendance Operations, Manual Check-In & Exception Handling

Status: Completed on 2026-08-20

## Delivered scope

- Dedicated `/attendance-operations` staff experience with registered-terminal selection, live authoritative identity search, manual check-in/check-out, recent receipts, exception filtering, and authorized resolve/dismiss actions.
- Least-privilege lookup by Student/Employee Number or name. Responses expose operational verification fields only; no permanent terminal-side identity database is created.
- Manual capture for eligible current Students and Employees with explicit direction, capture time, standardized reason, optional detail, attendance status, late minutes, operator, terminal, and client UUID.
- Transactional writes into the existing employee or student attendance source of truth, with duplicate/open-record behavior surfaced as durable accepted or rejected receipts.
- Terminal-scoped idempotency, immutable event history, centralized audit entries, and permission-separated exception resolution.
- A visible Manual assistance path from the existing offline-first Attendance Terminal while retaining distinct kiosk and staff shells.

## API and authorization

- `GET /api/v1/attendance-operations/context`
- `GET /api/v1/attendance-operations/events`
- `GET /api/v1/attendance-operations/lookup`
- `POST /api/v1/attendance-operations/manual`
- `POST /api/v1/attendance-operations/events/:id/resolve`

Permissions are separated into `attendance.operations.view`, `attendance.identity.lookup`, `attendance.manual.capture`, and `attendance.exception.resolve`. Server-side checks remain authoritative. School Administrator and Attendance Operator receive operational lookup/capture access; Registrar receives lookup/capture access; Principal and School Administrator receive exception-resolution access. The Super Administrator receives all permissions through the existing full-access grant.

## Data model

Migration `0019_attendance_operations.sql` adds `attendance_manual_events` and `attendance_manual_event_history`. Events reference an active registered terminal and exactly one authoritative Student or Employee. The `(terminal_id, client_event_id)` unique constraint makes retries idempotent. History is append-only through the existing audit-mutation trigger. The polymorphic attendance record reference identifies the existing employee or campus-student attendance row without transferring ownership from those domains.

## Explicit boundaries

- Manual lookup and capture are online-only in Phase 18. Offline-first scanning remains owned by `/attendance-terminal`.
- Phase 18 does not issue credentials, register terminals, automate notifications, or add biometric matching.
- Phase 18 does not implement Clinic, Library, Laboratory, Credits, Canteen, Events, or any later-phase functionality.
- A real accepted manual capture was not inserted merely for verification because the local environment may not contain a configured operational terminal and eligible person; no fabricated school attendance record was created.

## Verification

- Migration validation: passed for all 19 files.
- Migration application: passed; `0019_attendance_operations.sql` applied.
- Repeatable seed: passed as `phase-18-attendance-operations`.
- Backend typecheck: passed.
- Backend lint: passed.
- Backend tests: 91 passed across 27 files, including 5 Phase 18 route/permission/validation tests.
- Frontend typecheck: passed.
- Frontend lint: passed.
- Frontend tests: 4 passed across 2 files.
- API production build: passed.
- Frontend production build: passed (1,714 modules transformed).
- Docker services: API, web, and PostgreSQL running on isolated host ports `14000`, `15173`, and `15432`; PostgreSQL healthy.
- Live verification: API health 200, readiness 200, `/attendance-operations` 200, and unauthenticated operations context correctly denied with 401.
- Authenticated verification: Super Administrator login, operations context, and event receipt list each returned 200 without creating fabricated attendance data.
- Browser verification: the deployed Phase 18 route resolved to the centralized sign-in boundary as expected without an authenticated session.

Phase 18 is complete. The next planned phase is Phase 24, but it has not been started.
