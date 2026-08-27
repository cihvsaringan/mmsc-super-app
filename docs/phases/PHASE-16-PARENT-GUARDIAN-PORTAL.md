# Phase 16 — Parent / Guardian Portal

> Post-Phase-26 stabilization: a sequence-backed Guardian Number is the Parent Portal login identifier. One Guardian-linked centralized User can retain access to multiple explicitly related children; activation is controlled, idempotent, and relationship-eligible.

## Status

Completed

## Implementation

Added a dedicated, responsive `/parent` experience that does not expose the administrative application shell. A linked parent or guardian can switch among authorized children and enrollment years, then view a child summary, enrollment placement, assigned subjects and teachers, published grades, attendance totals, and published school events.

The API exposes one permission-gated dashboard endpoint. It derives the Guardian from the authenticated centralized user account, resolves children only through active Guardian–Student relationships, and validates any requested Enrollment against the selected child. The frontend uses a purpose-built parent header and mobile bottom navigation while retaining the shared MMSC design tokens and authentication system.

## Data and Security

Phase 16 adds no migration and reuses the authoritative `users`, `guardians`, `student_guardians`, `students`, `enrollments`, Academic Core, Grading, Attendance, and Events records. The repeatable seed adds `parent.portal.access` and grants it to the Parent / Guardian role.

The API never accepts a Guardian identifier. Child and Enrollment selectors narrow an already authorized scope and cannot expand it. Only published or locked gradebooks and published events are returned. Parent DTOs omit LRN, addresses, internal notes, other Guardians, audit records, and unrelated Students.

## Account Provisioning

Portal access requires a centralized active user with the Parent / Guardian role, an active Guardian record whose `user_id` points to that user, and at least one active `student_guardians` relationship. No shared or default parent account is seeded. The temporary Super Administrator remains an administrative test account and is not a substitute for a linked Guardian account.

## Known Limitations

- Account invitation and self-service Guardian linking are not exposed in this phase; administrators must provision and link the centralized account through an approved operational process.
- Phase 17 Notification Center is not implemented. The initial dashboard shows published school events, but does not deliver targeted announcements or notifications.
- Clinic, Library, MMSC Credits, and Canteen information remain unavailable until their roadmap phases.
- `/parent/account` is a shell destination for future account-management capability and intentionally contains no profile mutation workflow.
- No parent test account or fabricated family data is seeded, so live family-data verification requires an institution-provisioned linked Guardian account.

## Verification

- All 17 migration files validated; Phase 16 correctly required no new migration.
- Phase 16 repeatable seed completed successfully.
- Backend and frontend typechecks and lint passed.
- Backend tests: 82/82 passed across 25 files, including Parent Portal permission, authenticated-scope forwarding, and malformed-selector coverage.
- Frontend tests: 4/4 passed across two files.
- Backend and frontend production builds passed; Vite transformed 1,711 modules and emitted a 416.54 kB JavaScript bundle (110.10 kB gzip).
- Docker API, web, and PostgreSQL services are running on isolated host ports `14000`, `15173`, and `15432`. `/parent`, API health, and API readiness returned HTTP 200; the protected Parent Portal API returned the expected HTTP 401 without a session.

## Next Phase

Phase 16 is complete. The next planned phase is Phase 17, but it has not been started.
