# Changelog

- Corrected approved-Admission Enrollment review eligibility, added truthful readiness states, and enriched the atomic Enrollment completion result/audit references for future non-blocking integrations without implementing Finance or Billing.

## 2026-08-28 — Registration & Admissions minor enhancement

- Added a single enabled School-Year registration period with audited activation and backend enforcement.
- Added the public registration-closed state using authoritative School contact data.
- Extended optional Admission documents and protected staff operations without duplicating storage.
- Added permission-protected Under Review application editing while preserving Enrollment handoff semantics.
- Applied migration `0062` to the configured local database, resolving public and administrative bootstrap failures caused by the missing `registration_periods` table.
- Added the omitted optional staff-assisted document picker and create-then-upload workflow using the shared Admission document domain.
- Added grouped multi-file selection for public, staff-assisted, and Under Review Admission documents while preserving each file's document-type tag.
- Added secure per-document download actions in Admissions using the existing application-scoped, permission-protected storage endpoint.

## 2026-08-27 — Phase 20 manual testing extension 2

- Corrected centralized credential resolution to prefer a current active, unexpired row when the same digest also has revoked/replaced lifecycle history; this is the real application-created RFID case that seed-only verification missed.
- Aligned Library Visitor accepted identity credentials with the credential UI's `rfid`/`qr` types while retaining legacy `barcode` compatibility and the shared string normalization/SHA-256 pipeline.
- Fixed Visitor Analytics PostgreSQL syntax errors caused by unquoted `hour` and `day` aliases, and applied the established `Asia/Manila` school-day boundary to visitor lists and aggregates.
- Added official credential-service create-to-scan acceptance, existing lifecycle-history RFID acceptance, zero-data/open-session analytics checks, validation coverage, and Attendance-isolation verification. No schema migration was required.

## 2026-08-27 — Phase 20 manual testing extension

- Centralized Library Visitor credential resolution over the existing `credentials` table and canonical SHA-256 digest/normalization helper; no Library credential registry was added.
- Preserved case and leading zeroes, removed scanner CR/LF and surrounding whitespace, accepted active/unexpired RFID and barcode credentials, and retained authoritative Student/Employee eligibility checks.
- Corrected Library audit action names to the platform-required lowercase dotted convention after live Entry testing exposed transaction rollback on `VISITOR_ENTRY`.
- Normalized Library text, textarea, select, date, search, focus, disabled, and button presentation to the established Administration/Clinic control standard without changing scanner behavior.
- Live local acceptance completed Student and Employee RFID Entry/Exit and verified unchanged Student Attendance, Employee Attendance, and Attendance Terminal event counts.

## 2026-08-27 — Phase 20 Library Management MVP completed

- Completed the live Library dashboard with eight KPIs, seven-day circulation trends, 30-day popularity analytics, and operational copy/open-session alerts.
- Added eight bounded, permission-scoped Library reports with pagination and filter-preserving CSV export separately protected by `report.export`.
- Added migration 0053 with returned-loan, copy-status, and completed-visit reporting indexes; reviewed existing barcode/accession, active-loan, open-visitor, overdue, and notification-deduplication constraints.
- Completed the RBAC, IDOR, audit, error-contract, responsive UI, accessibility, performance, and cross-module regression review without adding deferred fines, payments, holds, acquisition, or stocktake functionality.
- Final verification passed: 47 migrations, live PostgreSQL acceptance for all eight reports and dashboard aggregate, API/web typechecks and lint, 53 API files/265 tests, 29 web files/89 tests, and both production builds. Physical scanner/browser workflow validation remains an on-site operational check.
- Phase 20 is complete. Phase 21 has not been started.

## 2026-08-27 — Phase 20 Group 6 overdue management and portals

- Added grace-aware due/overdue queues, server filters and pagination, read-only Student My Library, and Guardian-relationship-scoped Parent Child Library views.
- Integrated milestone reminders with the existing Notifications domain and an idempotent per-loan dispatch ledger; returned loans are excluded and no fines/payments were added.
- Added migration, route, relationship-boundary, portal UI, and rollback database acceptance coverage. Phase 20 remains in progress; Group 7 has not started.
- Verification passed for 46 migrations, Group 6 database acceptance, API/web typechecks and lint, 264 API tests, targeted Group 6 web coverage, and both production builds. The full parallel web run passed 88 tests and exposed one pre-existing scanner autofocus timing failure that passed immediately in isolation (2/2); a single-worker retry ended at the host level before a summary was emitted.

## 2026-08-27 — Phase 20 Group 5 visitor logging

- Added Library-owned entry/exit sessions, duplicate protection, scanner/manual workflows, current-inside state, daily logs, and server foot-traffic analytics without Attendance writes. Phase 20 remains in progress; Group 6 has not started.


## 2026-08-27 — Phase 20 Group 4 borrowing policies

- Added editable default policy and optional Student, Teacher, and Employee overrides for limits, duration, renewals, grace, and overdue borrowing.
- Enforced rules in checkout and renewal with patron serialization, server-owned due dates, domain errors, reasoned overrides, and non-retroactive changes.
- Added policy settings UI, audit events, date tests, and rollback acceptance. Phase 20 remains in progress; Group 5 has not started.


## 2026-08-27 — Phase 20 Group 3 patrons and circulation

- Added canonical Student/Employee patron resolution, Teacher specialization display, shared barcode/RFID/QR credential scanning, and least-data patron profiles.
- Added migration 0049 and transactional multi-copy checkout, patron-independent check-in, renewal, active/patron/copy history, copy-state synchronization, deterministic locks, and one-active-loan enforcement.
- Added scanner-first Checkout, rapid Check-in, and Patron workspaces plus granular RBAC and `CHECKOUT_CREATED`, `CHECKIN_COMPLETED`, `LOAN_RENEWED`, and `CIRCULATION_OVERRIDE` audits. Phase 20 remains in progress; Group 4 has not started.

## 2026-08-27 — Phase 20 Group 2 Library catalog and copies

- Added reusable Library classifications, practical bibliographic records, independently tracked physical copies, and case-insensitive unique barcode/accession indexes.
- Added sequence-backed `LIB-000001` identifier generation, transactional bulk copy creation, normalized barcode lookup, controlled status transitions, title archival, and centralized audit events.
- Replaced the Catalog placeholder with server-paginated search/filter/sort, book details, Add/Edit Book, classification, copy creation/editing, copy summary, and responsive status-management workflows.
- Added route, schema, transition, UI permission, navigation regression, and rollback-only PostgreSQL acceptance coverage. Phase 20 remains in progress; Group 3 has not started.

## 2026-08-27 — Phase 20 Group 1 Library foundation

- Added the dedicated `/library/*` portal shell, route-derived Portal Switcher integration, permission-filtered responsive navigation, zero-safe dashboard, and truthful deferred-workflow states.
- Added migration 0046 with constrained Library settings, twenty granular Library permissions, and Library Administrator, Librarian, and Library Assistant least-privilege grants.
- Added portal-plus-granular API enforcement, validated transactional settings updates, centralized Library audit events, Security & Access visibility, and automated route/RBAC/navigation coverage.
- Reused centralized Student, Employee, User, Credential, RBAC, session, error, and audit architecture; no Library-local people or credential registry was created. Phase 20 remains in progress; Group 2 has not started.

## 2026-08-27 — Phase 19 portal switcher and Clinic UI stabilization

