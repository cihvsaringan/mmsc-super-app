# MMSC Super App Roadmap

> 2026-08-28 Registration & Admissions minor enhancement: source now includes School-Year-specific public registration activation, server-enforced closure, authoritative school-contact closed state, optional intake documents, protected staff document operations, and Under Review editing. Migration and authenticated manual acceptance remain pending. No new roadmap phase was started.

> 2026-08-28 Phase 21 manual-testing extension: centralized Computer Laboratory application display and final role mappings are corrected, Workstations no longer fails on partial schema state, and migrations 0055–0061 were applied to the positively identified local Docker development database. Authenticated browser acceptance remains pending.

> 2026-08-28 Phase 21 source-completion note: Group 7 adds the operational Dashboard, alerts, ten bounded reports, CSV export, final navigation, and Equipment UI follow-ups. Groups 1–7 are complete in source. Migrations 0055–0060 and authenticated acceptance remain pending explicit authorization; Phase 21 is not yet production-accepted.

> 2026-08-28 Phase 21 Group 5 note: Computer Laboratory Equipment & Peripheral Tracking is implemented in source with separate condition/assignment state, transactional transfer history, workstation retirement protection, RBAC, audit logging, and a responsive Equipment workspace. Migrations 0055–0058 remain pending explicit database authorization.

> 2026-08-27 Phase 21 Group 4 note: Issues and Maintenance are implemented in source as separate audited domains with controlled lifecycle, Employee assignment, active-session-safe workstation status actions, linked maintenance, history, filters, and an operational UI. Migrations 0055–0057 remain pending explicit database authorization. Group 5 has not started.

> 2026-08-27 Phase 21 Group 3 note: Lab Access, Walk-ins, and Student Sessions are implemented in source with centralized RFID/Barcode resolution, authoritative enrollment checks, scheduled-class priority, walk-in cutoffs, transactional workstation assignment, derived occupancy, RBAC, audit logging, and an operational staff UI. Migrations 0055–0056 application remains pending explicit database authorization. Group 4 has not started.

> 2026-08-27 Phase 21 note: Computer Laboratory Management Group 1 is complete. The dedicated Computer Laboratory experience, laboratories, workstations, walk-in configuration foundation, RBAC, auditing, validation, search/filtering, and pagination are implemented. Phase 21 remains In Progress; later groups have not started.

> 2026-08-27 Phase 20 Group 6 note: grace-aware overdue operations, idempotent due/overdue Notifications, Student My Library, and Guardian-relationship-scoped Parent Child Library views are implemented. Fines and payments remain excluded. Phase 20 remains In Progress; Group 7 has not started.

> 2026-08-27 Phase 20 Group 5 note: Library-owned entry/exit sessions, shared-ID scanning, manual fallback, current-inside operations, daily logs, and server foot-traffic analytics are implemented without writing Attendance. Phase 20 remains In Progress; Groups 6–7 have not started.

> 2026-08-27 Phase 20 note: Library Management Group 1 is complete. The dedicated Library Portal, centralized RBAC roles/permissions, minimal settings schema, zero-safe dashboard, audit boundary, and shared-identity/credential architecture are implemented. Phase 20 remains In Progress; Groups 2–7 have not started.

> 2026-08-26 post-Phase-29 Attendance Terminal Web-2 rebuild: the former singular-contract/shared-import implementation is **RETIRED / REMOVED**. The independent device-provisioned PWA and pluralized `/api/v1/attendance-terminals` APIs are authoritative. Automated implementation verification passed; database-backed Docker and managed physical-device acceptance remain pending. No subsequent phase was started.

> 2026-08-26 Attendance device-authorization note: terminal registration is now distinct from user login through a revocable, digest-backed terminal runtime credential and IndexedDB configuration. Automated scoped verification passed; installed-PWA all-services-stopped acceptance remains pending. No future roadmap phase was started.

> 2026-08-24 Attendance enhancement note: the post-Phase-29 Attendance Terminal now has shared Student/Employee RFID/QR lifecycle administration, incremental minimal offline identity synchronization, source-aware HID/camera capture, and first-Time-In-only rapid result handling. Automated verification passed; managed-device offline/PWA/reader end-to-end completion remains pending. See `docs/phases/PHASE-29-EXT-ATTENDANCE-CREDENTIAL-OFFLINE-PWA-ENHANCEMENT.md`. No future roadmap phase was started.

> 2026-08-24 Academic Assignments stabilization note: the post-Phase-29 workspace now uses Grade Level and Section aggregate grids, transactional batch editors, and preview-first missing-only copy-forward. See `docs/phases/PHASE-29-EXT-ACADEMIC-ASSIGNMENTS-WORKFLOW-REVAMP.md`.

> 2026-08-24 Academics stabilization note: the post-Phase-29 Academics workspace now makes School Year activation an explicit, atomic Planned → Active transition and nests Terms, Sections, and Calendar within the owning School Year. Reusable academic structure remains top-level. See `docs/phases/PHASE-29-EXT-ACADEMICS-SCHOOL-YEAR-WORKFLOW-REFACTOR.md`.

