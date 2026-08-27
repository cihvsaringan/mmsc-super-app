# Architecture

## Phase 20 credential resolution hardening

Library Visitor scans consume the centralized digest-backed Credential resolver rather than owning a lookup implementation. Canonical normalization removes outer whitespace and scanner CR/LF suffixes but preserves case and leading zeroes. The resolver returns only credential ownership/type/lifecycle state; Library then validates authoritative Student enrollment or Employee employment eligibility and writes only `library_visits`. Attendance tables and terminal sessions are not dependencies or side effects.

## Phase 20 final Library reporting boundary

The Library dashboard and reports are bounded read models over authoritative catalog, copy, loan, visitor, borrowing-policy, Student, Employee, and Guardian domains. Dashboard aggregates use fixed 7- and 30-day windows. Detailed reports enforce a maximum 366-day range, server pagination, and bounded CSV output; no frontend filter is treated as authorization. Library visitor facts remain distinct from Attendance. The Library experience is complete without acquiring ownership of identities, credentials, Notifications, payments, or credits.

## Phase 20 Group 6 overdue and portal boundary

Overdue status is a Library read model over active `library_loans`, calculated from due time plus the effective institution/patron grace policy. Student and Parent experiences consume that same model: Student access is self-scoped through the authenticated User link, while Parent access revalidates the authoritative Guardian–Student relationship. Reminders reuse Notifications and record idempotent Library dispatch milestones; Library does not own portal identity, messaging delivery, fines, or payment data.

## Phase 20 Group 2 catalog boundary

Library Catalog owns bibliographic metadata and physical-copy lifecycle, separating one `library_books` title/edition from many `library_book_copies`. Reusable institution-scoped classifications prevent repeated Category, Subject, and Shelf text. A database sequence allocates human-readable accession/barcode identifiers without `max + 1` races. Copy management cannot bypass circulation: checked-out and reserved states have no normal management transition, and active circulation blocks title archival. Future patron, loan, hold, RFID, and procurement domains reference these records rather than extending them with duplicated ownership.

## Phase 20 Library foundation

Library is a purpose-built `/library/*` sibling experience over the shared authentication, API, RBAC, audit, Student, Employee, User, and Credential domains. `library.portal.access` gates the namespace and granular `library.*` permissions gate each route and action. Group 1 owns only constrained institution settings and a zero-safe dashboard read model; catalog, copies, loans, visitor logs, and reporting facts remain deferred. Future patron scanning will resolve centralized digest-backed credentials but will never consume Attendance events or create a duplicate identity registry.

## Phase 19 Clinic boundary

Clinic is a first-class `/clinic/*` operational application using shared authentication, authoritative Students/Employees/Guardians/Enrollments/School Years, centralized RBAC/audit/notifications, and the common design system. `clinic.portal.access` is its portal boundary and granular `clinic.*` permissions protect work inside it; no separate application-assignment persistence layer exists. `/clinic-management` is the Administration governance surface; Administration access alone never implies restricted EHR access. Clinic inventory is currently an operational location with explicit items, lots, balances, and movements so a future central inventory service can adopt it without duplicating identities or rewriting clinical encounters.

## Authoritative Attendance Terminal Web-2 architecture

The previous `apps/web-2` implementation that imported runtime code from `apps/web`, used operator/session compatibility, and called singular `/attendance-terminal/*` APIs is **RETIRED / REMOVED**. `apps/web-2` is now self-contained. Administration remains in `apps/web` at `/attendance-terminals`; the shared API, PostgreSQL, Credential, Student, Employee, Attendance, RBAC, and Audit domains remain authoritative. Runtime machine authentication uses a terminal-bound device credential and pluralized `/api/v1/attendance-terminals/runtime/*` endpoints.

Normal terminals have no IN-only or OUT-only mode. Under a person/date advisory transaction lock, the server derives the next direction from the latest accepted terminal event, opens a new Student/Employee attendance session for TIME IN, and closes the latest unmatched session for TIME OUT. Accepted events alternate across all authorized terminals. Captures within one minute are rejected without changing state; client event IDs retain idempotency. Offline batches are sorted by original `capturedAt` before authoritative processing.

Legacy accepted receipts created before direction tracking remain valid. When no directional receipt precedes a capture, the sequencer falls back to the authoritative open-session state, preventing a second open session while preserving the one-open-session database constraint. Capture IDs are serialized and rechecked before attendance mutation, so concurrent or delayed replay returns the existing receipt.

