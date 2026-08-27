# Phase 20 Group 6 — Library overdue management and portal visibility

**Status:** Completed on 2026-08-27

## Delivered scope

- Added a server-paginated librarian queue for due-soon, due-today, 1–7 day overdue, 8–30 day overdue, and 30+ day overdue loans.
- Applied the effective institution or patron borrowing-policy grace period when classifying overdue loans and calculating days overdue.
- Added patron, title/accession, patron type, grade, section, and overdue-range filtering without adding a Library-local identity registry.
- Added read-only Student **My Library** and Parent **Child Library** views for active loans, due-soon items, overdue items, and borrowing history.
- Student data is derived only from the authenticated user's authoritative Student link. Parent selection is checked against the authenticated Guardian relationship on every request.
- Integrated due/overdue reminders with the existing Notifications domain for Students and Guardians who receive communications. Trigger dispatches are idempotent per loan and milestone and exclude returned loans.
- Added no fine, payment, wallet, or MMSC Credits behavior.

## API and data

- `GET /api/v1/library/overdue`
- `POST /api/v1/library/overdue/notifications/run`
- `GET /api/v1/student-portal/library`
- `GET /api/v1/parent-portal/library?studentId=<uuid>`
- Migration `0052_library_overdue_notifications.sql` adds only the notification dispatch ledger and its indexes.

## Security and audit

- `library.overdue.view` gates the queue; `library.overdue.manage` gates reminder dispatch.
- Portal routes retain their existing `student.portal.access` and `parent.portal.access` boundaries and never accept an arbitrary Student identity for the Student route.
- Each created reminder emits an existing Notification publish event and a centralized `LIBRARY_NOTIFICATION_CREATED` audit event without raw credentials.

## Verification

- Migration validation: passed, 46 migration files.
- Group 6 rollback database acceptance: passed (grace boundary, dispatch uniqueness, and no fines/payments).
- API and web TypeScript checks: passed.
- API and web lint: passed.
- API tests: 53 files and 264 tests passed.
- Group 6 API route tests: 3 files and 27 tests passed; Student portal UI test passed.
- Web tests: 28 files/88 tests passed in the full parallel run; one pre-existing scanner autofocus test failed only in that run and passed 2/2 when immediately isolated. A single-worker retry was attempted but the host ended before Vitest printed a summary.
- API and web production builds: passed.

Phase 20 Group 6 is complete. The next planned work is Phase 20 Group 7, but it has not been started.
