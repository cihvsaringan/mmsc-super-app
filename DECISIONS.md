# Architecture Decision Records

## ADR-053 — Separate bibliographic titles from sequence-identified copies

Status: Accepted

Store practical title/edition metadata once in `library_books` and every circulatable physical item in `library_book_copies`. Allocate default `LIB-######` accessions from a PostgreSQL sequence, use the accession as the default barcode, and enforce both identifiers case-insensitively. This supports bulk acquisition and exact scanning without MARC21 complexity or unsafe application-side numbering.

## ADR-057 — Use bounded live Library reporting

Library dashboard and report results are queried from authoritative operational tables rather than persisted into a second analytics source. Fixed dashboard windows, validated report ranges, pagination, export caps, and targeted indexes keep MVP queries predictable. CSV shares the report query and filters but requires the existing `report.export` permission in addition to Library report access.

## ADR-056 — Derive Library overdue state and reuse Notifications

Library overdue state is derived from active loans using the same effective borrowing-policy grace hierarchy as circulation eligibility. It is not persisted as a mutable status. Due and overdue reminders use the existing Notifications domain, with a small Library-owned milestone dispatch ledger for idempotency. Portal reads remain scoped through authoritative Student and Guardian relationships, and financial penalties are deferred rather than implied by overdue state.

## ADR-052 — Reuse centralized identity and credentials for Library

Status: Accepted

Library owns its future catalog, copy, loan, visitor, overdue, and settings transactions, but not people or credentials. Patron lookup will resolve canonical Students and Employees through the shared digest-backed Credential service. Attendance records are never a Library data source. This preserves one identity registry while keeping Library circulation and visitor activity operationally independent.

## ADR-050 — Separately deploy the Attendance Terminal frontend

Status: Accepted

Deploy operational attendance scanning as `apps/web-2` on its own origin while retaining terminal registration and lifecycle management in `apps/web`. This isolates kiosk navigation, service-worker scope, installability, and device operation from the administrative shell while preserving one API, database, identity model, RBAC policy, attendance domain, credential service, and audit trail. A separately deployed frontend is not separate data ownership.

## ADR-049 — Attendance kiosk authorization is device-bound

Provision an Attendance Terminal online through an authorized User, then operate it through a separately revocable terminal-scoped random credential. Store only its digest on the server and limit its use to device validation, minimal cache synchronization, and attendance synchronization. It is never a general User session. This enables offline restart and recovery without weakening Administration authentication or duplicating authoritative identities.

## ADR-048 — Preserve Teaching Assignment identity during Teacher changes

**Decision:** Changing the Teacher or role updates the existing Teaching Assignment under optimistic concurrency and records previous/new placement data in audit metadata. Curriculum, Section, and Subject identity remain fixed for that record.

**Reason:** Delete-and-recreate obscures operational history and can create gaps or duplicate assignments. An audited update expresses the real business event while existing unique indexes remain authoritative.

## ADR-047 — Treat School Year activation as an atomic lifecycle command

**Decision:** New School Years are always Planned. Activation uses a dedicated confirmed server command that serializes by institution, closes the existing Active year, activates the target, and audits both changes within one transaction. Terms, Sections, and Calendar remain authoritative year-linked resources surfaced inside School Year detail.

**Reason:** A generic status field permits invalid transitions and race-prone multiple-active outcomes. A lifecycle command expresses the business invariant while nested presentation makes year ownership clear without changing data ownership or identifiers.

## ADR-046 — Operational Teacher directory over shared domains

Use a list projection plus on-demand modal detail for Teacher administration. Employee identity/profile/photo, Academic Assignments, and Security accounts remain authoritative in their existing domains. The Teachers module owns only its explicit one-to-one Employee specialization, qualifications, and School Year placement and cannot create parallel people, accounts, or assignment records.

## ADR-045 — Enrollment confirmation owns SIS materialization

**Decision:** Admissions approval is exposed as a virtual pending Enrollment candidate. It does not materialize a permanent Student or Enrollment. Enrollment confirmation owns transactional Student create/reuse, Student Number allocation, Guardian linkage, enrolled Enrollment creation, and Admission lifecycle completion.

