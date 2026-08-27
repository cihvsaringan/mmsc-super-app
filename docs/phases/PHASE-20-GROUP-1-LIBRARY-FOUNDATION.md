# Phase 20 — Group 1: Library Foundation, Portal, RBAC & Security

Status: Completed on 2026-08-27. Phase 20 remains In Progress; Groups 2–7 have not been started.

## Scope completed

Library is a purpose-built `/library/*` operational experience using the existing Super App session, route-derived Portal Switcher state, shared design system, centralized RBAC, and audit infrastructure. The permission-filtered responsive shell includes Dashboard, Checkout, Check-in, Catalog, Patrons, Visitors, Overdue, Reports, and Settings. Deferred destinations render truthful internal empty states and no operational control writes future-domain data.

The Dashboard uses `GET /api/v1/library/dashboard` and returns zero-safe metrics until authoritative catalog, copy, loan, and visitor tables arrive in Groups 2–7. Settings use `GET/PUT /api/v1/library/settings`; updates are validated, permission-protected, transactional, and centrally audited.

## Data and identity architecture

Migration `0046_library_group1_foundation.sql` creates only `library_settings`, with one row per canonical MMSC school and constrained default loan/renewal values. Book, copy, loan, visitor, and Library-local patron tables are intentionally deferred to their owning groups.

Library patrons will resolve from authoritative Student and Employee identities. Barcode/RFID lookup will reuse the centralized digest-backed Credential domain introduced for Attendance, but Library will never reuse Attendance events or maintain a duplicate credential/person registry.

## RBAC and audit

Twenty `library.*` permissions cover portal entry, dashboard, catalog, copies, circulation operations and override, patrons, visitors, overdue, reports, and settings. Built-in roles are Library Administrator, Librarian, and Library Assistant. Library Administrator and Super Administrator receive all Library grants; Librarian excludes settings management and circulation override; Library Assistant receives least-privilege lookup, circulation, and visitor operations.

Every Library API first requires `library.portal.access`, then its granular permission. Dashboard entry records `library.portal.access_used`; settings mutation records `library.setting.changed` with non-sensitive before/after values. Standard request validation, parameterized SQL, error middleware, and session-derived authorization remain authoritative.

## Verification

- All 40 migration files validated; migration 0046 applied to the configured database and the repeatable Phase 20 seed passed.
- Database verification found one settings row, 20 Library permissions, and the intended grants: Library Administrator 20, Librarian 18, Library Assistant 12, and Super Administrator 20.
- API typecheck, lint, production build, and all 50 files / 233 tests passed.
- Web typecheck, lint, and production build passed. The targeted Library/routing set passed 3 files / 16 tests. The concurrent full web run passed 24 files and 82 tests, with one pre-existing forced-password-change routing test timing out while the same test file passes in isolation; a serialized full rerun was attempted but the runner did not emit a final summary.
- Coverage includes portal and granular API denial, settings view/manage separation and validation, Library-only landing, permission-filtered navigation, responsive drawer behavior, multi-portal discovery, and route-derived active Library state.

Phase 20 Group 1 is complete. Phase 20 Group 2 was subsequently completed; see `PHASE-20-GROUP-2-LIBRARY-CATALOG-COPIES.md`.
