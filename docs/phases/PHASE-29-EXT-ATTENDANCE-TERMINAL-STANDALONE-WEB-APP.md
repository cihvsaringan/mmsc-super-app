# Phase 29 Extension — Attendance Terminal Standalone Web App

Status: Implemented and verified with limitations  
Date: 2026-08-26

## Scope

Move operational Attendance Terminal use out of the main administrative frontend into a dedicated kiosk/PWA deployment without duplicating authentication, master records, attendance rules, APIs, or PostgreSQL data. Phase 30 and deferred modules remain unstarted.

## Delivered

- Added `apps/web-2`, an independently runnable React/Vite frontend with a kiosk-only entry point, setup screen, manifest, service worker, nginx image, strict development port `15174`, and SPA fallback.
- Removed the operational `/attendance-terminal` route, terminal experience entry, and terminal service worker/manifest from `apps/web`.
- Retained terminal registration and lifecycle management at `/attendance-terminals` in `apps/web`.
- Preserved the scanner, camera, manual test input, device authorization, minimal credential cache, durable offline queue, recovery synchronization, and idempotent API contracts by reusing the established terminal frontend modules.
- Added the `web-2` Compose service and configured API CORS for `http://localhost:15173` and `http://localhost:15174`.
- Added no schema migration, backend fork, or second database.

## Application map

| Purpose | Location |
|---|---|
| Administration and portals | `http://localhost:15173` (`apps/web`) |
| Terminal registration | `http://localhost:15173/attendance-terminals` |
| Operational kiosk/PWA | `http://localhost:15174/` (`apps/web-2`) |
| Shared API | `http://localhost:14000/api/v1` (`apps/api`) |
| Shared PostgreSQL | host port `15432` |

The kiosk continues to use the shared terminal device, credential-cache, and sync endpoints. Interactive setup uses centralized authentication and the existing terminal list/session endpoints. Server-side permission, status, eligibility, school-day, duplicate, idempotency, and audit rules are unchanged.

## Provisioning and operation

1. Register and activate the logical terminal in Administration at `/attendance-terminals`.
2. On the kiosk device, open `http://localhost:15174/` while online.
3. An authorized operator signs in once and selects the terminal.
4. The API issues a one-time device credential; only its digest remains server-side and the managed browser stores the secret in IndexedDB.
5. Routine scans use terminal authorization and the shared attendance service. Offline events keep stable client event IDs and synchronize when API reachability returns.

## Verification

- Standalone TypeScript project check: passed.
- Standalone ESLint: passed.
- Standalone Vite production compilation: passed; 1,692 modules were transformed and production assets emitted to `.verify/web-2-dist`. The dependency junction prevented writing the default local `dist` path, so an alternate in-workspace verification directory was used.
- Standalone Vitest command: passed with no app-local tests. Terminal behavior continues to be exercised by existing shared frontend and API regression tests.
- Main frontend TypeScript application check: passed. Its composite Vite-config emit could not overwrite existing protected generated files, so this environment-specific file-write failure is not represented as a source type error.
- API TypeScript no-emit check and alternate-directory production emit: passed.
- Main frontend production compilation: passed; 1,736 modules were transformed.
- Main frontend regression suite: 18 files and 62 tests passed.
- API regression suite: 40 files and 173 tests passed, including all terminal device, credential, attendance, CORS, authentication, and security tests.
- Main frontend and API ESLint: passed with no errors; one existing `Assignments.tsx` hook-dependency warning remains outside this refactor.
- Docker build and runtime: passed after correcting the standalone image to install both workspace dependency graphs used by the shared terminal modules. PostgreSQL, API, Administration web, and `web-2` are running and healthy/available on ports `15432`, `14000`, `15173`, and `15174` respectively.
- Live smoke check: the Docker-served `http://127.0.0.1:15174/` returned HTTP 200 with title `MMSC Attendance Terminal`; Administration and API health also returned HTTP 200.
- Cross-origin setup check: API preflight from `http://localhost:15174` returned HTTP 204 and explicitly allowed that origin with credentials.
- Migration validation: `pnpm --filter @mmsc/api db:migrate:check` passed inside the API container and validated all 27 migration files. The earlier host-runtime attempt failed in `uv_os_get_passwd`; the container check is the authoritative successful result.
- Installed-PWA physical scanner/camera and full process-stop recovery remain hardware/operational acceptance checks.

## Port decision

The supplied requirement contained conflicting `15173` examples. The implementation uses `15174` for the standalone terminal because `15173` is already the MMSC Administration frontend; sharing it would create a port collision and defeat independent deployment. This also keeps MMSC isolated from the King Seven Builders applications.
