# Phase 21 Group 6 — Software & Configuration

Status: Implemented in source on 2026-08-28. Migration execution and authenticated runtime verification remain pending an explicitly confirmed local/test database.

Migration `0059_computer_lab_group6_software.sql` adds a lightweight Computer Laboratory software catalog and workstation configuration relation. These records describe manually maintained expected/configured state only. They do not represent automatic discovery, endpoint verification, deployment, patching, remote access, or policy enforcement.

The catalog stores controlled category, lifecycle, license type, optional positive license count and expiration, safe non-secret references, default version, and notes. Product keys, credentials, activation secrets, scripts, and arbitrary configuration blobs are not modeled. Workstation assignments store a flexible expected version plus one of `expected`, `installed`, `needs_update`, `missing`, or `not_applicable`; these states are explicitly manual.

Active `(workstation_id, software_id)` assignments are unique. Assignment creation transactionally revalidates active software and a non-archived, non-retired workstation in a non-archived laboratory. Retired software blocks new assignments but preserves existing records. Workstation retirement is not blocked by software records. Removal archives the assignment, while restore revalidates both sides and prevents an active duplicate.

License allocation is informational. For `per_device` software with a recorded count, the API and UI show an over-configuration warning after assignments exceed that count; they do not delete assignments or claim legal compliance. Other license models show recorded counts conservatively without pretending one assignment always consumes one legal license.

The Software Catalog workspace provides server-side search, controlled filters, paging, add/edit/detail workflows, explicit workstation assignment, manual configuration editing, removal, coverage/status counts, and responsive operational layouts. Workstation details show physical Assigned Equipment and Software & Configuration as separate sections.

Group 5 follow-up review: the Equipment API remains bounded, but dedicated UI paging controls and its metadata-edit modal were not folded into Group 6 because the current compressed component requires a broader UI rewrite than this lightweight group warrants. They remain documented follow-ups; assignment/location fields still cannot bypass Transfer/Reassign through the API.

## Verification

- Migration source authored but not applied because database target authorization remains unconfirmed.
- Backend and frontend typechecks passed.
- Focused schema and route tests passed: 11 tests across 2 files.
- Full API regression passed: 326 tests across 66 files.
- Full web regression passed: 90 tests across 29 files.
- Full API and web lint passed.
- API and web production builds passed using isolated output directories.
- Migration-state check was attempted but the local `tsx` runtime failed before project code with `uv_os_get_passwd` / `ENOMEM`; no migration was applied.
- Authenticated browser and portal-switcher verification remain pending database application and available credentials.

Group 7 Dashboard and Reporting, automatic endpoint agents/discovery, remote management, deployment, patching, software installation, secrets storage, automated Issues, and bulk assignment were not implemented.