## Standalone Attendance Terminal frontend

`apps/web-2` is a separately built kiosk/PWA experience, not a separate platform domain. It consumes the same API, User/RBAC system, terminal device authorization, Student/Employee credential service, attendance transaction service, audit infrastructure, and PostgreSQL database as `apps/web`. Its IndexedDB data remains limited to revocable configuration, the minimal credential index, and durable pending attendance events.

Credential registration and scanning share a trim-only normalization rule before SHA-256 digesting; case and leading zeros remain significant. The runtime credential snapshot branches explicitly by authoritative owner type so both Student and Employee identifiers, names, eligibility, status, and digest lookup keys are returned. Full snapshot replacement changes only the credential store and synchronization metadata, preserving the device/configuration stores and attendance queue.

Registration and lifecycle controls stay at `/attendance-terminals` in `apps/web`; operational scanning is rooted at `/` in `apps/web-2`. The former `/attendance-terminal` route is absent from the Administration router. The standalone client currently imports established terminal-specific frontend modules from `apps/web` to avoid behavioral duplication; they may later move to a neutral shared package without changing API or data ownership.

## Attendance Terminal device authorization

Registered kiosk authorization is distinct from interactive User authentication. An authorized online operator provisions the installation once; the API returns a random token once and stores only its digest. IndexedDB retains the versioned terminal configuration. The token is limited to device validation, minimal credential-cache synchronization, and idempotent attendance synchronization and cannot enter Administration. Transport failure preserves a locally valid authorization; HTTP rejection pauses capture pending reconfiguration.

## Student Attendance operational read model

The Student and Employee Attendance transaction/history workspaces use their authoritative attendance-record tables as the root of each selected-date query. Identity and academic tables enrich existing records only; they do not manufacture roster rows for people without a transaction. Search, filters, counts, sorting, and Student pagination therefore operate on the same date-scoped record set. A recorded status remains visible even when one or both timestamps are null. Student School Year filtering is optional so historical records are not hidden by an implicit active-year default. Full adjustment history is loaded only for an existing record, and terminal/manual capture continue writing to the existing attendance sources of truth.

## Post-Phase-29 Academic Assignments workspace

Academic Assignments presents two responsibilities without changing ownership: Grade-Level Curriculum defines the Subjects a Grade Level takes for a School Year, while Section Teaching Assignments links an existing curriculum Subject and Section to a Teacher School-Year placement. Its aggregate grids are read models; modal batch saves run in one transaction. Copy-forward maps reusable Grade Levels and Subjects, Sections by Grade Level plus Section code, and Teachers through target-year placements. It copies only missing assignments, never overwrites target records, and never copies students or identity master data.

## Post-Phase-29 Academic configuration workspace

Academics separates reusable MMSC structure (Campuses, Departments, Grade Levels, Subjects, Classrooms, and configurable statuses) from School Year-owned configuration. Terms, Sections, and Calendar events remain their existing authoritative records and identifiers, but are managed through the owning School Year detail surface rather than top-level navigation. School Year activation is a dedicated command, not a generic record update: it serializes per institution, closes the prior Active year, activates the selected Planned year, and records both lifecycle events in one transaction.

## Post-Phase-29 Teacher directory and specialization boundary

The Teachers workspace reads a paginated list projection and loads the full record only when its modal opens. Its list projection joins Workforce-owned identity and position data and summarizes current authoritative Academic Assignments without copying either domain. Teacher creation accepts an existing eligible `employee_id` and creates only the one-to-one Teacher specialization; it never creates another Employee, User, login identifier, photo, or contact record. Qualifications and School Year placement remain Teacher-owned, while class/subject assignments remain owned by Academic Assignments and portal activation remains owned by Security & Access.

## Post-Phase-29 Enrollment handoff

Admissions approval is an Enrollment candidate, not a permanent Student creation event. Enrollments composes authoritative Admission, applicant, Guardian, document, academic placement, Section, and curriculum reads into one Registrar review surface. Only the Enrollment confirmation command may create/link the Student and enrolled Enrollment, and it commits Student Number allocation, Guardian relationships, Admission lifecycle/history, and audit transactionally. The UI does not merge domain ownership.

## Student Master Directory interaction

The administrative Students experience is a directory over authoritative SIS and Enrollment data:

