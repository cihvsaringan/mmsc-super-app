# Development

## Phase 20 manual extension acceptance

Run `pnpm --filter @mmsc/api db:validate:library-manual-extension` against seeded local data. It scans `DEMO-STUDENT-1-RFID` and `DEMO-EMPLOYEE-1-RFID` with scanner line suffixes through real Library Entry/Exit transactions and asserts that Student Attendance, Employee Attendance, and Attendance Terminal event counts do not change.

## Phase 20 Group 7 and final Library acceptance

Run `pnpm --filter @mmsc/api db:validate:library-group7` after migration 0053. It executes all eight report families against PostgreSQL, confirms ten critical integrity/reporting indexes, and verifies deferred fines/payment tables remain absent. Complete the phase with migration validation, API/web typecheck and lint, full tests, and both production builds.

## Phase 20 Group 6 overdue and portal acceptance

Run `pnpm --filter @mmsc/api db:validate:library-group6` after migrations. The rollback-only acceptance verifies the effective grace boundary, notification milestone uniqueness, and absence of fines/payment tables. Route tests cover overdue RBAC plus Student self-scope and Parent Guardian linkage; web tests cover the read-only Student Library presentation.

## Phase 20 Group 2 Library catalog acceptance

After migrations, run `pnpm --filter @mmsc/api db:validate:library-group2` to exercise generated identifiers, five-copy bulk allocation, duplicate barcode/accession rejection, normalized lookup, catalog search/pagination, and copy summaries inside a transaction that always rolls back.

## Local RFID test reset

Run `pnpm reset:test-rfid` with `MMSC_RFID_TEST_RESET=RESET_LOCAL_TEST_RFID` to remove only Student and Employee RFID credentials from the local `mmsc` database. The command refuses production, remote hosts, differently named databases, and execution without the explicit confirmation. It preserves identities, attendance history/events, terminal devices, trusted installations, assignments/sessions, and other credential types. Afterward, use **Sync Now** on each provisioned Attendance Terminal to replace its credential snapshot without clearing device registration or pending attendance.

## Standalone Attendance Terminal

The operational kiosk is the self-contained `apps/web-2` PWA at `http://localhost:15174`. Administration remains in `apps/web` at `http://localhost:15173/attendance-terminals`. The retired singular API/runtime and imported `apps/web` terminal modules must not be restored. Start only the kiosk with `pnpm --filter @mmsc/web-2 dev`, or start every workspace application with `pnpm dev`.

`apps/web-2` reuses the established authentication client, terminal UI, IndexedDB queue, credential cache, and API client while owning its entry point, application shell, manifest, service worker, build, nginx image, and port. `VITE_MAIN_APP_URL` controls its return link to Administration and defaults to `http://localhost:15173`.

Provisioning requires an online interactive account with `attendance.terminal.operate`. After terminal selection, the one-time plaintext device token is held only in IndexedDB; the API stores its digest. Routine operation uses `Authorization: Terminal <token>` and does not store the operator password.

## Attendance Terminal device provisioning

Fresh browser profiles require an online User with `attendance.terminal.operate` to select and provision a terminal. Subsequent terminal runtime calls send the IndexedDB-held device credential through the `Terminal` authorization scheme. Do not copy it into local storage, logs, fixtures, URLs, or general API clients. Local authorization is bounded to 30 days since successful verification.

## Student Attendance workspace

The daily list is roster-first: eligible active enrollments appear even with no attendance row, shown as the derived `Not Recorded` state. Do not seed an absent/present row merely to make a Student visible. Pending applicants and non-enrolled Student records are intentionally excluded.

`GET /api/v1/attendance/students` defaults to today and accepts `search`, `schoolYearId`, `gradeLevelId`, `sectionId`, `status`, `source`, `sort`, `page`, and `limit` (25 in the web workspace, maximum 100). The response is `{ items, total, page, limit }`. Keep list rows compact; retrieve `/attendance/students/:id` only when opening details so immutable adjustment history is not repeated across the grid.

## Academic Assignments workflow

Use `/api/v1/assignments/workspace?schoolYearId=...` for the Grade Level and Section summary grids. Batch curriculum writes use `PUT /assignments/curriculum/grade-level/:gradeLevelId`; batch primary-Teacher writes use `PUT /assignments/teaching/section/:sectionId`. Copy operations must call the corresponding `/copy/{curriculum|teaching}/preview` endpoint before commit and send the explicit `COPY_MISSING` confirmation. These operations are transactional, permission-protected, audited, and reject Closed target School Years.

