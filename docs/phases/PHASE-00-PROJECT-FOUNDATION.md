# Phase 0 — Project Foundation

## Status

Completed

## Objective

Establish a runnable, documented full-stack foundation for incremental development of the MMSC Super App.

## Scope

- pnpm monorepo with React/TypeScript/Vite frontend and Node.js/TypeScript/Express API
- PostgreSQL development service, migration runner, and seed framework
- versioned API, environment validation, structured logging, request IDs, global errors, and schema validation
- authentication-ready request context without user login or RBAC behavior
- official-logo-derived design tokens, reusable UI primitives, and responsive Dashboard-only shell
- Docker configuration, automated tests, build tooling, and durable project documentation

## Out of Scope

Phase 1 authentication workflows, users, roles, permissions, sessions, audit persistence, and every domain module are deferred. Future navigation entries are not exposed.

## Expected Database Changes

Create only foundation tables: migration history, application metadata, and a seed execution ledger.

## Expected API Work

Health and readiness endpoints under `/api/v1`, validation/error contracts, logging, and request identity foundations.

## Expected UI Work

Responsive branded shell, dashboard foundation, reusable Button/Card/EmptyState/Spinner/Toast components, and API status display.

## Permissions

None. Granular RBAC begins in Phase 1.

## Testing Strategy

Unit/integration-style API route tests, frontend component tests, typecheck, lint, production builds, and migration dry-run validation.

## Architecture

A pnpm workspace separates `apps/web` and `apps/api`. The React client consumes a versioned Express REST API; PostgreSQL is the durable store. Docker Compose defines web, API, and database services. Configuration and design tokens are centralized.

## Database Changes

- Added checksummed, transactional, ordered SQL migration runner.
- Added `schema_migrations`, `app_metadata`, and `seed_executions` foundation tables.
- Added repeatable Phase 0 metadata seed.

## Backend Changes

- Added `/api/v1/health` and database-aware `/api/v1/ready` routes.
- Added Zod environment validation, request IDs, structured/redacted Pino logging, Helmet, configured CORS, JSON limits, not-found handling, and global JSON errors.
- Added a typed anonymous request context as the integration seam for Phase 1 authentication.

## Frontend Changes

- Added responsive sidebar, top bar, mobile navigation, branded Dashboard, centralized logo-derived tokens, and accessible navigation.
- Added reusable Button, Card, EmptyState, Spinner, and Toast primitives.
- Only Dashboard is exposed; future modules are hidden.

## Permissions

None introduced. Authentication, RBAC, and permissions remain Phase 1 scope.

## Audit Events

No persisted audit events. Structured HTTP request logging is implemented; audit persistence is deferred to Phase 1.

## Seed / Sample Data

The idempotent seed writes application identity and Phase 0 metadata only. No fake users or domain records are created.

## Tests

- API health and standardized not-found response contract
- Frontend Dashboard presence and future-navigation absence
- TypeScript, ESLint, migration file validation, and production builds

## Verification Results

Executed on 2026-08-18:

| Check | Result |
|---|---|
| Migration file validation | Passed — 1 SQL migration validated |
| Actual PostgreSQL migration/seed | Not run — Docker/PostgreSQL unavailable on this machine |
| Backend typecheck | Passed |
| Frontend typecheck | Passed |
| Backend lint | Passed |
| Frontend lint | Passed |
| Backend tests | Passed — 2/2 |
| Frontend tests | Passed — 1/1 |
| Backend production build | Passed |
| Frontend production build | Passed — 1,684 modules, 236.88 kB JS (76.21 kB gzip) |
| Docker image/Compose runtime | Not run — Docker executable unavailable |

## Known Limitations

- A PostgreSQL runtime is required to apply the validated migration and seed or exercise `/ready` successfully.
- Docker configuration was statically reviewed but could not be executed locally.
- Authentication, accounts, passwords, sessions, RBAC, audit persistence, school data, and domain modules are intentionally deferred.
- The frontend imports web fonts with a system-font fallback; production may later self-host fonts under deployment policy.

## Files Added or Modified

Root workspace/infrastructure configuration; `apps/api`; `apps/web`; official logo copy; all required root project documentation; Phase 0, API, and testing documentation.

## Completion Notes

The repository is installable and both applications typecheck, lint, test, and build successfully. The application shell exposes no premature module functionality.

## Next Phase

Phase 1 — Security, Users, Roles and RBAC is planned but has not been started.
