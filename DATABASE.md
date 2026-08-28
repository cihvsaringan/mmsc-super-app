# Database

## Registration availability and Admission document lifecycle

Migration `0062_registration_admissions_minor_enhancement.sql` adds `registration_periods`, keyed to `school_years`, with a partial unique index allowing only one enabled public period. Admission documents retain their existing application ownership and managed-storage key; `removed_at` and `removed_by` provide audited soft removal without deleting historical Admission records.

## Migration 0053 — Library reporting indexes

Migration 0053 adds partial returned-loan and completed-visit indexes plus a copy-status reporting index. These complement the existing normalized unique accession/barcode, partial active-loan, active due-loan, open-visitor, visitor analytics, and notification-dispatch uniqueness indexes. Reports remain derived and do not add summary tables, mutable overdue state, fines, or payments.

## Migration 0052 — Library overdue notification dispatches

Migration 0052 adds `library_notification_dispatches`, an append-only idempotency ledger linking an active/historical Library loan and one constrained reminder milestone to the ordinary Notification it created. A unique `(loan_id, trigger_key)` constraint prevents duplicate reminders. Overdue state itself remains derived from `library_loans` and the effective borrowing-policy grace period; no fines, payments, or duplicated patron tables are added.

## Migrations 0047–0048 — Library catalog and copies

Migration 0047 adds `library_accession_sequence`, reusable `library_classifications`, bibliographic `library_books`, and physical `library_book_copies`. Partial uniqueness protects active classification names/codes; case-insensitive functional unique indexes protect accession numbers and barcodes; lookup and aggregation indexes cover catalog and circulation preparation. Checks constrain publication year, copy number, condition, and status. Institution/kind validation triggers protect classification references. Migration 0048 aligns trigger failures with the standard invalid-relationship database error contract.

## Migration 0046 — Library Group 1 foundation

Migration 0046 creates `library_settings` keyed to the canonical `schools` row with constrained default loan days, maximum renewals, update attribution, and timestamps. It adds twenty granular Library permissions and the Library Administrator, Librarian, and Library Assistant system roles with least-privilege grants. Book, copy, loan, visitor, and patron tables are intentionally deferred; canonical Students, Employees, Users, and Credentials are not duplicated.

## Phase 19 Group 3 consultation transactions

Group 3 uses the existing Phase 19 schema without a new migration. Encounter completion locks the active encounter and atomically persists final disposition/time-out plus an optional canonical Guardian contact and optional follow-up. Dispensing retains active-encounter validation, unexpired FEFO lot selection, row locks, quantity safeguards, encounter-linked inventory transactions, and full rollback. Completed encounters and their interventions are never deleted.

## Migrations 0042–0043 — Clinic Student Health Records

Migration 0042 renames `clinic.ehr.view/manage` to `clinic.health_records.view/manage` in place, preserving permission identifiers and role relationships. It adds optimistic version/update metadata and recoverable archival to immunizations and physical examinations, plus update attribution/versioning to health alerts. Migration 0043 removes a temporary derived Guardian compatibility field; the final schema continues to consume canonical `guardians` and `student_guardians` records without duplicating them.

## Migration 0041 — Clinic Group 1 RBAC stabilization

`0041_clinic_group1_rbac_stabilization.sql` adds view-only `clinic.dashboard.view`, `clinic.appointment.view`, and `clinic.follow_up.view` permissions. Clinic Staff and Super Administrator receive these grants through `role_permissions`; no direct-user permission or application-assignment table is introduced.

## Migrations 0039–0040 — Application Access rollback

Migration `0039_application_access_registry.sql` introduced a generalized `applications` / `user_applications` registry that duplicated RBAC and caused valid existing users to lose portal routing. Because 0039 was already applied, immutable migration history is retained. Forward repair migration `0040_remove_application_access_registry.sql` first maps any Clinic assignment to the existing `clinic_staff` role, then removes both temporary tables. The final schema uses `roles`, `permissions`, `user_roles`, and `role_permissions`; `clinic.portal.access` gates `/clinic/*`.

## Migration 0038 — Clinic Management

