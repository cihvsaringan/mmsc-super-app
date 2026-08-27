# Phase 24 Extension — Attendance Terminal Operational Stabilization

Status: Implemented. Phase 25 remains planned and was not started.

This extension adapts the King Seven Builders operational pattern while preserving MMSC domains: a logical terminal, centralized operator, non-secret browser identifier, and auditable terminal session are separate. No people or attendance database was duplicated.

Administrators with `attendance.terminal.manage` use `/attendance-terminals` to list, register, edit, enable, disable, and revoke terminals; assign Campus and location; and see last seen, last sync, and recent operator. Lifecycle and session changes are audited. Disabled/revoked terminals cannot synchronize and their active sessions end.

Operators use `/attendance-terminal`. Selecting or changing a terminal online starts a session. The menu exposes Change terminal, Sync now, Manual verification, and Sign out. Student credentials route through Enrollment-backed Student Attendance and employee credentials through Employee Attendance. QR/RFID/NFC/barcode share the central digest resolver. Keyboard-emulating readers work; camera decoding and vendor hardware SDK/drivers remain deferred.

Every scan gets a stable UUID `clientEventId`. The browser queue keeps event data only, grouped by its original terminal/session, and removes only acknowledged receipts. Reconnect triggers automatic sync. PostgreSQL uniqueness on `(terminal_id, client_event_id)` prevents duplicates. Manual verification links to the existing authoritative, audited, online-only `/attendance-operations` workflow; no people cache is created.

Migration 0020 adds terminal campus, description, last-sync, terminal sessions, and event-session linkage. The PWA manifest now declares id/start URL/scope/standalone display; service-worker v2 cleans old caches. Local storage remains a known durability limitation pending Phase 27 IndexedDB optimization. Physical-device installability and reader behavior must be manually verified and are not inferred from builds.

## Verification

### Automated verification — 2026-08-20

- All 20 migrations validated and migration 0020 applied.
- API and web TypeScript checks and production builds passed.
- API and web lint passed.
- API: 97 tests across 28 files passed. Web: 18 tests across 6 files passed.
- Docker API, web, and PostgreSQL ran on isolated ports 14000, 15173, and 15432. Readiness and both terminal routes returned HTTP 200.

### Manual operational verification — 2026-08-20

The in-app browser loaded `/attendance-terminal`, confirmed the centralized login boundary, manifest link, and no console errors. HTTP checks confirmed the terminal administration/capture routes, manifest, service worker, and API readiness. Authenticated terminal registration, selection/session change, real Student/Employee QR capture, manual capture, forced offline queue/reconnect, a physical reader, and the browser PWA install prompt were not exercised because no test identities/credentials or physical device were used. Installability is therefore not claimed.
