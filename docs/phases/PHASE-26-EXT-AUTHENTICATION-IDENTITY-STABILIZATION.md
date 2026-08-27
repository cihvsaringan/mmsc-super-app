# Phase 26 Extension — Authentication Identity Stabilization

Status: Completed on 2026-08-21

## Purpose and boundary

Phase 26 remains the completed security baseline. This focused extension replaces email login and stabilizes account provisioning, portal activation, first-login password replacement, and Super Administrator password management before Phase 27. It implements no Phase 27 PWA work.

## Central authentication model

Passwords, account state, lockout, sessions, `must_change_password`, roles, permissions, and recovery email remain on centralized `users`. `login_identities` is a collision-safe lookup layer with one global active normalized-value uniqueness boundary. It references but does not own Employee Number, Student Number, or Guardian Number. Database triggers synchronize linked authoritative identifiers after changes; a conflicting change fails instead of resolving to another user.

Login identifiers are:

- Administration/internal: Security-owned Username.
- Employee and Teacher: authoritative Employee Number; an employee-backed administrative user may also have a Username.
- Student: authoritative Student Number.
- Parent/Guardian: authoritative Guardian Number (`GDN-YYYY-NNNNNN`, sequence-generated and stable).

Email is retained as the recovery/security address and is no longer accepted by `/auth/login`. The centralized request is `{ identifier, password }`; errors remain generic. The existing role/permission-based frontend routing remains deterministic: restricted Teacher, Student, Parent, and Attendance Operator accounts land in their specialized experience; staff-capable accounts land in Administration. A person with multiple grants retains all authorized routes without receiving a duplicate User.

## Provisioning and activation

Security & Access → Add User searches active/on-leave Employees by Employee Number or name and displays operational placement only. It requires a visible Username and recovery email, accepts explicit role/application-access selection, links the existing Employee, and never creates a second Employee identity. Its Portal Activation workspace exposes eligible Students, Teachers, and Guardians with activate/ensure-access actions. Bootstrap/system users remain supported through environment-controlled seeding.

Portal activation is idempotent and available through centralized protected APIs. Student bulk activation is exposed from the filtered Students directory. Teacher and Guardian activation contracts are available for their authoritative workflows and reuse an existing linked User when present. Every provisioned account appears in Security & Access.

Eligibility is authoritative:

- Student: non-archived, status `enrolled`, with a `pending` or `enrolled` Enrollment in a planned/active School Year.
- Teacher: non-archived active specialization, with an active/on-leave non-archived Employee.
- Guardian: non-archived, linked through a non-archived communication-enabled relationship to at least one non-archived enrolled Student.
- Employee administration: non-archived and active/on-leave.

Activation assigns only the applicable portal role (`student`, `teacher`, or `parent_guardian`); it does not imply Administration access. Repeated activation reuses the User, alias, and role. Bulk Student activation reports created/skipped/failed counts and returns credentials only for newly created accounts in that operation.

## Password lifecycle

New accounts receive a cryptographically random, policy-compliant temporary password generated with Node `randomBytes`. Only the scrypt hash is stored. Plaintext is returned once to the authorized activation response, never logged or audited, and cannot be retrieved later. `must_change_password=true` blocks every protected API and frontend experience until the user replaces it through centralized self-service Change Password. Password change clears the flag and revokes other sessions.

`security.user.change_password` permits only explicitly granted administrators (seeded to Super Administrator) to replace any centralized account password. The standard modal requires confirmation and defaults “Require password change on next login” on. The backend applies the shared policy/hash, revokes all target sessions, resets lockout, and audits only target, forced-change choice, and revocation count. Existing passwords are never exposed.

Forgot Password accepts the new identifier and always returns a generic response. It records a non-secret request event, but no reset token is issued and no email is claimed because outbound email delivery is not configured. Secure token issuance/delivery remains deferred until a verified email provider and reset-delivery workflow exist.

## Database and API

Migration `0021_authentication_identity_stabilization.sql` adds `login_identities`, Guardian Number generation, `must_change_password`, account type, authoritative alias-sync triggers, and the two granular permissions. It migrates existing linked identifiers and assigns collision-safe Username aliases without resetting password hashes. Conflicting unresolved aliases are omitted rather than guessed and can be remediated through Security administration.

New/changed APIs:

- `POST /api/v1/auth/login` — Username or School ID.
- `POST /api/v1/auth/forgot-password` — generic recovery foundation.
- `POST /api/v1/auth/change-password` — self-service and forced-first-login completion.
- `GET|POST /api/v1/security/provisioning/employees` — Employee-backed provisioning.
- `POST /api/v1/security/portal/students/:id/activate` and `/students/bulk-activate`.
- `POST /api/v1/security/portal/teachers/:id/activate`.
- `POST /api/v1/security/portal/guardians/:id/activate`.
- `POST /api/v1/security/users/:userId/change-password` — permission-gated replacement.

## Verification

- Migration validation: 21 files passed; migration 0021 applied; repeatable seed passed.
- API and web typecheck, lint, and production builds passed.
- API: 109 tests across 29 files passed. Web: 18 tests across 6 files passed.
- Rebuilt PostgreSQL, API, and web services ran on isolated ports `15432`, `14000`, and `15173`; readiness, web, and the authenticated Portal Activation candidate contract returned HTTP 200.
- Live Username login and `/auth/me` returned HTTP 200, the legacy recovery Email failed as a login identifier with the generic HTTP 401, centralized accounts were visible, and the recovery foundation returned HTTP 202.
- Browser inspection confirmed the unified login labels/helper/recovery action and no console warnings or errors.
- The development database contained no eligible unlinked Student, Teacher, or Guardian, so live provisioning/forced-change journeys for those account types were not manually executed. Automated tests cover resolver eligibility, forced API blocking, temporary-password generation, and Employee-backed provisioning UI behavior.

## Known limitations

- Outbound email and usable forgot-password token delivery are not configured; the UI/API disclose no false delivery claim.
- One-time activation credentials must currently be copied and distributed securely by authorized staff. Printable credential slips and activation links are not implemented.
- Existing alias collisions are never auto-resolved to a person; an omitted alias requires administrative remediation.
- Physical terminal hardware was not changed by this extension.

Phase 27 remains Planned and has not been started.

Authentication, User Provisioning, Portal Activation, and Super Admin Password Management stabilization is complete. Phase 27 remains the next planned phase, but it has not been started.