> 2026-08-24 Teachers minor stabilization note: the Teachers header now matches Enrollments and the false qualification-add error is fixed with success, failure, refresh-failure, and duplicate safeguards. See `docs/phases/PHASE-29-EXT-TEACHERS-MINOR-UI-QUALIFICATION-FIX.md`.

> 2026-08-23 Teachers stabilization note: the post-Phase-29 Teachers Directory and Employee-to-Teacher workflow enhancement is complete. It adds a paginated operational directory, modal details, authoritative Employee selection, and Teacher workflow regression coverage without starting deferred Phases 19–23. See `docs/phases/PHASE-29-EXT-TEACHERS-DIRECTORY-WORKFLOW-STABILIZATION.md`.

> 2026-08-23 Enrollment stabilization note: the post-Phase-29 Enrollments queue and Registrar workflow refactor is complete. Approved Admissions records now hand off directly to a transactional Enrollment confirmation flow; permanent Students are created or linked only at completion. See `docs/phases/PHASE-29-EXT-ENROLLMENT-WORKFLOW-STABILIZATION.md`.

> 2026-08-23 dashboard note: the post-Phase-29 Dashboard Tab-Based UI Redesign is complete. It establishes permission-scoped Students, Employees, Teachers, and More Operations dashboard areas using implemented domains only. Deferred Phases 19–23 remain unstarted. See `docs/phases/PHASE-29-EXT-DASHBOARD-TAB-REDESIGN.md`.

> 2026-08-22 stabilization note: the post-Phase-29 manual-test and UI/UX correction pass is complete. It did not start deferred Phases 19–23 or any new roadmap phase. See `docs/phases/PHASE-29-EXT-PRE-NEXT-PHASE-UI-UX-STABILIZATION.md`.

Only the explicitly requested phase may be implemented. Later phases remain architectural planning.

## Roadmap revision after Phase 14

> After completion of Phase 14, the remaining planned roadmap was reprioritized to deliver Registration & Admissions, Parent / Guardian Portal, Notification Center, and Attendance Operations earlier in the development sequence. Completed Phases 0–14 remain unchanged. Previously planned future modules remain in scope and have only been reordered.

This sequence supersedes the former Phase 15–28 planning order. It does not cancel or reduce the scope of any future module.

## MVP sequencing after Phase 17

Phase 18 is complete. MVP work proceeds next to Phase 24 and then through Phase 29. Phases 19–23 retain their phase numbers and long-term scope but are deferred until after the initial MVP is completed and stabilized.

| Phase | Scope | Status |
|---:|---|---|
| 0 | Project Foundation | Completed |
| 1 | Security, Users, Roles and RBAC | Completed |
| 2 | School Structure and Academic Master Data | Completed |
| 3 | HRIS Core / Workforce Management | Completed |
| 4 | Teacher Management Extension | Completed |
| 5 | Student Information System Core | Completed (including stabilization extension) |
| 6 | Enrollment and Student Academic History | Completed (including stabilization extension) |
| 7 | Class, Subject and Teacher Assignments | Completed |
| 8 | HRIS Attendance and Employment Foundation | Completed |
| 9 | Student Attendance Foundation | Completed |
| 10 | Dashboards, Reporting and Core Administration | Completed (including multi-experience architecture extension) |
| 11 | Teacher Portal | Completed |
| 12 | Grading System | Completed |
| 13 | Student Portal | Completed |
| 14 | Offline-first Attendance Terminal | Completed |
| 15 | Registration and Admissions | Completed (including Public Registration and Applicant Intake extension) |
| 16 | Parent / Guardian Portal | Completed |
| 17 | Notification Center | Completed |
| 18 | Attendance Operations, Manual Check-In & Exception Handling | Completed |
| 19 | Clinic Management & Clinic Portal | Completed |
| 20 | Library Management | Completed — 2026-08-27 |
| 21 | Computer Laboratory Management | Source Complete — Groups 1–7 implemented; migrations 0055–0060 and runtime acceptance pending |
| 22 | MMSC Credits / Wallet Foundation | Deferred — Post-MVP |
| 23 | Canteen and Cafeteria Management | Deferred — Post-MVP |
| 24 | Events and Calendar Experience | Completed (including manual-test and Attendance Terminal operational stabilization extensions) |
| 25 | Reporting and Analytics Expansion | Completed |
| 26 | Security Hardening | Completed |
| 27 | PWA Optimization | Completed |
| 28 | Operational Administration | Completed |
| 29 | Super App Integration Polish | Completed — Initial MVP |

## Near-term planned priorities

### Phase 15 — Registration and Admissions

Create new- and returning-student application workflows that collect applicant, student, guardian, contact, previous-school, enrollment, and supporting-document information. Plan status tracking, Registrar review and notes, requests for information, validation, approval/rejection, duplicate detection, existing-student matching, and conversion of approved applications into authoritative Student, Guardian, and Enrollment records. Integrate School Year, Grade Level, Section, centralized RBAC, and audit infrastructure. Approved information must not require Registrar re-encoding or become a separate permanent student database.

### Phase 16 — Parent / Guardian Portal

