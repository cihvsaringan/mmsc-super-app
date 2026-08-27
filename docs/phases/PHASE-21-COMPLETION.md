# Phase 21 — Computer Laboratory Management Completion

Phase 21 implementation is complete in source. Runtime database migration and authenticated acceptance remain pending.

- Group 1: campus-scoped Laboratories, Workstations, walk-in policy, specialized portal, RBAC, and audit.
- Group 2: one-time/weekly class, reservation, event, and maintenance-block scheduling with authoritative assignment validation and conflict protection.
- Group 3: centralized Student credential resolution, scheduled/walk-in/special-event access, transactional workstation sessions, and derived occupancy separate from official Attendance.
- Group 4: Issues and Maintenance with Employee assignment, controlled lifecycle, exact costs, and active-session workstation protections.
- Group 5: physical Equipment/Peripherals with separate location and condition, explicit transactional transfers, durable history, paging, metadata editing, and retirement protection.
- Group 6: non-secret Software Catalog and manually maintained expected workstation configuration with conservative license warnings.
- Group 7: operational Dashboard, alerts, ten bounded reports, permission-protected CSV export, completed navigation, and integration polish.

Permanent invariants: `in_use` is never persisted; active Computer Laboratory Sessions alone determine occupancy. Sessions never write official Student Attendance. Equipment and software do not affect occupancy. Equipment location changes require transfer history. Software status is manual expected/configured state and never endpoint telemetry. Issue resolution does not silently make a workstation available. Maintenance blocks remain schedule records. Shared identities, Academic records, Employees, Students, credentials, RBAC, and audit remain authoritative platform domains.

Source migrations 0055–0060 remain unapplied against the currently unconfirmed database target. Database-backed acceptance, authenticated portal-switcher walkthrough, and the complete end-to-end operational scenario must be performed after explicit authorization and successful migration. This source-completion status is not a claim of production acceptance.
# Manual Testing Extension — RBAC and Workstation Compatibility (2026-08-28)

Lab Session lifecycle stabilization confirmed the canonical API was already `POST /sessions/:id/end` and `POST /sessions/:id/cancel`; the observed GET originated from a stale deployed web bundle. The current UI now has explicit, accessible End Session and Cancel Session buttons, per-session submission locking, an in-app cancellation-reason confirmation, and automatic session/workstation refresh after success. Regression coverage rejects GET mutation routes and asserts the exact POST client contract.

Runtime stabilization after applying Groups 2–7 found three source-level SQL defects that had been hidden by the earlier schema drift: Equipment and Software pagination concatenated PostgreSQL placeholders directly with `OFFSET`; Issues selected nonexistent person-name columns from the authoritative `users` table instead of `display_name`; and several reports concatenated SQL clauses without separators while Equipment/Software reports supplied unused date parameters. These queries were corrected without weakening schema requirements or returning fake empty data. The database-backed runtime validator now executes the actual context/list/dashboard paths and all ten report types, confirming truthful zero-safe responses.

The follow-up portal-routing correction removed the assumption that every authorized Computer Laboratory account can open Dashboard. The shared experience registry now resolves the Computer Laboratory landing from the user's effective workspace permissions, in priority order, while nested `/computer-lab/*` paths continue to resolve to the same experience. This prevents legacy or deliberately restricted staff mappings from selecting a forbidden dashboard and being redirected to the default portal.

Manual testing found two separate integration defects. Security & Access omitted the `computer_lab.access`-derived application label even though the Portal Switcher already used that authoritative permission. Existing Computer Laboratory roles could also remain limited to early-group permissions because fresh seed data lacked the final Phase 21 catalog and upgraded installations had no final reconciliation migration. Migration `0061_computer_lab_rbac_application_access_fix.sql` and the seed now converge on the complete Administrator mapping and the documented operational Staff mapping.

The Workstations list query had evolved to join session, equipment, and software tables from migrations 0056, 0058, and 0059. On the known 0054-only runtime this raised PostgreSQL undefined-table errors. The Group 1 base query now depends only on Group 1 tables and enriches later domains when their tables exist; only PostgreSQL `42P01` is treated as an unavailable optional integration, while all other database errors remain visible.

The configured target was subsequently identified as the repository's local Docker PostgreSQL service (`mmsc` on its Docker bridge). The normal migration runner successfully applied migrations 0055–0061. A read-only post-migration validation confirmed the complete Administrator and Staff permission mappings. Authenticated browser acceptance remains pending.