```text
Students → Search / Placement Filters / Pagination → Directory Grid
         → Student Details Modal
              ├── Profile and optimized photo
              ├── Current and historical Enrollment
              ├── reusable Guardian relationships
              ├── linked Admissions document metadata
              └── informational portal-account status
```

The list query returns only scan-oriented fields and uses server-side search, filtering, sorting, and pagination. Full relationships and history load only when a record opens. Profile editing never mutates Enrollment placement. Documents remain owned by their source Admissions application because no Student document domain exists yet. Portal activation is not duplicated in Students and remains owned by centralized Security & Access.

## Post-Phase-29 Admissions work-queue UI

The administrative Admissions main surface is a server-paginated operational queue, not a persistent applicant-detail workspace. Queue queries compose search, workflow status, application type, Grade Level, School Year, sorting, limit, and offset against authoritative Admissions, Student, and submitted Guardian data. Selecting a row fetches the existing permission-protected detail DTO into a responsive review modal containing complete submitted information, document metadata, history, and only valid authorized transitions. Closing the modal preserves the in-memory queue filters and page.

## Post-Phase-29 Admissions stabilization

Public applicant intake remains a two-stage draft-and-submit API transaction exposed as one guided applicant action. Draft creation validates authoritative MMSC placement before writing, resolves returning identities through Student Number plus birth date (and LRN when supplied), copies permanent identity fields from the matched Student, and writes applicant, guardian, initial history, and audit records atomically. Public workflow history has no fabricated staff actor. Submission locks the application and is idempotent once Submitted; the same application is immediately available to the permission-protected Registrar queue and existing state machine.

## Phase 29 extension — Administration navigation and workspace discovery

Implemented application experiences are declared in one frontend registry with label, route, description, and authoritative availability predicate. One centralized User may resolve several entries concurrently; switching uses React Router inside the same authenticated session. Administration availability derives from at least one granted Administration capability, not Employee position. Dedicated portals additionally retain their authoritative role relationship and access permission.

The Administration shell renders reusable permission-aware navigation groups. Grouping is presentation only: existing routes and API guards remain unchanged, and groups with no visible items are omitted. Deferred Library, Clinic, Laboratory, and Canteen applications are not registered until their routes and centralized access grants exist; adding an implemented workspace extends the registry rather than changing the identity schema.

## Phase 29 extension — Security & Access workspace

`/security` is one administrative experience over the existing centralized Security domain. Its Accounts, Roles and Permissions, Portal Activation, and Recent Security Activity tabs use stable `?tab=` URL state and are independently visible according to `security.user.view`, `security.role.view`, `security.account.provision`, and `audit.view`. The route and sidebar accept any of those capabilities; every API still enforces its own permission server-side. Portal state is derived from the authoritative user, role assignment, and linked Teacher, Student, or Guardian record rather than from a UI-local access model.

The enriched lists are read models only. Account lifecycle fields come from `users`, linked school identifiers from authoritative people tables, user counts from `user_roles`, and portal activation from the applicable portal-role assignment. Recent audit responses deliberately omit metadata and secrets.

## Phase 29 integrated experience resolution

One frontend resolver maps the authenticated centralized User to valid MMSC experiences using role membership plus the corresponding access permission. Permissions remain the server authorization boundary, while roles prove the account has the identity specialization required by Teacher, Student, Parent/Guardian, or Attendance Terminal shells. The same resolver controls initial landing, invalid-route fallback, current-workspace selection, and multi-experience switching. No experience owns separate authentication or domain data.

## Phase 28 operational control plane

Operational Administration is a request-time read model composed over existing Security, Admissions, Grading, Attendance, Notifications, Media, and release-history tables. It is not a new source of truth and does not copy domain records. The `/operations` administrative experience independently gates System status, Reports, and Application settings, while the API remains the authorization boundary. The sole maintenance command is transactional, idempotent, confirmation-protected, and restricted to authentication sessions already invalid because of expiry or account availability.

## Post-Phase-26 authentication identity layer

One centralized User owns all authentication state. `login_identities` maps globally unique normalized Username, Employee Number, Student Number, and Guardian Number aliases to that User while authoritative person domains retain identifier ownership. Portal provisioning links existing Employee/Student/Guardian records, assigns explicit RBAC access, and never creates portal-local passwords or duplicate person identities. Email is recovery metadata, not a login key.

## Phase 26 defense in depth