- Corrected Portal Switcher active-state resolution so `/clinic/*` routes remain in Clinic for multi-portal users; RBAC still determines only the available workspaces.
- Standardized Clinic Portal and Clinic Management form controls with the Administration input, textarea, select, focus, disabled, and responsive-layout treatment.
- Changed Operational Alerts to an explicit four-column desktop, two-column tablet, one-column mobile grid, preserving its existing alert actions and content.
- Added switcher interaction, deep-route, and alert-grid tests. Full web regression passed: 23 files / 77 tests; typecheck and production build passed; lint reports two existing warnings and no errors.

## 2026-08-27 — Phase 19 final validation and completion

- Repaired repeatable seeding by loading the repository-root environment deterministically and retaining the portable SHA-256 bootstrap identity digest.
- Added a Clinic Staff demo persona plus representative Clinic EHR, inventory, and appointment data with twelve demo invariants.
- Added disposable fresh-PostgreSQL validation for all 39 migrations, seed/reset/validation, RBAC, removed application-registry state, and real transactional Clinic dispensing acceptance.
- Verified the populated database, all API and web tests, lint/typecheck, and production builds. Phase 19 is complete; Phase 20 has not been started.

## 2026-08-27 — Phase 19 Group 3 Consultation workflow

- Completed the Student arrival-to-disposition Clinic workflow with active queue states, direct consultation opening, structured symptoms, optional vitals, separate assessment/diagnosis, interventions, observation, Guardian contact, follow-up, and audited completion.
- Connected the transactional FEFO dispensing backend to a valid-stock and batch-aware consultation UI, retained row locking and rollback safeguards, and added item creation/stock receiving through permission-scoped UI workflows.
- Added the searchable, filtered, paginated Daily Transaction Log and concurrency regression coverage for last-unit dispensing. Phase 19 remains in progress; Group 4 has not started.

## 2026-08-27 — Phase 19 Group 2 Student Health Records

- Completed the restricted Clinic Student Health Record with canonical Student, Enrollment, photo, Guardian, visit, appointment, and follow-up context.
- Added health-profile, allergy/condition, immunization, and physical-examination create/edit workflows with optimistic versions, archival history, and server-calculated BMI.
- Renamed the earlier Clinic EHR permission records in place to `clinic.health_records.view/manage`, retaining centralized RBAC assignments and keeping School Administrator outside detailed clinical access by default.
- Added privacy-conscious audit events, prominent critical-alert rendering, responsive Administration-aligned tabs/forms/history tables, and expanded API/UI tests. Phase 19 remains in progress; Group 3 has not started.

## 2026-08-27 — Phase 19 Group 1 RBAC and Clinic Portal foundation

- Added migration 0041 with least-privilege Clinic Dashboard, Appointment-view, and Follow-up-view permissions for Clinic Staff and Super Administrator.
- Stabilized the Clinic shell with permission-filtered operational navigation and an accessible responsive drawer aligned with Administration UI conventions.
- Added granular frontend route guards, a dedicated permission-scoped visit-queue API, and action visibility for encounter creation.
- Expanded access, navigation, Security role-editor, API boundary, and existing-portal regression coverage without restoring an application registry or starting Group 2 workflows.

## 2026-08-27 — Phase 19 Clinic Application Access correction

- Retired the generalized `applications` and `user_applications` model introduced by migration 0039 and added forward migration 0040 to preserve Clinic intent through the existing Clinic Staff role before removing both tables.
- Restored pre-0039 Administration, Teacher, Student, Parent, and Attendance access resolution and removed application assignments from authentication and portal activation.
- Made `clinic.portal.access` the server and frontend gate for `/clinic/*`, while retaining granular Clinic permissions for operations inside the portal.
- Refactored Security & Access to display portal access derived from RBAC and configure Clinic through the existing role and permission workflows.

## 2026-08-26 — Phase 19 Clinic Management & Clinic Portal (in progress)

- Added Clinic as an independently permissioned application with direct clinic-only routing, a dedicated operational shell, persisted dashboard/queue, enrolled-student lookup, restricted health alerts, encounter creation, inventory visibility, and Administration governance.
- Added longitudinal EHR, encounter, appointment, follow-up, guardian-contact, item, lot, and stock-movement structures in migration `0038_clinic_management.sql`.
- Added transactional earliest-expiry dispensing with row locks and inactive, expired, insufficient, and negative-stock protection.
- Added granular Clinic permissions and default Clinic Staff/School Administrator boundaries; general Administration does not automatically grant detailed EHR access.
- Automated TypeScript verification passed. Full test/build execution encountered a local Vite temporary-directory permission limitation; database-backed and manual multi-account acceptance remain pending.

## 2026-08-26 — Attendance multi-session sync conflict correction

- Fixed legacy open attendance sessions being misclassified as a new TIME IN when their older terminal receipts had no direction.
- Preserved Student and Employee one-open-session constraints while allowing completed multi-session rows.
- Serialized capture-id processing so retries return `already_processed` without another attendance transition.
- Added explicit sync result classification and terminal-specific logging/error mapping for unexpected uniqueness failures.
- Recovered the reported queued capture as one TIME OUT transaction; its idempotent replay returned the stored result.

## 2026-08-26 — Attendance Terminal multi-session IN/OUT processing

- Converted Student campus and Employee terminal attendance from one daily session to repeatable TIME IN/TIME OUT session rows while preserving the existing tables and event audit log.
- Added server-authoritative alternation, latest-open-session pairing, one-minute duplicate protection, person/day concurrency locks, chronological offline batch reconciliation, and idempotent receipts across terminals.
- Added Web-2 offline direction prediction from synchronized state plus queued captures, local one-minute rejection before enqueue, and authoritative online TIME IN/TIME OUT/duplicate results without changing PWA trust or queue stores.

## 2026-08-26 — Credential lifecycle and Attendance Terminal sync fix

- Traced the shared `Credential not valid` branch to newly issued Student and Employee RFID rows whose expiration timestamps were already earlier than their creation timestamps. Registration now rejects non-future expiration values, the form prevents past/current-minute selection and explains that expiration is optional, and Web-2 reports/logs `CREDENTIAL_EXPIRED` without raw RFID data.
- Fixed PostgreSQL parameter inference in the shared lifecycle update (`42P08`), which had caused Deactivate, Mark Lost, and Revoke to return `INTERNAL_ERROR`.
- Enforced explicit lifecycle transitions, added previous/new status audit metadata and contextual unexpected-failure logging, and aligned Administration action availability.
- Corrected the terminal snapshot's Employee name branch; a null Student join could previously win `COALESCE` as an empty string and hide the Employee display name.
- Kept RFID normalization lossless except for scanner whitespace trimming, with leading zeros and case preserved through digest creation and lookup; terminal rejection messages now distinguish inactive, lost, revoked, and replaced credentials from device authorization failures.
- Prevented credential lifecycle buttons from triggering unintended form navigation, kept mutations on the authoritative POST status route, and separated mutation success from list refresh errors.
- Kept credential replacement response reads inside the atomic transaction.
- Added bounded and manual Student/Employee credential snapshot refresh to Web-2 without changing its IndexedDB queue or device provisioning model.
- Added targeted Administration and Web-2 regression tests.
- Added a production-blocked, confirmation-guarded local RFID test reset and used it to clear 5 Student and 7 Employee RFID rows while preserving identities, attendance, and terminal/PWA state.

## 2026-08-26 — Teacher Portal grading, navigation, and attendance fixes

- Separated explicit School Year Grading Period configuration from Terms, scoped Teacher gradebook choices to the active assigned year, simplified Teacher navigation, retained Notification/Account header access, and made class rosters recognize campus Time In records without requiring Time Out.

## 2026-08-26 — Student and Employee profile-photo routing fix