Provides a dedicated parent-facing experience using authoritative Guardian relationships, Student, Enrollment, Academics, published Grades, Student Attendance, and published school events. The parent dashboard supports linked-child and enrollment-year switching, child and relationship summaries, academic information, and attendance. Targeted announcements and full account management remain deferred to their appropriate later capabilities.

### Phase 17 — Notification Center

Provides centralized in-app notification infrastructure for roles, employees, teachers, students, parents/guardians, grade levels, sections, all active users, and specific users. The Administrative, Teacher, Student, and Parent experiences share one permission-scoped inbox, unread state, and authoritative publishing workflow. Email, SMS, web push, and mobile push remain optional future adapters.

### Phase 18 — Attendance Operations, Manual Check-In & Exception Handling

Extend the authoritative Attendance domain from Phases 8, 9, and 14 for forgotten, lost, damaged, missing, or unreadable credentials; reader/camera failures; new people awaiting credentials; late arrivals; authorized manual check-in; exception handling; and administrative correction. Plan least-privilege identity lookup by Student/Employee Number or name, exposing only verification fields. Manual captures must record operator, terminal, timestamp, method/source, reason where required, synchronization state, and audit event while retaining duplicate protection, authorization, offline tolerance, and idempotency.

```text
QR Scan ──────────────┐
RFID Scan ────────────┤
Manual Check-In ──────┼──► Authoritative Attendance Service ──► Attendance Record ──► Audit Trail
Offline Queue ────────┤
Admin Correction ─────┘
```

## Initial MVP completion sequence

The initial MVP consists of the implemented platform through Phase 18 and the planned platform-completion work in Phases 24–29.

```text
Phase 17 — Notification Center (Completed)
        ↓
Phase 18 — Attendance Operations / Manual Check-In (Completed)
        ↓
MVP operational checkpoint
        ↓
Phase 24 — Events and Calendar Experience (Completed)
        ↓
Phase 25 — Reporting and Analytics Expansion (Completed)
        ↓
Phase 26 — Security Hardening (Completed)
        ↓
Post-Phase-26 — Authentication Identity Stabilization (Completed)
        ↓
Phase 27 — PWA Optimization (Completed)
        ↓
Phase 28 — Operational Administration (Completed)
        ↓
Phase 29 — Super App Integration Polish (Completed, including the Security & Access, grouped Administration navigation, and single-institution/external-school architecture correction extensions)
        ↓
Post-Phase-29 — End-to-End Admissions Stabilization (Completed)
        ↓
Post-Phase-29 — Attendance Date Filtering Correction (Completed)
        ↓
Post-Phase-29 — Attendance Terminal True Offline-First Hardening (Implemented; installed-PWA shutdown/recovery acceptance pending)
        ↓
Initial MVP (Completed)

Phases 19–23 → Deferred — Post-MVP
```

Phases 24–29 must operate only against domains that actually exist. They must not create placeholder Clinic, Library, Laboratory, Credits, or Canteen functionality. Events and Calendar integrates the implemented Admin and portal experiences plus Notifications. Reporting covers implemented domains only. Security Hardening prioritizes the implemented authentication, RBAC, Student/Guardian, Grades, Attendance, public Registration, uploads, portals, Notifications, and terminal attack surface. PWA, Operational Administration, and Integration Polish likewise apply only to the implemented MVP.

The deferred modules remain governed by the permanent Multi-Experience Super App architecture, shared authentication and RBAC, authoritative identities, centralized APIs, shared credentials where applicable, domain ownership, and the MMSC design system.

## Key dependencies

```text
Registration & Admissions (Phase 15)
        ↓
Student / Guardian / Enrollment
        ↓
Parent Portal (Phase 16)
        ↓
Notification Center (Phase 17)

Attendance Foundations (Phases 8–9)
        ↓
Attendance Terminal (Phase 14)
        ↓
Attendance Operations / Manual Check-In (Phase 18)

MMSC Credits (Phase 22 — Post-MVP)
        ↓
Canteen / Cafeteria (Phase 23 — Post-MVP)
```

The Parent Portal begins with domains already available and expands without waiting for every later module:

```text
Parent Portal
   ├── Grades                 Available
   ├── Attendance             Available
   ├── Enrollment             Available
   ├── Notifications          Phase 17
   ├── Clinic                 Phase 19 — Completed Post-MVP expansion
   ├── Library                Phase 20 — Post-MVP
   ├── MMSC Credits           Phase 22 — Post-MVP
   ├── Canteen Transactions   Phase 23 — Post-MVP
   └── Events                 Phase 24
```
> 2026-08-26 trusted Attendance PWA note: trusted browser installations are now registered with one-time codes, independently assigned/revoked, and persisted separately from operator authentication and connectivity. Automated implementation checks passed; managed installed-PWA outage/restart/reader acceptance remains pending. No next phase was started.
> 2026-08-27 Phase 20 completion note: all seven Library groups are complete, including dashboard analytics, eight bounded reports, filtered CSV export, audit/RBAC hardening, portal relationship security, and final regression coverage. Deferred advanced Library and financial features were not started.