State-changing API requests cross an origin/fetch-metadata boundary before authentication. Throttling complements persistent lockout, while transactional session limits preserve centralized identity and RBAC.

## Phase 25 reporting read model

Reports remain request-time read models over authoritative implemented-domain tables. No duplicate metrics or warehouse is persisted. `report.view` protects reads and `report.export` independently protects CSV.

## Attendance Terminal operational boundary

The kiosk separates logical terminal, centralized operator, browser installation ID, and auditable session. Pending events retain their originating terminal/session and synchronize only through authoritative credential and Attendance services. Administration is `/attendance-terminals`; capture remains `/attendance-terminal`.

The production service worker precaches the built application shell from Vite's complete hashed-asset manifest and provides an offline navigation fallback only for `/attendance-terminal`. Offline boot reads the IndexedDB device authorization and terminal configuration without constructing a User before attempting API refresh. Scanner adapters and the temporary manual credential test input feed one stable sequential processing queue; an accepted event is successful only after its client UUID and original timestamp are durably written to IndexedDB. Result display and background synchronization are independent consumers and cannot gate scan intake.

## Phase 24 shared calendar experience

The shared Calendar experience reads the existing authoritative `calendar_events` domain rather than creating portal-local calendars. `/calendar`, `/teacher/calendar`, `/student/calendar`, and `/parent/calendar` render one reusable frontend surface inside their appropriate shells. A dedicated read API applies the visibility boundary: calendar managers may preview planned or cancelled events, while ordinary users receive published events only. Existing audited Academic administration remains the write boundary.

## Phase 18 attendance operations experience

`/attendance-operations` is a dedicated staff workspace connected to the same Attendance, Student, Employee, Security, and terminal domains as the kiosk. Identity lookup is online and authoritative; it returns only operational verification fields and never establishes a separate people store. Manual check-in/check-out flows through the shared attendance tables while retaining a separate idempotent receipt and immutable history for operator, terminal, reason, outcome, synchronization, and exception resolution.

The workspace and `/attendance-terminal` remain sibling experiences with purpose-built shells. Permission checks are server-side and granular, and every manual or resolution action uses centralized audit infrastructure.

## Phase 17 centralized notification domain

Notifications are one shared platform domain, not per-portal announcement stores. Publishers declare authoritative targets; publication resolves linked active users through Security, HRIS, Teacher, SIS Guardian, and Enrollment relationships and atomically materializes a deduplicated recipient snapshot. Every experience reads the same per-user recipient records through its own application shell.

The initial delivery adapter is in-app only. Notification content may contain a validated internal MMSC action path, but authorization at that destination remains independent. Read state is recipient-owned, publishing is permission-gated, and immutable lifecycle events preserve accountability.

## Phase 16 parent and guardian experience

`/parent/*` is a dedicated sibling experience sharing authentication, brand primitives, API utilities, and account settings without inheriting the administrative sidebar. The API derives one Guardian from `guardians.user_id`, obtains children only through active `student_guardians`, and validates every selected child and Enrollment against that relationship. It reads authoritative SIS, Academics, published Grading, Attendance, and Calendar data without duplicating family records.

## Phase 15 public applicant experience

`/register` is an unauthenticated sibling experience with no administrative shell. Its limited public API writes the existing Admissions domain and returns applicant-safe DTOs only. A public draft receives a human reference plus a high-entropy resume secret; only the digest is stored. The same application appears in the Registrar queue and uses the existing approval/conversion transaction. This boundary is reusable by a future authenticated Parent Portal without implementing Phase 16 now.

## Phase 15 admissions boundary

Admissions owns pre-enrollment applications and their review history, not permanent Student identity. Registrar conversion is one transaction: it blocks likely duplicate Students, reuses a matched returning Student, reuses matching Guardians where possible, creates missing authoritative SIS identities, links guardian relationships, creates the school-year Enrollment, and marks the application converted. The administrative `/admissions` workspace consumes the shared API, RBAC, academic master data, and audit service.

## Phase 14 attendance terminal experience

`/attendance-terminal` is a dedicated kiosk/PWA sibling experience that shares centralized authentication, credentials, RBAC, Student/Employee identities, and Attendance services. The browser keeps only a retry queue; PostgreSQL remains authoritative. Each client event carries a UUID and the API enforces `(terminal_id, client_event_id)` uniqueness, so reconnection retries cannot duplicate attendance.