- Fixed Student and Employee profile-photo owner URLs by resolving them through the existing managed-media asset service, preserving immutable asset delivery, permission checks, replacement behavior, and a non-fatal missing/broken-photo fallback.

## 2026-08-26 — Grade Review, Workforce, and Employee Attendance UI alignment

- Aligned Grade Review and Workforce with the enhanced Students directory hierarchy, blue workspace headers, integrated filters, responsive tables, status treatments, loading/empty states, and pagination.
- Aligned Employee Attendance with the enhanced Student Attendance date/filter panel and attendance-record table while retaining employee-specific statuses, fields, permissions, and manual capture.
- Preserved all existing grade workflow, Workforce profile/configuration, protected HR data, photo, credential, and attendance API contracts and actions.

## 2026-08-26 — Login, RBAC, and portal routing manual-test fix

- Corrected application discovery so shared Dashboard, Notifications, and Calendar permissions no longer imply Administration application access.
- Reused centralized role-backed experience resolution after login and forced password change, with Administration preferred only for Administration-assigned users.
- Guarded the Administration route group before its shell mounts, filtered the application switcher to authorized experiences, and removed the switcher for single-experience accounts.
- Added regressions for portal-only, Administration, multi-assignment, no-application, forced-password-change, and direct unauthorized Administration routing.

## 2026-08-26 — Attendance Terminal Administration migration fix

- Applied missing migration 0036 after confirming `GET /api/v1/attendance-terminals/admin` failed because PostgreSQL lacked `attendance_terminal_devices` and `attendance_terminal_provisioning_tokens`.
- Added Administration/runtime RBAC separation regression tests and actionable secret-safe unhandled-error logging.

## 2026-08-26 — Attendance Terminal Web-2 clean rebuild

- Retired the shared/imported `web-2` runtime, singular terminal APIs, session-selection authorization, trusted-installation compatibility flow, and legacy frontend IndexedDB modules.
- Added terminal-bound one-time provisioning, device authentication/revocation, pluralized APIs, versioned IndexedDB stores, per-capture batch receipts, and one bounded-retry synchronization engine.

## 2026-08-26 — Standalone Attendance Terminal frontend

- Extracted operational scanning from the Administration router into independently built `apps/web-2` on local port `15174`.
- Kept terminal registration and lifecycle management at `/attendance-terminals` in the main frontend on port `15173`.
- Scoped the installable manifest and service worker to the kiosk origin while preserving device-token authorization, the minimal IndexedDB identity cache, durable offline queue, scan processing, and shared backend enforcement.
- Added the `web-2` Docker/nginx service and allowed both frontend origins through API CORS.

## 2026-08-26 — Attendance Terminal device authorization

- Replaced the cached fake operator identity with independently revocable terminal device authorization.
- Added digest-only runtime tokens scoped to validation, minimal credential-cache synchronization, and attendance synchronization.
- Persisted versioned provisioning in IndexedDB and separated network failure from authoritative rejection.
- Extended cached-identity Manual Verification to durably queue a normal offline Time In while retaining authoritative recovery validation and duplicate protection.

## 2026-08-24 — Attendance Terminal true offline-first and fast-scan hardening

- Replaced best-effort runtime asset caching with install-time precaching driven by Vite's full hashed-asset manifest and a terminal-only offline navigation fallback.
- Persisted terminal configuration in IndexedDB and allowed transport-failure boot from the least-privilege terminal operator snapshot even when `navigator.onLine` is misleading.
- Added a stable sequential scan processor, durable-write-before-success behavior, independent API recovery probing/synchronization, development counters, and 20-scan throughput regression coverage.
- Added the temporary offline-capable RFID/QR credential test field and auditable `manual_credential_test` source through migration `0033`.
- Automated verification does not replace the required installed-PWA/container shutdown and physical kiosk tests; completion is not claimed.

## 2026-08-24 — Student and Employee Attendance date filtering correction

- Changed Student Attendance history from an Enrollment-roster projection with synthetic `not_recorded` rows to an authoritative attendance-transaction query.
- Kept Student search, School Year, Grade Level, Section, status, source, sorting, counts, and pagination on the same date-scoped record set, without an implicit active School Year filter.
- Verified Employee Attendance was already transaction-driven and added regressions for both identity types, including time-in-only and time-out-only records.
- Added no migration because the existing attendance date and identity indexes support the corrected access pattern.

## 2026-08-24 — Attendance credential and offline PWA enhancement

- Added shared Student/Employee RFID and QR credential profile management with masked values, generated opaque QR identifiers, lifecycle actions, active cross-identity uniqueness, and audit logging.
- Added incremental minimal credential synchronization to IndexedDB, local first-Time-In duplicate detection, durable source-aware attendance events, reconnect retry, and preserved original scan timestamps.
- Added always-on HID scanner handling, supported-browser camera QR capture, high-throughput interruptible three-second identity results, and server-authoritative first-scan-only Time In behavior.
- Added migration `0032`, deterministic fake demo credentials, credential/scanner tests, and the Phase 29 Attendance extension document. Physical kiosk/PWA end-to-end completion remains pending and is not claimed.

## 2026-08-24 — Student Attendance operational UI alignment

- Replaced the legacy stacked attendance cards with a current-day operational grid aligned to Admissions, Enrollments, Students, and Security & Access.
- Added server-side Student/Student Number search, School Year, sequence-ordered Grade Level, dependent Section, status/source filters, sorting, and 25-row pagination.
- Added modal-only attendance details and immutable correction history, with existing permission-protected correction actions retained in the modal.
- Defaulted the view to today and the active School Year while preserving terminal ingestion, manual capture, audit, reporting, and authoritative Enrollment ownership.

## 2026-08-24 — Exact Academic Assignments alignment to School Years

- Reused the Academics tab class and exact School Years tab measurements for the two Academic Assignments areas.
- Changed the assignment directory header to the School Years structure: icon/title/subtitle group on the left and live filtered record count on the right.
- Moved School Year selection into the filter toolbar below the blue header so the page hierarchy matches the reference exactly.
- Kept curriculum, teaching, copy-forward, RBAC, and API behavior unchanged.

## 2026-08-24 — Academic Assignments visual alignment

- Aligned Academic Assignments primary tabs with the current Academics tab geometry, icon sizing, hover/focus treatment, and semantic on-primary selected foreground.
- Removed the one-off white icon tile from the curriculum/teaching workspace header and matched the current operational-directory 25px icon, 21px H2, colors, padding, and spacing.
- Preserved all assignment workflows, API contracts, RBAC, School Year handling, and copy-forward behavior.

## 2026-08-24 — Academic Assignments workflow simplification and copy-forward

- Collapsed curriculum to one Grade Level row and teaching assignments to one Section row, each backed by a searchable batch editor.
- Added transactional multi-Subject curriculum updates and transactional per-Section primary Teacher assignment saves.
- Added preview-first, missing-only curriculum and teaching copy-forward with stable Section, Subject, and Teacher placement mapping; unmatched records remain review items and existing target records are never overwritten.
- Preserved Closed School Years as selectable historical sources and read-only targets in the UI and API.

## 2026-08-24 — Academic Assignments workflow revamp

- Separated Grade-Level Curriculum and Section Teaching Assignments into primary operational tabs with guided assignment sub-workflows.
- Replaced mixed assignment cards with searchable, filtered, paginated grids and modal-only details/history.
- Added in-place curriculum metadata editing and Teacher reassignment while preserving assignment IDs and audit history.
- Enforced active Teacher placement, curriculum/Section scope, duplicate database constraints, and Closed School Year read-only behavior server-side.