`0038_clinic_management.sql` adds longitudinal student health profiles, alerts, immunizations, physical exams, encounters/interventions, appointments, follow-ups, canonical Guardian contact logs, settings, items, lots, and inventory transactions. Clinical history is appended instead of overwritten. Dispensing locks eligible lots and records consumption with the encounter in one transaction; check constraints prevent negative quantities and invalid workflow states.

## Migration 0037 — Attendance multi-session sequencing

Migration `0037_attendance_multi_session.sql` converts the existing Student campus and Employee daily attendance rows from one-row-per-day records into repeatable IN/OUT session rows. It removes the daily unique indexes, adds one-open-session-per-person/day partial unique indexes, and adds `attendance_direction` plus a person/day sequence index to the existing terminal event log. Existing attendance rows and terminal events are preserved.

> 2026-08-26 Administration incident: the local database stopped at migration 0035 while the rebuilt Administration repository queried migration-0036 relations. Migration 0036 was applied through the repository runner; terminal/device/token reads now succeed without altering attendance history.

## Migration 0036 — Attendance Terminal Web-2 rebuild

Migration `0036_attendance_terminal_web2_rebuild.sql` introduces `attendance_terminal_devices`, terminal-bound `attendance_terminal_provisioning_tokens`, `attendance_terminal_events.device_id`, and a partial unique `(device_id, client_event_id)` index. Historical attendance and terminal events are preserved. Earlier session/installation tables are migration-era history only and are not used by the authoritative runtime.

## Attendance Terminal device authorization

Migration `0034_attendance_terminal_device_authorization.sql` adds the unique nullable device-token digest, offline-enable flag, authorization state, provisioning/verification timestamps, and configuration version to terminal sessions. Active terminal/device uniqueness prevents two live authorizations for one installation. Disable/revoke ends matching active sessions and updates their authorization state.

The same migration permits credential-free `manual_verification` terminal events with a nullable credential digest. Such events must carry the cached canonical identity type and ID, remain device/session bound and idempotent, and are authoritatively revalidated during synchronization before attendance is recorded.

## Attendance Terminal manual credential source

Migration `0033_attendance_manual_credential_source.sql` extends the existing `attendance_terminal_events.scan_source` constraint with `manual_credential_test`. It does not create another attendance table or identity source. Manual test input retains the same terminal/session, client-event UUID, credential digest, authoritative resolution, attendance record, and idempotency path as reader scans.

## Attendance transaction date filtering

This correction adds no migration. Student and Employee transaction/history reads start from `student_attendance_records` and `employee_attendance_records` respectively, using the stored `attendance_date` for inclusive date filtering. Existing date, status, and identity/date indexes support these queries. Identity, Enrollment, and academic joins provide display and filter attributes but cannot add people without an attendance record.

## Academic Assignment identity and uniqueness

This extension adds no migration. Existing partial unique indexes prevent duplicate active curriculum rows, duplicate Teacher/role combinations, and multiple active primary Teachers for the same curriculum Subject and Section. Teacher reassignment updates `teaching_assignments.teacher_school_year_assignment_id`, increments `version`, and retains the assignment ID. Closed School Year curriculum and teaching records are historical and cannot be mutated through the repository.

## Grade Level canonical order

`grade_levels.sequence` is non-null, positive, and unique per active school by the existing schema and partial unique index. Ordered grade lists use `sequence ASC, name ASC, id ASC` at the query layer; no migration or hard-coded grade-name sequence is required.

## School Year lifecycle stabilization

This extension adds no migration. Existing `academic_terms.school_year_id`, `sections.school_year_id`, and `calendar_events.school_year_id` relationships remain authoritative, and the existing partial unique index allowing at most one non-archived Active School Year per school remains the final concurrency constraint. Activation also takes a school-scoped PostgreSQL advisory transaction lock and row locks before atomically changing the current Active year to Closed and the target Planned year to Active. Planned and Active years cannot be archived through the academic repository.

## Enrollment completion Student Numbers

Migration `0031_enrollment_completion_student_numbers.sql` adds `student_number_seq`, initialized above existing numeric Student Number suffixes. Enrollment completion consumes it inside the server transaction and relies on the existing active school/Student Number unique index for final enforcement. Sequence gaps after rollback are permitted; duplicate numbers and duplicate Student/School-Year Enrollments are not.

