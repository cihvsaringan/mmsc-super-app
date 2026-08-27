# Phase 1 — Security, Users, Roles and RBAC

## Status

Completed

## Objective

Implement centralized local accounts, secure session authentication, granular role-based authorization, account lifecycle controls, and immutable security audit events.

## Scope

- local user accounts with normalized email identifiers and scrypt password hashes
- active/inactive accounts, failed-login tracking, and temporary account locking
- opaque, hashed, expiring, revocable server-side sessions in secure HTTP-only cookies
- roles, granular permissions, role-permission grants, and user-role assignments
- server-side authentication and permission middleware
- user/role administration REST APIs with validation and audit recording
- sign-in, authenticated shell, account/password screen, sign-out, and permission-aware security administration UI
- predefined role and Phase 1 permission seed framework plus optional environment-driven first administrator

## Out of Scope

School master data, employee/teacher/student/guardian linkage, external SSO, MFA, password reset email, broad domain permissions, and all Phase 2+ modules.

## Expected Database Changes

Add `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `auth_sessions`, and `audit_events`, with UUID identifiers, uniqueness and status constraints, indexes, timestamps, and archival/revocation fields.

## Expected API Work

Authentication (`login`, `logout`, `me`), protected user administration, role/permission administration, authorization middleware, lockout logic, and audit retrieval.

## Expected UI Work

Sign-in page, authenticated loading/error states, user menu/sign-out, and a Security area visible only to users with appropriate permissions.

## Permissions

`dashboard.view`, `security.user.view`, `security.user.manage`, `security.role.view`, `security.role.manage`, and `audit.view`.

## Audit Events

Authentication success/failure/logout; user creation/status/role changes; role creation/permission changes.

## Seed / Sample Data

Seed standard roadmap roles and Phase 1 permissions. Create an initial Super Administrator only when explicit bootstrap email/password environment variables are supplied; never use a committed default password.

## Testing Strategy

Unit-test password/session primitives and authorization behavior, exercise route contracts with mocked repositories where practical, validate both migrations, run typecheck/lint/tests/build, and attempt PostgreSQL/Docker integration when available.

## Architecture

Authentication is centralized in the API. Random opaque session tokens travel only in HTTP-only SameSite cookies, while PostgreSQL stores SHA-256 digests. Middleware resolves active account/session state and assembles permissions from normalized RBAC joins. Repository transactions couple security mutations with immutable audits.

## Database Changes

- Migration `0002_security_rbac.sql`
- Tables: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `auth_sessions`, `audit_events`
- UUID primary keys; normalized unique active emails; role/permission code constraints; relationship foreign keys; session and audit indexes
- account version columns and timestamps; session revocation; immutable audit trigger

## Backend Changes

- Authentication: login, current user, logout, password change
- User administration: list/create, activate/deactivate, assign/remove roles
- Role administration: list/create, replace permission grants
- Audit event retrieval
- scrypt password utility, opaque token/digest utility, typed authentication context, authentication and permission middleware
- lockout after five failures for 15 minutes; secure cookie and session expiry configuration
- last-active-Super-Administrator and protected-grant safeguards

## Frontend Changes

- branded sign-in workflow with safe errors and loading states
- session-aware application bootstrap and sign-out
- account identity in the header and permission-gated Security navigation
- user creation, status controls, role assignment/removal, custom-role creation, permission editing, and recent audit display
- self-service password change with confirmation and other-session revocation
- no Phase 2 or later navigation/functionality

## Permissions

- `dashboard.view`
- `security.user.view`
- `security.user.manage`
- `security.role.view`
- `security.role.manage`
- `audit.view`

## Audit Events

`auth.login`, `auth.logout`, `auth.password_change`, `security.user.create`, `security.user.status_change`, `security.user.role_assign`, `security.user.role_remove`, `security.role.create`, and `security.role.permissions_change`, with success/failure where relevant.

## Seed / Sample Data

Thirteen standard roles and six Phase 1 permissions are seeded idempotently. Super Administrator receives all Phase 1 grants; School Administrator receives dashboard and read-only security grants; other roles receive dashboard access. A first Super Administrator is created only when both bootstrap email and password environment variables are supplied. No default/fake account is created.

## Tests

- password hashing/verification and opaque session digest behavior
- authorization middleware allowed and denied paths
- successful login, secure-cookie attributes, generic invalid-password response, and failed-attempt recording
- API health/error foundation regression coverage
- frontend authenticated permission-aware navigation and absence of future modules

## Verification Results

Executed on 2026-08-18:

| Check | Result |
|---|---|
| Migration file validation | Passed — 3 migrations validated |
| Actual PostgreSQL migration/seed | Passed — migrations 0001–0003 applied; Phase 1 seed completed |
| Backend typecheck | Passed |
| Frontend typecheck | Passed |
| Backend lint | Passed |
| Frontend lint | Passed |
| Backend tests | Passed — 8/8 across 4 files |
| Frontend tests | Passed — 1/1 |
| Backend production build | Passed |
| Frontend production build | Passed — 1,689 modules, 251.50 kB JS (80.09 kB gzip) |
| Docker image/Compose runtime | Passed — web, API, and PostgreSQL containers built and started |
| Runtime health | Passed — web HTTP 200, API healthy, database readiness connected |

## Known Limitations

- External SSO, MFA, password recovery, forced first-login password change, IP-wide distributed rate limiting, session cleanup jobs, and audit retention policies are not implemented.
- Accounts are not yet linked to employees, students, or guardians because those identities begin in later phases.
- Security administration includes the Phase 1 workflow only; bulk operations and advanced filtering are deferred.

## Files Added or Modified

Security migration and seed; API security utilities/repository/middleware/routes/tests; authenticated frontend context, login and administration UI; environment configuration; all affected project, architecture, database, security, API, development, deployment, decision, testing, roadmap, and changelog documentation.

## Completion Notes

Phase 1 is runnable when PostgreSQL is available and a bootstrap administrator has been explicitly seeded. Authorization is enforced server-side by permission rather than role name. No future domain functionality was introduced.

Post-completion local-environment maintenance reserved ports 15173 (web), 14000 (API), and 15432 (PostgreSQL) so MMSC can run alongside the King Seven Builders HRIS and Attendance Terminal without using their common development ports.

The first Docker/PostgreSQL execution added forward-only migration `0003_permission_code_segments.sql` so validated permission codes can contain hierarchical resource segments such as `security.user.view`; the applied Phase 1 migration was not rewritten.

Docker Desktop runtime verification completed successfully with MMSC web on 15173, API on 14000, and PostgreSQL on 15432. All containers are running, PostgreSQL is healthy, migrations 0001–0003 are applied, and the Phase 1 role/permission seed completed.

## Next Phase

Phase 2 — School Structure and Academic Master Data is planned but has not been started.
