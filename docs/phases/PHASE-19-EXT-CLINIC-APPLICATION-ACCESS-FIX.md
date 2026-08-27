# Phase 19 Extension — Clinic Application Access Correction

Status: Implemented on 2026-08-27. This is an architectural rollback and regression repair; parent Phase 19 remains In Progress.

## Final architecture

The generalized Application Access persistence layer introduced by migration 0039 was unnecessary because the platform already resolves access through centralized Users, Roles, and Permissions. Requiring a separate `user_applications` row made the new table a second authorization source and redirected otherwise valid legacy users to `/access-denied`.

Clinic remains a purpose-built operational experience at `/clinic/*`. Its portal boundary is `clinic.portal.access`; individual APIs and controls retain their granular `clinic.*` checks. Administration and the Teacher, Student, Parent, and Attendance experiences use their established pre-0039 role, permission, identity, and activation behavior.

## Forward rollback

Migration `0039_application_access_registry.sql` remains immutable because it was applied locally. Migration `0040_remove_application_access_registry.sql` preserves intentional `clinic` assignments by assigning the existing `clinic_staff` role where missing, then drops `user_applications` and `applications`. It does not modify Clinic tables or unrelated RBAC and portal-activation records. Fresh databases run both migrations and finish without the temporary registry.

Authentication/session payloads no longer load application assignments. The generalized Security application-list and user-application update APIs, schemas, repository methods, provisioning hooks, and frontend mutations were removed. Security & Access keeps the user-friendly Application Access column as an RBAC-derived readout; administrators grant or remove Clinic Portal access through Clinic Staff role assignment or the existing role-permission editor.

## Authorization behavior

- Clinic-only: `clinic.portal.access` resolves directly to `/clinic/dashboard`.
- Administration + Clinic: established Administration role resolution and Clinic permission expose both switcher choices, preserving Administration landing priority.
- No `clinic.portal.access`: Clinic is hidden and `/clinic/*` APIs/routes are denied.
- Portal access does not replace granular permissions; actions still require their relevant `clinic.*` grant.
- Super Administrator receives Clinic access through its existing all-Clinic-permissions mapping and needs no special assignment row.

## Verification

Verification performed on 2026-08-27:

- Existing upgraded database: migration 0040 applied successfully; migration runner validated all 34 migration files.
- Final database state: `applications` and `user_applications` both resolve as absent. Clinic Staff has 2 assigned users and Super Administrator has 1; both roles resolve `clinic.portal.access`.
- Seed: passed after replacing the unavailable pgcrypto `digest` overload with PostgreSQL's built-in SHA-256 function.
- API: 46 test files / 199 tests passed; typecheck, lint, and production build passed.
- Web: 18 test files / 65 tests passed; typecheck and production build passed. Lint has no errors and retains one pre-existing `Assignments.tsx` exhaustive-deps warning.
- Automated access coverage validates Administration restoration, Teacher/Student/Parent behavior, Clinic-only landing, Administration + Clinic switching, Clinic omission without the portal permission, the server-wide Clinic gate, and granular action denial.
- A destructive fresh-database rebuild and interactive multi-account browser logins were not performed against the populated development environment. The immutable 0039 → 0040 sequence is checksum-valid and leaves the configured upgraded database in the intended final state.

Phase 19 remains In Progress. Full EHR and immunization editing, physical examinations, complete consultation/treatment/dispensing/disposition and Guardian-contact workflows, appointment/follow-up CRUD, privacy-safe Student/Parent summaries, governance editing, and manual concurrent/multi-account acceptance remain incomplete. Phase 20 has not been started.