## Post-Phase-29 public Admissions stabilization

Migration `0030_public_admissions_stabilization.sql` permits a null `admission_status_history.actor_user_id` for genuine public applicant actions and adds a partial unique index over `(existing_student_id, school_year_id)` for active returning applications. Draft creation, guardian rows, initial history, and audit events share one transaction. PostgreSQL sequences continue to generate concurrency-safe `MMREG-YYYY-NNNNNN` application numbers.

## Phase 29 Administration navigation extension

No migration or data table is added. Multiple assignments continue to be represented by existing `user_roles` and `role_permissions` records on one `users` row, with authoritative Employee/Teacher/Student/Guardian relationships where required. The repeatable seed marker advances to `phase-29-ext-administration-navigation` without changing existing grants.

## Phase 29 Security & Access UI extension

The extension adds no migration or table. Existing `users`, `login_identities`, `roles`, `user_roles`, `role_permissions`, `audit_events`, `employees`, `students`, and `guardians` are composed into richer administrative read models. Portal activation time is the existing applicable `user_roles.assigned_at`; no derived status is persisted. Audit metadata remains server-side and is not included in the browser list response. The repeatable seed marker advances to `phase-29-ext-security-access-operations-ui` without changing grants.

## Phase 29 integration polish

Phase 29 adds no migration or domain table. The repeatable seed only advances `app_metadata` and `seed_executions` to `phase-29-super-app-integration-polish`; existing roles, permissions, authoritative identity links, and business records are unchanged.

## Phase 28 operational administration

Phase 28 adds no migration or operational snapshot table. Its control-plane query reads existing authoritative tables and release ledgers at request time. Session hygiene updates only `auth_sessions.revoked_at` for rows already expired or attached to an inactive/archived User and records the affected count in the existing immutable audit trail.

## Authentication identity stabilization

Migration `0021_authentication_identity_stabilization.sql` adds `login_identities`, `users.must_change_password`, `users.account_type`, sequence-backed `guardians.guardian_number`, global active alias uniqueness, per-user/type uniqueness, supporting indexes, and authoritative identifier synchronization triggers. Existing User password hashes are preserved. Two permissions separate account provisioning and administrative password replacement.

Migration 0020 adds terminal Campus, description, last-sync, `attendance_terminal_sessions`, and event-session linkage. Existing `(terminal_id, client_event_id)` uniqueness remains the duplicate-prevention boundary.

## Phase 24 calendar data reuse

No migration was required. Phase 24 uses the existing `calendar_events` table and its School, Campus, School Year, and Academic Term references established by migration `0004_academic_master_data.sql`. Archived events remain excluded, range queries use the existing school/date indexes, and portal reads expose published events only.

## Phase 18 attendance operations schema

Migration `0019_attendance_operations.sql` adds `attendance_manual_events` and immutable `attendance_manual_event_history`. Each event references one registered terminal and exactly one authoritative Student or Employee, preserves a client UUID for terminal-scoped idempotency, and records capture direction, reason, details, attendance status, result, authoritative attendance record reference, sync state, operator, and exception resolution. The history table is protected by the shared audit-mutation trigger. Student and employee attendance remain authoritative in their existing domain tables.

## Phase 17 notification schema

Migration `0018_notification_center.sql` adds `notifications`, `notification_targets`, `notification_recipients`, and immutable `notification_events`. Targets describe an audience; recipients preserve the exact deduplicated user set resolved when a draft is published. The recipient composite primary key prevents duplicate delivery across overlapping targets. Partial indexes support active inbox and unread-count queries, while expiration filters messages without deleting records.

## Phase 16 data reuse

No migration was required. Parent Portal ownership uses the existing `guardians.user_id` account link and active `student_guardians` relationships. Portal views read Student, Enrollment, academic assignments, published/locked gradebooks, Student Attendance, and published calendar events from their authoritative tables.

## Phase 15 public-registration extension

Migration `0017_public_registration.sql` extends the existing application entity with source, resume-token digest/expiry/revocation, privacy consent timestamp/version, and applicant response. It extends admission-document metadata with storage key, original filename, MIME type, and byte size. Public application references use the concurrency-safe `MMREG-YYYY-NNNNNN` sequence; UUIDs remain internal relational identifiers.

