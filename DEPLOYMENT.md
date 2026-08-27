# Deployment

## Standalone Attendance Terminal deployment

Compose deploys `web` on host port `15173` for Administration and portals and `web-2` on host port `15174` for the Attendance Terminal. The API CORS allowlist includes both origins. Build and start the full local stack with `docker compose up --build`; rebuild `web-2` after kiosk source or service-worker changes.

The `web-2` image serves its own manifest, service worker, hashed assets, and SPA fallback through nginx. `VITE_API_URL` identifies the shared MMSC API and `VITE_MAIN_APP_URL` the Administration frontend. Do not attach a second API or database.

## Student Credential schema prerequisite

Student and Employee credential management requires migrations `0032_attendance_credential_offline_enhancement.sql` through `0034_attendance_terminal_device_authorization.sql` before the matching API image is started. A Phase 14 credential table lacks `last_used_at`, `updated_by`, replacement linkage, manual scan source, and device authorization fields; running newer credential code against that older schema causes database errors during both list and registration. Apply `pnpm db:migrate`, confirm all three migration names in `schema_migrations`, then rebuild/restart the API. Never work around this state by adding portal-account fields or a second credential table.

## Attendance Terminal device authorization acceptance

Deploy migration `0034`, then rebuild API and web artifacts. Provision each managed encrypted browser profile online. Before production approval, install and close the PWA, stop web/API/PostgreSQL, reopen the installed terminal, capture cached Student and Employee scans, restore services, and verify idempotent synchronization. Also verify disable, revoke, explicit unregister, 30-day revalidation, and browser-profile retirement. These physical tests were not available during implementation and are not claimed complete.

Pre-`0034` terminal sessions contain no recoverable device secret and therefore require one authorized online reprovisioning after deployment. Complete that rollout and a credential-cache synchronization before relying on offline startup; an old local operator snapshot is intentionally not migrated into device authorization.

## Post-Phase-29 Admissions stabilization

Apply migration `0030_public_admissions_stabilization.sql` before deploying the rebuilt API and web images. Local Docker verification on 2026-08-23 applied migration 0030, validated all 23 migration files, and ran web/API/PostgreSQL on `15173`/`14000`/`15432`. New and returning applications `MMREG-2026-100075` and `MMREG-2026-100076` were submitted, opened in the queue, and transitioned to Under Review; the returning record remained linked to `MMSC-2026-0002`.

## Phase 29 Administration navigation extension

No migration, port, permission, environment variable, or external service is added. Rebuild the API/web images and run the repeatable seed to advance release metadata to `phase-29-ext-administration-navigation`. Verify representative single- and multi-workspace accounts, permission-hidden/empty menu groups, active highlighting, group collapse, mobile drawer behavior, same-session switching, and direct route rejection.

Verified locally on 2026-08-21: all 21 migrations, API/web typecheck and lint, 113 API tests, 26 web tests, and both production builds passed. Docker rebuilt and restarted the isolated `15432`/`14000`/`15173` services, the seed completed, and web/health/readiness returned HTTP 200. Authenticated browser verification was attempted but could not proceed without action-time approval to enter the local administrator password; deterministic tests cover grouped visibility, empty-group omission, current-workspace presentation, multi-access coexistence, and single-workspace routing.

## Phase 29 Security & Access UI extension

No migration, port, environment variable, permission, or external service is added. Rebuild the API and web images and run the repeatable seed so release metadata advances to `phase-29-ext-security-access-operations-ui`. Verify all four `/security?tab=` views using accounts with their intended permissions, confirm that privileged controls remain hidden without their management grants, and confirm audit responses contain no metadata or secrets.

Phase 29 requires no migration, new port, permission, environment variable, or external service. Rebuild the web/API images and run the repeatable seed to advance release metadata. Verify landing behavior for each provisioned role, multi-experience switching only for accounts with multiple authoritative roles, permission-hidden navigation, keyboard skip/focus behavior, and direct invalid-route fallback.

Verified locally on 2026-08-21: all 21 migrations validated; API/web typecheck, lint, 113 API tests, 24 web tests, and both production builds passed. Docker rebuilt/restarted the isolated `15432`/`14000`/`15173` services, and the Phase 29 seed passed. Web, health, and readiness returned HTTP 200. Authenticated desktop/mobile browser checks confirmed valid Super Administrator landing, invalid Student-route fallback, live-data copy, main/skip landmarks, zero horizontal overflow, and no post-login console errors. Multi-role selection was verified in automated role/permission tests rather than by fabricating a live identity relationship.

Phase 28 requires no migration, new port, environment variable, or external monitoring service. Rebuild API/web images and run the repeatable seed to install the two operational permissions and role grants. Verify authenticated control-plane reads with a view-authorized account; do not execute session maintenance merely as a health probe because it is an audited state-changing operation.

