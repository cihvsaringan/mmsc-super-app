# MMSC Super App

> Phase 21 implementation complete in source 2026-08-28: the Computer Laboratory portal now includes Groups 1–7, ending with an operational Dashboard, alerts, bounded reports, CSV export, completed Equipment UI follow-ups, and integration polish. Migrations 0055–0060 and authenticated runtime acceptance remain pending.

> Phase 21 Computer Laboratory Group 5 implemented in source 2026-08-28: authorized staff can register, locate, condition, transfer, retire, and inspect durable history for laboratory equipment and peripherals. Migrations 0055–0058 remain pending explicit authorization.

> Phase 21 Computer Laboratory Group 4 implemented in source 2026-08-27: staff can manage workstation/laboratory issues and separate maintenance history with active-session-safe status controls. Migrations 0055–0057 remain pending explicit authorization.

> Phase 21 Computer Laboratory Group 3 implemented in source 2026-08-27: staff can resolve centralized Student RFID/Barcode credentials, evaluate scheduled/walk-in/event access, transactionally assign workstations, and operate session history with derived occupancy. Database migrations 0055–0056 remain pending explicit authorization.

> Phase 21 Computer Laboratory Management Group 1 completed 2026-08-27: the dedicated Computer Laboratory experience now manages campus-scoped laboratories, walk-in policy configuration, workstation inventory metadata and operational state through centralized RBAC and audit logging. Scheduling, sessions, occupancy, maintenance workflows, equipment, software, and reports remain deferred.

> Phase 20 Library Management MVP completed 2026-08-27: the dedicated Library experience now includes catalog and copies, shared-identity patron scanning, circulation and policy enforcement, Library visitor sessions, overdue/Notification workflows, Student and Parent integration, a live operational dashboard, eight reports, filtered CSV export, audit coverage, and hardened RBAC. Deferred financial and advanced Library features remain excluded. See `docs/phases/PHASE-20-GROUP-7-LIBRARY-COMPLETION.md`.

> Phase 20 Library Management (Group 1 completed 2026-08-27): Library is a first-class `/library/*` operational experience with centralized RBAC, permission-filtered navigation, a zero-safe dashboard, foundational settings, centralized auditing, and shared Student/Employee/Credential architecture. Catalog, copies, patrons, circulation, visitors, overdue workflows, and analytics remain deferred to Groups 2–7. See `docs/phases/PHASE-20-GROUP-1-LIBRARY-FOUNDATION.md`.

> Phase 19 Clinic Management (completed 2026-08-27): Clinic is a first-class `/clinic/*` operational experience with RBAC-only access, longitudinal EHR, end-to-end consultations, appointments/follow-ups, privacy-safe portal releases, inventory operations, aggregate reporting, and transactionally safe lot-aware dispensing. Administration contains governance at `/clinic-management`; it is not the daily consultation surface. See `docs/phases/PHASE-19-CLINIC-MANAGEMENT.md`.

> Attendance Terminal Web-2 rebuild (2026-08-26): the former shared/imported terminal runtime and singular `/attendance-terminal/*` contract are **RETIRED / REMOVED**. The authoritative kiosk is the independent `apps/web-2` PWA using `/api/v1/attendance-terminals/*`, one-time terminal-bound provisioning, device credentials, IndexedDB capture/credential stores, and one batch sync engine. See `docs/phases/PHASE-29-EXT-ATTENDANCE-TERMINAL-WEB2-REBUILD.md`.

> Standalone Attendance Terminal (2026-08-26): the kiosk/PWA now runs as the independent `apps/web-2` frontend at `http://localhost:15174`, while terminal registration remains in Administration at `http://localhost:15173/attendance-terminals`. Both clients use the same API, authentication/RBAC, attendance services, and PostgreSQL database. See `docs/phases/PHASE-29-EXT-ATTENDANCE-TERMINAL-STANDALONE-WEB-APP.md`.

> Attendance Terminal device authorization (2026-08-26): registered kiosks now reopen and synchronize through a revocable terminal-only credential stored in IndexedDB, independently of interactive operator login. Fresh devices still require online authorized setup; authoritative rejection pauses capture, while transport failure preserves offline operation. Managed installed-PWA shutdown/recovery acceptance remains pending. See `docs/phases/PHASE-29-EXT-ATTENDANCE-TERMINAL-DEVICE-AUTHORIZATION.md`.

> Attendance Terminal offline-first hardening (2026-08-24): production builds now precache the complete hashed application shell, persist terminal configuration, capture scans through a durable sequential queue, distinguish API reachability from browser connectivity, and include a temporary RFID/QR test input. Automated checks passed, but installed-PWA operation with web, API, and PostgreSQL all stopped remains operationally unverified and is not claimed complete. See `docs/phases/PHASE-29-EXT-ATTENDANCE-TRUE-OFFLINE-FIRST-HARDENING.md`.

> Attendance history correction (2026-08-24): Student and Employee Attendance date filters now return only real attendance transactions for the selected date or period. Student counts, filters, sorting, and pagination use that same record set; time-in-only and time-out-only records remain visible. See `docs/phases/PHASE-29-EXT-ATTENDANCE-DATE-FILTERING-FIX.md`.