Keep curriculum (`subject_grade_level_assignments`) separate from class responsibility (`teaching_assignments`). Section choices must be filtered by School Year and Grade Level; teaching Subject choices must come from the selected curriculum; Teacher values are Teacher School-Year Assignment IDs, never Employee IDs. Use PATCH to update curriculum metadata or the assigned Teacher while preserving optimistic versioning and record identity.

## Academics minor stabilization

The School Year detail Section projection counts every Enrollment related to the Section; `enrollments` is historical and does not implement `archived_at`. Do not add archival predicates that are absent from the authoritative schema. Grade Level option/list queries must order at the database layer by `sequence ASC`, then `name` and `id` for deterministic results before presentation or pagination.

## Academics workspace conventions

Keep reusable academic master data in the top-level Academics directories and year-dependent Terms, Sections, and Calendar under School Year detail. New School Years must use the generic create contract without a client-provided lifecycle status; use `POST /api/v1/academics/school-years/:id/activate` with the explicit confirmation contract for activation. Do not restore generic status editing or duplicate year-dependent records to support the nested UI. Preserve the 25-row directory pagination, keyboard-operable rows, shared modal pattern, and view-only detail behavior.

## Teacher related-form mutation handling

Capture a submitted form element before the first `await`; React event `currentTarget` must not be accessed after asynchronous work. Report the primary create result separately from any subsequent detail refresh. Teacher subject qualifications retain the existing active uniqueness rule on `(teacher_profile_id, subject_id)` and return `QUALIFICATION_EXISTS` for a detected duplicate.

## Post-Phase-29 Teachers workspace

Keep `/teachers` list reads server-paginated (`limit=25` by default) and reserve `/teachers/:id` for modal detail. Extend Employee search through `/api/v1/teachers/eligible-employees`; never return the complete Workforce directory in Teacher context or duplicate Employee fields in `teacher_profiles`. Add Teacher accepts an existing active/on-leave Employee and Teacher-only fields. Use Academic Assignments and Security & Access for assignment and portal changes respectively.

## Enrollment workflow verification

The Enrollment queue uses `GET /api/v1/enrollments` with server search, filters, sorting, `limit`, and `offset`. Modal data uses `GET /api/v1/enrollments/candidates/:kind/:id`; confirmation uses `POST /api/v1/enrollments/candidates/:kind/:id/complete`. Run `pnpm db:migrate` before completion so `student_number_seq` exists. Docker serves the web workspace at `http://localhost:15173/enrollments` and the API at `http://localhost:14000/api/v1`.

## Phase 29 Administration navigation extension

Add an implemented workspace through the declarative registry in `apps/web/src/auth/experiences.ts`; do not infer access directly from Employee position or add unimplemented entries. Administration links belong in `AdministrationNav.tsx`, each with its existing route predicate. The component filters inaccessible items and empty groups. `ExperienceSwitcher` shows the current workspace for a single experience and a native switch control for multiple experiences without creating another session.

## Phase 29 Security & Access UI extension

Security tab state is the `tab` search parameter at `/security`; unsupported or unauthorized values normalize to the first permitted tab. Keep route, navigation, tab visibility, and endpoint permissions aligned, and test with `Security.test.tsx`. Portal presentation must derive from the centralized user plus authoritative person link and applicable portal role. Do not add portal-local account state. The workspace styles are isolated in `apps/web/src/pages/security-workspace.css` and reuse the shared MMSC tokens.

## Phase 29 integration polish

Use `availableExperiences` and `homePath` for cross-shell routing; do not recreate role priority in individual components. A specialized portal requires its role and matching access permission. Add new implemented experiences to the centralized resolver only after their authoritative identity and server authorization exist. Preserve `RouteFocus`, the `main-content` landmark, skip navigation, and permission-gated portal links when changing shells.

## Phase 28 operational administration

Run the repeatable seed before testing `/operations`, then sign in with `administration.operations.view`. The read endpoint is `GET /api/v1/administration/operations`. The optional maintenance endpoint is `POST /api/v1/administration/operations/session-maintenance` with `{ "confirmation": "CLOSE_STALE_SESSIONS" }` and manage permission. Extend operational signals only from implemented authoritative domains; do not add placeholder metrics for Phases 19–23 or silently broaden the maintenance action.

## Phase 27 PWA optimization

Vite development intentionally does not register the service worker, preventing stale production assets from masking source changes. Test install, cache, and offline behavior against a production build or rebuilt web container at `http://localhost:15173`; localhost is a secure-context exception, while non-local deployments require HTTPS. The terminal migrates `mmsc-terminal-queue-v2` into IndexedDB database `mmsc-attendance-terminal` and retains local storage only as an availability fallback. Do not cache API responses or add a terminal-side people directory.

