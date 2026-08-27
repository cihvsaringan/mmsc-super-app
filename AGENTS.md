# MMSC Super App — Permanent Codex Instructions

## Project Identity

- Project: MMSC Super App
- Organization: My Messiah School of Cavite (MMSC), Cavite, Philippines
- Type: Modular school management super application
- Stack: React, TypeScript, Vite; Node.js, TypeScript, Express REST API; PostgreSQL; pnpm workspaces; Docker
- Structure: `apps/web` frontend, `apps/api` backend, root infrastructure, and durable Markdown documentation

## Required Session Start

Before changing the repository, read this file, `ROADMAP.md`, the previous phase document, the requested phase document, relevant architecture/database/security documentation, and inspect the implementation and repository state. Repository documentation—not chat history—is the durable source of truth.

## Phase Execution Rules

- Implement only the explicitly requested phase.
- Future roadmap phases are architectural references and must not be implemented automatically.
- Complete, test, document, and verify one phase, then stop. Do not start the next phase without explicit instruction.
- Keep each phase independently runnable and logically commit-ready.
- Never mark a phase Completed unless implementation and verification were attempted and results are documented honestly.
- End each phase with: “Phase X is complete. The next planned phase is Phase Y, but it has not been started.”

## Core Architecture Rules

## Multi-Experience Super App Architecture

MMSC Super App is **one integrated platform with multiple role-specific and operational user experiences**.

Different modules may have significantly different UI layouts, navigation, workflows, device requirements, and interaction patterns, but they must remain connected to the same MMSC platform, shared backend services, master records, authentication, authorization, and database.

### Platform Rule

Do not interpret a specialized UI as permission to create an isolated application, independent business domain, duplicated identity database, or separately managed source of truth.

All MMSC experiences must integrate through the shared platform architecture unless an explicit architecture decision states otherwise.

The long-term platform may provide distinct experiences for:

* Administration / School Staff
* HR / Workforce
* Registrar
* Teacher Portal
* Student Portal
* Parent / Guardian Portal
* Attendance Terminal
* Clinic
* Library
* Computer Laboratory
* Canteen / Cafeteria POS
* Registration / Admissions

Each experience may use a different application shell when appropriate.

### UI Separation

The following experiences SHOULD have purpose-built interfaces rather than simply exposing the administrative UI with different permissions:

#### Teacher Portal

Provide a teacher-focused interface optimized for:

* assigned classes
* advisory sections
* subjects
* student rosters
* attendance
* grade encoding
* schedules
* announcements
* school calendar

Do not expose unnecessary administrative HRIS/SIS interfaces simply because the teacher account has access to teacher functionality.

#### Student Portal

Provide a student-focused, mobile-friendly interface optimized for:

* student profile
* current enrollment
* subjects
* schedules
* published grades
* attendance
* announcements
* school events
* future student-facing services

Students must not use the administrative SIS interface.

#### Parent / Guardian Portal

Provide a parent-focused, mobile-friendly interface optimized for:

* switching between authorized children
* published grades
* attendance
* announcements
* events
* school notices
* MMSC Credits
* permitted clinic/library information
* future parent services

Parents must not use the administrative SIS interface.

#### Attendance Terminal

The Attendance Terminal must use a dedicated kiosk/PWA-oriented UI.

Optimize it for:

* rapid QR scanning
* RFID scanning when supported
* large touch targets
* minimal navigation
* immediate success/error feedback
* offline-first capture
* queued synchronization
* device/terminal identity
* security-operator workflows

The terminal must not expose the normal administrative application shell.

#### Canteen / Cafeteria

The Canteen module should provide a dedicated POS-oriented workspace optimized for:

* rapid student identification
* QR/RFID scanning
* product selection
* cart processing
* MMSC Credit validation
* balance display
* transaction confirmation
* cashier workflows

The canteen workspace must not maintain its own student master records or wallet balance independently.

#### Library

The Library module should provide a circulation-oriented workspace optimized for:

* borrower identification
* book/item scanning
* checkout
* return
* renewal
* overdue handling
* inventory/catalog lookup
* librarian workflows

The Library UI may look significantly different from the administrative HRIS/SIS interface while still using shared MMSC identities and services.