Verified locally on 2026-08-21: all 21 migrations validated; API/web typecheck, lint, 113 API tests, 21 web tests, and both production builds passed. Docker rebuilt/restarted the isolated `15432`/`14000`/`15173` services, and the Phase 28 seed passed. Web Operations, API health/readiness, configured Super Administrator login, and the authorized control-plane read returned expected success responses. The live read found 15 stale sessions; maintenance was intentionally not invoked during deployment verification.

Phase 27 requires no migration, seed, API configuration, or port change. Rebuild the web image to receive route chunks, manifest metadata, IndexedDB queue migration, and service-worker cache `mmsc-app-shell-v4`. Production must use HTTPS and should verify installability, offline capture while the authenticated kiosk remains open, refresh durability, reconnect synchronization, cache cleanup, and physical scanner behavior on each managed device. A fresh offline launch cannot establish or renew a server session and is intentionally not claimed as supported.

Verified locally on 2026-08-21: all 21 migrations validated; API/web typechecks, lint, 109 API tests, 20 web tests, and both production builds passed. Docker rebuilt/restarted the isolated `15432`/`14000`/`15173` services; web, terminal, manifest, service worker, health, and readiness returned HTTP 200. Browser inspection found the correct manifest and no console warnings/errors. Physical install, scanner hardware, and an authenticated forced-offline/reconnect cycle remain explicit device acceptance checks.

Migration 0021 is required before deploying the authentication stabilization. Run the repeatable seed to grant `security.account.provision` and `security.user.change_password` to Super Administrator and ensure the bootstrap Username alias. Existing password hashes remain valid; users switch from email to their migrated Username or authoritative School ID. Configure a verified outbound email provider and token-delivery design before claiming Forgot Password delivery.

Verified locally on 2026-08-21: 21 migrations validated, migration 0021 applied, seed passed, API/web typecheck/lint/tests/builds passed (109 API and 18 web tests), and all services ran on isolated ports `15173`/`14000`/`15432`. Username login, authenticated identity, centralized account listing, recovery foundation, readiness, and web returned expected success responses; legacy Email login returned generic HTTP 401. Browser inspection found the new login experience without console errors. No eligible unlinked portal identities existed for a live activation journey.

Phase 26 adds `TRUST_PROXY` (false by default). Enable only with exactly one controlled reverse proxy directly before the API. Multi-instance deployment requires shared/edge throttling. Production requires HTTPS, `SESSION_COOKIE_SECURE=true`, and the exact web origin in `CORS_ORIGIN`.

Verified locally on 2026-08-20: all 20 migrations validated; API/web typechecks, lint, tests, and production builds passed (105 API tests across 29 files and 18 web tests across 6 files); all Docker services ran on isolated ports `15173`, `14000`, and `15432`; readiness and web returned HTTP 200; security/no-cache headers matched the local HTTP environment; a hostile cross-site login returned HTTP 403 `UNTRUSTED_ORIGIN`; and the configured superadmin login plus authenticated identity check returned HTTP 200.

Direct frontend Docker builds default `VITE_API_URL` to `http://localhost:14000/api/v1`, matching the isolated local stack. Compose still supplies the value explicitly. This prevents a missing build argument from producing relative `/auth/*` requests against Nginx and HTTP 405 login failures.

Phase 25 requires no migration or environment change. Rebuild API/web images for the nine-report catalog; existing `report.view` and `report.export` grants remain authoritative.

Verified locally on 2026-08-20: all 20 migrations validated; API/web typechecks, lint, tests, and production builds passed (100 API and 18 web tests); all nine SQL report contracts executed against PostgreSQL; Docker remained isolated on 15173/14000/15432; Operations and readiness returned HTTP 200. Browser inspection confirmed the centralized sign-in boundary without console errors; authenticated report interaction was not manually claimed.

The Attendance Terminal stabilization requires migration 0020 and rebuilt API/web images. Production PWA installation requires HTTPS and physical device/reader verification; localhost is a development secure context.

Verified locally on 2026-08-20: 20 migrations validated and migration 0020 applied; API/web typechecks, lint, tests, and builds passed (97 API and 18 web tests); all isolated Docker services ran; routes, PWA assets, and readiness returned HTTP 200. Browser login boundary and manifest linkage were inspected without console errors. Authenticated capture, forced offline/reconnect, install prompt, and physical hardware were not manually exercised.

The Post-Phase 24 stabilization extension adds no migration or seed. Rebuild the frontend to receive the user-creation, logout URL, Student filter, Admissions tab, and Attendance verification layout fixes. Verified locally on 2026-08-20: all 19 migrations validated; API/web typecheck, lint, tests, and production builds passed; 95 backend and 18 frontend tests passed; all containers ran on isolated ports; Student All/canonical-status, Admissions, and affected frontend routes returned 200.