## 2026-08-24 — Academics School Year detail and ordering correction

- Fixed School Year detail returning `INTERNAL_ERROR` because its Section count query referenced the nonexistent `enrollments.archived_at` column.
- Added Planned, Active, Closed, empty-child, configured-child, invalid-ID, and missing-record detail regressions.
- Made Grade Level API and related workflow context queries order by configured `sequence` ascending with deterministic `name` and `id` tie-breakers.
- Scoped the Academic Structure selected-tab foreground to the semantic `--on-primary` token for readable white text and icons.

## 2026-08-24 — Academics School Year workflow and workspace refactor

- Made all new School Years Planned and moved activation to a confirmed server transaction that closes the current Active year, activates the target, and audits both changes.
- Added a School Year detail API and modal with nested Overview, Terms, Sections, Calendar, and lifecycle history while preserving existing identifiers and ownership.
- Replaced the Academics card workspace with searchable, paginated operational directories and clarified reusable structure versus yearly configuration.
- Protected Planned and Active School Years from archival and kept Calendar and audit data independently permission-scoped.

## 2026-08-24 — Teachers header alignment and qualification feedback fix

- Matched the Teachers Directory heading and Graduation Cap treatment to the implemented Enrollments queue header values.
- Fixed false qualification failure feedback caused by accessing the React form event's `currentTarget` after asynchronous work.
- Separated qualification creation failures from detail-refresh failures, added success feedback, retained form data on genuine failures, and preserved the existing Teacher+Subject uniqueness boundary with a specific duplicate response.

## 2026-08-23 — Teachers directory and Employee-to-Teacher stabilization

- Replaced the Teacher card/detail workspace with a server-paginated directory and modal-only Teacher details aligned with the MMSC operational directory pattern.
- Added server-side Teacher search, Department/faculty/employment/assignment filters, sorting, workload summaries, and permission-scoped assignment and audit detail.
- Simplified Add Teacher to select an eligible existing Employee and configure only Teacher-owned fields; inactive Employees and duplicate Teacher profiles are rejected authoritatively.
- Reused Workforce identity, photo, contact, position, and User linkage; Academic Assignments and centralized Security remain the owners of teaching assignments and portal activation.

## 2026-08-23 — Enrollment confirmation contract correction

- Fixed Enrollment review detail dropping the canonical `candidateKind`, which caused Confirm Enrollment to submit `kind=undefined` in the route and trigger strict enum validation.
- Centralized the frontend completion route builder, added a runtime discriminator guard, and retained backend validation for only `admission | enrollment`.
- Added regressions for both canonical kinds and invalid `student`; verified no duplicate or partial records resulted from failed manual attempts.

## 2026-08-23 — Enrollment workflow stabilization

- Replaced the persistent Enrollment detail panel and manual-first workflow with an Admissions-consistent server-paginated queue and modal review workspace.
- Made approved Admissions applications appear automatically as pending Enrollment candidates with authoritative applicant, Guardian, document, placement, Section, curriculum, and history context.
- Moved new/returning Student creation or reuse, Student Number allocation, Guardian linking, Enrollment creation, Admission conversion/history, and audit into one duplicate-safe Enrollment confirmation transaction.
- Added migration `0031_enrollment_completion_student_numbers.sql`; closed the early Admissions conversion endpoint in favor of the Enrollment handoff.

## 2026-08-23 — Student Master Directory UI refactor

- Replaced the Student card grid and persistent selected-record panels with an Accounts-style, server-paginated directory and keyboard-operable Student Details modal.
- Added School Year, Grade Level, Section, status, sorting, guardian-aware search, optimized thumbnails, actual totals, and lifecycle-aware empty states.
- Added Profile, Enrollment, Guardians, Documents, and Account modal sections with permission-controlled profile/photo/relationship actions and authoritative Enrollment history.
- Removed “Activate shown portal accounts”; Student/Guardian activation remains centralized in Security & Access → Portal Activation.

## 2026-08-23 — Local student lifecycle test-data reset

- Added a transactionally guarded, idempotent `db:reset:student-lifecycle` command restricted to non-production local MMSC databases with exact operator confirmation.
- Purged Admissions, Student, Guardian, Enrollment, student-grade, student-attendance, student credential, lifecycle notification, access-mapping, and exact referenced-upload test data while preserving academic, workforce, teacher, terminal, RBAC, and audit foundations.
- Deactivated historical Student/Guardian Users instead of deleting them because immutable audit events retain actor references; all login identities, roles, and sessions for those accounts were removed.
- Verified a second no-op reset, zero-state authenticated APIs, public `/register`, retained operational counts, builds, migrations, and automated checks.

## 2026-08-23 — Admissions Application Queue UI refactor

- Replaced the persistent split-pane applicant view with an Accounts-style, keyboard-operable queue table and complete Applicant Review modal.
- Added server-side pending/default filtering, applicant/application/Student/contact search, application type, placement, School Year, sorting, 25-record pagination, and actual totals.
- Moved full submitted applicant, Guardian, address, previous-school, returning-Student, document metadata, consent, duplicate, workflow history, and permission-valid actions into the responsive review modal.
- Added focused API and frontend regression coverage while preserving `/register`, Admissions RBAC, and authoritative workflow behavior.

## 2026-08-23 — End-to-end Admissions stabilization

- Fixed public new/returning registration failures caused by duplicate `is_primary` guardian columns and removed the bootstrap-user dependency from public workflow history.
- Added authoritative placement validation, returning-Student identity resolution, active-application duplicate protection, transactional rollback coverage, and idempotent submission retries.
- Fixed the Registrar transition query's PostgreSQL parameter-type conflict and verified public submission through queue detail to Under Review.
- Added an applicant success/tracking state, focused transaction regression tests, migration 0030, and live Docker/API/browser verification.

## 2026-08-23 — Dashboard tab-based UI redesign

- Replaced the simultaneous dashboard card grid with Operations-style Students, Employees, Teachers, and More Operations tabs.
- Added Student secondary views for Enrollment by Grade, Students by Section, and Attendance Today with filters, accessible charts, supporting tables, and drill-downs.
- Added Employee and separately derived Teacher attendance summaries with Department and Employee Type filtering where applicable.
- Added permission-scoped summaries for Admissions, Enrollment Operations, Attendance Exceptions, and Grade Review without exposing deferred modules.
- Scoped enrollment to the active School Year and added truthful attendance-not-recorded handling.
- Added dashboard-specific API aggregation, RBAC regression tests, query-state navigation, loading skeletons, responsive behavior, and Docker verification.

## 2026-08-22 — Pre-next-phase UI/UX and manual-test stabilization

- Fixed the live Attendance Operations manual-confirmation PostgreSQL syntax failure and verified persistence, auditing, refresh visibility, idempotency, and unauthenticated rejection.
- Enhanced the administration dashboard with real-data distribution bars, localized metrics, update context, and honest empty states.
- Consolidated My Account and Sign Out into the avatar menu and kept Notifications on the permission-scoped bell.
- Moved the institution profile out of Academics tabs into compact institution context.
- Added Grade Review search, status filtering, richer context, result counts, empty-state handling, and pagination.
- Rebuilt the MMSC API and web Docker services and completed the documented quality gates.

## Post-Phase 29 — MVP Demo Data Reset and Seed

- Added an explicitly confirmed, local-database-only reset command that retains the single Super Administrator, archives replaceable accounts, and preserves immutable audit history.
- Added deterministic SY 2026–2027 academic, workforce, teacher, student, guardian, Admissions, external-school, attendance, account, and RBAC demo data.
- Added ten cross-module integrity checks, safe shared demo-password injection, documented personas, and an MVP walkthrough.