#### Clinic

The Clinic may use a specialized clinical workspace when introduced.

Optimize it for:

* student lookup
* medical record access
* clinic visits
* medicine disbursement
* emergency information
* restricted clinical workflows

Apply stricter authorization than general school administration screens.

---

## Single Source of Truth

Specialized experiences must never duplicate authoritative MMSC master data.

Authoritative ownership includes:

* Employee identity → Workforce / HRIS
* Teacher identity → Employee record plus teacher specialization
* Student identity → SIS
* Guardian identity and relationships → SIS / Guardian domain
* Enrollment → SIS / Registrar
* School Year → Academic Core
* Grade Level / Section / Subject → Academic Core
* Teacher assignments → Academics
* Grades → Grading module
* Attendance → Attendance domain
* Medical records → Clinic
* Library circulation → Library
* Computer laboratory sessions → Laboratory
* MMSC Credits → Credits Ledger
* Canteen sales → Canteen
* User identity / Roles / Permissions → Security

A module may own its own transactions while consuming master information owned elsewhere.

Example:

Library owns:

* checkouts
* returns
* renewals
* fines/penalties where implemented

Library does NOT own:

* Student
* Teacher
* Employee

Canteen owns:

* sales
* sale line items
* POS sessions

MMSC Credits owns:

* credit/debit ledger transactions
* resulting wallet balance

Canteen does NOT independently modify a student's credit balance outside the Credits service.

Attendance owns attendance events but does not own Student or Employee identity.

---

## Shared Validation Rule

Specialized applications must validate identities and eligibility against authoritative platform services.

Examples:

When the Attendance Terminal scans a credential:

1. Resolve the credential through the shared credential service.
2. Resolve the associated Student or Employee.
3. Validate that the credential is active.
4. Validate that the person is eligible for attendance.
5. Record attendance through the Attendance service.
6. Do not maintain a separate permanent terminal-side student/employee master database.

When the Canteen scans a student:

1. Resolve the credential through MMSC.
2. Resolve the Student.
3. Validate current status where required.
4. Query MMSC Credits through the authoritative Credits service.
5. Process the purchase transactionally.
6. Record the sale.
7. Debit credits through the ledger service.

When the Library scans a borrower:

1. Resolve the credential.
2. Resolve the Student, Teacher, or Employee.
3. Validate borrowing eligibility.
4. Perform circulation operations using the shared identity.

---

## Shared Credentials

QR, RFID, NFC, barcode, or future identification technologies must use the centralized credential architecture.

Do not create separate permanent QR/RFID identities for:

* Attendance
* Library
* Canteen
* Laboratory

A credential should identify the authoritative MMSC person/student/employee record.

Modules may impose their own eligibility rules after identity resolution.

---

## Shared Authentication and Authorization

Use one centralized authentication and authorization system.

Do not create independent username/password systems for Teacher Portal, Student Portal, Parent Portal, Library, Canteen, or other MMSC clients.

Different experiences may have separate login screens or application shells, but authentication must resolve through the shared MMSC identity platform.

Authorization remains server-side and permission-based.

Route or UI separation must never be treated as sufficient security.

---

## Frontend Architecture

Initially prefer a modular frontend architecture within the existing repository.

Possible route groups may include:

```text
/admin/*
/teacher/*
/student/*
/parent/*
/attendance/*
/canteen/*
/library/*
/clinic/*
```

These route groups may have independent layouts and navigation shells while sharing:

* design tokens
* UI primitives
* API clients
* authentication
* authorization utilities
* validation
* common types
* domain services where appropriate

Do not force all experiences to use the same sidebar/navigation layout.

UI consistency should exist at the brand and component-system level, not by making every operational interface identical.

---

## Future Client Extraction

A specialized experience may later become a separate deployable frontend when there is a clear operational reason.

Likely candidates include:

* Attendance Terminal PWA
* Canteen POS
* possibly dedicated portal clients

If extracted, the client must continue to use the same MMSC APIs and authoritative platform data.

Do not create a separate database simply because a frontend becomes separately deployable.

Any extraction must preserve:

* API contracts
* shared authentication
* RBAC
* authoritative identities
* audit logging
* centralized business rules

