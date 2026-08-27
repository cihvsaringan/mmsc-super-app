# Phase 29 Extension — Administration Navigation and Multi-Assignment Workspace Refactor

Status: Completed on 2026-08-21

## Scope and outcome

This extension makes the Administration sidebar easier to scan and prepares implemented workspace discovery for a centralized User with multiple concurrent assignments. It preserves every existing route, permission, API guard, record, and business workflow. It does not implement Library, Clinic, Computer Laboratory, Canteen, or another deferred Phase 19–23 domain.

## Administration navigation

The flat sidebar is replaced by reusable collapsible groups:

- Overview
- School Management
- People & Workforce
- Attendance Operations
- Administration

Every item retains its existing permission predicate. Groups filter their items before rendering and disappear when empty. Existing active-route highlighting, mobile drawer close behavior, MMSC icon vocabulary, and the independently scrollable navigation rail remain intact. The brand now identifies the current shell as Administration.

## Workspace access

Implemented experiences are declared once in the frontend experience registry. Each definition contains its key, user-facing name, description, route, and access predicate. Administration requires an actual granted Administration capability rather than an Employee position or a single-role assumption. Teacher, Student, Parent/Guardian, and Attendance Terminal continue to require both their authoritative role relationship and matching access permission.

A User satisfying several definitions receives a native workspace switcher and navigates between shells within the existing authenticated session. A single-workspace User sees a compact current-workspace indicator and routes directly to that experience. No duplicate account, authentication system, or session is created.

Future operational workspaces will be registered only when their route and centralized grant are implemented. This gives them an extension point without presenting fake or inaccessible applications today.

## Data and deployment impact

No migration, table, permission, route, port, environment variable, or external service was added. Existing `users`, `user_roles`, `roles`, and `role_permissions` remain the authorization source. The repeatable seed advances release metadata to `phase-29-ext-administration-navigation` without changing grants.

## Regression coverage

- Super Administrator portal permissions do not fabricate unrelated Teacher, Student, or Parent workspaces.
- A Teacher with only Teacher Portal access remains a single-purpose account.
- Adding an explicit Administration module grant exposes Administration alongside Teacher Portal.
- Single-purpose Student, Parent/Guardian, and Attendance Terminal users retain direct home routing.
- Administration tests verify grouped headings, omission of an inaccessible empty group, permission-aware links, and the visible current-workspace indicator.

## Verification

Completed on 2026-08-21:

- All 21 migrations validated; this extension adds no migration.
- API and web TypeScript checks and lint passed.
- API tests: 113 tests across 30 files passed.
- Web tests: 26 tests across 9 files passed, including four experience-resolution cases and grouped/empty-group/current-workspace shell coverage.
- API and web production builds passed. Vite transformed 1,727 modules; the initial JavaScript chunk is 259.94 kB (81.28 kB gzip) and shared CSS is 77.50 kB (15.02 kB gzip).
- Docker rebuilt and restarted PostgreSQL, API, and web on isolated ports `15432`, `14000`, and `15173`; all services are running and PostgreSQL is healthy.
- The repeatable seed completed as `phase-29-ext-administration-navigation`.
- Web root, API health, and API readiness returned HTTP 200.
- An authenticated live browser pass was attempted, but the available browser had no MMSC session. Entering the local administrator password requires explicit action-time approval, which was not provided in the subsequent request. Responsive structure, permission filtering, current-workspace rendering, and multi-access behavior were therefore verified through deterministic component/unit tests and the production build rather than by claiming a live authenticated visual pass.

## Completion boundary

This extension ends at Administration navigation and implemented-workspace discovery. Deferred Phases 19–23 remain unimplemented and no subsequent phase has been started.
