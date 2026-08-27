# Phase 28 — Operational Administration

Status: Completed on 2026-08-21

## Scope and outcome

Phase 28 adds a permission-scoped operational control plane to the existing administrative Operations workspace. It summarizes current service/database posture, release records, centralized account and session state, implemented workflow queues, Attendance Terminal health, managed-media footprint, and recent failed audit events. It does not introduce monitoring infrastructure, mutate business-domain records, or add functionality for deferred Phases 19–23.

## Operational read model

`GET /api/v1/administration/operations` computes a current read model directly from authoritative platform tables. Counts remain owned by Security, Admissions, Grading, Attendance, Notifications, Media, and migration/seed infrastructure; no duplicate operational snapshot table was introduced. The response is protected by `administration.operations.view` and never includes credentials, session tokens, private student data, or audit-event metadata payloads.

The administrative `/operations` route now opens a dedicated **System status** tab for authorized users. Existing Reports and Application settings remain independently permission-scoped. The responsive control plane exposes status, attention signals, operational queues, terminal posture, release/storage information, and recent failure summaries without presenting fake telemetry.

## Safe maintenance boundary

`POST /api/v1/administration/operations/session-maintenance` requires `administration.operations.manage` and the exact confirmation phrase `CLOSE_STALE_SESSIONS`. In one transaction it revokes only sessions already expired or attached to inactive/archived users. Valid active sessions are not affected. The operator and affected count are recorded through centralized audit logging. The action is idempotent.

The repeatable Phase 28 seed grants view/manage to School Administrator, view-only to Principal, and both permissions to Super Administrator through the existing all-permissions rule.

## Data and deployment impact

No schema migration, new business entity, environment variable, port, external service, or separate data store is required. The implementation uses the existing isolated local ports: web `15173`, API `14000`, and PostgreSQL `15432`. Deployment requires rebuilt API/web images and the repeatable seed so role grants and phase metadata are current.

## Verification

### Automated and live verification — 2026-08-21

- All 21 migrations validated; Phase 28 adds no migration.
- API and web TypeScript checks and lint passed.
- API tests: 113 tests across 30 files passed, including operational authorization, response-contract, confirmation, and audit-context regressions.
- Web tests: 21 tests across 8 files passed, including operational posture, queue, and safe disabled-maintenance rendering.
- API and web production builds passed. Vite transformed 1,721 modules; the lazy Operations JavaScript chunk is 21.05 kB (6.20 kB gzip), its route stylesheet is 4.99 kB (1.27 kB gzip), and the initial JavaScript chunk is 254.48 kB (79.46 kB gzip).
- Docker rebuilt and restarted PostgreSQL, API, and web on isolated ports `15432`, `14000`, and `15173`; all services remained running.
- The repeatable seed completed as `phase-28-operational-administration`.
- Web `/operations`, API health, and API readiness returned HTTP 200. Configured Super Administrator login returned HTTP 200, and its live authorized operational read reported API/database available, 21 migrations, the Phase 28 seed, five active accounts, two active terminals, and current queue/failure signals.
- The live read found 15 stale sessions. Maintenance was deliberately not invoked as a deployment probe because it is an audited state-changing operator action; its exact targeting, permission, confirmation, and affected-count behavior are covered by automated tests.
- The live Operations route was opened in the Codex browser panel for manual review. Automated component coverage verifies the authenticated control-plane content; browser automation was not available to claim an authenticated interactive walkthrough.

## Next phase

Phase 29 — Super App Integration Polish remains planned and has not been started.