Record significant extraction decisions in `DECISIONS.md`.

---

## Brand Consistency Across Experiences

All specialized interfaces belong to MMSC.

Use the centralized MMSC design system and logo-derived branding, but allow layouts to be purpose-specific.

Share:

* colors
* typography
* logos
* spacing conventions
* form styling
* status semantics
* accessibility rules
* component primitives where appropriate

Do not require every experience to visually resemble the administrative dashboard.

For example:

* Attendance Terminal may be highly simplified and touch-focused.
* Canteen may resemble a POS.
* Teacher Portal may resemble an academic dashboard.
* Parent and Student portals should be mobile-first and information-focused.
* Library may emphasize scanning and circulation.

They should still clearly feel like parts of the same MMSC ecosystem.

---

## Cross-Module Integration Rule

Before creating new data structures, first determine whether the required information already belongs to another MMSC domain.

Prefer references and APIs over duplicated information.

Expected integration relationships include:

```text
HRIS
  └── Teacher specialization
        └── Academic Assignments
              ├── Teacher Portal
              ├── Attendance
              └── Grading

SIS
  ├── Student
  ├── Guardian
  └── Enrollment
        ├── Academics
        ├── Attendance
        ├── Grading
        ├── Clinic
        ├── Library
        ├── Laboratory
        ├── Canteen
        └── Parent/Student Portals

Credential Service
  ├── Attendance Terminal
  ├── Library
  ├── Canteen
  └── Laboratory

MMSC Credits
  ├── Canteen POS
  ├── Parent Portal
  └── Student Portal

Notifications
  ├── Teacher Portal
  ├── Student Portal
  └── Parent Portal
```

Do not bypass the authoritative domain simply to make implementation easier.

---

## Dedicated UI Does Not Mean Dedicated Data

Permanent rule:

> MMSC Super App is one platform with multiple specialized user experiences. A different UI, route group, PWA, kiosk, POS, or future deployable client does not imply separate data ownership. All clients must use authoritative MMSC platform domains, APIs, security, and shared identity unless an explicitly documented architectural decision states otherwise.

- Maintain a modular React/TypeScript frontend, Node.js/TypeScript REST backend, and PostgreSQL relational database.
- Keep frontend, backend, and database concerns separated; use reusable UI components, services, migrations, validation, and centralized errors.
- Use stable internal identifiers, strong constraints, foreign keys, indexes, transactions, timestamps, and archival rather than destructive deletion where history matters.
- Enforce authorization and integrity server-side; frontend controls are never a security boundary.
- Use centralized authentication, granular RBAC, audit logging, and shared identities when their roadmap phases are implemented.
- Keep configuration environment-driven and secrets out of source control.
- Preserve Docker-friendly development and cloud-deployable assumptions.

## Domain Rules

- MMSC is a single-institution platform. `schools` represents the one configured MMSC institution profile; campuses represent MMSC locations. External educational institutions are reusable reference data and must use the separate External Schools domain. Do not model external schools as MMSC campuses or allow routine creation of additional internal institutions unless a future, explicitly documented multi-institution architecture decision changes this rule.

- Email is a recovery/security communication address, not the primary MMSC login identifier. Administrative/internal users use Username; Students, Employees/Teachers, and Guardians use their authoritative Student, Employee, or Guardian Number.
- Every authenticating person uses the centralized User domain for password and security state. Never store authentication passwords on Employee, Teacher, Student, Guardian, terminal, or other domain records.
- A User account does not imply Administration access; RBAC, authoritative identity relationships, and explicit application access determine experiences.
- Domain record creation and portal-account activation are separate. Provisioning must be controlled, idempotent, centrally visible in Security & Access, and must reuse the existing User linked to an authoritative person.
- Administrative provisioning for school personnel must select and link an existing eligible Employee; bootstrap/system accounts are the documented exception.
- Newly provisioned accounts require a unique cryptographically secure random temporary password unless a secure one-time activation-token flow exists. Store only its hash, never log or persist plaintext, display it only in the authorized activation response, and require first-login replacement by default.
- Authorized Super Administrators may replace but never retrieve a password. Administrative replacement must use the centralized policy and hasher, be audited, revoke the target's sessions, and require another change by default.
- Initial setup, activation, administrative replacement, forced first-login change, self-service change, and password reset must share one centralized password policy.

