# Phase 21 — Computer Laboratory Management, Group 1

**Status:** Completed on 2026-08-27. Phase 21 remains In Progress; later groups have not started.

## Delivered scope

The dedicated `/computer-lab/*` experience provides permission-filtered Laboratories and Workstations pages using the shared session, route-derived Portal Switcher, MMSC design tokens, reusable modal, structured API errors, responsive operational tables, filters, search, and bounded pagination.

Migration `0054_computer_lab_group1.sql` adds `computer_laboratories` and `computer_lab_workstations`. Laboratories reference authoritative active Campuses and store controlled operational state, positive capacity, location, notes, and future walk-in policy configuration. Workstations reference a non-archived laboratory and store operational, asset, network, hardware, purchase, warranty, and maintenance metadata. Codes are unique per campus/laboratory. Both domains use archival timestamps; workstations additionally support `retired`. No persistent `in_use` state exists.

## Security and audit

Six `computer_lab.*` permissions gate portal entry and lab/workstation view/manage operations. Computer Laboratory Administrator receives all six permissions; Computer Laboratory Staff receives portal and read access; Super Administrator receives all Computer Laboratory permissions. Every endpoint requires `computer_lab.access` plus its granular permission.

Centralized audit events are `computer.lab.created`, `computer.lab.updated`, `computer.lab.archived`, `computer.lab.restored`, `computer.workstation.created`, `computer.workstation.updated`, `computer.workstation.retired`, `computer.workstation.archived`, and `computer.workstation.restored`.

## Verification

- 48 migration files validated and migration 0054 applied successfully.
- API and web TypeScript checks passed.
- API: 56 test files and 281 tests passed. Web: 29 test files and 90 tests passed. The final targeted Phase 21 set passed 3 files and 16 tests.
- API and web lint passed; two pre-existing React hook dependency warnings remain in Assignments and Clinic Inventory.
- API and web production builds passed.
- Automated route-state coverage verifies the Computer Laboratory namespace remains selected. An authenticated browser walkthrough was not performed because no authorized Computer Laboratory login credential was available to the session.

No scheduling, lab sessions, scanning, occupancy, maintenance workflow, equipment/peripheral inventory, software inventory, reports, monitoring, blocking, or remote-control functionality was implemented.

Phase 21 Group 1 is complete. The next planned phase is Phase 21 Group 2, but it has not been started.