**Reason:** Admissions decides acceptance; Enrollment decides final School Year, Grade, Section, and curriculum. This boundary prevents premature Students and half-enrolled records while preserving separate authoritative domains.

**Compatibility:** Previously converted pending Enrollments remain supported. The old Admissions conversion route returns a handoff error and the Admissions UI directs approved records to Enrollments.

## ADR-044 — Discover workspaces declaratively and separate assignment from application access

**Decision:** Resolve implemented MMSC workspaces through a centralized registry. Availability uses centralized roles and permissions, while Employee position is never itself an access grant. Render Administration modules through reusable permission-filtered groups and omit empty groups. Do not register deferred operational applications before their routes and grants exist.

**Rationale:** A User may hold multiple concurrent assignments and needs one identity/session across several purpose-built experiences. Declarative discovery supports this without duplicate accounts, portal-local authorization, or a schema redesign each time an operational client is implemented.

## ADR-043 — Treat Security & Access as one permission-scoped, URL-addressable operations workspace

**Decision:** Keep accounts, roles, portal activation, and audit activity in the existing centralized Security domain and expose them as four independently authorized `?tab=` views under `/security`. Enrich read models from authoritative tables instead of persisting UI status or creating portal-specific access stores. Do not return audit metadata to the general activity list.

**Rationale:** Security operators need distinct workflows and shareable/reload-stable locations, while centralized identity, RBAC, and server-side authorization must remain the only source of truth. A tabbed application boundary provides operational clarity without weakening isolation or duplicating data.

## ADR-041 — Role-backed experience discovery

Status: Accepted

Resolve frontend experiences from both centralized role membership and the matching access permission. Permission alone cannot prove that the User has the authoritative Employee/Teacher, Student, or Guardian relationship required by a specialized portal. Use one resolver for home routing, invalid-route fallback, and workspace switching, while retaining all server-side RBAC and identity-scope checks at destination APIs.

## ADR-040 — Compose operations from authoritative domains

Status: Accepted

Provide Operational Administration as a request-time, permission-scoped read model over implemented authoritative domains rather than introducing a duplicate monitoring database or persisted operational snapshot. Keep maintenance commands explicit, narrow, transactional, idempotent, and audited. Phase 28 therefore exposes one safe session-hygiene command and leaves infrastructure observability integrations or deferred-domain operations to future explicit decisions.

## ADR-039 — PWA only where offline capability has operational value

Status: Accepted

Apply installability and durable offline capture to the Attendance Terminal, where connectivity interruptions must not stop the school gate workflow. Keep administrative and portal routes network-authoritative while optimizing their delivery through route-level chunks. Cache only static application-shell assets, never authenticated API responses or managed media. Preserve queued capture identity in IndexedDB and submit it through the existing idempotent Attendance service; a PWA remains a client of the shared platform, not a separate identity or attendance domain.

## ADR-038 — Central collision-safe login identities

Status: Accepted

Use one globally unique normalized `login_identities` lookup layer for Username, Employee Number, Student Number, and Guardian Number. Person domains retain authoritative identifier ownership and synchronization triggers keep linked aliases current. Email remains recovery metadata. Provisioning reuses one centralized User, assigns explicit RBAC access, and uses random one-time temporary passwords with mandatory first-login replacement until secure activation-email delivery exists.

## ADR-037 — Layer origin enforcement with SameSite sessions

Status: Accepted

SameSite Strict remains the primary CSRF defense, supplemented by allowlisted Origin and Fetch Metadata checks for unsafe methods. Non-browser clients without browser metadata remain supported; declared cross-site traffic is rejected before authentication.

## ADR-036 — Request-time analytics over authoritative domains

Status: Accepted

Phase 25 expands report queries directly over implemented authoritative tables instead of introducing a reporting warehouse or persisted aggregate store. This keeps operational results current and avoids duplicated ownership at the current scale; future warehouse adoption requires a separate decision with refresh, lineage, retention, and access controls.