## Phase 15 Registration and Admissions

Migration `0016_registration_admissions.sql` adds `admission_applications`, `admission_guardians`, `admission_documents`, and immutable `admission_status_history`. Applications reference the authoritative School, School Year, Grade Level, optional Section, and optional existing Student. Placement integrity is enforced by trigger. Converted applications reference the resulting Student and Enrollment; application rows remain preserved as intake and decision history.

## Phase 14 attendance terminal

Migration `0015_attendance_terminal.sql` adds centralized `credentials`, registered `attendance_terminals`, and immutable `attendance_terminal_events`. Credentials store a SHA-256 digest and display suffix rather than the scannable secret. Terminal event IDs are unique per device and retain accepted or rejected sync receipts. Attendance records continue to be owned by the existing employee and student attendance tables.

Migration `0032_attendance_credential_offline_enhancement.sql` expands centralized credential lifecycle states, records last use/updater/replacement linkage, and adds incremental synchronization indexes. Terminal events retain normalized scan source (`rfid`, `qr_scanner`, `qr_camera`, `nfc`, or `barcode`), synchronization time, and observed clock offset. Existing active-digest uniqueness prevents concurrent cross-identity assignment; existing terminal/client-event uniqueness remains the offline retry idempotency boundary.

## Phase 13 data reuse

No new tables were added. The portal reads the existing Student, Enrollment, Academic Assignment, Student Attendance, Calendar Event, and published Grading records through authenticated ownership joins.

## Phase 12 grading

Migration `0014_grading_system.sql` owns grading periods, assignment gradebooks, enrollment grades, and immutable grade history. Database constraints and a trigger preserve academic scope and published history.

Migration `0037_grading_period_scope.sql` enforces the configured `School Year → optional Term → Grading Period` boundary. A linked Term must belong to the same School Year, and period dates must remain inside both the School Year and linked Term. Existing periods and gradebooks are preserved.

## Phase 11 data reuse

No new tables are required. The portal reads the authoritative chain `users → employees → teacher_profiles → teacher_school_year_assignments → teaching_assignments`, and reaches students only through matching Sections and Enrollments. Attendance and calendar records remain owned by their existing domains.

## Phase 0 schema

| Table | Purpose |
|---|---|
| `schema_migrations` | Applied migration name, immutable SHA-256 checksum, execution timestamp |
| `app_metadata` | Small keyed JSON metadata records with update timestamp |
| `seed_executions` | Idempotent seed execution ledger |

`schema_migrations` is created by the runner; migration `0001_foundation.sql` creates the other two tables. Each migration runs in a transaction and a changed already-applied migration is rejected.

No Employee, Teacher, Student, Guardian, Enrollment, School Year, role, permission, or account tables exist in Phase 0. Their relationships described in `AGENTS.md` are binding design constraints for later phases, not implemented schema.

## Phase 1 security schema

| Table | Purpose |
|---|---|
| `users` | Stable account identity, normalized email, password hash, active state, lockout counters, timestamps, optimistic version |
| `roles` | Named reusable role definitions with system/custom distinction and archival fields |
| `permissions` | Granular `<resource>.<action>` authorization grants |
| `user_roles` | Many-to-many account role assignments with assignment provenance |
| `role_permissions` | Many-to-many permission grants with grant provenance |
| `auth_sessions` | Hashed opaque sessions, expiry, revocation, last-seen, IP and user-agent metadata |
| `audit_events` | Append-only security and authentication event history |

All identities are UUIDs. Active emails and role/permission codes are unique. Foreign keys protect relationships, indexes cover account status, active sessions, role/permission reverse lookups, and audit timelines. An update/delete trigger makes `audit_events` immutable. Deactivating an account revokes all sessions transactionally. No Employee, Student, or academic tables are introduced.

Migration `0003_permission_code_segments.sql` broadens the permission-code constraint to support hierarchical resource names such as `security.user.view` while retaining lowercase dotted-segment validation.

## Phase 2 academic master-data schema

