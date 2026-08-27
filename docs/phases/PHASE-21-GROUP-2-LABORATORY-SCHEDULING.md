# Phase 21 — Computer Laboratory Management, Group 2

**Status:** Implemented on 2026-08-27; database application remains pending explicit authorization. Phase 21 remains In Progress; Group 3 has not started.

## Delivered scope

Migration `0055_computer_lab_group2_scheduling.sql` defines `computer_lab_schedules` for `class`, `reservation`, `event`, and `maintenance_block` records. Active/cancelled lifecycle, one-time/weekly recurrence, bounded dates, time ordering, laboratory ownership, creator/updater identity, historical retention, and query indexes are database constrained.

Class schedules reference the authoritative School Year and Teaching Assignment. Teacher, Section, Subject, and display names are joined from Academics/Workforce and are not duplicated. Class occurrence dates must remain within the School Year. Normal schedules require an active, non-archived laboratory; maintenance blocks require a non-archived laboratory and do not change its operational status.

## Conflict model

The transactional save boundary takes a laboratory-scoped advisory lock, expands a maximum 370-day recurrence into actual school-local dates, and uses open interval overlap (`new_start < existing_end AND new_end > existing_start`). It rejects overlapping active records for the same laboratory, authoritative teacher, or authoritative section. Cancelled records do not participate. Updates exclude their own record.

## Portal and API

The existing Computer Laboratory shell now includes Schedule. The responsive page offers week/list views, bounded week navigation, filters, type-specific modal fields, authoritative Teaching Assignment selection, status/type styling, editing, and cancellation. The route namespace keeps the Computer Laboratory experience active.

APIs under `/api/v1/computer-lab` provide schedule context, bounded listing, details, create, update, and cancellation. Both `computer_lab.access` and granular `computer_lab.schedule.view/manage` authorization are enforced. Cancellation is intentionally one-way in Group 2; staff can create a replacement schedule when needed.

## Verification status

- API/web TypeScript checks passed.
- API: 58 files and 289 tests passed. Web: 29 files and 90 tests passed.
- Targeted scheduling recurrence, time validation, adjacency, and RBAC tests passed: 2 files, 8 tests.
- API/web lint passed; the two pre-existing hook dependency warnings remain in Assignments and Clinic Inventory.
- API and web production builds passed.
- Migration application was requested but blocked by the safety reviewer because the configured database target could not be independently confirmed as local/authorized. It was not bypassed.
- Final full-suite, lint, and production-build results are recorded after the completion gate.

No scanning, sessions, walk-ins, occupancy, maintenance workflow/history, equipment, software, terminal, monitoring, or remote-control functionality was implemented.

Phase 21 Group 2 implementation is complete. The next planned group is Phase 21 Group 3, but it has not been started.