## ADR-035 — One published calendar read model across experiences

Status: Accepted

Reuse the existing authoritative Calendar Event aggregate and audited Academic write path. Provide one cross-experience read model with server-enforced published-only visibility for ordinary users and preview visibility for calendar managers. Render the same reusable calendar component within each role-specific shell.

This avoids divergent Teacher, Student, Parent, and administrative calendars while preserving purpose-built navigation and least-privilege publication controls. External calendar synchronization and audience-specific private events are not introduced in Phase 24.

## ADR-034 — Online authoritative manual attendance with immutable receipts

Status: Accepted

Manual attendance assistance uses online least-privilege lookup against authoritative Student, Enrollment, and Employee data. Accepted capture updates the existing attendance domain transactionally; every accepted or rejected attempt also creates an idempotent operational receipt and immutable history tied to the registered terminal and authenticated operator. The browser does not keep a permanent people cache.

This preserves one identity and attendance source of truth while supporting credential failures, late arrivals, and accountable exception handling. Manual operations are intentionally not offline-capable in Phase 18; the existing scan terminal remains the offline-first capture experience.

## ADR-033 — MVP Sequencing After Phase 17

Status: Accepted

### Context

Phase 17 — Notification Center is complete. The platform now contains the major administrative, academic, portal, registration, notification, and attendance foundations required for an initial school-focused MVP.

### Decision

Complete Phase 18, then defer Phases 19–23 and continue MVP development directly with Phases 24–29. Deferred phases retain their identifiers and long-term scope.

### Rationale

This prioritizes completion and hardening of the existing school platform before investing in additional operational domains. The MVP focuses on Admissions, Students, Teachers, Parents, Academics, Grades, Attendance, Communications, Events, Reporting, Security, PWA value, and operational readiness.

### Consequences

Clinic, Library, Computer Laboratory, MMSC Credits, and Canteen remain part of the long-term MMSC Super App but are classified as Post-MVP. Phases 24–29 must integrate only implemented domains and must not create placeholder deferred functionality. When Post-MVP development resumes, Phases 19–23 remain subject to the shared platform architecture, authentication, RBAC, authoritative identities, credentials, APIs, domain ownership, and design system.

## ADR-032 — Publish-time notification recipient snapshots

Status: Accepted

Store declarative authoritative audience targets on a draft, then resolve and materialize a deduplicated user recipient set transactionally at publication. This makes delivery and read history stable even when roles, enrollments, sections, or Guardian relationships later change. Late-linked accounts do not receive old messages automatically; a new publication is required.

## ADR-031 — Guardian-derived child scope

Status: Accepted

Resolve Parent Portal identity from the centralized account's `guardians.user_id` link and authorize children only through active `student_guardians` relationships. Validate Enrollment ownership after child authorization and expose only published academic data. A UI child switch never expands server-side access.

## ADR-030 — Token-scoped public Admissions access

Status: Accepted

Permit applicants to draft, submit, resume, check, and supplement an Admissions application without creating an MMSC account. Require the application reference plus a random 256-bit secret, persist only its digest, expire it, and expose applicant-specific DTOs through a separate public API. This preserves centralized Admissions processing and leaves future Guardian account invitation/linking to Phase 16.

## ADR-029 — Admissions staging with transactional SIS conversion

Status: Accepted

Keep pre-approval application information in a dedicated Admissions workflow because it is not yet authoritative Student or Enrollment data. Convert only approved applications through one audited transaction that resolves duplicates, reuses matched identities, and writes the shared SIS records. Preserve the application and immutable status history after conversion for accountability.

## ADR-028 — Roadmap Reprioritization After Phase 14

Status: Accepted

### Context

Phases 0–14 established the MMSC platform foundation, HRIS, SIS, Academics, Teacher Portal, Grading, Student Portal, and Offline-first Attendance Terminal. The next priority is increasing real-world school usability.

### Decision

Prioritize Registration & Admissions, Parent / Guardian Portal, Notification Center, and Attendance Operations / Manual Check-In before continuing with the remaining operational modules.

