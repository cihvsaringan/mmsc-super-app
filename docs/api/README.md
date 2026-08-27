# API Documentation

## Foundation endpoints

### `GET /api/v1/health`

Public process liveness endpoint. Returns HTTP 200 with service name, version, and `status: ok`. It does not query PostgreSQL.

### `GET /api/v1/ready`

Public deployment readiness endpoint. Returns HTTP 200 and `database: connected` after `SELECT 1`, or HTTP 503 when PostgreSQL is unavailable.

Every response includes `x-request-id`. Errors use `{ error: { code, message, details? }, requestId }`. The health endpoints remain public; the Phase 1 endpoints below are authenticated and permission-protected as specified.

## Centralized credentials and Attendance Terminal

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| GET | `/api/v1/credentials?ownerType=&ownerId=` | `credential.manage` | List masked Student/Employee credentials |
| POST | `/api/v1/credentials` | `credential.manage` | Register scanned/manual RFID or scanned/manual/generated QR |
| POST | `/api/v1/credentials/:id/status` | `credential.manage` | Activate, deactivate, mark lost, replace, or revoke |
| POST | `/api/v1/attendance-terminals/provision` | One-time terminal provisioning code | Provision one device and return its credential once |
| GET | `/api/v1/attendance-terminals/runtime/bootstrap` | Device credential | Restore terminal configuration and server time |
| GET | `/api/v1/attendance-terminals/runtime/credentials?changedSince=` | Device credential | Synchronize the minimum offline lookup index |
| POST | `/api/v1/attendance-terminals/runtime/sync` | Device credential | Idempotently accept a batch and return per-capture receipts |
| POST | `/api/v1/attendance-terminals/runtime/heartbeat` | Device credential | Report reachability, version, and queue counters |

Credential values are hashed before persistence; list APIs expose only suffixes. A generated QR value is returned only in its authorized issuance/replacement response. Terminal cache synchronization requires an active operator-owned session. Sync events use stable client UUIDs, retain the original offset-aware capture time and scan source, and return `time_in` or `already_timed_in` without treating the second scan as Time Out.

## Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Public | Validate `{ email, password }`, issue HTTP-only session cookie |
| GET | `/api/v1/auth/me` | Authenticated | Return current account, roles, and permissions |
| POST | `/api/v1/auth/logout` | Authenticated | Revoke current session and clear cookie |
| POST | `/api/v1/auth/change-password` | Authenticated | Validate current password, set 12+ character new password, revoke other sessions |

Invalid login responses are intentionally generic. Five failed passwords lock an account for 15 minutes.

## Security administration

| Method | Endpoint | Permission |
|---|---|---|
| GET / POST | `/api/v1/security/users` | `security.user.view` / `security.user.manage` |
| PATCH | `/api/v1/security/users/:userId/status` | `security.user.manage` |
| POST / DELETE | `/api/v1/security/users/:userId/roles[/:roleId]` | `security.user.manage` |
| GET / POST | `/api/v1/security/roles` | `security.role.view` / `security.role.manage` |
| PUT | `/api/v1/security/roles/:roleId/permissions` | `security.role.manage` |
| GET | `/api/v1/security/audit-events?limit=50` | `audit.view` |

UUID path parameters, strict JSON bodies, normalized emails, permission-code formats, status values, and result limits are validated. The final active Super Administrator and that system role's complete permission set are protected.

## Academic master data

Phase 2 exposes allowlisted resources at `/api/v1/academics/:resource`: `schools`, `campuses`, `school-years`, `terms`, `departments`, `grade-levels`, `sections`, `subjects`, `classrooms`, `statuses`, and `events`.

`schools` is the protected MMSC Institution Profile. Its POST and DELETE operations are disabled, and institution-owned resources receive primary MMSC ownership server-side.

| Method | Purpose | Permission |
|---|---|---|
| GET | List non-archived records | `academic.config.view` or `academic.calendar.view` for events |
| POST | Create a validated record | corresponding `.manage` permission |
| PATCH `/:id` | Replace editable data with `{ version, data }` | corresponding `.manage` permission |
| DELETE `/:id?version=N` | Archive a version-matched record | corresponding `.manage` permission |

Conflicting unique values return 409, invalid relationships return 400, and stale versions return 409. Later-phase resources such as students, grades, and attendance are not exposed.

## External Schools reference data

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/reference-data/external-schools?search=&includeInactive=false` | `reference.external_school.view` |
| POST | `/api/v1/reference-data/external-schools` | `reference.external_school.manage` |
| PATCH | `/api/v1/reference-data/external-schools/:id` | `reference.external_school.manage` |

Search covers name, DepEd School ID, city, and province. Inactive records remain retained; there is no destructive-delete endpoint.