## Post-Phase 29 — Academic Structure Domain Correction

- Clarified MMSC as the platform's single institution and campuses as its physical locations; Academics now exposes an editable Institution Profile but cannot create or archive internal institutions.
- Added migration 0022 with an explicit primary-institution invariant and a normalized, searchable External Schools reference domain.
- Preserved historical `previous_school` text while adding optional normalized references and compatibility triggers for Admissions and Student records.
- Added External School autocomplete to public Registration and staff-assisted Admissions while retaining free-text fallback for schools not yet in the directory.
- Added permission-protected External Schools administration, centralized audit events, Administration navigation, and automatic MMSC ownership for institution-scoped academic records.
- Added API and UI regression coverage for RBAC, primary-institution protection, automatic ownership, and reference-data discovery.

## Phase 29 Extension — Administration Navigation and Multi-Assignment Workspaces

- Replaced the flat Administration menu with reusable, collapsible Overview, School Management, People & Workforce, Attendance Operations, and Administration groups.
- Kept every item permission-aware, omitted empty groups, preserved routes and API authorization, and made the current Administration workspace explicit beside the MMSC brand.
- Consolidated implemented workspace discovery into one declarative registry. A single centralized User may concurrently enter Administration, Teacher Portal, Student Portal, Family Portal, and Attendance Terminal when the matching role/permission access exists.
- Made Administration access depend on granted Administration capabilities rather than Employee position or a single staff-role assumption; single-workspace users still route directly to their only experience.
- Kept future Library, Clinic, Computer Laboratory, and Canteen workspaces unregistered until their deferred routes and centralized grants are implemented. No Phase 19–23 system, schema, or placeholder navigation was introduced.
- Added multi-assignment, current-workspace, grouping, and empty-group regression coverage.

## Phase 29 Extension — Security & Access Operations-Style UI

- Refactored the administrative Security screen into four URL-addressable, permission-scoped tabs: Accounts, Roles and Permissions, Portal Activation, and Recent Security Activity.
- Preserved centralized account provisioning, status, role assignment, password replacement, first-login, audit, and portal activation flows while adding search, filters, linked identity context, application-access summaries, portal state, bulk Student activation, and audit context.
- Expanded existing Security read models with account lifecycle, linked authoritative identifier, role assignment counts, portal-role activation time, login/lock state, and request source; audit metadata remains excluded from the client response.
- Aligned route and sidebar visibility with all four supported read/provision permissions, added responsive Operations-style workspace styling, and added Security workspace regression tests.
- Added no migration, permission, port, external service, or duplicate identity/access store. Phases 19–23 remain deferred.

## Phase 29 — Super App Integration Polish

- Centralized role-and-permission-aware experience discovery and home routing.
- Added a shared workspace switcher for accounts with multiple valid MMSC experiences.
- Prevented broad permission grants from falsely implying linked Teacher, Student, or Guardian identities.
- Aligned Teacher, Student, and Parent navigation visibility with server permissions.
- Replaced portal section page reloads with client navigation and added route/hash focus management.
- Added shared skip links, focus-visible treatment, mobile touch targets, and reduced-motion behavior.
- Replaced the dashboard's internal phase badge with user-facing live-data status.
- Added experience-resolution regression tests.

## Phase 28 — Operational Administration

- Added a live, permission-scoped operational control plane to the existing Operations workspace.
- Added authoritative service/database, release, Security, workflow, terminal, media, and recent-failure summaries without duplicating domain data.
- Added `administration.operations.view` and `administration.operations.manage` role grants.
- Added confirmation-protected, audited, idempotent cleanup for already-stale authentication sessions.
- Added API permission/contract/action tests and a frontend operational-state regression test.

## Phase 27 — PWA Optimization

- Replaced the Attendance Terminal's synchronous local-storage queue with an asynchronous IndexedDB queue, including validated migration and a local-storage fallback for browsers where IndexedDB is unavailable.
- Added reconnect and Background Sync wake-up handoff while preserving stable event IDs, original terminal/session binding, server-side eligibility checks, and idempotent receipts.
- Restricted service-worker caching to same-origin application-shell and static build assets; API responses and managed media are never cached.
- Added install metadata/action, production-only deferred service-worker registration, and route-level code splitting across implemented MMSC experiences.
- Added focused queue migration/acknowledgement tests; no API, database schema, or deferred-module functionality changed.

## Post-Phase-26 Authentication Identity Stabilization

- Replaced email login with globally collision-safe Username, Employee Number, Student Number, and Guardian Number aliases.
- Added Employee-backed account provisioning, controlled portal activation, filtered bulk Student activation, and one-time random temporary credentials.
- Added mandatory first-login password replacement, centralized recovery entry, and permission-gated Super Administrator password replacement with session revocation.
- Added forward migration 0021 while preserving existing password hashes and Phase 26 as the completed roadmap baseline.

## Phase 26 — Security Hardening

- Added browser-origin enforcement, API no-store, login/public throttling, bounded sessions, strong new-password composition, request-ID validation, and document signature checks.
- Made proxy trust explicit and transport headers environment-aware.

## Post-Phase 25 login routing fix

- Added a safe local API URL default to the web Docker build and advanced the service-worker cache so rebuilt clients no longer send authentication requests to the Nginx frontend origin.

## Phase 25 — Reporting and Analytics Expansion

- Expanded reporting from four to nine authoritative reports across implemented MMSC domains.
- Added catalog, date controls, generated timestamps, comparison bars, detailed tables, CSV, print, loading, and honest empty states.
- Separated settings into a permission-scoped tab and added server-side interval validation.

## Phase 24 extension — Attendance Terminal operational stabilization

- Added administrator lifecycle management, campus/location assignment, last activity/sync, and recent-operator visibility.
- Added audited terminal sessions separating logical terminal, operator, and browser installation identity.
- Bound sync to active sessions while preserving idempotent Student/Employee credential routing; improved kiosk menu, offline grouping, feedback, and PWA metadata.

## Post-Phase 24 Stabilization — Manual Test Issues

- Fixed false user-creation failure caused by dereferencing the React form event after the successful asynchronous POST; creation now uses a stable form reference, immediately inserts the returned account, refreshes the authoritative list, and displays success feedback.
- Made logout replace protected Teacher, Student, Parent, administrative, Attendance, and other experience paths with the public root after the server session is revoked.
- Aligned Attendance Operations identity-search controls, heights, spacing, focus treatment, and narrow-screen stacking without changing lookup behavior.
- Split Admissions into Application Queue and Staff-assisted Application tabs, clarified queue filtering/counts, and retained one authoritative Admissions workflow plus separate public `/register` intake.
- Centralized Student status labels/values and omitted empty or unsupported status parameters instead of sending invalid enum values.
- Added 14 focused frontend regression assertions across user creation success/failure, logout, Student filters, and Admissions tabs.

## Phase 24 — Events and Calendar Experience

- Added a shared responsive month/agenda calendar at administrative, Teacher, Student, and Parent routes.
- Added validated Calendar context and range-query APIs with event type, Campus, and School Year filtering.
- Enforced published-only event visibility for ordinary users while allowing calendar managers to preview lifecycle states.
- Added event detail and permission-gated creation workflows using the existing audited Academic Calendar domain.
- Added `calendar.experience.access` to centralized role seeding and four backend authorization/validation tests.
- Reused the existing Calendar schema; no migration or external calendar provider was required.