### Rationale

This sequencing reduces Registrar re-encoding, establishes parent onboarding earlier, makes existing academic and attendance data useful to families, centralizes communication across specialized experiences, and gives authorized operators a fallback when QR/RFID capture is unavailable. It moves the platform closer to a deployable end-to-end school workflow.

### Consequences

Clinic, Library, Laboratory, Credits, and Canteen remain planned but move later. No completed phase is renumbered, and this decision changes no implementation, schema, API, or UI.

## ADR-027 — Shared credential and idempotent terminal event boundary

Status: Accepted

Represent QR, RFID, NFC, and barcode identifiers in one centralized credential table using one-way digests. Attendance terminals are registered platform clients and synchronize stable client event UUIDs; the API stores one receipt per terminal/event pair and writes attendance transactionally. A dedicated PWA may queue scans temporarily, but it does not own person master data or become an independent attendance system.

## ADR-001 — PostgreSQL as the primary database

Status: Accepted

Use PostgreSQL for shared relational data because the platform requires strong integrity, transactions, rich indexing, and durable historical relationships.

## ADR-002 — TypeScript pnpm monorepo

Status: Accepted

Keep web and API applications in one pnpm workspace to align tooling and enable future shared packages while preserving separately buildable deployment units.

## ADR-003 — Versioned Express REST API

Status: Accepted

Expose JSON resources under `/api/v1` through a middleware-oriented Express application. REST is broadly interoperable with browsers, terminals, and future integrations.

## ADR-004 — Forward-only checksummed SQL migrations

Status: Accepted

Use ordered SQL migrations applied transactionally and record checksums. This keeps schema changes explicit and prevents silent mutation of applied history without introducing future domain tables early.

## ADR-005 — Shared identity domain

Status: Accepted

All modules will reference shared stable identities. Teacher specializes Employee; Student remains permanent while Enrollment captures school-year placement; Guardian records are reusable. Implementation is deferred to the relevant phases.

## ADR-006 — Server-side opaque sessions

Status: Accepted

Use random opaque session tokens in HTTP-only SameSite cookies and store only SHA-256 token digests in PostgreSQL. This enables immediate revocation, account deactivation, server-side expiry, and avoids exposing authorization claims in browser-readable storage.

## ADR-007 — Scrypt password hashing

Status: Accepted

Use Node's built-in, memory-hard scrypt implementation with a unique random salt. This avoids plaintext/reversible storage and native third-party deployment dependencies while retaining timing-safe verification.

## ADR-008 — Permission-based authorization

Status: Accepted

Enforce granular `<resource>.<action>` permissions at API boundaries. Roles are reusable grant collections and never substitute for server-side permission checks. Security audit records are immutable.

## ADR-009 — School Year as a first-class aggregate

Status: Accepted

Represent each School Year with a stable identity, explicit dates, lifecycle status, and preserved history. Academic terms and sections reference it rather than relying on a global “current year” string. Only one active year per school is allowed.

## ADR-010 — Archive and optimistic concurrency for master data

Status: Accepted

Phase 2 master records are archived rather than deleted and carry integer versions. Updates and archives must match the caller's version, preventing silent overwrites while preserving identities for later historical relationships.

## ADR-011 — Permanent employee identity with append-only status history

Status: Accepted

Represent each employee once with a stable UUID and archive the record rather than deleting it. Keep current employment status on the profile for efficient search while appending every transition to immutable history in the same transaction. Teacher specialization must reference this employee identity in Phase 4.

## ADR-012 — Separate authorization boundary for employee identifiers

Status: Accepted

Keep government and administrative identifiers outside ordinary employee responses and protect their endpoints with dedicated sensitive view/manage permissions. Never copy identifier values into audit metadata. Binary document storage remains external/deferred; Phase 3 stores only permission-protected metadata and storage references.

## ADR-013 — Teacher as an employee specialization

Status: Accepted

Represent a teacher through a one-to-one profile referencing the permanent employee identity. Keep personal, contact, employment, and sensitive identifier data in Workforce. Teacher-specific faculty metadata and qualifications live in the extension, preventing duplicate people records.