The post-Phase-29 Attendance enhancement adds a minimal incremental IndexedDB credential index and local identity/day marker alongside the retry queue. RFID HID, QR HID, and supported camera QR adapters feed one credential-resolution and attendance pipeline. The cache contains only opaque lookup digests, canonical identity references, display/eligibility fields, optional managed-photo references, and synchronization metadata; it is not a terminal-owned people database. Online synchronization revalidates credential status, identity eligibility, terminal/session state, and the first-Time-In rule against PostgreSQL.

## Phase 13 student experience

The `/student/*` sibling experience shares authentication and platform services but resolves one Student from the authenticated user. It reads authoritative Enrollment, Assignment, Attendance, Calendar, and Grading domains; grade queries include only published or locked gradebooks.

## Phase 12 grading workflow

Grading is its own authoritative domain linked to Teaching Assignment, Grading Period, and Enrollment. School Years own Terms and independently configured Grading Periods; a Grading Period may optionally be scoped to a Term, but Terms are never implicitly converted into grading periods. Teachers consume the open periods in their active assigned School Year. Teacher writes are assignment-scoped; review and publication are separate administrative transitions. Grade history records every value change and workflow transition so published results are never silently overwritten.

## Phase 11 teacher experience

The first specialized sibling experience lives at `/teacher/*`. `TeacherShell` shares centralized authentication, API utilities, brand assets, tokens, and account management without inheriting the administrative sidebar. Portal APIs derive scope from the authenticated User → Employee → Teacher relationship and never accept a client-selected teacher identity.

## Current topology

The Phase 5 system is a pnpm monorepo with an independently built browser client and REST API backed by PostgreSQL. Docker Compose describes local web, API, and database services.

`Browser → React/Vite web → /api/v1 REST → Express application → PostgreSQL`

## Frontend

`apps/web` uses React, TypeScript, Vite, and React Router. `AuthProvider` resolves the HTTP-only server session before rendering protected routes. The responsive shell exposes Dashboard, account, permission-gated Workforce, Teachers, Students, Academics, and Security navigation. Students manages permanent protected profiles and reusable guardian relationships without presenting future enrollment placement.

Phase 27 loads implemented page modules through route-level dynamic imports beneath the shared authentication provider and experience shells. The service worker is registered only by production builds and caches only same-origin application-shell/static build assets. It explicitly excludes API and managed-media paths so protected business responses never become a browser cache. The Attendance Terminal persists pending captures in IndexedDB, preserving client event, terminal, and terminal-session identity across refreshes; an old local-storage queue is migrated once, with local storage retained only as a compatibility fallback when IndexedDB is unavailable.

## Backend

`apps/api` uses Express with explicit middleware for request correlation, structured Pino logging, security headers, configured CORS, JSON size limits, versioned routes, consistent not-found errors, and centralized error handling. Zod validates configuration and is the selected request-schema framework. `/api/v1/health` is process health; `/api/v1/ready` checks PostgreSQL.

## Database

A lightweight ordered SQL migration runner records checksums in `schema_migrations` and applies each migration transactionally. The seed framework is repeatable. Phase 0 stores only application metadata and seed history—no future domain model is prematurely created.

## Authentication and authorization

Local accounts use normalized email identifiers and Node scrypt password hashes with random salts. Successful login issues a 256-bit opaque token in an HTTP-only SameSite cookie; PostgreSQL stores only its SHA-256 digest, expiry, revocation, and device metadata. Authentication middleware resolves active sessions and account status. Permission middleware enforces granular `<resource>.<action>` grants assembled through user-role and role-permission relationships. Five failed logins temporarily lock an account for 15 minutes. Security mutations and authentication outcomes create immutable audit events.

Standard school roles are seeded, while permissions—not role names—are the authorization boundary. The Super Administrator grant set and last active Super Administrator are protected from accidental lockout.

Academic configuration and calendar use separate view/manage permissions. All writes are validated against allowlisted resources, enforced server-side, version-checked, archived rather than deleted, and recorded in immutable audit events.

Workforce is a bounded Phase 3 module. Employee directory/profile access, creation, editing, archival, sensitive identifiers, document metadata, and configuration use separate permissions. Ordinary employee responses do not contain government identifiers. Employee status changes append immutable history; employees and related mutable records use archival and optimistic versions.

