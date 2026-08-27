# Phase 29 Extension — Attendance Terminal True Offline-First Hardening

## Status

Implemented on 2026-08-24. Automated verification and production artifact inspection were attempted. Not Completed: this environment has no Docker executable, installed-PWA/browser control session, PostgreSQL client, physical kiosk, or prepared set of 20 valid cached credentials, so the mandatory all-services-stopped launch/capture/recovery acceptance test could not be run honestly.

## Root cause

The previous hand-written service worker knew only four shell URLs. It cached hashed JavaScript and CSS opportunistically after fetch, which is not reliable during the first uncontrolled installation session. An installed launch could therefore have cached HTML but no React route chunks. Offline authentication also refused the cached terminal operator whenever `navigator.onLine` was true, even if the API was unreachable. Terminal selection details were held in live API state and local-storage IDs instead of one durable configuration record.

## Implementation

- Vite emits `/.vite/manifest.json`; service-worker installation reads it and precaches every emitted JS/CSS/static asset plus the SPA shell, terminal navigation, web manifest, and logo.
- Offline navigation fallback is limited to `/attendance-terminal`. API and managed-media responses remain network-only. Worker updates do not use `skipWaiting`, protecting active scanning sessions.
- IndexedDB database version 3 adds `terminal-config` alongside `credential-cache`, `daily-attendance`, `attendance-events`, and `terminal-meta`.
- Authentication falls back to the least-privilege terminal operator only on transport failure and only for an initialized terminal route. HTTP authentication rejection still clears the snapshot.
- Browser connectivity and API reachability are separate states. A 15-second non-blocking probe/sync loop detects recovery.
- HID, QR camera, and temporary manual credential input feed one stable `ScanProcessingQueue`. Every scan gets a client UUID immediately and is processed sequentially without listener remounting.
- Successful feedback occurs only after the attendance event is written to IndexedDB. A storage error instructs the operator to scan again. Synchronization removes only server-acknowledged UUIDs and preserves original timestamps.
- The test input supports type/paste, Enter, button submission, automatic clearing/refocus, offline cached resolution, and the distinct `manual_credential_test` source. Manual Verification remains a separate permission-protected workflow and continues using the authoritative Attendance domain.

## Automated results

- A 20-item burst test verifies 20 received, 20 processed, and 0 rejected events in order.
- Queue continuation after a rejected item, HID consecutive scanning, three-second display replacement, offline auth with both `navigator.onLine` values, manual scan-source validation, and storage-failure behavior are covered.
- Production artifact inspection confirmed the Vite manifest and service worker are emitted, the manifest contains the Attendance Terminal JS/CSS chunks, and the worker has no forced `skipWaiting`.
- API typecheck, lint, and production compiler build passed. API tests passed: 37 files, 163 tests.
- Frontend typecheck and production build passed after 1,743 modules transformed. Frontend tests passed: 17 files, 57 tests. Frontend lint has no errors and retains one unrelated pre-existing `Assignments.tsx` hook warning.
- Static migration validation found 26 non-empty ordered SQL files. The TSX migration check was attempted but its Windows launcher failed before database access with `uv_os_get_passwd returned ENOMEM`.
- Docker shutdown/recovery, installed-PWA launch, live IndexedDB persistence counts, and server synchronization counts were not executed because Docker and an installed browser session are unavailable. The simulated 20-scan processor result was 20 submitted, 20 processed, 0 processor failures; it is not represented as a live persistence or synchronization result.

## Operational acceptance still required

Run on the target managed browser/PWA with valid cached Student and Employee credentials:

1. Installed launch and manual credential capture with `web` stopped.
2. Capture with `api` stopped, `postgres` stopped, and all three stopped.
3. Close/reopen with pending events and confirm they remain.
4. Submit 20 unique eligible credentials online, offline, API-unavailable, and while synchronization runs; compare received, persisted, and synchronized counts.
5. Restore the stack and verify original timestamps, one Time In per identity/day, Attendance Operations receipts, Student/Employee history, and zero pending events.
6. Repeat with supported physical RFID, USB QR, and camera devices.

Phase 29 Attendance Terminal True Offline-First Hardening is implemented but not complete. The next planned roadmap phase remains Phase 19, but it has not been started.