## ADR-014 — Separate faculty placement from teaching assignments

Status: Accepted

Store school-year faculty status, department, teaching level, maximum-load limit, advisory class, and homeroom class in Phase 4. Defer actual subject/class assignments, schedules, and calculated academic load to Phase 7 so the assignment model can reference students, enrollments, classes, and subjects coherently.

## ADR-019 — One shared academic assignment engine

Status: Accepted

Represent curriculum separately from section teaching assignments. Curriculum binds school year, grade, subject, and optional term; a teaching assignment references that curriculum, a section, and the existing teacher school-year placement. Keep adviser/homeroom ownership on faculty placement, and defer timetable periods and calculated-load enforcement.

## ADR-020 — Separate daily attendance facts from correction history

Status: Accepted

Keep one active employee/day attendance record and apply approved changes through an immutable adjustment ledger containing before/after snapshots. Correction requests have an explicit review lifecycle. Reserve a source-scoped external event identifier for safe future device/import retries without building the terminal in Phase 8.

## ADR-021 — Anchor student attendance to Enrollment

Status: Accepted

Reference Enrollment so every attendance fact carries historical student, school-year, grade, and section placement without duplication. Keep employee attendance separate. Model campus and future class scopes in the same student-attendance aggregate; require a matching teaching assignment for class scope and retain source-event idempotency for the future shared terminal.

## ADR-022 — Compute operational reporting from authoritative tables

Status: Accepted

Use query-time dashboard/report read models instead of duplicated aggregate storage at this scale. Persist only centralized settings. Provide JSON, permission-protected CSV, and print output now; defer native Excel, scheduling, and advanced analytics until a proven operational need.

## ADR-023 — One platform with multiple specialized frontend experiences

Status: Accepted

MMSC Super App uses one integrated platform with multiple purpose-built frontend experiences. Route groups, application shells, PWAs, kiosks, POS workspaces, or separately deployable frontend clients continue to consume authoritative MMSC master data, centralized authentication and RBAC, shared versioned APIs and business rules, immutable audit infrastructure, and the same primary platform database. A dedicated UI never implies separately owned identities, domains, or databases.

## ADR-015 — Permanent student identity separated from Enrollment

Status: Accepted

Keep names, LRN, demographics, contacts, address, entry information, and current lifecycle status on one permanent student record. Do not store grade, section, or school-year placement there. Phase 6 will reference the student through append-preserved yearly Enrollment records.

## ADR-016 — Reusable guardians with explicit student relationships

Status: Accepted

Represent each guardian independently and link the same record to multiple students. Store relationship type, custody, primary-contact, and communications flags on the student/guardian link, not on the guardian. This avoids sibling duplication and establishes the explicit relationship boundary required for future parent access.

## ADR-017 — Shared modal convention for standard creation

Status: Accepted

Open ordinary Add/New/Create forms in the shared accessible application modal. The modal owns focus containment/restoration, Escape and backdrop dismissal, responsive sizing, scroll containment, error presentation, and busy-state dismissal protection. Keep complex multi-step creation and substantial detail/edit experiences on dedicated screens when their context warrants it.

## ADR-018 — Enrollment as an immutable student/year identity

Status: Accepted

Represent academic placement as one enrollment identity per permanent student and school year. Keep student and school-year ownership fixed after creation, allow version-checked lifecycle and placement corrections, prevent duplicate yearly identities with a database constraint, and never replace prior-year grade/section information when a new school year begins.
# ADR-009 — Storage-neutral managed profile media

## ADR-026 — Self-scoped Student Portal

Status: Accepted

Resolve the Student Portal identity only through the centralized account's `students.user_id` relationship. Permit selection only among that Student's enrollments and expose grades only from published or locked gradebooks.

## ADR-025 — Versioned gradebook workflow

Status: Accepted

Own grades in one gradebook per Teaching Assignment and Grading Period. Store grades per Enrollment, require explicit state transitions, make submitted/published/locked gradebooks read-only, and preserve every value/state change in immutable history. Reopening requires permission and an audited reason.