> Attendance Terminal enhancement (2026-08-24): Students and Employees now share centralized RFID/QR lifecycle management, while registered terminals incrementally synchronize a minimal IndexedDB identity index for source-aware offline Time In capture. Automated verification is complete; physical managed-kiosk end-to-end validation remains pending. See `docs/phases/PHASE-29-EXT-ATTENDANCE-CREDENTIAL-OFFLINE-PWA-ENHANCEMENT.md`.

> Enrollment workflow update (2026-08-23): approved Admissions applications now appear directly in the server-paginated Enrollments queue. Registrar confirmation validates Section and curriculum, then transactionally creates or links the permanent Student and enrolled Enrollment. See `docs/phases/PHASE-29-EXT-ENROLLMENT-WORKFLOW-STABILIZATION.md`.

MMSC Super App is the shared, modular school management platform for My Messiah School of Cavite. It is designed to grow into one identity platform, HRIS, SIS, academic data model, and integrated set of role-specific school services without duplicating master records.

**Current status:** Phase 21 Computer Laboratory Management is complete in source across Groups 1–7, with database migration and authenticated runtime acceptance still pending. MMSC connects Administration, Teacher, Student, Parent/Guardian, Attendance Terminal, Clinic, Library, and Computer Laboratory experiences through centralized authentication, RBAC, authoritative records, and one shared platform database.

**MVP sequence:** Phase 29 completed the planned initial MVP. Clinic is implemented as Phase 19; Library Phase 20 has started with Group 1. Computer Laboratory, MMSC Credits, and Canteen remain deferred under Phases 21–23.

The multi-experience architecture provides route-level layouts for purpose-built portals, kiosks, and operational workspaces while retaining one shared backend, authentication system, RBAC model, master-data source, audit infrastructure, and primary database. Phase 11 is its first implemented specialized experience.

## Technology

React 19, TypeScript, Vite, React Router, Node.js 22+, Express 5, PostgreSQL 17, pnpm workspaces, Vitest, and Docker Compose.

## Structure

- `apps/web` — responsive React frontend
- `apps/web-2` — dedicated Attendance Terminal kiosk/PWA frontend
- `apps/api` — versioned REST API and database tooling
- `docs` — detailed phase and engineering documentation
- root files — workspace, Docker, environment, and project governance

## Quick start

Prerequisites: Node.js 22+, pnpm 10+, and PostgreSQL 17+ or Docker Desktop.

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres
pnpm db:migrate
# Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in .env before the first seed.
pnpm db:seed
pnpm dev
```

MMSC uses a dedicated local port range to avoid the King Seven Builders HRIS and Attendance Terminal builds:

- Frontend: `http://localhost:15173`
- Attendance Terminal: `http://localhost:15174`
- API health: `http://localhost:14000/api/v1/health`
- PostgreSQL host port: `15432`

Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` to verify the workspace. Run the complete container stack with `docker compose up --build`.

The seed creates standard roles and permissions. It creates a first Super Administrator only when both bootstrap variables are explicitly configured; there is no default password.

For a guarded local MVP demonstration reset, set `MMSC_DEMO_RESET=RESET_LOCAL_MMSC_DEMO` and a 12+ character `MMSC_DEMO_PASSWORD`, then run `pnpm demo:reset` followed by `pnpm demo:validate`. This archives replaceable accounts, preserves the one Super Administrator and immutable audit history, and repopulates interconnected SY 2026–2027 data. Never configure or run this command in production. See [MVP demo data](docs/MVP-DEMO-DATA.md).

See [DEVELOPMENT.md](DEVELOPMENT.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md), [MVP sequencing after Phase 17](docs/MVP-ROADMAP-AFTER-PHASE-17.md), and [Phase 10 documentation](docs/phases/PHASE-10-DASHBOARDS-REPORTING-AND-CORE-ADMINISTRATION.md).
> Trusted Attendance PWA (2026-08-26): a kiosk installation is now a durable, separately revocable security principal registered with a single-use code and assigned to a logical terminal. Connectivity no longer expires local trust; IndexedDB preserves installation, minimal identity cache, and queued capture state. See `docs/phases/PHASE-29-EXT-ATTENDANCE-TERMINAL-TRUSTED-PWA-OFFLINE-CAPTURE.md` for delivered behavior and pending managed-device acceptance.
> Attendance sync recovery addendum (2026-08-26): fixed the live PostgreSQL `day` alias syntax failure behind `/attendance-terminal/sync` HTTP 500, replaced legacy authorization wording with trusted-installation states, and added single-flight synchronization, bounded retry, queue-safe HTTP classification, and operator feedback. See `docs/phases/PHASE-29-EXT-ATTENDANCE-TRUSTED-PWA-SYNC-RECOVERY-ADDENDUM.md`.

> Surgical terminal authorization follow-up (2026-08-26): trusted PWA runtime requests now send and prioritize `Installation` credentials over shared API login cookies, preventing refresh from falling back to legacy terminal-device validation.
