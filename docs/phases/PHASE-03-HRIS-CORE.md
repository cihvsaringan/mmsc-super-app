# Phase 3 — HRIS Core / Workforce Management

## Status

Completed

## Objective

Establish a permanent, auditable employee identity and workforce record system that later teacher, attendance, payroll, clinic, and portal phases can safely reuse.

## Scope

- permanent employee identities linked to the shared school organization
- positions and employee types as configurable workforce master data
- employment status, contact/address data, emergency contacts, and status history
- separately permissioned government/administrative identifiers
- employee profile-photo reference and document-metadata foundations
- employee search, filters, profile workflows, archival, optimistic concurrency, RBAC, and audits
- permission-aware Workforce web workspace

## Out of Scope

Teacher specialization, teaching assignments, payroll, leave balances, biometric/timekeeping attendance, schedules, document binary storage, student data, and all Phase 4+ functionality.

## Expected Database Changes

Add `positions`, `employee_types`, `employees`, `employee_emergency_contacts`, `employee_identifiers`, `employee_status_history`, and `employee_documents` with UUID identifiers, relational constraints, indexes, timestamps, archival fields, optimistic versions where records are mutable, and append-only status history.

## Expected API Work

Validated workforce context, master-data, employee search/profile/create/update/archive, emergency-contact, sensitive-identifier, status-history, and document-metadata endpoints under `/api/v1/workforce`.

## Expected UI Work

Add permission-aware Workforce navigation and a responsive employee directory/profile workspace supporting search, filters, core employee editing, and related-record management without exposing future teacher or attendance features.

## Permissions

- `employee.view`, `employee.create`, `employee.edit`, `employee.archive`
- `employee.sensitive.view`, `employee.sensitive.manage`
- `employee.document.view`, `employee.document.manage`
- `workforce.config.view`, `workforce.config.manage`

## Audit Events

Audit employee create/update/archive and access or changes to emergency contacts, identifiers, document metadata, and workforce configuration. Identifier values must never be copied into audit metadata or ordinary employee responses.

## Seed / Sample Data

Seed Phase 3 permissions and appropriate grants to existing system roles. Do not fabricate employees, employment history, positions, identifiers, or documents.

## Testing Strategy

Validate migration structure and strict request schemas; test authentication, granular permission boundaries, sensitive-data separation, employee status history, and later-phase exclusion; retain earlier regressions; then run the complete migration/typecheck/lint/test/build and Docker runtime verification gates.

## Implementation Summary

- Added migration `0005_hris_core.sql` and seven normalized workforce tables.
- Added `/api/v1/workforce` context, configuration, employee directory/profile, emergency-contact, identifier, and document-metadata APIs.
- Added permanent employee creation, full profile updates, version-checked archival, paginated search/filtering, and transaction-coupled append-only status history.
- Added ten granular permissions and appropriate Super Administrator, School Administrator, HR Administrator, HR Staff, and Principal grants.
- Added responsive, permission-aware Workforce navigation, directory, profile, form, and related-record workflows.
- Updated the application packages to version `0.4.0`.

## Verification Results

Executed on 2026-08-18:

| Check | Result |
|---|---|
| Migration file validation | Passed — 5 migrations validated |
| Actual PostgreSQL migration | Passed — `0005_hris_core.sql` applied |
| Phase 3 seed | Passed — 10 permissions; 0 fabricated employees, positions, or employee types |
| Backend typecheck / production build | Passed in Docker |
| Frontend typecheck / production build | Passed — 1,691 modules, 279.60 kB JS (86.41 kB gzip) |
| Backend lint | Passed |
| Frontend lint | Passed |
| Backend tests | Passed — 20/20 across 8 files |
| Frontend tests | Passed — 1/1 |
| Docker runtime | Passed — PostgreSQL, API, and web running on the dedicated MMSC ports |
| Runtime health | Passed — web HTTP 200, API healthy/ready, database ready |
| Authorization boundary | Passed — anonymous workforce request returned 401 |

## Known Limitations

- Binary document upload/storage is intentionally not implemented; Phase 3 stores protected metadata and optional external storage keys only.
- Identifier values rely on database/storage encryption and strict database access at deployment time; application-layer field encryption is deferred to Phase 26 Security Hardening under the roadmap revision after Phase 14.
- Positions and employee types are intentionally empty until authorized staff configure real MMSC values.
- No bootstrap administrator exists unless credentials are explicitly added to `.env` and the seed rerun.
- Teacher specialization, teaching records, attendance, payroll, leave processing, and scheduling are not implemented.

## Next Phase

Phase 4 — Teacher Management Extension is planned but has not been started.