Status: Accepted

Store profile-photo metadata and logical keys in `media_assets`, process uploads into bounded WebP profile and thumbnail variants, and access physical storage only through `StorageProvider`. Use persistent local storage for current Docker/VPS development; substitute object storage later without changing Employee or Student business logic.

## ADR-024 — Teacher Portal identity and scope

Status: Accepted

Host the first specialized experience as `/teacher/*` in the shared frontend while using a purpose-built shell. Resolve the teacher only from the authenticated User → Employee → Teacher link, and scope all academic data through shared school-year and teaching assignments. Do not accept arbitrary teacher identifiers or duplicate teacher/student master records.
# Post-Phase 29 decision — one institution, separate external-school references

**Decision:** Keep institution-aware keys but configure one primary MMSC institution. Model MMSC locations as campuses and other educational institutions as `external_schools` reference data.

**Rationale:** This preserves integrity and future flexibility without presenting a multi-tenant model MMSC does not operate. Legacy previous-school text remains historical evidence; normalized references augment it. Any future multi-institution conversion requires a new explicit decision and migration plan.

## ADR-027 — Minimal revocable offline Attendance identity index

Status: Accepted

Registered Attendance Terminals may incrementally cache only an opaque credential lookup digest, canonical Student/Employee reference, display name/number, optional managed-photo reference, credential/eligibility state, last attendance date, and synchronization metadata in IndexedDB. This cache supports installed-PWA startup and first-Time-In decisions during an outage but never becomes an authoritative or complete people database. Online synchronization must revalidate terminal/session state, credential lifecycle, person eligibility, Philippine school day, and idempotent event identity against PostgreSQL. Retirement clears the managed browser profile.
## ADR-051 — Separate trusted PWA installations from logical terminals and operators

Decision: model each installed Attendance PWA as a durable, revocable client principal. Register it once with a short-lived single-use code and authorized operator credentials, then assign it to a logical terminal. Persist the installation secret only in managed IndexedDB and only its digest in PostgreSQL. Operator sessions and network reachability do not define device trust. This prevents restarts and outages from deauthorizing a kiosk while retaining explicit server-side revocation and auditability.
## ADR-053 — Model Library patrons as authoritative identity projections

Status: Accepted, 2026-08-27.

Library circulation stores a constrained Student-or-Employee reference on each historical loan, while operational patron profiles are projected from authoritative identity, active enrollment/employment, and Teacher specialization. Shared credential digests resolve scans without disclosing raw values. Checkout is an all-or-nothing batch and due dates come from Library settings so Group 4 can extend rules without rewriting circulation.
## ADR-054 — Use a bounded Library borrowing-policy hierarchy

Status: Accepted, 2026-08-27.

The MVP uses one default policy and three optional patron-type overrides instead of a generic rules engine. Grace expires only after `due_at + grace`; renewal extends from the later of the current due time or renewal time. Existing due dates are not retroactively rewritten. Monetary fines and payments are deferred.
## ADR-055 — Keep Library visits separate from Attendance

Status: Accepted, 2026-08-27.

Library entry and exit are operational sessions in `library_visits`. Shared identity resolution does not make them school attendance, and no Attendance records or terminal captures are created.
# 2026-08-27 — Computer Laboratory workstation state

Group 1 stores only administrator-controlled workstation states (`available`, `maintenance`, `offline`, `retired`). `in_use` is excluded from persistence and normal CRUD; a later lab-session group must derive occupancy from the authoritative active session. Existing generalized asset tables were not coupled because Group 1 requires workstation-specific network and hardware metadata and no clean shared asset aggregate currently owns it.
# 2026-08-27 — Bounded school-local laboratory recurrence

Computer Laboratory schedules store Philippine school-wall dates and times rather than occurrence timestamps. Weekly recurrence is capped at 370 days and expanded only during bounded conflict/range operations. This makes exact classroom periods stable across clients, supports future “what applies now?” Group 3 queries, and avoids introducing an enterprise recurrence engine.
