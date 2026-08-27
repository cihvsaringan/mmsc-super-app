# Phase 29 Extension — Security & Access Operations-Style UI Refactor

Status: Completed on 2026-08-21

## Scope and outcome

This extension refactors the existing administrative Security capability into a focused Security & Access operations workspace. It does not introduce a new authentication system, permission model, identity store, migration, or Post-MVP module.

The workspace provides four independently authorized and URL-addressable tabs:

1. Accounts — centralized user lifecycle, linked identity, application access, roles, password administration, and status controls.
2. Roles and Permissions — system/custom role context, user counts, and permissions grouped by platform domain.
3. Portal Activation — eligible Teacher, Student, and Guardian activation state, existing one-time credentials, role-backed disable/re-enable, and bulk Student activation.
4. Recent Security Activity — searchable/filterable existing audit events with actor, target, outcome, source, and timestamp, but no secret-bearing metadata.

## Architecture and authorization

Tab state uses `/security?tab=accounts|roles|portal-activation|activity`, so refresh, direct navigation, and browser history preserve the active workspace. Route and sidebar access accept any supported tab permission, while each tab is hidden unless its own read/provision permission exists. Existing mutation controls remain protected by narrower server-enforced management permissions.

The API enriches existing read models only. Accounts compose `users`, login aliases, roles, and authoritative Employee/Student/Guardian identifiers. Role counts derive from `user_roles`. Portal enablement and activation time derive from the applicable `teacher`, `student`, or `parent_guardian` role assignment. Audit list output deliberately excludes metadata.

## UX behavior

- The hierarchy, tabs, blue section heading, filter rows, tables, status semantics, and responsive overflow behavior align with the established Operations/Reports administration patterns.
- Creation remains in the shared modal pattern; existing detail-changing operations are preserved.
- Empty states describe authoritative eligibility and never fabricate records.
- Mobile layouts stack filters and keep wide operational tables in an explicit horizontal scroll region.

## Data and deployment impact

No migration, table, permission, environment variable, port, or external service was added. The repeatable seed only advances release metadata to `phase-29-ext-security-access-operations-ui`.

## Verification

Verification results are recorded after the complete Phase gate is run. Required checks are migration validation, API/web typecheck, lint, tests, production builds, Docker rebuild/restart, seed, health/readiness, and authenticated desktop/mobile browser inspection of the four tab URLs.

## Completion boundary

This work is limited to the requested Phase 29 extension. Deferred Phases 19–23 remain unimplemented, and no subsequent phase has been started.
