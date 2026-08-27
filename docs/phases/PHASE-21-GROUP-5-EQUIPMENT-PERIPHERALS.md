# Phase 21 — Computer Laboratory Management, Group 5

**Status:** Implemented in source on 2026-08-28. Migrations 0055–0058 and database-backed acceptance remain pending explicit authorization. Phase 21 remains In Progress; Group 6 has not started.

## Delivered

Migration `0058_computer_lab_group5_equipment.sql` creates a Computer Laboratory-specific equipment registry and durable transfer history. Equipment remains distinct from operational workstations and from Group 4 issues/maintenance. The controlled model separates physical condition from assignment/lifecycle state, supports optional asset and serial identifiers, stores warranty and purchase dates, and keeps retired/lost equipment historically visible.

Every creation records an initial transfer. Every later assignment change uses one transactional transfer operation that validates the destination, captures the prior state, updates current assignment, inserts queryable history, and writes a central audit event. Workstation assignments require a matching non-archived, non-retired workstation and laboratory. Retired/lost equipment clears current location and cannot be reassigned. Generic metadata edits cannot mutate assignment fields.

Workstation retirement is blocked while active equipment remains assigned. The error tells the operator to transfer or retire those items first. Group 4 remains laboratory/workstation scoped; equipment-specific issue and maintenance targets are deliberately deferred rather than forcing an incompatible schema change.

The Equipment workspace provides bounded server search and filters, concise current assignment, condition/status badges, add and explicit transfer modals, detail history, permission-scoped actions, and responsive tables. Workstation details include a concise Assigned Equipment section linked to the equipment workspace. Complete desktop seats remain `computer_lab_workstations`; the equipment registry covers laptops and physical peripherals/components around them.

## Verification

- Migration authored in repository order and not applied because the configured database remains unconfirmed.
- API/web typechecks and lint passed.
- Focused schema/RBAC tests passed: 2 files, 9 tests.
- Full API suite passed: 64 files, 315 tests. Full web suite passed: 29 files, 90 tests.
- API and web production builds passed using fresh temporary output directories because existing build trees are host-locked.
- Database-backed acceptance remains pending because migrations 0055–0058 were not applied to the unconfirmed target.

Phase 21 Group 5 is complete in source. The next planned group is Phase 21 Group 6, but it has not been started.