## Phase 18 — Attendance Operations, Manual Check-In & Exception Handling

- Added migration `0019_attendance_operations.sql` for idempotent manual-event receipts, exception state, authoritative attendance references, and immutable event history.
- Added least-privilege Student/Employee lookup, registered-terminal context, manual check-in/check-out, receipt listing, and permission-separated exception resolution APIs.
- Added a dedicated responsive `/attendance-operations` workspace and linked it to the Attendance Terminal without exposing the administrative shell inside the kiosk.
- Added four granular permissions and standard role grants, with authenticated operator attribution and centralized audit events.
- Added five backend route/security tests; completed API and frontend typecheck, lint, tests, production builds, migration validation/application, and repeatable seed.

## Documentation — MVP sequencing after Phase 17

- Preserved the completed history and existing documentation for Phases 0–17.
- Kept Phase 18 as the next planned MVP implementation phase.
- Marked Phases 19–23 as `Deferred — Post-MVP` without removing or renumbering them.
- Established Phases 24–29 as the MVP completion sequence after Phase 18 and prohibited dependencies on placeholder deferred modules.
- Added ADR-033 and a durable MVP sequencing document. This update changed planning documentation only; no application code, schema, API, or UI was changed.

## Phase 17 — Notification Center

- Added migration `0018_notification_center.sql` for notification drafts/publication, declarative authoritative targets, materialized recipients, per-user read state, expiration, and immutable lifecycle events.
- Added personal inbox, unread count, mark-read, and mark-all-read APIs scoped exclusively to the authenticated user.
- Added permission-gated publishing for all users, roles, employees, teachers, students, Guardians, Grade Levels, Sections, and individual users with deduplicated publish-time delivery.
- Added the shared Notification Center UI and unread bell to the Administrative, Teacher, Student, and Parent / Guardian experiences.
- Added four backend route/security tests and completed the Phase 17 build, migration, seed, Docker, and live-route verification gate.

## Phase 16 — Parent / Guardian Portal

- Added the dedicated mobile-friendly `/parent` shell and family dashboard with authorized child switching and school-year selection.
- Added relationship-scoped Parent Portal API data for Student profile summary, Enrollment, subjects/teachers, published Grades, Student Attendance, and published calendar events.
- Added `parent.portal.access` for the Parent / Guardian role and automatic role-specific routing away from the administrative shell.
- Added three Parent Portal authorization/validation route tests. No schema migration was required.

## Phase 15 Extension — Public Registration and Applicant Intake

- Added the unauthenticated `/register` applicant experience for new and returning registrations, secure draft creation, submission, resumption, and status checking.
- Added intentionally limited `/api/v1/public/admissions/*` endpoints with strict DTOs, validation, in-memory rate limiting, structured audit events, and no access to administrative Admissions actions.
- Added `MMREG-YYYY-NNNNNN` public references and 256-bit resume tokens stored only as SHA-256 digests with expiry/revocation fields.
- Added privacy-notice version and affirmative consent recording, application-source visibility, applicant response storage, and protected PDF/JPEG/PNG document intake using logical storage keys.
- Added migration `0017_public_registration.sql` and four public-route security/validation tests. Phase 16 was not started.

## Phase 15 — Registration and Admissions

- Added the Registrar Admissions queue, structured application intake, placement selection, parent/guardian capture, duplicate-candidate feedback, review transitions, information requests, approval/rejection, and conversion action.
- Added protected Admissions APIs and separate view, manage, review, and conversion permissions for Registrar and School Administrator roles.
- Added migration `0016_registration_admissions.sql` for staged applications, guardian submissions, document requirements metadata, and immutable workflow history.
- Added transactional approved-application conversion that reuses or creates authoritative SIS Student and Guardian identities and creates the school-year Enrollment without re-encoding.
- Added four Phase 15 route tests and updated production documentation.

## Documentation — Roadmap reprioritization after Phase 14

- Preserved completed Phases 0–14 without application changes or historical renumbering.
- Reordered the remaining plan: Registration is now Phase 15, Parent / Guardian Portal Phase 16, Notification Center Phase 17, and Attendance Operations / Manual Check-In Phase 18.
- Renumbered the remaining operational and platform-maturity modules without cancellation or scope reduction; Super App Integration Polish is now Phase 29.
- Updated planning dependencies and superseded future-phase references. This entry records product sequencing only, not a software feature implementation.

## Phase 14 — Offline-first Attendance Terminal

- Added a dedicated touch-first attendance terminal route, installable manifest, service worker, offline scan queue, connection feedback, retry, and QR/RFID/NFC/barcode capture modes.
- Added registered terminal devices, centralized credential digests, durable terminal event receipts, and idempotent batch synchronization into authoritative student and employee attendance.
- Added terminal operation/management and credential permissions plus a restricted Attendance Operator role.
- Added Phase 14 route tests and migration `0015_attendance_terminal.sql`.

## Phase 13 — Student Portal

- Added a dedicated mobile-friendly Student Portal with self-scoped profile, enrollment history, subjects, attendance summary, published grades, and school events.
- Enforced authenticated Student identity and published/locked grade visibility server-side.

## Phase 12 — Grading System

- Added grading periods, assignment gradebooks, enrollment-linked grades, immutable history, optimistic versions, and controlled submission/review/publication/locking/reopening.
- Added teacher encoding and administrative review interfaces with server-side assignment scope and granular permissions.

## Phase 11 — Teacher Portal

- Added a purpose-built responsive Teacher Portal, authenticated teacher identity resolution, assignment-scoped classes and rosters, attendance status, academic-year context, and published calendar events.
- Added server-enforced `teacher.portal.access`; grading and future notification/timetable behavior remain deferred.

## Phase 6 — Enrollment and Student Academic History

Date: 2026-08-18

- Added preserved one-per-student/school-year Enrollment identities with grade, optional section, lifecycle, completion/promotion, transfer/withdrawal, remarks, and optimistic versions.
- Added database and service validation for same-school student/year/grade ownership and matching year/grade section placement.
- Added versioned enrollment context, directory, detail, student-history, create, and update APIs with granular RBAC and audit events.
- Added a responsive Enrollments workspace, filtered directory, historical detail, dedicated update experience, and shared-modal creation.
- Added two permissions and role grants; no sample student, enrollment, school-year, grade, or section records were fabricated.
- Class/subject/teacher assignments, schedules, attendance, grades, report cards, and all Phase 7+ behavior remain unimplemented.

## Phase 5 Extension — Workforce Stabilization and Create Modals

Date: 2026-08-18

- Fixed the Workforce default blank status filter and preserved API validation details in the web client so invalid fields are actionable instead of appearing only as “Request validation failed.”
- Verified and regression-tested the complete normalized employee-create payload against the live API and Workforce schema.
- Added a shared accessible, responsive modal with focus management, keyboard/backdrop dismissal, scrollable content, errors, sizes, and protected busy state.
- Standardized employee, teacher, student, academic-master-data, and security-user creation on modal dialogs while retaining profile/detail screens.
- No migration, endpoint, schema, enrollment, or Phase 6 behavior was added.

## Phase 5 — Student Information System Core

Date: 2026-08-18

### Added

- Permanent student profiles with validated student number/LRN, demographics, contacts, address, entry information, lifecycle status, photo reference, previous school, and notes.
- Independent reusable guardian identities and typed many-to-many student relationships.
- LRN redaction, dedicated sensitive permissions, same-school relationship enforcement, audited protected reads, optimistic concurrency, and archival.
- Responsive Students directory/profile, guardian creation/reuse, and relationship UI.
- Eight granular SIS permissions and role grants without fabricated records.