## Post-Phase-26 authentication stabilization

Apply migration 0021 and run the repeatable seed. Sign in with Username, Employee Number, Student Number, or Guardian Number—not email. Optional `BOOTSTRAP_ADMIN_USERNAME` controls the bootstrap Username; if omitted, the normalized email local part is used. Portal activation returns a temporary password only once, so test automation must hold it in memory and never log it.

## Phase 26 security

State-changing browser requests must use `CORS_ORIGIN`. Keep `TRUST_PROXY=false` for direct development. Strong composition applies to new/changed passwords; existing hashes authenticate normally.

## Phase 25 reporting

Reports use `/api/v1/reports/:type` and `/operations`. Extend the allowlist, authoritative query, and permission/interval/export tests together. Never add placeholder reports for deferred modules.

Apply migration 0020, register a logical terminal at `/attendance-terminals`, then select it online at `/attendance-terminal`. Preserve generated `clientEventId` values on retries. Keyboard-emulating credential readers work; vendor SDK integrations remain deferred.

The shared Calendar is available at `/calendar` and under the Teacher, Student, and Parent shells. Extend the authoritative `calendar_events` domain and `/api/v1/calendar` read model rather than adding portal-specific event stores. Preserve published-only visibility for non-managers. Calendar creation and updates must continue through the audited Academic Calendar write path.

Attendance Operations development must use the online authoritative lookup endpoint and must not persist a permanent browser-side Student or Employee directory. The workspace is available at `http://localhost:15173/attendance-operations`. Manual capture requires an active registered terminal and a stable `clientEventId`; every retry must reuse that ID. Extend standardized reason codes and exception transitions through validated server contracts, immutable history, and permission checks.

Notification development must keep audience definition separate from materialized delivery. Resolve users only from centralized Security, Employee, Teacher, Student, Guardian, Enrollment, Grade Level, and Section records. Never introduce portal-local recipient lists. Preserve per-user read state and immutable lifecycle events, and require server-side authorization at every notification action URL.

Parent Portal development must derive Guardian from `guardians.user_id` and validate child scope through `student_guardians` on every request. Never trust a child selector as authorization. A Parent / Guardian user must be linked to an active Guardian record and that Guardian to at least one active Student relationship before `/parent` can display family data.

The applicant experience is available at `http://localhost:15173/register`; it requires an open/planning/active School Year and configured Grade Levels. Public endpoints live under `/api/v1/public/admissions` and must never reuse administrative serializers. Resume tokens must be treated as secrets and must not be logged, seeded, or committed.

Admissions development must treat application records as staging data and use the transactional conversion service for approved applications. Never copy an approved applicant into a module-local permanent student store or bypass Student, Guardian, Enrollment, academic placement, RBAC, and audit integrity. The Registrar workspace is `/admissions`.

Attendance Terminal development must preserve `clientEventId` across every retry, use only registered active terminal IDs, and resolve scanned identities through centralized credentials. Never add terminal-local permanent Student or Employee master records. The development UI is available at `http://localhost:15173/attendance-terminal` after signing in with an account that has `attendance.terminal.operate`.

After migration `0032`, open a Student or Employee profile with `credential.manage` to register RFID/QR credentials. The repeatable seed uses fake values such as `DEMO-STUDENT-1-RFID` and `DEMO-EMPLOYEE-1-QR` when matching identities exist. Initialize the selected terminal online before disconnecting so IndexedDB has the minimal credential snapshot. HID readers should emit the credential followed by Enter; camera QR requires a browser implementing `BarcodeDetector` and camera access. Clear site data or retire the managed browser profile when decommissioning a terminal.

Student Portal APIs must derive Student and Enrollment ownership from the authenticated user. Never accept a Student ID or return non-published grades from a student-facing endpoint.

Grade changes must use the Grading repository transaction and history path. Never update published grade values directly or accept a teacher identity from a portal request.

Phase 11 portal development must preserve server-derived teacher scope. Never add a teacher ID query parameter to portal endpoints; extend the linked User → Employee → Teacher assignment queries instead.

## Prerequisites

- Node.js 22 or later
- pnpm 10 or later (`corepack enable` may provide it)
- PostgreSQL 17 or Docker Desktop with Compose v2

## Setup

Copy `.env.example` to `.env`, install with `pnpm install`, and start PostgreSQL using `docker compose up -d postgres` or a compatible local server. Never commit `.env`.