| Table | Purpose |
|---|---|
| `schools` | Organization identity and contact profile |
| `campuses` | School-owned physical locations |
| `school_years` | First-class historical/current academic-year boundaries and lifecycle |
| `academic_terms` | Ordered, dated academic terms within a school year; a Term is not itself a Grading Period |
| `departments` | Academic, administrative, and support organizational units |
| `grade_levels` | Ordered education stages owned by the school |
| `sections` | Year-specific grade-level groups assigned to a campus |
| `subjects` | Reusable school subject catalog with optional department ownership |
| `classrooms` | Campus room inventory and capacity |
| `academic_statuses` | Configurable status labels for future academic lifecycles |
| `calendar_events` | School/campus/year/term-aware calendar and event records |

Migration `0004_academic_master_data.sql` adds UUID keys, ownership foreign keys, date/range checks, status constraints, active-record uniqueness, query indexes, archival timestamps, and optimistic `version` columns. Only one non-archived school year may be active per school. No fabricated school year is seeded.

## Phase 3 workforce schema

| Table | Purpose |
|---|---|
| `positions` | School-owned workforce positions with optional department ownership |
| `employee_types` | Configurable employment classifications |
| `employees` | Permanent employee identity, organization placement, contacts, address, and current employment state |
| `employee_emergency_contacts` | Archived emergency-contact history with one active primary contact |
| `employee_identifiers` | Separately authorized government/administrative identifiers |
| `employee_status_history` | Append-only employment lifecycle history |
| `employee_documents` | Protected document metadata and external-storage reference foundation |

Migration `0005_hris_core.sql` adds UUID keys, organization foreign keys, active-record uniqueness, search indexes, constrained lifecycle values, timestamps, versions, and archival fields. The status-history immutability trigger rejects updates and deletes. No Employee is a Teacher in this phase; that specialization remains Phase 4.

## Phase 4 teacher-management schema

| Table | Purpose |
|---|---|
| `teacher_profiles` | One-to-one teaching specialization of a permanent employee |
| `teacher_subject_qualifications` | Teacher capability linked to the shared subject catalog |
| `teacher_school_year_assignments` | Year-scoped faculty status, department, advisory/homeroom placement, and maximum-load foundation |

Migration `0006_teacher_management.sql` adds unique employee specialization, teacher-number uniqueness, faculty-status constraints, academic foreign keys, advisory/homeroom uniqueness, indexes, timestamps, versions, and archival fields. Actual class/subject assignments are intentionally absent until Phase 7.

## Phase 5 student-information schema

| Table | Purpose |
|---|---|
| `students` | Permanent student identity, protected LRN, contacts, address, entry data, and current lifecycle status |
| `guardians` | Independent reusable guardian identity and contacts |
| `student_guardians` | Typed many-to-many student relationships, custody, primary contact, and communications authority |

Migration `0007_student_information_system_core.sql` adds school/account foreign keys, 12-digit LRN validation and uniqueness, student-number uniqueness, guardian search indexes, typed relationships, one active primary guardian, timestamps, versions, and archival fields. It intentionally adds no school-year, grade-level, or section placement; those belong to Phase 6 Enrollment.

## Phase 7 academic assignment schema

Migration `0010_academic_assignments.sql` adds `subject_grade_level_assignments` and `teaching_assignments`. Curriculum is school-year scoped with an optional term, load units, and required/elective designation. Teaching assignments reuse `teacher_school_year_assignments` and sections; the service enforces matching school year and grade, while partial unique indexes prevent duplicate curriculum and multiple active primary teachers for one section-subject combination.

## Phase 8 employee attendance schema

Migration `0011_employee_attendance.sql` adds `employee_attendance_records`, `employee_attendance_correction_requests`, and immutable `employee_attendance_adjustments`. It enforces one active employee/day record, valid time ranges, allowlisted statuses/sources, nonnegative late minutes, source-event idempotency, correction workflow states, and indexed date/status/history access.

## Phase 9 student attendance schema

Migration `0012_student_attendance.sql` adds `student_attendance_records` and immutable `student_attendance_adjustments`. Records reference Enrollment, enforce one active enrollment/date/scope identity, validate time/status/source and terminal idempotency, and reserve class scope through a matching teaching assignment. A trigger enforces enrollment status and year/section class integrity.

