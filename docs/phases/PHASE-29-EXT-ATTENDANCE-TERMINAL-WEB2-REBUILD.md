# Post-Phase-29 Extension — Attendance Terminal Web-2 Rebuild

Status: Implemented; migration 0036 applied, managed-device manual acceptance pending  
Date: 2026-08-26

## Replacement decision

The former standalone client that imported authentication, terminal UI, API utilities, IndexedDB stores, and synchronization code from `apps/web` is **RETIRED / REMOVED**. The old singular `/api/v1/attendance-terminal/*` runtime contract, operator-bound session authorization, trusted-installation compatibility path, and `TERMINAL_AUTHORIZATION_INVALID` state are not authoritative and must not be restored.

The authoritative implementation is the independent `apps/web-2` PWA plus the pluralized `/api/v1/attendance-terminals` Administration and Runtime APIs. `apps/web` owns Administration only. Both clients continue using the shared PostgreSQL, Credential, Student, Employee, Attendance, Security/RBAC, and Audit domains.

## Provisioning and security

An authorized administrator creates or enables a logical terminal, then generates a terminal-bound, single-use, 15-minute provisioning code. The PWA submits that code with a browser-generated UUID. It receives a random device credential once; only its digest is stored server-side. No administrator password or ordinary User token is stored in the terminal. Runtime requests use `Authorization: Device <credential>`. Devices can be revoked independently, and disabled logical terminals cannot synchronize.

## Runtime API

- `POST /api/v1/attendance-terminals/provision`
- `GET /api/v1/attendance-terminals/runtime/bootstrap`
- `GET /api/v1/attendance-terminals/runtime/credentials`
- `POST /api/v1/attendance-terminals/runtime/sync`
- `POST /api/v1/attendance-terminals/runtime/heartbeat`

Administration uses `GET/POST/PATCH /api/v1/attendance-terminals`, terminal status commands, terminal-bound provisioning-token creation, and device revocation.

## Offline storage and synchronization

IndexedDB database `mmsc-attendance-terminal-web2` version 1 has `device`, `configuration`, `credentials`, `captures`, and `meta` stores. The credential store contains only digest lookup, MMSC identity reference, display/eligibility fields, and synchronization metadata. Captures receive a UUID and monotonic local sequence before success feedback. States are `pending`, `syncing`, `synced`, `failed_retryable`, and `failed_permanent`.

One synchronization engine serves startup, online recovery, foreground recovery, periodic retry, new online capture, and Sync Now. It uses batches of at most 100 and preserves `captureId` and `capturedAt`. The API returns per-capture receipts; accepted records are removed, permanent rejections remain inspectable, and transport failures remain queued with bounded exponential backoff and jitter. PostgreSQL enforces device/capture idempotency while the existing terminal/event uniqueness continues protecting historical records.

## PWA and recovery

The service worker caches only the versioned app shell and static assets. API and media responses remain network-only. It does not force `skipWaiting` and never clears IndexedDB. Temporary network/server errors preserve device identity and queued records. Explicit revocation requires reprovisioning; logical-terminal disablement produces Device Disabled.

## Verification record

- `web-2`, API, and Administration TypeScript project builds: passed.
- Changed frontend/backend ESLint: passed.
- API regression suite: 38 files and 163 tests passed.
- Standalone scanner tests: 2 passed.
- Standalone production Vite build: passed to an alternate workspace output directory because the managed filesystem blocked creation of the default `apps/web-2/dist` directory.
- Migration 0036 was subsequently applied and its Administration read model was database-verified; Docker/manual device scenarios remain unclaimed.

## Known limitations and required acceptance

Camera QR decoding is visibly disabled in this build; HID RFID/QR readers and the test input use the same capture pipeline. Run migration 0036 and validate provisioning, online/offline capture, refresh/browser/API/Docker restart, duplicate submission, revocation, reprovisioning, and physical readers on the managed kiosk before rollout.

This post-Phase-29 Attendance Terminal Web-2 rebuild is implemented. No next roadmap phase has been started.