Run `pnpm db:migrate`. For the first seed, set a unique `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` (12+ characters) in `.env`, then run `pnpm db:seed`. The bootstrap is optional and idempotent; no default credentials exist. Remove the bootstrap password from the environment after successful provisioning. Start both applications with `pnpm dev`, or individually with `pnpm --filter @mmsc/web dev` and `pnpm --filter @mmsc/api dev`.

## Dedicated local ports

MMSC intentionally uses a separate high port range so it can run beside the King Seven Builders HRIS and Attendance Terminal:

| Service | Host port | URL / connection |
|---|---:|---|
| Web | 15173 | `http://localhost:15173` |
| Attendance Terminal | 15174 | `http://localhost:15174` |
| API | 14000 | `http://localhost:14000/api/v1` |
| PostgreSQL | 15432 | `localhost:15432` |

Vite uses `strictPort`, so it reports a clear error if port 15173 is unexpectedly occupied instead of silently moving the MMSC frontend to another address. PostgreSQL still uses port 5432 inside the Docker network.

## Commands

| Task | Command |
|---|---|
| Migration file validation | `pnpm --filter @mmsc/api db:migrate:check` |
| Apply migrations | `pnpm db:migrate` |
| Repeatable seed | `pnpm db:seed` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Tests | `pnpm test` |
| Production builds | `pnpm build` |
| Production-like PWA test server | `pnpm --filter @mmsc/web pwa:test` |
| Full container stack | `docker compose up --build` |
| Reset local Student lifecycle test data | `docker compose run --rm -e MMSC_STUDENT_LIFECYCLE_RESET=RESET_LOCAL_STUDENT_LIFECYCLE api pnpm --filter @mmsc/api db:reset:student-lifecycle` |

## Local student lifecycle test reset

The Student lifecycle reset is for local development and MVP manual testing only. It removes Admissions applications, Students, Guardians, Enrollments, student grades/attendance/credentials, related access mappings, and referenced test uploads without reseeding them. It retains the MMSC institution, School Year and academic setup, Employees, Teachers and assignments, employee/teacher attendance, terminals, administrative accounts, RBAC, and immutable audit history.

The command refuses production, remote database hosts, databases other than `mmsc`, and execution without the exact `MMSC_STUDENT_LIFECYCLE_RESET=RESET_LOCAL_STUDENT_LIFECYCLE` confirmation. It is transactional and idempotent. Do not use `db:demo:reset` for this workflow because that separate command rebuilds broad demo data.

Begin the fresh manual cycle at `/register`. Returning Student verification becomes available after the first application has been approved and converted to an authoritative Student. Completing another Enrollment for that Student requires a different School Year because `enrollments` enforces one record per Student and School Year.

## Create workflow convention

Use the shared `Modal` component for normal Add/New/Create workflows. Put authoritative API errors in the active dialog, disable submission and dismissal while a request is in flight, and retain full-page or dedicated views for complex multi-step workflows and substantive detail/edit experiences.

Workforce routes are under `/api/v1/workforce`, teacher routes under `/api/v1/teachers`, SIS identity routes under `/api/v1/students`, enrollment routes under `/api/v1/enrollments`, and Phase 7 configuration under `/api/v1/assignments`. Run migrations and the repeatable seed before opening Assignments.

Employee attendance routes are under `/api/v1/attendance/employees`. Apply migration 0011 and run the repeatable seed before opening Attendance. Manual timestamps must be ISO 8601 with an offset; future ingestion clients should supply a stable `externalEventId` with their source.

Student attendance routes are under `/api/v1/attendance/students`. Apply migration 0012 and seed before opening Student Attendance. Campus entries use an Enrollment ID; class-scope API clients must also provide a teaching assignment matching that enrollment's year and section.

Dashboard data is served by `/api/v1/dashboard/admin`, reports by `/api/v1/reports/:type`, and settings by `/api/v1/administration/settings`. Apply migration 0013 and seed first. CSV uses `format=csv`; JSON is the default and browser printing supplies the initial printable report surface.

Authenticated frontend experiences should be composed as sibling React Router layouts beneath the shared `AuthProvider`. The current `AppShell` is the administrative layout. Do not place a future teacher, student, parent, kiosk, POS, library, or clinic experience inside it merely to reuse authentication; reuse the provider, API client, design tokens, primitives, and permission utilities instead.

## Environment

`API_PORT`, `API_HOST`, `DATABASE_URL`, `LOG_LEVEL`, `CORS_ORIGIN`, and `MEDIA_STORAGE_PATH` configure the API. `SESSION_TTL_HOURS` controls expiry; set `SESSION_COOKIE_SECURE=true` behind production HTTPS. Optional bootstrap variables provision the first administrator during seed. `VITE_API_URL` identifies the public API base. See `.env.example`.