## Phase 10 administration schema

Migration `0013_reporting_and_administration.sql` adds `application_settings` with optional school ownership, dotted stable keys, JSON values, public/restricted classification, active-scope uniqueness, timestamps, versions, and archival. Dashboard/report totals are query-time read models and create no aggregate tables.

## Phase 6 enrollment schema

| Table | Purpose |
|---|---|
| `enrollments` | One preserved student/school-year placement with grade, optional section, lifecycle, completion/promotion, transfer/withdrawal, remarks, and optimistic version |

Migration `0008_enrollment_academic_history.sql` enforces one enrollment per student and school year, dates and completion consistency, academic foreign keys, query indexes, and a placement-integrity trigger that requires active same-school student/year/grade data and a matching section. Enrollment records are not destructively deleted; cancellation is a lifecycle status.

## Phase 6 managed-media extension

Migration `0009_managed_profile_media.sql` adds reusable `media_assets` metadata and optional Employee/Student profile-photo asset references. Domain rows store a stable asset ID; media rows store deployment-neutral profile and thumbnail keys. Existing legacy URL columns remain temporarily readable for compatibility, but new writes no longer accept or persist full URLs. Owner-level profile-photo resolution returns an empty success response when no asset is assigned; absence of a photo is a normal optional state rather than an API error.

## Strategy

Use PostgreSQL relational integrity, stable identifiers, timestamps, foreign keys, unique constraints, purposeful indexes, transactions, and archival where history matters. Migration files are ordered, forward-only, reviewable SQL. Destructive production schema changes must include a recovery plan.

## Local student lifecycle reset

`db:reset:student-lifecycle` performs a targeted development/test purge using the actual foreign-key order. It temporarily disables only the named immutable triggers required to delete lifecycle-owned history, restores them inside the same transaction, validates zero target counts, and verifies unchanged retained baselines before commit. It does not truncate tables, reset sequences, or recreate Student data.

`audit_events` remains untouched. Student and Guardian Users with historical audit actor references are stripped of sessions, login identities, and roles, then set inactive and archived instead of being physically deleted. This preserves immutable audit attribution while leaving zero active Student/Guardian accounts. Exact Admission document and Student profile media keys are captured before commit and removed through the storage provider afterward; shared Employee media causes an abort.
# Post-Phase 29 academic structure correction

Migration `0022_institution_external_schools.sql` adds `schools.is_primary`, with a partial unique index allowing only one live primary institution, and marks code `MMSC` primary. It creates versioned, searchable `external_schools` records with optional DepEd identifiers and active/archive lifecycle.

Nullable `previous_school_id` foreign keys augment `admission_applications` and `students`. Backfill normalizes exact case-insensitive legacy names without deleting `previous_school`; compatibility triggers resolve exact names on later writes and copy a name when only an identifier is supplied. Referential deletion is restricted.
## Trusted Attendance PWA installation

Migration `0035_attendance_terminal_trusted_pwa.sql` adds `attendance_terminal_installation_codes` and `attendance_terminal_installations`, links terminal sessions to installations, and adds installation view/manage permissions. Registration codes and installation credentials are stored only as digests. Installation rows retain lifecycle, assignment, heartbeat, synchronization, queue-counter, version, and revocation metadata; logical terminal records remain separate.
## Migration 0044 — Clinic appointments and portal-safe releases

Migration 0044 adds optimistic versioning and archival/update metadata to appointments and follow-ups, and introduces `clinic_portal_releases` as the explicit, allowlisted safe-summary boundary for Student/Guardian delivery. Releases reference canonical Students and at most one Clinic source record; notification recipients remain in the shared notification domain.
## Migration 0045 — Clinic administration and reporting performance

Migration 0045 adds optimistic versions to Clinic settings and item masters, update attribution for item masters, and indexes for inventory history, encounter reporting, and appointment reporting. Stock movements lock their selected lot, reject negative results, update remaining quantity, append a `clinic_inventory_transactions` record, and audit non-sensitive movement metadata in one transaction.

## Phase 19 validation and seed contract