### Database

- Added migration `0007_student_information_system_core.sql` with three normalized tables, constraints, indexes, timestamps, versions, and archival fields.

### Boundaries

- Historical Enrollment, grade/section placement, attendance, grading, portals, medical records, and all Phase 6+ behavior remain unimplemented.

## Phase 4 — Teacher Management Extension

Date: 2026-08-18

### Added

- Employee-linked teacher profiles with teacher number, faculty status, teaching department, level, and biography.
- Subject qualifications referencing the shared subject catalog.
- School-year faculty placement with advisory/homeroom sections and maximum academic-load foundation.
- Validated teacher APIs, six granular permissions, immutable audits, optimistic concurrency, and archival.
- Responsive Teachers directory/profile workspace using live employee and academic choices.

### Database

- Added migration `0006_teacher_management.sql` with three relational extension tables, constraints, indexes, timestamps, versions, and archival fields.

### Boundaries

- Actual class/subject assignments, schedules, calculated teaching load, attendance, grading, portals, and all Phase 5+ behavior remain unimplemented.

## Phase 3 — HRIS Core / Workforce Management

Date: 2026-08-18

### Added

- Permanent employee identities, organization placement, employment profiles, search/filtering, status history, emergency contacts, protected identifiers, and document metadata.
- Validated permission-protected workforce REST APIs with optimistic concurrency, archival, transaction-coupled audits, and pagination.
- Responsive Workforce directory/profile UI and position/employee-type configuration.
- Ten granular workforce permissions and role grants without fabricated employee data.

### Database

- Added migration `0005_hris_core.sql` with seven normalized tables, foreign keys, constraints, indexes, versions, archival fields, and immutable status history.

### Boundaries

- Teacher specialization, attendance, payroll, leave, binary document storage, and all Phase 4+ behavior remain unimplemented.

## Phase 2 — School Structure and Academic Master Data

Date: 2026-08-18

### Added

- School profile, campus, school year, academic term, department, grade level, section, subject, classroom, status, and calendar/event persistence.
- Server-side validated allowlisted academic APIs with optimistic concurrency, archival, permissions, and immutable audit events.
- Responsive permission-aware Academics workspace with relational choices and create/edit/archive flows.
- MMSC organization and Main Campus seed without fabricated school years.

### Database

- Added migration `0004_academic_master_data.sql` with eleven normalized tables, foreign keys, constraints, indexes, timestamps, versions, and archival fields.

### Security

- Added separate academic configuration and calendar view/manage grants and role mappings.

## Phase 1 Maintenance — Dedicated Local Ports

Date: 2026-08-18

### Changed

- Reserved MMSC host ports 15173 (web), 14000 (API), and 15432 (PostgreSQL) to prevent conflicts with the King Seven Builders HRIS and Attendance Terminal.
- Enabled strict Vite port handling and synchronized Docker, environment, CORS, API fallback, and development documentation.
- Isolated Docker build contexts from host dependencies and made container installs use the committed lockfile.
- Added a forward-only constraint correction for hierarchical permission codes discovered during the first real PostgreSQL seed.
- Built and started the full MMSC Docker stack, applied migrations 0001–0003, seeded Phase 1 roles/permissions, and verified web/API/database health on the dedicated ports.

## Phase 1 — Security, Users, Roles and RBAC

Date: 2026-08-18

### Added

- local user accounts with scrypt passwords, active/inactive lifecycle, failed-login tracking, and temporary locking
- opaque hashed server sessions, secure cookies, authentication middleware, login/logout/current-user/password-change APIs
- granular roles, permissions, assignments, server-side permission enforcement, and standard role seeds
- immutable authentication/security audit events and protected administration endpoints
- permission-aware sign-in, authenticated shell, self-service password change, user/custom-role administration, and audit interface
- guardrails for the final active Super Administrator and protected Super Administrator grants

### Database

