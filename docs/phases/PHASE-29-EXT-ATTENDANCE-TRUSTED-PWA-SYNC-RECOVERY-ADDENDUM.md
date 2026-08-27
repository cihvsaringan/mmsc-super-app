# Phase 29 Extension Addendum — Trusted PWA Sync Recovery

Status: Surgical follow-up implemented; Docker/browser acceptance blocked by current Codex usage limit  
Date: 2026-08-26

## Surgical follow-up for remaining manual-test defects

The follow-up manual test showed `TERMINAL_AUTHORIZATION_INVALID` after refresh even though the browser was already a trusted PWA. The cause was middleware precedence: `requireTerminalRuntime` accepted the shared API login cookie before reading the `Installation` header. Because Administration and the standalone terminal share the API origin, a signed-in browser could bypass trusted-installation resolution and `/attendance-terminal/device` then validated the ordinary security session as if it were an old terminal device session.

The runtime middleware now treats an `Installation` header as authoritative whenever present. `/attendance-terminal/device` calls `validateInstallationRuntime` for trusted installations and only uses legacy `validateDevice` for the old interactive fallback path without an installation header. The terminal frontend now sends `Authorization: Installation <token>` for device validation, credential-cache sync, and attendance sync. The obsolete `Terminal <token>` scheme is no longer used by `web-2`.

The reported continuous `GET /api/v1/attendance-terminal/sync` was not found in the attendance terminal source, service worker, or recent API logs during this pass. The frontend source contains only `POST /attendance-terminal/sync`. The final live browser-console check still needs to be repeated after the service-worker v4 bundle is active.

Service-worker cache version `mmsc-attendance-standalone-v4` registers at `/sw.js?v=4` and calls `skipWaiting()` so the corrected authorization bundle can replace the previously cached terminal shell without forcing re-registration. IndexedDB trust, assignment, cache, and queue stores are not cleared.

## Sync 500 root cause

Live API logs identified PostgreSQL SQLSTATE `42601` in `TerminalRepository.recordStudent`. The query used `SELECT (...)::date::text day`; PostgreSQL parsed the unqualified `day` alias as invalid syntax. Every student event rolled back the batch and returned the centralized `INTERNAL_ERROR` response. The query now uses an explicit parenthesized cast and `AS attendance_day` in both Student and Employee paths. The corrected SQL was executed successfully against the running PostgreSQL container.

## Legacy authorization conflict

The runtime middleware previously emitted `TERMINAL_AUTHORIZATION_REQUIRED` / “Registered terminal authorization is required” when no recognized header was present. This legacy wording obscured the trusted-installation model. It now requires an `Installation` credential and returns `PWA_INSTALLATION_NOT_TRUSTED` when absent. A valid credential resolves the trusted installation, active assignment, active logical terminal, and installation-bound runtime session. Missing assignment, inactive terminal, revocation, and invalid credential have distinct HTTP/domain responses.

The sync route also compares the queued terminal/session identifiers with the server-resolved installation assignment. Trusted-PWA requests cannot select another terminal by changing their payload. Interactive operator compatibility remains isolated to requests that do not authenticate as an installation.

## Final trusted-PWA authentication

- Bootstrap/trust: one-time registration code plus centralized operator credentials and `attendance.terminal.operate`.
- Installation context, assignment, and heartbeat: purpose-limited `Installation` credential through trusted-installation middleware.
- Credential-cache synchronization, device validation, and attendance synchronization: the same `Installation` credential through runtime middleware, followed by server-side assignment/session/terminal validation.
- Attendance processing: centralized credential, Student/Employee eligibility, school-day, duplicate, idempotency, and audit services.
- No second legacy device token is required.

## Sync loop root cause

On every HTTP failure the open client registered Background Sync. The service worker immediately notified the open client, which invoked sync again; failure registered the same job again. Reconnect, periodic probe, new capture, and manual actions could also overlap. The refactor adds a single-flight promise lock, visible sync state, and a bounded retry scheduler. HTTP errors no longer register Background Sync in a feedback loop. Offline capture may still request one background wake-up for later recovery.

## Retry and manual synchronization

Automatic failure delays are 2, 5, 10, 30, then at most 60 seconds. Only one batch request runs at a time. Manual synchronization cancels the pending timer, makes one immediate attempt, and is disabled while a request is active. Pending events are deleted only for server-returned receipts; failures preserve the queue and original `clientEventId`/`capturedAt`.

## Error classification

| Condition | Connectivity/trust interpretation | Operator state |
|---|---|---|
| Fetch/network failure | API unreachable | Offline capture / reconnecting; queue retained |
| HTTP 500 | API reachable | Online · Sync error; queue retained |
| Invalid/missing installation credential | API reachable, trust invalid | Device authorization needs attention |
| Revoked installation | API reachable, explicitly revoked | Device revoked |
| Missing/inactive/mismatched assignment | API reachable, assignment invalid | Assignment issue |
| Successful receipts | API reachable and authorized | Online · Synced; acknowledged events removed |

## Logging

Unexpected sync failures add request ID, trusted installation ID, server-resolved terminal ID, event count, offline event IDs, route, and database-operation context. Credentials, passwords, and secrets are excluded.

## Verification

- Live root-cause reproduction: confirmed repeated HTTP 500 with request IDs and PostgreSQL syntax error before the fix.
- Corrected PostgreSQL Philippine-day query: passed and returned `2026-08-26` for a `2026-08-26 14:17:36+08` capture.
- API production build: passed.
- Standalone PWA typecheck and production build: passed; 1,692 modules transformed.
- API regression suite: 40 files, 176 tests passed.
- Migration validation: 28 files passed.
- Docker API and `web-2` images rebuilt and restarted successfully.
- No new migration or re-registration requirement was introduced. Service-worker cache version 4 replaces the corrected shell while preserving IndexedDB.

## Outstanding live acceptance

The pre-existing queue belongs to the user’s installed browser profile, which is not exposed to the test browser. No event for its session had reached `attendance_terminal_events` at the time of verification, so queue flush to zero and console quietness are not claimed. The final Docker rebuild, API/web-2 regression run, refresh test, offline/reconnect test, and console-loop verification could not be executed in the resumed turn because the Codex account hit its current usage limit. After usage resets, rebuild and restart `api` and `web-2`, then reopen the Attendance Terminal and use **Synchronize now**. The installation, assignment, cache, and queued records remain in IndexedDB and do not require registration again.

This addendum is implemented. Phase 30 has not been started.