## Troubleshooting

### Attendance Terminal installed-PWA test

The Vite development server does not register the service worker. Use the Nginx Docker build (`docker compose up --build`) for the exact local stack, or run `pnpm --filter @mmsc/web pwa:test` to build and preview production assets on port 15173. Initialize `/attendance-terminal` online, wait for credential synchronization, install and close the PWA, then stop `web`, `api`, and `postgres`. Reopen the installed app and use the temporary RFID/QR test input with a cached credential. After scans are queued, restore the services and verify original timestamps, idempotent receipts, authoritative Student/Employee attendance, and a zero pending count.

- A readiness `503` means PostgreSQL is unavailable or migrations/setup need attention; `/health` can remain healthy.
- Port conflicts: MMSC reserves 15173/14000/15432 locally. If another unrelated service occupies one, update Docker, `.env`, Vite, CORS, and public API configuration together.
- Migration checksum failure: never edit an applied migration; add a new migration.
- Clean generated output by removing `apps/*/dist`; never delete source or migration history to repair a build.
# Post-Phase 29 academic structure correction

Apply migration 0022 and run the repeatable seed before testing Academics and External Schools. Institution-scoped Academics payloads omit `schoolId`; the API resolves active primary MMSC. External-school records use `/api/v1/reference-data/external-schools` and optimistic concurrency.

## Local MVP demo reset

Run the normal migration and reference seed first. Then set `MMSC_DEMO_RESET=RESET_LOCAL_MMSC_DEMO` and `MMSC_DEMO_PASSWORD` (12+ characters) only in the local shell/environment. Run `pnpm demo:reset` and `pnpm demo:validate`. The reset refuses production, non-local database hosts, databases other than `mmsc`, missing confirmation, and missing/short passwords. It is transactional and may be rerun. See `docs/MVP-DEMO-DATA.md` for counts, personas, and manual checks.

For the Phase 19 completion gate, run `apps/api/src/database/verify-phase19-existing.ts` against the configured populated database. Run `apps/api/src/database/validate-phase19-fresh.ts` only against local PostgreSQL; it owns the exact disposable database `mmsc_phase19_validation`, performs seed/demo/Clinic acceptance, and removes it afterward. The demo reset also permits that exact validation database when the normal explicit confirmation is present.
## Trusted Attendance PWA development

Create and inspect logical terminals and trusted installations at `http://localhost:15173/attendance-terminals`; run the kiosk at `http://localhost:15174`. A fresh browser profile must be registered online with a one-time code and an operator account. Do not put passwords, plaintext registration codes, installation secrets, or authoritative person data in source, logs, fixtures, local storage, or service-worker caches. Preserve queued `clientEventId` and `capturedAt` values across retries.
## Attendance synchronization failure testing

Treat a rejected `fetch` as connectivity loss and any HTTP response as API reachability. Keep queued events for network, 4xx, and 5xx failures. Exercise the single-flight/backoff behavior when editing terminal effects, timers, service-worker messages, or reconnect handlers. A manual sync must never overlap an existing request.
## Phase 20 Group 3 Library circulation acceptance

Run `pnpm --filter @mmsc/api db:migrate:check`, `pnpm --filter @mmsc/api db:migrate`, and `pnpm --filter @mmsc/api db:validate:library-group3`. The last command performs rollback-only PostgreSQL acceptance for centralized credential resolution, canonical patron references, active-loan uniqueness, renewal history, and return/copy synchronization.
## Phase 20 Group 4 Library policy acceptance

Run migration check/apply and `pnpm --filter @mmsc/api db:validate:library-group4`. The rollback-only acceptance checks all patron policy slots, grace-boundary semantics, and that policy changes leave active due dates untouched.
## Phase 20 Group 5 visitor acceptance

Run `pnpm --filter @mmsc/api db:validate:library-group5` for rollback-only duplicate-session, duration, and zero-Attendance-write verification.

For manual-testing extension 2, supply existing application-created values at runtime through `MMSC_LIBRARY_TEST_STUDENT_RFID` and `MMSC_LIBRARY_TEST_EMPLOYEE_RFID`, then run `pnpm --filter @mmsc/api db:validate:library-manual-extension2`. Never commit or log those values. The command exercises their lifecycle histories and registers temporary Student/Employee RFID credentials through the official credential repository before Library Entry/Exit, then revokes those temporary credentials through the normal lifecycle service. It also verifies Manila-local analytics, open and empty results, and unchanged Attendance-domain counts.