- A Teacher is an Employee specialization; not every Employee is a Teacher.
- A Student is a permanent identity; Enrollment represents school-year placement.
- School Year is a first-class entity and must never be hard-coded.
- Never overwrite historical enrollment or silently overwrite published grades; grades require version/audit history.
- Guardians are independent reusable records and may relate to multiple students; students may have multiple guardians.
- Modules must use shared employee, student, guardian, and account identities. Do not create duplicate module-local people databases.
- MMSC Credits uses an immutable ledger; never alter balances without traceable transactions.
- Attendance synchronization must be offline-tolerant and idempotent when introduced.
- Attendance Terminal credentials for Students and Employees must use the centralized digest-based credential domain. Offline kiosks may cache only the minimum revocable identity index and durable pending events needed for attendance; server-side eligibility, one-Time-In-per-school-day rules, and idempotency remain authoritative.
- Medical, grade, identity, and minor-student information requires strict least-privilege authorization and auditing.
- Parent/guardian access must be limited to explicitly related students.

## Coding Rules

- Inspect before editing and preserve existing conventions and user changes.
- Prefer existing libraries, components, and services; do not replace technology without a documented architectural reason.
- Maintain strict TypeScript typing and avoid unnecessary `any`.
- Validate untrusted input; pair client usability validation with authoritative server validation and database constraints.
- Use versioned APIs, consistent response/error contracts, structured logging, and request correlation IDs.
- Add proportionate automated tests for critical behavior and regressions.
- Hide unimplemented navigation and never fill future modules with fake functionality.
- Keep accessibility, responsive behavior, and centralized design tokens intact.
- Standard Add, New, and Create workflows must open in the shared application modal pattern by default. Use a dedicated page only when the workflow is unusually complex, multi-step, or needs a documented usability exception; keep detail and substantial edit experiences on dedicated screens where appropriate.
- User-uploaded media must not be persisted as Base64 data or deployment-specific absolute URLs in domain records. Store a logical media key or asset reference and resolve delivery URLs through a reusable storage/media service. Validate and optimize images, serve appropriately sized variants, and keep storage replaceable so local/VPS storage can migrate to object storage or CDN delivery without rewriting domain modules.

## Frontend Design and Impeccable Rules

- Impeccable is installed and available for frontend design guidance.
- Use Impeccable intentionally when designing or refining new user-facing experiences, especially specialized MMSC application shells and workflows.
- Do not use Impeccable as justification to redesign, restyle, or refactor existing working interfaces outside the scope of the explicitly requested phase.
- Preserve the centralized MMSC design system, logo-derived brand colors, design tokens, accessibility rules, and reusable UI primitives.
- Specialized experiences may have their own layouts, navigation, information hierarchy, responsive behavior, and interaction patterns while remaining visually recognizable as part of the MMSC ecosystem.
- Purpose-built UI is preferred over forcing specialized experiences into the administrative application layout.
- When working on an existing interface, preserve established behavior unless the current phase explicitly includes redesign or UX improvement.
- Impeccable recommendations must not override domain rules, RBAC, security, accessibility, shared-data ownership, or the phase execution boundaries defined in this file.

## Documentation Rules

Documentation is implementation. Update the relevant documents whenever architecture, schema, security, API behavior, deployment, commands, workflow, or permanent rules change:

- `README.md`, `ROADMAP.md`, `CHANGELOG.md`
- `ARCHITECTURE.md`, `DATABASE.md`, `SECURITY.md`
- `DEVELOPMENT.md`, `DEPLOYMENT.md`, `DECISIONS.md`
- the active `docs/phases/PHASE-XX-*.md`

Document only reality. Clearly label planned or deferred behavior. Do not fabricate endpoints, migrations, tests, deployment, or passing results. Create module documentation only when that module begins.

## Phase Completion Gate

Attempt and record: migration validation, backend typecheck, frontend typecheck, lint, unit tests, integration tests where available, frontend production build, and backend production build. Fix failures in scope or document the exact limitation.