Teacher Management is a bounded Phase 4 extension. `teacher_profiles` has a one-to-one foreign key to `employees`; personal and employment data remain owned by Workforce. Subject qualifications reference the Phase 2 subject catalog. Faculty/advisory/homeroom placement is school-year scoped, while actual class/subject assignments and calculated teaching load remain deferred to Phase 7.

SIS Core is a bounded Phase 5 identity module. `students` stores permanent identity and current lifecycle information, while future yearly placement belongs to Enrollment. `guardians` are independent reusable people records. `student_guardians` explicitly scopes relationship type, custody, primary-contact, and communications authority for each student; it will become the parent-access boundary in later phases.

## Phase 6 enrollment boundary

Enrollment is the academic-history aggregate. Each `enrollments` row permanently binds one student to one school year, with grade/section placement and lifecycle, completion, promotion, transfer, or withdrawal facts. Student, school year, grade, and optional section ownership are enforced in both the service and PostgreSQL. Update APIs cannot replace the student/school-year identity, and a unique constraint prevents duplicate yearly identities.

## Managed profile media

Profile photos use a reusable storage provider boundary. The initial local provider writes immutable UUID-named WebP profile and thumbnail variants to persistent storage; Employee and Student logic references media assets rather than filesystem paths or public hostnames. A future S3-compatible provider can replace local storage without changing those domain modules.

## Boundaries and integration

Phase 7 adds one shared academic assignment boundary: curriculum records bind a subject to a grade, school year, and optional term; teaching records bind that curriculum to a section and an existing teacher school-year placement. Enrollment, employee, teacher, and academic identities are referenced rather than duplicated. Timetables, attendance, payroll, grades, portals, and later modules remain planned. REST/JSON remains the integration pattern.

Phase 8 employee attendance references the shared Employee identity. A daily record holds operational facts, while correction requests and append-only adjustments preserve review and before/after history. Source plus external event ID supplies an idempotency boundary for future terminals and imports. Published calendar holidays are read as context rather than duplicated. Student attendance and the terminal remain separate future boundaries.

Phase 9 student attendance is a separate bounded context anchored to Enrollment, never a duplicate student identity. Campus attendance is the implemented operational scope. The schema also reserves class scope through an optional Phase 7 teaching assignment and validates matching school year and section. Employee and student tables remain independent while sharing status/source conventions, holiday context, idempotency, audit, and adjustment patterns.

Phase 10 reporting is a read-model boundary that computes dashboards and operational report rows directly from authoritative module tables. It does not persist duplicate totals. Central administration persists only typed JSON settings with scope, visibility, versions, authorization, and audits. CSV and print are the initial export surfaces; advanced analytics and scheduled/native workbook output remain later work.

## Multi-experience application composition

MMSC is one integrated platform with multiple specialized frontend experiences. `AuthProvider`, the API client, authorization utilities, design tokens, and UI primitives sit above or outside experience-specific layouts. The current administrative `AppShell` is a React Router layout using an outlet; future purpose-built route groups can be siblings with their own shells and must not inherit the administrative sidebar by default.

Frontend separation never changes domain ownership. All experiences use the versioned shared API, centralized accounts/sessions/RBAC, immutable audit infrastructure, authoritative master records, and primary PostgreSQL platform database. The API accepts its HTTP-only session cookie and bearer session token; allowed client origins remain environment-configured.

No portal, kiosk, POS, library, or clinical route tree exists before its roadmap phase. A separately deployable frontend remains a client of the same platform rather than a new domain or database.
# Post-Phase 29 academic structure correction

MMSC Super App is institution-aware but currently single-institution: the one primary `schools` row is the MMSC organization profile, while `campuses` models its locations. Institution-scoped academic records retain `school_id`, but the API assigns the primary MMSC identifier instead of asking operators to choose an internal school.

`external_schools` is separate shared reference data for prior, origin, destination, and transfer institutions. Admissions and Student history retain original free text and may reference a normalized record. External schools never become MMSC campuses or gain platform ownership.
## Trusted Attendance PWA installation

Attendance uses separate logical-terminal, trusted-installation, assignment, operator-session, and connectivity concepts. A trusted installation is a revocable client principal, not a User and not a second identity store. Its terminal-scoped credential can call only the shared installation, cache, heartbeat, and sync contracts. IndexedDB durability and service-worker availability do not change server ownership of eligibility, school-day, duplicate, and audit rules.
## Trusted Attendance synchronization recovery

