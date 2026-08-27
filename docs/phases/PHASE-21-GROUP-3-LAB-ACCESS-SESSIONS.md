# Phase 21 — Computer Laboratory Management, Group 3

**Status:** Implemented in source on 2026-08-27. Database application and database-backed acceptance remain pending explicit authorization. Phase 21 remains In Progress; Group 4 has not started.

## Delivered

Migration `0056_computer_lab_group3_sessions.sql` defines durable scheduled, walk-in, and special-event sessions. Partial unique indexes enforce one active session per Student and workstation. Sessions are completed or cancelled, never deleted; expected end, approval actor, cancellation reason, and narrow override reason are retained.

The API reuses the centralized credential resolver for Student RFID and Barcode values, preserves scanner normalization, validates an active credential plus an authoritative active School Year enrollment, and never stores or logs the raw credential. Access is evaluated using Asia/Manila school-local time and Group 2 recurrence. Maintenance blocks access; a matching class produces scheduled access; another section or reservation requires the distinct override permission; current events permit special-event usage; otherwise walk-in policy, approval, maximum duration, next-schedule cutoff, and a conservative 60-minute fallback apply.

Session start is transactional and revalidates identity, enrollment, laboratory state, schedule, timing, and workstation occupancy. PostgreSQL uniqueness is the final race-condition guard. Ending or cancelling releases derived occupancy without changing workstation `operational_status` to `in_use`. Central audit events cover starts, override starts, ends, and cancellations.

The Lab Sessions page provides scan-and-Enter, Student/access context, a workstation grid, controlled purpose and approval, permission-gated override, active sessions with expected/overdue state, lifecycle actions, and recent history. Computer Laboratory sessions remain independent usage records and never update official Attendance.

## API and authorization

`/api/v1/computer-lab/sessions` provides context, credential resolution, derived workstations, paginated list, detail, start, override start, end, and cancel. All routes require `computer_lab.access`; reads use `computer_lab.sessions.view`, operations use `computer_lab.sessions.manage`, and overrides additionally use `computer_lab.sessions.override`. Administrators receive all three; Computer Laboratory Staff receive view/manage only.

## Verification

- Migration authored after 0055 but not applied because the configured database has not been confirmed as an authorized local/test target.
- API and web TypeScript checks passed; API and web lint passed.
- Focused schema/RBAC suite passed: 2 files, 9 tests. Full API suite passed: 60 files, 298 tests.
- Full web suite produced one pre-existing Library circulation timing failure (89/90 passed); that failing file passed 2/2 immediately in isolation.
- API and web production builds passed when redirected to fresh temporary output because the existing `dist` trees were locked by the host.
- Read-only migration check was attempted but the local TS runner failed before repository safety/database inspection with `uv_os_get_passwd` / `ENOMEM`. No migration was applied; database-backed transaction/concurrency acceptance remains pending.

Phase 21 Group 3 is complete in source. The next planned group is Phase 21 Group 4, but it has not been started.