Phase 24 adds no migration. Run the Phase 24 repeatable seed to grant `calendar.experience.access`, rebuild API/web images, and retain the isolated `15173`/`14000`/`15432` ports. The experience uses the existing calendar event data and requires no external calendar provider. Verified locally on 2026-08-20: all 19 migrations validated, the seed passed, 95 backend and 4 frontend tests passed, typecheck/lint/build gates passed, all three containers ran, and health, readiness, web Calendar, authentication boundary, plus authenticated Calendar context/event queries returned their expected results.

Phase 18 requires migration `0019_attendance_operations.sql` and the Phase 18 repeatable seed. Before operational use, register at least one active Attendance Terminal and grant staff only the required lookup, capture, or exception permissions. The manual workspace performs online authoritative identity resolution; it does not require a separate identity cache or new external service. Verified locally on 2026-08-20: all 19 migrations validated, migration and seed succeeded, API and frontend typecheck/lint/tests passed, 91 backend and 4 frontend tests passed, and both production images built. API health/readiness, the web route, authentication boundary, and authenticated context/event-list requests passed on isolated ports `15173`, `14000`, and `15432`.

Phase 17 requires migration `0018_notification_center.sql` and the Phase 17 repeatable seed. It introduces in-app delivery only and requires no email, SMS, or push provider configuration. Verified locally on 2026-08-20: all 18 migration files validated, migration and seed succeeded, production images built, all automated checks passed, notification routes plus API health/readiness passed on isolated ports `15173`, `14000`, and `15432`, and an authenticated draft/publish/deliver/read lifecycle succeeded. The temporary verification message was expired and archived while its immutable lifecycle history was retained.

Phase 15 requires migration `0016_registration_admissions.sql` and the Phase 15 seed. Verify Registrar/School Administrator role grants before accepting real applications. MMSC continues to use isolated host ports 15173/14000/15432.

Phase 16 has no migration. Run the Phase 16 seed to grant `parent.portal.access`, then provision accounts through centralized Security and link `guardians.user_id` before portal use.

Verified locally on 2026-08-20: all 17 migration files validated, the Phase 16 seed completed, both production images built, and all three Docker services ran on isolated ports `15173`, `14000`, and `15432`. `/parent`, API health, and API readiness returned HTTP 200; the protected Parent Portal API returned the expected HTTP 401 without a session.

The Public Registration extension additionally requires migration `0017_public_registration.sql`, HTTPS in production, persistent protected media storage, and reverse-proxy request throttling. The built-in rate limiter is a single-process baseline; production multi-instance deployments must enforce shared or edge rate limits.

Verified locally on 2026-08-20: migration validation, production builds, `/register`, public context, invalid-token denial, and API readiness passed on the isolated Docker ports. End-to-end submission could not be exercised against local data because no School Year or Grade Level is configured; configure academic intake choices before opening registration.

Verified locally on 2026-08-20: all 16 migrations validated, the Phase 15 seed completed, production images rebuilt, and Docker services remained healthy. `/admissions`, API health, and API readiness returned HTTP 200; the Admissions API returned the expected HTTP 401 without an authenticated session.

Verified locally on 2026-08-20: all 15 migrations validated, the seed completed, production images rebuilt, Docker services restarted, and the terminal route, PWA assets, API health, and API readiness returned HTTP 200.

Phase 12 requires migration `0014_grading_system.sql` and the repeatable seed for grading permissions and term-derived grading periods. Verified locally on 2026-08-20: migration, seed, API/web builds, Docker restart, and live health/readiness checks passed on isolated ports.

Phase 11 adds no migration. Run the repeatable seed to install `teacher.portal.access`, rebuild API/web images, and retain the isolated web `15173`, API `14000`, and PostgreSQL `15432` ports.

Verified locally on 2026-08-20: both images built, the Phase 11 seed completed, all three services started on their dedicated ports, and web/API health/readiness returned HTTP 200.

## Development

Docker Compose exposes PostgreSQL on host port 15432, the Express API on 14000, and the Nginx-served frontend on 15173. PostgreSQL remains on 5432 inside the Compose network. These dedicated MMSC ports avoid the King Seven Builders HRIS and Attendance Terminal development stacks. The root `.env` supplies local configuration and local data persists in a named volume.

Profile media persists in the `media_uploads` named volume mounted at `/data/uploads`; container recreation and frontend rebuilds do not remove it. Production may substitute S3-compatible object storage and CDN delivery through the storage provider while retaining logical keys and media asset references.

Phase 7 uses the existing dedicated ports: web `15173`, API `14000`, and PostgreSQL `15432`, avoiding the King Seven applications. Deploy migration `0010_academic_assignments.sql`, run the repeatable seed, rebuild API/web images, and verify health/readiness and the Assignments workspace.

