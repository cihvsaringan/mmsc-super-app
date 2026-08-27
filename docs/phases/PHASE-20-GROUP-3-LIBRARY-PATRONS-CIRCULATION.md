# Phase 20 — Group 3: Patrons, School ID Scanning & Circulation

Status: Completed on 2026-08-27. Phase 20 remains In Progress; Groups 4–7 have not been started.

## Patron identity and credentials

Library patrons are a least-data projection over canonical `students` and `employees`; active `teacher_profiles` cause an Employee to be presented operationally as a Teacher without creating another patron record. Students are eligible only when their canonical status is enrolled and they have an enrolled placement in the active school year. Employees and Teachers are eligible only with active employment. Responses expose only name, school identifier, permitted photo, current grade/section where applicable, identity/eligibility status, and Library counts.

School barcode, RFID, and QR credentials are resolved by SHA-256 digest against the centralized `credentials` table. The Library endpoint requires both portal access and `library.patrons.view`, accepts the scan only in the request body, and never returns, logs, or audits the raw scan. Attendance terminal events and attendance records are not queried or modified.

## Loan lifecycle and workflows

Migration 0049 adds `library_loans`, referencing one physical copy and exactly one canonical Student or Employee. It preserves checkout/due/return timestamps, checkout and return operators, renewal count/operator/timestamp, override reason, timestamps, and optimistic version. A partial unique index permits only one active loan per copy, with patron, due-date, and copy-history indexes supporting paginated operational reads.

Checkout resolves eligibility server-side, locks all requested copies in sorted order, requires every copy to be `available`, computes the due date from `library_settings.default_loan_days`, inserts every loan, and changes every copy to `checked_out` in one transaction. Duplicate client items are rejected by validation; the active-loan unique index closes concurrent races. Check-in needs only the copy barcode, locks the copy then its active loan, records the return operator/time, and restores `available` atomically. Renewal locks the loan, enforces `maximum_renewals`, computes the new due date server-side, and updates the same historical record.

Overrides require `library.circulation.override`, an explicit reason of at least five characters, and append a separate `CIRCULATION_OVERRIDE` audit event. Standard events are `CHECKOUT_CREATED`, `CHECKIN_COMPLETED`, and `LOAN_RENEWED`; their metadata uses internal copy/patron references and never credential values.

## API and UI

- `POST /api/v1/library/patrons/credential`
- `GET /api/v1/library/patrons`
- `GET /api/v1/library/patrons/:patronType/:personId`
- `GET /api/v1/library/circulation/copies/barcode/:barcode`
- `GET /api/v1/library/circulation/loans`
- `POST /api/v1/library/circulation/checkout`
- `POST /api/v1/library/circulation/checkin`
- `POST /api/v1/library/circulation/loans/:id/renew`

The Checkout workspace keeps a resolved patron loaded while rapid copy scans build a pending batch. Check-in autofocuses the copy scanner, needs no patron scan, and retains recent-return feedback. Patrons supports credential/manual lookup, concise profiles, paginated history contracts, overdue indicators, and authorized renewal.

## Verification

- All 43 migrations validated and migration 0049 applied successfully.
- Rollback-only PostgreSQL acceptance passed centralized RFID resolution, canonical patron references, active-loan uniqueness, renewal history, and return/copy synchronization; a read-only live patron projection smoke test also passed.
- API typecheck, quiet lint, production build, and all 52 files / 253 tests passed.
- Web typecheck, quiet lint, production build, and all 27 files / 87 tests passed.

## Deferred to Group 4+

Group 4 owns differentiated patron rules, configurable borrowing limits, richer overdue restrictions, and expanded override policy. Reservations/holds, fines, visitor tracking, overdue administration, and final analytics remain later Group 4–7 work.

Phase 20 Group 3 is complete. The next planned group is Phase 20 Group 4, but it has not been started.