- Added `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `auth_sessions`, and `audit_events` with constraints, indexes, relationships, and immutability trigger.

### Security

- No default account or password; optional environment-driven bootstrap provisioning only.
- Account deactivation and password change revoke relevant sessions.

## Phase 0 — Project Foundation

Date: 2026-08-18

### Added

- pnpm TypeScript monorepo, environment template, Git/editor hygiene, and Docker Compose topology
- Express REST API foundation with health/readiness routes, validation, logging, request IDs, security middleware, and global errors
- PostgreSQL ordered migration and idempotent seed frameworks
- React/Vite responsive branded shell, Dashboard, design tokens, and reusable UI primitives
- automated API and frontend tests plus typecheck, lint, and production build tooling
- permanent project, architecture, database, security, development, deployment, decision, roadmap, and phase documentation

### Security

- Added secure HTTP defaults and authentication-ready anonymous request context; users, login, sessions, RBAC, and audit persistence remain deferred to Phase 1.

### Database

- Added foundation migration for application metadata and seed history plus migration checksum tracking.
# Phase 6 Extension

- Synchronized canonical Student statuses and improved validation detail display.
- Converted Workforce Add Position to the shared modal workflow.
- Added authorized, optimized Employee and Student profile-photo management, thumbnails, persistent Docker storage, and a replaceable provider boundary.
# Phase 7 — Class, Subject and Teacher Assignments

- Added a normalized curriculum and teaching-assignment engine with school-year, optional term, grade, subject, section, and shared teacher-placement scope.
- Added strict server validation, RBAC, audit events, archival, load-unit metadata, and one active primary teacher per section-subject curriculum assignment.
- Added the Assignments workspace and preserved timetable, attendance, grading, and all Phase 8+ behavior as unimplemented.
# Phase 8 — HRIS Attendance and Employment Foundation

- Added employee daily attendance, time in/out, status/source, late minutes, holiday context, and future ingestion idempotency.
- Added correction requests, approve/reject review, immutable administrative adjustment history, RBAC, and audit events.
- Added the employee Attendance workspace; no terminal, student attendance, payroll calculation, or Phase 9+ behavior was added.
# Phase 9 — Student Attendance Foundation

- Added enrollment-scoped student campus attendance with school-year/grade/section context, status/source, late minutes, and idempotency.
- Added a validated future class-attendance scope referencing Phase 7 teaching assignments and immutable administrative adjustment history.
- Added the Student Attendance workspace; no terminal UI, dashboards, reports, or Phase 10+ behavior was added.
# Phase 10 — Dashboards, Reporting and Core Administration

- Replaced the static foundation dashboard with real workforce, enrollment, attendance, and activity aggregates.
- Added four operational reports with JSON, protected CSV export, and printable browser output.
- Added centralized JSON settings with RBAC, versions, school scope, and audits; no Phase 11 portal behavior was added.
# Phase 10 Extension — Multi-Experience Architecture Preparation

- Audited Phases 0–10 for shared APIs, centralized authentication/RBAC, authoritative master-data ownership, credential readiness, attendance ingestion, and multi-shell frontend compatibility.
- Converted the administrative shell into a route-level React Router layout while preserving every current URL and workflow.
- Documented no remaining blockers, recommended route modularization, and deferred centralized credentials, cross-site session deployment policy, and offline terminal synchronization.
## 2026-08-24 — Student Attendance roster visibility stabilization

- Fixed the attendance list parameter placeholders that caused PostgreSQL UUID-versus-integer failures and surfaced as `INTERNAL_ERROR` when School Year or other filters were applied.
- Changed Student Attendance listing, filtering, counting, and pagination to start from eligible enrolled Students and left-join the selected date's attendance.
- Added the derived, non-persisted `Not Recorded` state so active enrolled Students remain visible before attendance capture; pending and invalid enrollment states remain excluded.
- Verified the current local active roster has one eligible Student, no duplicate active enrollment, and zero attendance rows for the test date; the Student now appears as `Not Recorded`.
## 2026-08-26 — Student Credential migration-state recovery

- Fixed Student Details credential loading and registration by applying pending credential/terminal migrations 0032–0034 to the local MMSC PostgreSQL database.
- Confirmed both failures were caused by the live `credentials` table retaining its Phase 14 schema: reads referenced missing `last_used_at`, while registration inserted missing `updated_by`.
- Verified empty loading, one successful Student RFID registration, immediate list refresh, duplicate conflict handling, RBAC denial, and centralized terminal Student resolution. The isolated verification credential was safely revoked afterward; no active test credential remains.
- Added repository and request-validation regression coverage for empty lists, atomic registration/audit, duplicate rollback, invalid Student, invalid type, and RBAC.
## Phase 29 Extension — Trusted Attendance PWA and mandatory offline capture

- Added single-use installation registration codes, durable trusted-installation credentials, logical-terminal assignment, heartbeat/sync telemetry, and explicit audited revocation.
- Reworked the standalone setup and Administration terminal workspace around the new trust model; removed obsolete direct session provisioning.
- Persisted trust in IndexedDB without a connectivity-based expiry and hardened the standalone service worker to retain application shell and offline state across restart/update.
- Added migration 0035 and terminal trust/runtime regression coverage. Managed installed-PWA, physical reader, and full outage/recovery acceptance remains pending and is not claimed.
## Phase 29 trusted-PWA sync recovery addendum

- Fixed the live student-sync PostgreSQL syntax error caused by the unqualified `day` alias.
- Made trusted-installation authorization and server-resolved assignment authoritative for runtime sync, with explicit trust/assignment/inactive error codes.
- Replaced the Background Sync failure feedback loop with single-flight synchronization, bounded backoff, manual progress feedback, and separate network/HTTP/trust UI states.
- Preserved pending events, original capture timestamps, idempotency identifiers, IndexedDB trust, and offline credential recognition.
- Surgical follow-up: made `Installation` authorization take precedence over shared API login cookies, routed trusted `/attendance-terminal/device` validation through installation assignment state, switched terminal runtime headers to `Installation`, and bumped the standalone service worker to v4 for prompt activation.
## 2026-08-27 — Phase 19 Group 4 scheduling and portal-safe integration

- Completed appointment and follow-up workflows, idempotent encounter creation, actionable Clinic alerts, and explicit safe-release publishing through shared Notifications.
- Added relationship-scoped Student/Parent Clinic notices without exposing internal clinical notes or Clinic routes. Phase 19 remains in progress; Group 5 has not started.
## 2026-08-27 — Phase 19 Group 5 Clinic administration, inventory, and reports

- Completed governance-focused Clinic Management, medicine/supply master editing and activation, operational stock movements, paginated inventory history, aggregate Clinic reports, shared CSV export authorization, performance indexes, and Administration-aligned Clinic UX.
- Preserved centralized RBAC, transactional dispensing safeguards, and aggregate-only Administration reporting. Phase 19 remains in progress; final Phase 19 validation has not started.
# 2026-08-27 — Phase 21 Computer Laboratory Group 1

- Added the Computer Laboratory portal with permission-gated Laboratories and Workstations operations.
- Added campus-scoped laboratory configuration, walk-in policy fields, workstation hardware/network metadata, controlled statuses, archive/restore, pagination, validation, and centralized audit actions.
- Explicitly excluded scheduling, sessions, derived occupancy, maintenance workflows, equipment, software, reporting, scanning, and remote-control features.
# 2026-08-27 — Phase 21 Computer Laboratory Group 2

- Added one-time and weekly Computer Laboratory scheduling for classes, reservations, events, and maintenance blocks.

# 2026-08-27 — Phase 21 Computer Laboratory Group 3

- Added centralized Student RFID/Barcode access resolution, authoritative enrollment and schedule eligibility, controlled walk-ins, special-event sessions, transactional workstation assignment, and session end/cancellation.
- Added database-enforced single active Student/workstation occupancy, derived `in_use` state, granular session/override RBAC, centralized audit events, active/history APIs, and a responsive staff Lab Sessions workspace.
- Kept laboratory usage independent from official Attendance. Migrations 0055–0056 and database-backed acceptance remain pending explicit authorization.
- Added authoritative Teaching Assignment integration, laboratory/teacher/section conflict detection, cancellation, week/list UI, RBAC, and centralized auditing.
- Kept student sessions, scanning, walk-ins, occupancy, and later operational groups out of scope.
# 2026-08-27 — Phase 21 Computer Laboratory Group 4

- Added separate issue and maintenance history domains, controlled lifecycle, Employee assignment, compatible issue linkage, exact cost, monotonic last-maintenance summaries, active-session-safe workstation controls, RBAC, audit events, APIs, and a responsive operational workspace.
- Migrations 0055–0057 and database-backed acceptance remain pending explicit authorization.
# 2026-08-28 — Phase 21 Computer Laboratory Group 5

- Added the bounded Computer Laboratory equipment/peripheral registry, separate condition and assignment states, initial and subsequent transfer history, lifecycle controls, duplicate identifier handling, workstation retirement protection, RBAC, audit events, APIs, and Equipment UI.
- Kept complete workstation seats and Group 4 issue/maintenance ownership separate. Migrations 0055–0058 remain pending explicit authorization.

# 2026-08-28 — Phase 21 Computer Laboratory Group 6

- Added the lightweight Software Catalog, manual workstation expected-configuration assignments, license metadata and conservative per-device over-configuration warnings, archival assignment lifecycle, RBAC, auditing, APIs, responsive Software workspace, and workstation details integration.
- Added migration `0059_computer_lab_group6_software.sql`; migrations 0055–0059 remain pending explicit database authorization. No endpoint agent, discovery, remote management, automatic issue generation, or Group 7 reporting was introduced.

# 2026-08-28 — Phase 21 Computer Laboratory Group 7

- Added the derived operational Dashboard, actionable alerts, current/upcoming schedule views, ten bounded reports, permission-protected CSV export, targeted report indexes, final portal navigation, and responsive integration polish.
- Completed Equipment server paging controls, workstation filtering, and safe metadata editing without exposing assignment fields outside Transfer/Reassign.
- Phase 21 Groups 1–7 are complete in source. Migrations 0055–0060 and authenticated runtime acceptance remain pending; no official Attendance or endpoint-management behavior was added.
# Phase 21 Manual Testing Extension — 2026-08-28

- Hardened Lab Session End/Cancel actions with explicit POST-contract tests, accessible CTAs, cancellation confirmation, and double-submission prevention.
- Corrected runtime SQL construction for Issues, Equipment, Software, and Reports, and added a database-backed validator covering their list/context paths, Dashboard, required relations, and all ten reports.
- Resolved the Computer Laboratory switcher landing from effective workspace permissions so restricted or legacy accounts remain inside their explicitly selected portal.
- Reconciled Computer Laboratory permissions and built-in roles for fresh and upgraded databases through seed data and migration 0061.
- Added permission-derived Computer Laboratory display in Security & Access and made the Portal Switcher land on the dashboard.
- Made Group 1 Workstations compatible with a 0054-only database while retaining optional later-group enrichment.
- Added application-access, route-namespace, navigation, and workstation query regressions.
- Applied migrations 0055–0061 to the verified local Docker development database and validated the resulting Computer Laboratory role mappings.
