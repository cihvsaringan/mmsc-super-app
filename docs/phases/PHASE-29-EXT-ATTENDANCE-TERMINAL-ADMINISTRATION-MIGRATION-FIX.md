# Post-Phase-29 Extension — Attendance Terminal Administration Migration Fix

Status: Implemented and database-verified  
Date: 2026-08-26

## Incident

`GET /api/v1/attendance-terminals/admin` returned HTTP 500 with `INTERNAL_ERROR` after the Web-2 rebuild. The reported request ID was `8ae626cf-fd25-438d-b714-8c32855312d3`.

## Exact root cause

The running PostgreSQL migration history stopped at `0035_attendance_terminal_trusted_pwa.sql`. Source migration `0036_attendance_terminal_web2_rebuild.sql` had not been applied. `TerminalRepository.adminContext()` unconditionally queried the new authoritative `attendance_terminal_devices` and `attendance_terminal_provisioning_tokens` relations in its Administration read model. PostgreSQL therefore raised relation-not-found (`42P01`); the centralized error boundary correctly returned a generic `INTERNAL_ERROR` to the browser.

This was a deployment/schema-state mismatch, not a reason to restore the retired singular API, terminal sessions, trusted-installation compatibility, or device authorization aliases.

## Fix

The repository migration runner applied migration 0036 to the existing database. No attendance history was reset or removed. Post-migration verification confirmed the migration record and successful reads across 5 logical terminals, including terminals without a provisioned device, 1 device, and 1 provisioning token.

The generic server error log now includes request ID, HTTP method and route, authenticated user ID, exception type, PostgreSQL error code, and the error/stack object. Client responses remain generic and secrets remain excluded.

## Authentication boundary

- Administration routes use the authenticated User session plus `attendance.terminal.manage` or `attendance.terminal.device.manage`.
- Runtime bootstrap, credentials, heartbeat, and synchronization use `Authorization: Device` through `requireTerminalDevice`.
- Administration routes do not pass through device authentication.

## Verification

- Migration 0036: applied successfully through the repository migration runner.
- Live schema verification: device and provisioning-token relations exist; migration history contains 0036.
- Live Administration read-model data: 5 terminals, 1 device, 1 token; optional device relationships read without error.
- API, Administration frontend, and Web-2 typechecks: passed.
- API regression suite: 39 files and 167 tests passed, including four new Administration/runtime authentication-separation tests.
- Authenticated browser acceptance could not be repeated with the provided bootstrap credentials because the running database rejected those credentials; no account password was changed to bypass that boundary.

The Attendance Terminal Administration migration fix is implemented. The standalone Web-2 rebuild remains authoritative, and no subsequent roadmap phase has been started.
