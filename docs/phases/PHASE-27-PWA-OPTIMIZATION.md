# Phase 27 — PWA Optimization

Status: Completed on 2026-08-21

## Scope and outcome

Phase 27 optimizes only implemented MMSC experiences. It strengthens the Attendance Terminal because installation and offline capture have direct operational value, and improves delivery of all implemented frontend experiences through route-level code splitting. It introduces no Clinic, Library, Laboratory, Credits, Canteen, Phase 28, or Phase 29 functionality.

## Attendance Terminal durability

Pending scan events now use the `mmsc-attendance-terminal` IndexedDB database instead of synchronous local storage. Queue records retain the original terminal ID, terminal-session ID, stable `clientEventId`, capture method, timestamp, and credential value required by the existing sync contract. Initialization validates and migrates the former `mmsc-terminal-queue-v2` payload before removing it. A versioned local-storage fallback preserves capture availability only when IndexedDB is unavailable.

Reconnect continues to synchronize automatically. Browsers supporting Background Sync register `mmsc-attendance-sync`; the service worker wakes an available controlled client, which reuses the centralized API client and existing authenticated, idempotent sync contract. Acknowledgement removes only returned event IDs, so partial batches and retries retain unacknowledged scans. Server-side terminal/session state, credential resolution, Student/Employee eligibility, attendance rules, RBAC, audit, and duplicate protection remain authoritative.

The terminal menu exposes the browser install prompt when available, and the synchronization summary shows queue durability. Install metadata now includes an accurate square icon size, description, color, category, display, scope, ID, and start URL.

## Cache and performance architecture

Production builds defer service-worker registration until window load; Vite development does not register it. Cache `mmsc-app-shell-v4` stores only same-origin navigation shell entries, manifest/logo, and hashed `/assets/*` resources. The worker ignores API and managed-media requests, preventing authenticated business data from entering Cache Storage, and deletes prior MMSC caches on activation.

Nginx serves the manifest as `application/manifest+json`, revalidates the service worker and application shell, and gives content-hashed build assets a one-year immutable cache policy.

React pages are dynamic route chunks beneath the shared `AuthProvider` and existing experience shells. The prior documented single JavaScript bundle was approximately 384 kB (104 kB gzip). The Phase 27 build emits a 254.36 kB initial chunk (79.43 kB gzip) plus page chunks loaded on demand; the Attendance Terminal page is 10.05 kB (3.77 kB gzip). CSS remains one 73.61 kB file (14.18 kB gzip).

## Security and operational limits

The queue is temporary operational data, not a people cache or source of truth. Managed kiosk devices require HTTPS outside localhost, disk encryption, physical access control, protected browser profiles, and an explicit retirement/sign-out procedure. A queued scan is not authoritative until accepted by the server. Background Sync is a client wake-up handoff; when no controlled window is available, the browser retries later and normal reconnect synchronization remains the fallback. A fresh offline launch cannot establish or renew authentication, and that behavior was not weakened to simulate offline authorization.

No database migration, seed change, API endpoint, backend behavior, or environment/port change was required.

## Verification

### Automated verification — 2026-08-21

- All 21 migrations validated; the Phase adds no migration.
- API and web TypeScript checks and lint passed.
- Web tests: 20 tests across 7 files passed, including legacy migration, stable-ID persistence, and acknowledgement removal regressions.
- API tests: 109 tests across 29 files passed unchanged.
- Web production build passed after transforming 1,719 modules. The initial JavaScript chunk is 254.36 kB (79.43 kB gzip), with per-page lazy chunks.
- API production build passed.
- Docker rebuilt the web/API images and restarted PostgreSQL, API, and web on isolated ports `15432`, `14000`, and `15173`. Web root, Attendance Terminal, manifest, service worker, API health, and API readiness returned HTTP 200.
- Browser inspection confirmed the centralized login boundary, manifest linkage, and no console warnings/errors. IndexedDB durability is covered by implementation and fallback regression tests; authenticated offline capture/reconnect, install prompting, and physical scanner behavior require a managed device and were not falsely claimed from an unauthenticated browser inspection.

## Next phase

Phase 28 — Operational Administration remains planned and was not started.