Verified locally on 2026-08-19: both images built, migration 0010 and the Phase 7 seed completed, PostgreSQL remained healthy, API health/readiness passed, and the frontend returned HTTP 200 with the rebuilt Phase 7 asset.

Phase 8 retains isolated ports web `15173`, API `14000`, and PostgreSQL `15432`. Apply migration `0011_employee_attendance.sql`, run the seed, rebuild both images, and verify attendance permissions plus API/web readiness.

Verified locally on 2026-08-19: API and web images built, migration 0011 and the Phase 8 seed completed, all three containers became ready, API health/readiness passed, and the frontend returned HTTP 200 with the rebuilt Phase 8 asset.

Phase 9 retains isolated ports web `15173`, API `14000`, and PostgreSQL `15432`. Apply migration `0012_student_attendance.sql`, run the seed, rebuild both images, and verify student-attendance permissions plus API/web readiness.

Verified locally on 2026-08-19: both images built, migration 0012 and the Phase 9 seed completed, all containers became ready, database integrity triggers were present, API health/readiness passed, and the frontend returned HTTP 200 with the rebuilt Phase 9 asset.

Phase 10 retains isolated ports web `15173`, API `14000`, and PostgreSQL `15432`. Apply migration `0013_reporting_and_administration.sql`, run the seed, rebuild both images, and verify dashboard/report/settings permissions plus API/web readiness.

Verified locally on 2026-08-19: both images built, migration 0013 and the Phase 10 seed completed, all containers became ready, four new permissions existed, authoritative empty-state counts were confirmed, API health/readiness passed, and the frontend returned HTTP 200 with the rebuilt Phase 10 asset.

The Phase 10 multi-experience extension requires no migration or port changes. Verified locally on 2026-08-20: the outlet-capable administrative route layout built successfully, all three services ran on the dedicated ports above, and frontend/API health/readiness returned HTTP 200. No future experience route or deployable client was introduced.

## Staging (planned)

Use separate immutable web/API images, managed PostgreSQL, private database networking, TLS at a reverse proxy or platform edge, unique secrets, migration execution as a controlled release step, health/readiness probes, centralized logs, and automated backups with restore tests.

## Production (planned)

No production deployment exists. Production requires a chosen host/domain, TLS, secret manager, least-privilege database accounts, monitored backups, restore procedure, retention policy, deployment approval/rollback workflow, vulnerability scanning, and observability. Never reuse Compose development credentials or store secrets here.

Attendance kiosks additionally require a managed encrypted device/browser profile, HTTPS, an explicitly registered Campus-aware terminal, camera permission policy when used, tested USB HID reader timing, service-worker/IndexedDB retention, clock synchronization monitoring, and a retirement procedure that clears browser storage and ends the terminal session. Production approval requires an installed-PWA offline restart and reconnect/idempotency exercise on each supported kiosk/browser model.

The Attendance Terminal worker installs only after caching `/index.html`, the terminal route, manifest/logo, Vite build manifest, and every emitted hashed JS/CSS asset. The trusted-authorization recovery worker uses cache version 4 and `skipWaiting()` so the stuck legacy authorization bundle can be replaced promptly. Deployments must serve `/.vite/manifest.json` and `sw.js` from the same origin and must not rewrite API or managed-media requests into the application shell.

Set `SESSION_COOKIE_SECURE=true` in staging and production and serve the browser/API on a compatible HTTPS site so SameSite session cookies function. Run migrations before application rollout, seed standard roles/permissions, bootstrap the first administrator through a one-time secret, then remove that secret. Session and audit tables require retention/cleanup policies before production launch; neither policy is automated in Phase 1.
# Post-Phase 29 academic structure correction

This correction adds migration 0022 and two RBAC permissions but no port, environment variable, or external service. Back up PostgreSQL, apply migrations, run the repeatable seed, and rebuild API/web images. Verify one live primary MMSC institution, retained previous-school text, normalized references for exact matches, permission-scoped External Schools, and Academics creation without a school selector.

## Local demo data

`pnpm demo:reset` is destructive and exclusively for the local `mmsc` development/demo database. Never set its confirmation or shared demo-password variables in staging or production. Production deployment must use `pnpm db:seed` only for system roles, permissions, metadata, and explicitly supplied bootstrap administration.
## Trusted Attendance PWA deployment

Apply migration `0035_attendance_terminal_trusted_pwa.sql`, rebuild API, Administration, and `web-2`, then create installation codes from Administration. Production installation requires HTTPS or a localhost secure context. Retire a kiosk by revoking its trusted installation and clearing the managed browser profile; do not reuse its secret. Service-worker updates preserve IndexedDB and wait for the active kiosk session to close.
## Attendance sync recovery deployment

Rebuild and restart `api` and `web-2`. Service-worker cache version 4 stages the corrected client without deleting IndexedDB and activates promptly with `skipWaiting()`. Existing trusted installation and queue state remain intact.
