# Phase 21 Group 7 — Dashboard, Reports & Integration Polish

Status: implementation complete in source on 2026-08-28. Database migration and authenticated runtime acceptance remain pending.

Migration `0060_computer_lab_group7_reporting_polish.sql` registers dashboard/report permissions and adds indexes matching session, issue, warranty, and license-expiration report queries. It has not been applied because the configured database is not confirmed as an authorized local/test target.

The dashboard derives workstation occupancy exclusively from active Computer Laboratory Sessions. It shows laboratories, active-capacity workstations, available, in-use, maintenance and offline counts, active sessions, today's walk-ins, current laboratory usage, upcoming one-time/weekly schedule occurrences, and bounded actionable alerts. Alert sources include critical unresolved issues, overdue sessions, lost/maintenance equipment, 30-day equipment warranty and software license expiration, and manually marked missing/needs-update software.

Reports are bounded server-side to a maximum 366-day range and default to the current month in the UI. Detailed JSON results use limit/offset pagination. CSV reuses the shared quoted-cell export pattern, honors filters, requires `report.export`, and is capped at 5,000 rows. Implemented reports: laboratory utilization, workstation utilization, scheduled/walk-in/special-event mix, Student usage, section usage, subject usage, issues, maintenance, equipment inventory, and software inventory. Durations are truthful session-hours; no open-hours utilization percentage is invented.

Group 5 follow-ups are complete: Equipment now has visible server paging, page reset on filters/search, a workstation filter, and a metadata-edit modal. Assignment/location fields remain absent from metadata updates and still require transactional Transfer/Reassign.

The final portal order is Dashboard, Laboratories, Workstations, Schedule, Lab Sessions, Issues & Maintenance, Equipment, Software, Reports. Existing shared controls, tables, badges, modals, loading, empty, error, and responsive patterns are reused. Software configuration remains manually maintained expected state, never automatic endpoint observation.

Official Student Attendance remains untouched. No endpoint agent, discovery, remote management, deployment, automatic maintenance issue, notification subsystem, procurement, or new major domain was introduced.

## Verification

- Focused Group 7 validation/RBAC/CSV tests passed: 7 tests across 2 files.
- Full API regression passed: 333 tests across 68 files.
- Full web regression passed: 90 tests across 29 files.
- API and web typechecks passed.
- Full API and web lint passed.
- API and web production builds passed using isolated output directories. The web build emitted only the existing chunk-size advisory.
- Migration-state check was attempted and again stopped before project code by the host `tsx` `uv_os_get_passwd` / `ENOMEM` failure; no migration was applied.
- Authenticated browser and end-to-end database acceptance remain pending an authorized migrated environment and credentials.
