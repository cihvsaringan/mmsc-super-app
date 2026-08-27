# Phase 21 — Computer Laboratory Management, Group 4

**Status:** Implemented in source on 2026-08-27. Migrations 0055–0057 and database-backed acceptance remain pending explicit authorization. Phase 21 remains In Progress; Group 5 has not started.

## Delivered

Migration `0057_computer_lab_group4_issues_maintenance.sql` creates separate issue and maintenance entities. Issues retain controlled category, priority and lifecycle, authenticated reporter, optional authoritative Employee assignment, timestamps, resolution/cancellation information, and laboratory/workstation scope. Maintenance records retain controlled type, actual performer, exact decimal cost, parts/materials, advisory next-maintenance date, and an optional compatible issue link.

The server enforces a controlled reported, acknowledged, in-progress, resolved, closed or cancelled lifecycle. Resolution and cancellation require meaningful notes. Workstation/laboratory and maintenance/issue relationships are validated transactionally. Maintenance does not resolve its issue by default; the optional combined operation is atomic and audited. Workstation `last_maintenance_date` uses the later of its existing value and actual performed date.

Issue reporting can explicitly place a workstation into maintenance or offline state. The operation blocks when an active Student session occupies it and never terminates that session. Closing an issue does not automatically make the workstation available.

The portal adds a responsive Issues & Maintenance workspace with Issues and Maintenance History tabs, bounded search/filter lists, priority/status badges, modal creation, authoritative Employee assignment, and explicit valid lifecycle actions.

## Verification

- Migration authored in repository order and not applied because the configured database remains unconfirmed.
- API/web TypeScript and lint passed.
- Focused schema/RBAC tests passed: 2 files, 8 tests.
- Full suites, builds, and database-backed acceptance are recorded after the final verification run.

Phase 21 Group 4 is complete in source. The next planned group is Phase 21 Group 5, but it has not been started.
