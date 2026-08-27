# Phase 19 — Group 1: RBAC Stabilization and Clinic Portal Foundation

Status: Completed on 2026-08-27. Phase 19 remains In Progress; Group 2 has not been started.

## Access architecture

Clinic remains a separate `/clinic/*` operational experience on the centralized Super App authentication and RBAC model. `clinic.portal.access` gates the entire frontend and API namespace. Page and operation access then requires the corresponding granular `clinic.*` permission. The retired `applications` / `user_applications` tables remain absent and no application assignment is loaded into authentication or portal activation.

Migration `0041_clinic_group1_rbac_stabilization.sql` adds view-only permissions for the Clinic Dashboard, Appointments, and Follow-ups. Clinic Staff receives these operational grants along with its existing Clinic permissions but does not receive `clinic.config.manage`. Super Administrator receives the new grants through its established Clinic all-permissions mapping.

## Portal foundation

The Clinic shell now uses the MMSC Administration design vocabulary for navigation, typography, spacing, buttons, responsive behavior, empty states, loading feedback, and permission visibility. Its mobile navigation is an accessible drawer with explicit open, close, and backdrop controls.

Permission-filtered destinations are Dashboard, Student Lookup, Visit Queue, Clinic Visits, Health Records, Appointments, Follow-ups, Medicine & Supplies, and Reports. Routes are independently guarded. The visit queue uses a dedicated `clinic.encounter.view` API rather than requiring Dashboard access. Create-visit controls require `clinic.encounter.manage`.

Administration → Clinic Management remains governance-focused: settings, RBAC guidance, item-master visibility, and high-level configuration. Daily consultations remain in the Clinic Portal.

## Verification

- Migration 0041 applied to the configured upgraded database.
- Seed completed successfully.
- Database verification confirms `applications` and `user_applications` remain absent, Security account loading succeeds, and Clinic Staff / Super Administrator retain `clinic.portal.access`.
- API route tests cover missing portal permission, missing Dashboard permission, allowed Dashboard access, and granular action denial.
- Web tests cover Clinic-only landing, Administration + Clinic switching, legacy Teacher/Student/Parent experience resolution, permission-filtered Clinic navigation, responsive drawer controls, and Clinic permission grouping in Security & Access.
- Migration validation passed for all 35 migration files.
- API tests passed: 46 files and 200 tests.
- Web tests passed: 19 files and 70 tests.
- API and web TypeScript checks passed.
- API and web production builds passed.
- API lint passed. Web lint completed with no errors and one pre-existing `react-hooks/exhaustive-deps` warning in `Assignments.tsx`.
- The configured database contains nine Security accounts; Clinic Staff and Super Administrator assignments both resolve `clinic.portal.access`. Clinic Staff does not receive `clinic.config.manage`.
- Interactive browser login was not performed because no test-user password was supplied; route behavior, experience resolution, permission filtering, and configured-database role assignment were verified through automated tests and database checks.

Library remains deferred to Phase 20 and therefore has no implemented portal login surface to exercise in Group 1. Existing Attendance behavior remains outside the Clinic route changes.

Phase 19 Group 1 is complete. Phase 19 Group 2 is planned, but it has not been started.