The installation credential is the primary terminal client identity. Runtime middleware resolves its installation, assignment, logical terminal, and bound session before synchronization; the route rejects payload assignment mismatches. The client serializes all automatic, reconnect, background-wake, scan-triggered, and manual synchronization through one in-flight operation and retains unacknowledged events.

## Phase 19 Clinic experience

Clinic is a purpose-built `/clinic/*` sibling experience over the shared API, authentication, RBAC, audit, notification, Student, Enrollment, Guardian, Employee, and User domains. It owns clinical records, encounters, appointments, follow-ups, releases, and Clinic inventory transactions without duplicating canonical identities. `/clinic-management` is an Administration governance and aggregate-reporting surface; it does not host daily consultation work. Portal delivery crosses an explicit safe-release boundary and never exposes internal EHR or consultation notes.
## Phase 20 Group 3 circulation boundary

Library patron resolution is a read projection over authoritative Student, Employee, Teacher specialization, active enrollment, and centralized Credential domains. The Library does not own a patron or credential table and does not depend on Attendance events. `library_loans` owns Library circulation history. Atomic checkout locks all copies in deterministic UUID order; check-in locks the copy before its active loan; renewal locks the loan. Server-side settings calculate due dates and partial uniqueness protects each copy from concurrent active loans.
## Phase 20 Group 4 policy boundary

Borrowing policy is a bounded hierarchy: one default plus optional Student, Teacher, and Employee overrides. Circulation consumes but cannot modify the effective policy. Patron locking serializes active-loan-limit checks, while copy locking preserves physical state. Stored due dates remain historical facts and are never rewritten by policy changes.
## Phase 20 Group 5 visitor boundary

`library_visits` is operational foot traffic, not Attendance. It consumes shared identities and credential digests but never Attendance endpoints, sessions, captures, or records. Explicit entry/exit modes prevent ambiguous scans.

Credential creation and Library resolution share one UTF-8 SHA-256 pipeline over the same canonical string normalization. Resolution is lifecycle-aware: a current active, unexpired row wins over older revoked/replaced rows with the same digest. Visitor daily reads and analytics use the platform's established `Asia/Manila` school-day boundary; completed-session averages exclude open visits.
# Computer Laboratory experience

Computer Laboratory equipment is a bounded physical-peripheral registry, not a replacement for workstations and not a school-wide procurement/asset system. Current assignment is a summary backed by durable transfer history. Group 4 remains laboratory/workstation scoped; equipment-specific issues and maintenance are a deferred extension.

Computer Laboratory issues represent operational problems; maintenance records represent actual work. They remain separate, may be linked only within a compatible laboratory/workstation scope, and use authoritative Employees rather than module-local technicians. Issue closure never silently changes workstation availability.

The Computer Laboratory portal is a purpose-built `/computer-lab/*` frontend over the shared API, authentication, RBAC, Campus domain, authoritative Student/Enrollment identities, credential resolver, scheduling, audit infrastructure, and PostgreSQL database. Laboratory sessions own usage transactions while occupancy is derived from active sessions rather than a mutable workstation `in_use` flag. Laboratory usage is explicitly separate from official Attendance.
# Computer Laboratory scheduling

Laboratory schedules use authoritative Teaching Assignments as the academic aggregate, deriving Teacher, Section, Subject, and School Year through existing relationships. One-time and weekly recurrence are intentionally bounded to 370 days and expressed as school-local dates/times, avoiding browser timezone shifts and an unnecessary general recurrence engine.
# Phase 21 Group 6 software configuration boundary

Computer Laboratory software is a manually maintained expected-configuration domain. `computer_lab_software` owns catalog and non-secret license metadata; `computer_lab_workstation_software` references authoritative workstations and records expected versions and manual statuses. Physical Equipment, Group 4 Issues, workstation operating-system metadata, active Student sessions, and future observed endpoint state remain separate. No endpoint agent, remote execution, discovery, deployment, or automatic issue generation is part of this architecture.

# Phase 21 Group 7 derived operations

The Computer Laboratory Dashboard and Reports are bounded read models over Groups 1–6, not new sources of truth. Active sessions derive occupancy; schedule occurrence logic remains server-side; reporting uses validated date ranges, filters, pagination, and capped CSV. No summary tables, background alert engine, official Attendance integration, or endpoint telemetry were introduced.