Phase 19 finishes at migration 0045 (39 applied migrations). The repeatable API seed loads the repository-root `.env` independently of package working directory and hashes bootstrap login identities with PostgreSQL-portable SHA-256 input typing. `validate-phase19-fresh.ts` creates only the exact local disposable database `mmsc_phase19_validation`, runs migrations, seed, demo reset, demo invariants, and real Clinic inventory acceptance, then drops that database in a `finally` block. `verify-phase19-existing.ts` performs read-only validation of the populated database.
## Migration 0049 — Library patrons and circulation

Migration 0049 creates `library_loans` with mutually exclusive canonical Student/Employee references, copy and operator foreign keys, lifecycle timestamps, renewal history, explicit override capture, optimistic versioning, and a partial unique index enforcing one active loan per physical copy. Patron data and credentials remain in their authoritative tables; Teacher is derived from `teacher_profiles`.
## Migration 0050 — Library borrowing policies

Migration 0050 extends `library_settings` with default maximum-active-loan, grace-period, and overdue-borrowing fields. `library_borrowing_policies` provides exactly one optional override slot per school and patron type with constrained limits, durations, renewals, grace, attribution, and timestamp. No fine or payment tables are introduced.
## Migration 0051 — Library visitor sessions

Migration 0051 adds canonical patron references, entry/exit operators and methods, reporting snapshots, lifecycle timestamps, open-session uniqueness, and reporting indexes. Duration remains computed.
# Phase 21 Group 1 — Computer Laboratory

Migration `0054_computer_lab_group1.sql` adds `computer_laboratories` and `computer_lab_workstations`. Laboratories reference `campuses`; workstations reference laboratories with restrictive deletion. Active listing indexes and scoped unique constraints support campus laboratory codes and per-laboratory workstation codes. Both use `archived_at`; workstation `in_use` is intentionally not persisted.
# Phase 21 Group 2 — Laboratory scheduling

Migration `0055_computer_lab_group2_scheduling.sql` adds `computer_lab_schedules`. It uses date plus local `time` fields for Asia/Manila school-wall-time scheduling, bounded `one_time`/`weekly` recurrence, authoritative School Year and Teaching Assignment foreign keys for classes, active/cancelled lifecycle, and range/access indexes. Migration application is pending explicit database authorization.

# Phase 21 Group 3 — Laboratory sessions

Migration `0056_computer_lab_group3_sessions.sql` adds authoritative Student/laboratory/workstation usage sessions with optional schedule, controlled purpose, approval, expected end, cancellation, and override data. Partial unique indexes enforce at most one active session per Student and workstation. Occupancy is derived; `in_use` remains absent from workstation operational status. Migrations 0055–0056 remain unapplied pending confirmation of an authorized database target.
# Phase 21 Group 4 — Issues and maintenance

Migration `0057_computer_lab_group4_issues_maintenance.sql` creates separate `computer_lab_issues` and `computer_lab_maintenance_records` tables with restrictive foreign keys, controlled classifications and lifecycle constraints, exact numeric cost, operational/history indexes, archival fields, and granular RBAC. Workstation last-maintenance is only a monotonic summary of authoritative maintenance history. Migrations 0055–0057 remain unapplied pending authorization.
# Phase 21 Group 5 — Equipment and peripherals

Migration `0058_computer_lab_group5_equipment.sql` adds `computer_lab_equipment` and `computer_lab_equipment_transfers`. Current assignment and physical condition are separate constrained values. Workstation assignments require matching current laboratory references at the service boundary; immutable transfer rows make moves directly queryable. Equipment code is globally unique, while non-null active asset and serial identifiers use case-insensitive uniqueness.

# Phase 21 Group 6 — Software and configuration

Migration `0059_computer_lab_group6_software.sql` adds `computer_lab_software` and `computer_lab_workstation_software`. Catalog rows hold non-secret administrative metadata; active workstation/software pairs are unique through a partial index. Assignment removal is archival, and expected version plus manual configuration status remain separate from any future observed endpoint state.

# Phase 21 Group 7 — Reporting support

Migration `0060_computer_lab_group7_reporting_polish.sql` adds dashboard/report RBAC and targeted indexes for bounded session, issue, warranty, and license-expiration queries. Dashboard and report values are derived directly from Groups 1–6; no duplicate summary tables are introduced.
