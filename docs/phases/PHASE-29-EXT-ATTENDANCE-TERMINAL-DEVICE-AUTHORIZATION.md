# Phase 29 Extension — Attendance Terminal Device Authorization

## Status

Implemented on 2026-08-26. Automated device-boundary, route, authentication, and TypeScript verification passed. Not Completed: the required installed-PWA shutdown/reopen test with web, API, and PostgreSQL unavailable has not been performed on a managed kiosk.

## Root cause and implementation

The prior offline boot path stored a fabricated least-privilege operator snapshot. That coupled kiosk availability to a person session and blurred user authentication with device authorization.

- Migration `0034_attendance_terminal_device_authorization.sql` adds a one-way device-token digest, offline enablement, authorization state, provisioning/verification timestamps, and configuration version.
- Online setup still requires `attendance.terminal.operate`. Provisioning returns a random token once; PostgreSQL stores only its SHA-256 digest.
- `Terminal <token>` is accepted only by terminal validation, credential-cache, and attendance-sync routes. It grants no Administration or general API access.
- IndexedDB retains device ID, token, terminal/session identity, version, and state. A locally active configuration remains usable for up to 30 days without server contact.
- Transport failure preserves authorization. HTTP 401/403 pauses scanning and requests reconfiguration without deleting pending events.
- Disable/revoke ends active sessions. Explicit unregister requires a real authorized online user; operator sign-out and network loss do not unregister.
- Basic offline Manual Verification searches only the minimal cached identity index, applies the same local daily duplicate rule, and durably queues a `manual_verification` Time In event. Recovery revalidates the authoritative Student/Employee and eligibility before writing attendance. Privileged overrides and Attendance Operations remain online and permission protected.

## Verification

- API and web TypeScript checks: passed.
- Device middleware and terminal route tests: 9 passed.
- Authentication and application shell tests: 3 passed.
- API lint: passed. Web lint: passed.
- Full API suite: 167 passed across 38 files. Full web suite: 62 passed across 18 files.
- API and web production builds: passed; the web build transformed 1,743 modules.
- Migration validator: 27 ordered files passed static validation. PostgreSQL application was not attempted in this environment.
- Docker recovery and physical installed-PWA/reader acceptance remain pending.

Phase 29 Attendance Terminal Device Authorization is implemented but not complete. The next planned phase remains Phase 19, but it has not been started.
