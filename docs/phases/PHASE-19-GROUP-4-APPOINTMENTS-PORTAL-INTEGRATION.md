# Phase 19 — Group 4: Appointments, Follow-ups, Alerts, and Portal Integration

Status: Completed on 2026-08-27. Phase 19 remains In Progress; Group 5 has not been started.

## Delivered

Clinic staff can create, view, edit, reschedule, cancel, mark missed, complete, and start encounters from appointments. Appointment-to-encounter and follow-up-to-encounter operations are transactional and idempotent: an existing linked encounter is returned instead of creating a duplicate. Follow-ups support due dates, edits, due/overdue presentation, cancellation, completion, and linked completion encounters.

The Dashboard exposes actionable severe-health, follow-up, low/out-of-stock, near-expiry, and expired-stock alerts. Appointment and follow-up screens use the Clinic operational layout and Administration form/modal conventions.

## Privacy-safe portal integration

Migration 0044 introduces an explicit `clinic_portal_releases` model. Clinic staff deliberately write a safe title, summary, optional released instructions, audience, and allowlisted notice category. Internal encounter/EHR notes are never used as portal output. Publishing reuses shared Notifications and creates audience-specific recipients and `/student/clinic` or `/parent/clinic` links. Guardian delivery and reads use active canonical Student–Guardian relationships; unrelated Guardians receive no record.

Publishing requires both the Clinic-wide `clinic.portal.access` boundary and `clinic.notifications.send`. Student and Parent APIs return published safe-release columns only and never return assessment, internal notes, audit data, or unrestricted EHR.

## Verification

- Migration 0044 was applied to the configured local database; all 38 migration files validated afterward.
- API and web TypeScript validation and production builds passed.
- API tests passed: 48 files, 222 tests. Web tests passed: 21 files, 74 tests.
- Targeted coverage includes Clinic RBAC, appointment create/reschedule/start, dedicated notification authorization, Student safe visibility, Guardian child scoping, unrelated-Guardian denial, and internal-content exclusion.
- API lint passed. Web lint passed with no errors and retains one pre-existing `Assignments.tsx` hook-dependency warning.

Phase 19 Group 4 is complete. Phase 19 Group 5 is planned, but it has not been started.
