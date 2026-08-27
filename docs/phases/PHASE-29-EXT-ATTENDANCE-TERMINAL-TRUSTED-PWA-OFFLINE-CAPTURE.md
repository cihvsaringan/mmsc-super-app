# Phase 29 Extension — Attendance Terminal Trusted PWA and Mandatory Offline Capture

Status: Implemented; managed-device operational acceptance remains pending  
Date: 2026-08-26

Sync authorization and recovery follow-up: see `PHASE-29-EXT-ATTENDANCE-TRUSTED-PWA-SYNC-RECOVERY-ADDENDUM.md` for the live HTTP 500 root cause, trusted-installation authorization correction, retry-loop fix, and verification record.

## Scope and outcome

This extension replaces operator-bound terminal sessions with a durable, separately revocable trusted-PWA installation. It keeps the standalone kiosk at `http://localhost:15174`, the Administration workspace at `/attendance-terminals`, and all identity, credential, eligibility, attendance, and audit decisions in the shared API and PostgreSQL database. Phase 30 and deferred modules were not started.

## Root cause and correction

The earlier implementation treated an interactive provisioning session and its terminal token as the long-lived device identity. Local authorization also had a client-side age limit, and some online authorization failures collapsed into a generic blocked state. That made browser/PWA restart and connectivity loss look like terminal deauthorization.

The corrected model has four independent states:

1. A logical terminal is an Administration-managed school location/device record.
2. A trusted installation is a browser/PWA installation with its own random credential, whose digest alone is stored server-side.
3. An installation assignment connects one trusted installation to one active logical terminal.
4. Connectivity controls synchronization only. It does not remove locally persisted trust or prevent capture.

An authorized administrator creates a single-use, 15-minute registration code. At the kiosk, an operator with `attendance.terminal.operate` submits that code and centralized credentials once. The password is never persisted. The returned installation secret is stored in IndexedDB and is usable only for installation context, assignment, heartbeat, cache, and attendance synchronization. Trust attempts are rate limited. Revocation is explicit and audited.

## Data and APIs

Migration `0035_attendance_terminal_trusted_pwa.sql` adds registration-code and trusted-installation tables, binds runtime sessions to an installation, and adds installation view/manage permissions. Codes are stored as digests and plaintext is displayed once. Installations record assignment, registration actor, app version, last heartbeat/sync, queue counters, and revocation metadata.

New versioned endpoints create a registration code, trust an installation, read its context, assign it, submit heartbeat state, and revoke it. Runtime cache/sync requests accept only an active trusted-installation credential assigned to an active logical terminal. Obsolete direct session routes were removed.

## Offline behavior

IndexedDB stores the trusted installation, assigned terminal configuration, minimal revocable credential index, and durable attendance-event queue. The local trust record no longer expires merely because the API is unreachable. Captures retain their original `clientEventId` and `capturedAt`; retries preserve both values and server processing remains idempotent. API responses and managed media are never service-worker cached.

The service worker precaches the complete generated application shell, uses network-first navigation with a cached fallback, does not call `skipWaiting`, and deletes only older standalone shell caches. It never clears IndexedDB during an application update.

## Administration workflow

Administration now shows logical terminals and trusted PWA installations separately. It can generate a one-time registration code, inspect assignment/version/heartbeat/sync/queue state, and revoke an installation with a recorded reason. Revocation takes effect when the installation next reaches the server; an offline device cannot receive a revocation before reconnecting, which is displayed in the UI.

## Verification record

- Migration 0035 applied successfully in Docker.
- API and frontend typechecks, changed-file lint, API tests, web tests, and all three production builds passed. The final Docker rebuild compiled the latest security and heartbeat changes.
- API suite: 40 files, 175 tests passed.
- Web suite: 18 files, 62 tests passed.
- Fresh-origin browser smoke test showed the new registration-code, username, and password setup screen at `http://127.0.0.1:15174/`.
- Docker restart passed: PostgreSQL, API, Administration, and standalone terminal returned on isolated ports `15432`, `14000`, `15173`, and `15174`; Administration and terminal returned HTTP 200.
- Migration validation passed for all 28 migration files.
- The repeatable seed was attempted but stopped in an older seed operation because the existing database did not expose the expected `digest(text, unknown)` overload. Migration 0035 itself installs the new permissions, so this did not roll back the schema.

## Remaining operational acceptance

The following require an authorized test account, generated registration code, managed installed-PWA profile, and physical scanner/device and are not claimed as passed in this coding run: trust persistence after full browser/process and Docker restart, capture with web/API/database unavailable, multi-event replay, reader/camera input, and online receipt after recovery. Before production rollout, also validate the school’s intended revocation policy for events captured while a device was offline and later found to have been revoked.

Phase 29 extension implementation is complete. The next planned phase is Phase 30, but it has not been started. Managed-device operational acceptance remains open and prevents marking the extension fully verified.
