# Phase 19 — Clinic Management & Clinic Portal

Status: Completed on 2026-08-27. Groups 1 through 6 are implemented and the final migration, seed, RBAC, privacy, regression, build, and acceptance gates passed.

## Architecture

Application Access correction (2026-08-27): Clinic remains distinct at `/clinic/*`, but entry is controlled by the existing RBAC permission `clinic.portal.access`; no separate per-user application registry remains. Security & Access exposes Clinic through the Clinic Staff role and Clinic permission group. See `PHASE-19-EXT-CLINIC-APPLICATION-ACCESS-FIX.md`.

Group 1 completion (2026-08-27): RBAC, login routing, granular route/API protection, Security permission grouping, permission-filtered Clinic navigation, responsive shell behavior, and Administration/Clinic boundaries are stabilized. See `PHASE-19-GROUP-1-RBAC-CLINIC-PORTAL-FOUNDATION.md`.

Group 2 completion (2026-08-27): the longitudinal Student Health Record, health profile, allergy/condition management, immunizations, physical examinations, BMI, clinical audit boundary, and view/manage separation are implemented. See `PHASE-19-GROUP-2-STUDENT-HEALTH-RECORDS.md`.

Group 3 completion (2026-08-27): the arrival-to-disposition consultation workflow, active queue, structured care documentation, transactional dispensing UI, Guardian contact, follow-up completion, and Daily Transaction Log are implemented. See `PHASE-19-GROUP-3-CONSULTATION-WORKFLOW.md`.

Group 4 completion (2026-08-27): appointment and follow-up lifecycles, appointment-to-encounter behavior, operational alerts, explicit portal-safe releases, and Student/Guardian notification delivery are implemented. See `PHASE-19-GROUP-4-APPOINTMENTS-PORTAL-INTEGRATION.md`.

Group 5 completion (2026-08-27): Administration governance, item-master configuration, operational stock movements and history, privacy-scoped reports/exports, performance indexes, and UI consistency are implemented. See `PHASE-19-GROUP-5-ADMINISTRATION-INVENTORY-REPORTS.md`.

Group 6 completion (2026-08-27): seed/demo repair, fresh and populated database validation, real PostgreSQL concurrency/expiry acceptance, full regression, and documentation closeout passed. See `PHASE-19-GROUP-6-FINAL-VALIDATION.md`.

Stabilization extension (2026-08-27): Portal Switcher active state now derives from the current route namespace, Clinic form controls share the Administration form treatment, and Operational Alerts use an explicit responsive 4/2/1 grid. See `PHASE-19-EXT-PORTAL-SWITCHER-CLINIC-UI-STABILIZATION.md`.

Phase 19 adds Clinic as a first-class application experience at `/clinic/*`. Clinic-only users resolve directly to `/clinic`, then the Clinic shell redirects internally to `/clinic/dashboard`; Administration access is not required. Administration contains `/clinic-management` only for governance, configuration visibility, item-master oversight, staff access guidance, and reporting boundaries. Detailed EHR access remains independently permissioned.

Student, Employee, Guardian, User, Enrollment, School Year, RBAC, audit, and notification identities remain authoritative shared-platform records. No Clinic-local identity or authentication store exists. Parent and Student delivery uses the existing Notification Center; internal clinical notes are not exposed through either portal.

## Database and inventory

Migration `0038_clinic_management.sql` adds `clinic_settings`, `clinic_health_profiles`, `clinic_health_alerts`, `clinic_immunizations`, `clinic_physical_exams`, `clinic_items`, `clinic_inventory_lots`, `clinic_encounters`, `clinic_interventions`, `clinic_inventory_transactions`, `clinic_appointments`, `clinic_follow_ups`, and `clinic_guardian_contacts`. Foreign keys reference canonical platform entities. Check constraints protect statuses, quantities, queue completion/time-out consistency, and transaction types. Indexes cover alerts, longitudinal history, active queue, due follow-ups, appointments, lots, and transaction history.

Clinic inventory is an operational location boundary prepared for future central inventory integration. Dispensing locks the item and eligible lots inside one PostgreSQL transaction, consumes earliest-expiry valid lots first, rejects expired/inactive/insufficient stock, writes inventory movements and the intervention atomically, and never allows negative lot stock.

## API

- `GET /api/v1/clinic/dashboard`
- `GET /api/v1/clinic/students?q=` and `GET /api/v1/clinic/students/:id`
- `POST /api/v1/clinic/students/:id/alerts`
- `POST /api/v1/clinic/encounters`, `PATCH /api/v1/clinic/encounters/:id`
- `POST /api/v1/clinic/encounters/:id/dispense`
- `POST /api/v1/clinic/encounters/:id/follow-ups`
- `POST /api/v1/clinic/encounters/:id/guardian-contacts`
- `GET/POST /api/v1/clinic/items`, `POST /api/v1/clinic/items/:id/stock-in`
- `GET /api/v1/clinic/settings`

All endpoints require granular Clinic permissions. Search is limited to active-year enrolled Students. Guardian contact validates the canonical active relationship. Sensitive mutations write centralized audit events without clinical note contents.

## Frontend and RBAC

The dedicated shell provides Dashboard, Student Lookup, Visit Queue, Clinic Visits, Medicine & Supplies, Appointments, and Notifications. Dashboard counts and alerts come from persisted data. Administration gains Clinic Management without becoming the consultation surface.

The final schema contains 16 granular Clinic permissions, including portal access and separated view/manage boundaries for health records, encounters, inventory, appointments/follow-ups, notifications, reports, and configuration. Clinic Staff receives operational permissions except configuration management; School Administrator receives configuration and aggregate reporting but not automatic detailed Health Record access; Super Administrator inherits all permissions.

## Verification

- All 39 migrations passed on a disposable fresh PostgreSQL database and are present on the populated database.
- Repeatable seed passed on the populated database; fresh seed, demo reset, and all twelve demo invariants passed in isolation.
- The rejected `applications`/`user_applications` registry is absent, while pre-existing Administration, Teacher, Student, Parent, Attendance, Library, and Super Administrator access remains intact.
- Real PostgreSQL acceptance passed for simultaneous last-unit dispensing, expired-stock rejection, near-expiry consumption, rollback, movement history, and nonnegative stock.
- API: 49 files / 228 tests passed; lint, TypeScript, and production build passed.
- Web: 22 files / 75 tests passed; TypeScript and production build passed. Lint has zero errors and two documented hook-dependency warnings.
- UI/API integration coverage passed for RBAC view/manage separation, unauthorized access, EHR history, the consultation workflow, appointments/follow-ups, portal-safe Student/Guardian visibility, inventory, alerts, and reports.

Phase 19 is complete. The next planned phase is Phase 20, but it has not been started.
