# Phase 19 — Group 2: Student Health Records

Status: Completed on 2026-08-27. Phase 19 remains In Progress; Group 3 has not been started.

## Delivered scope

The Clinic Portal now provides a permission-scoped longitudinal Student Health Record workspace. Authorized users can search current canonical Students and open a clinical profile containing Student identity, current Enrollment placement/status, managed photo reference, active and resolved health alerts, health profile, immunizations, physical examinations, recent Clinic encounters, upcoming appointments, pending follow-ups, and active canonical Guardian relationships.

Health profile create/update covers blood type, past illnesses, surgeries or hospitalizations, medication restrictions, long-term medications, emergency medical notes, and physician recommendations. Allergy, medical-condition, medication-restriction, and emergency-instruction records support severity, notes, and active/resolved state. Immunizations and physical examinations support create, edit, history, and recoverable archival. Every examination is a separate historical record; editing never replaces another examination row.

BMI is calculated only by the API from valid centimetre and kilogram values. The result is rounded consistently to two decimal places and remains null when either measurement is absent or invalid. Immunizations remain flexible and contain no hard-coded vaccination schedule.

## Authorization and privacy

The existing centralized RBAC model is retained. Migration 0042 renames the earlier `clinic.ehr.view/manage` permission records in place to `clinic.health_records.view/manage`, preserving their identifiers and existing role assignments. All Health Record APIs first require `clinic.portal.access`, then require view or manage permission as appropriate. Clinic Staff and Super Administrator receive view/manage through existing role mappings; School Administrator receives no detailed Health Record access by default.

General Administration Student pages were not changed and expose no new EHR fields. Health-record search has its own `clinic.health_records.view` endpoint so a view-only clinical role does not need encounter-oriented Student Lookup access.

Clinical mutations use optimistic versions. Immunization and examination removal is archival, not destructive deletion. Audit entries record action, target, Student reference, changed field names, severity, or BMI presence where useful; they do not copy clinical narratives into generic audit metadata.

## User experience

The Health Records workspace follows the Administration component vocabulary with restricted search, responsive Student header, prominent critical-alert panel, tabs, definition-list summaries, history tables, permission-aware actions, large shared modals, validation, empty states, and mobile layouts. Severe and critical alerts appear in both search results and the opened profile.

## Verification

- Migrations 0042 and 0043 applied. Migration 0043 removes a migration-time compatibility field, leaving Guardian ownership canonical and unchanged.
- Seed completed and preserved Clinic Staff / Super Administrator Health Record grants.
- Configured-database smoke verification loaded an enrolled Student Health Record and its canonical Guardian relationship; School Administrator had no Health Record grant.
- API tests passed: 46 files and 206 tests.
- Web tests passed: 20 files and 72 tests.
- API and web TypeScript checks and production builds passed.
- API lint passed. Web lint completed with no errors and one pre-existing hook dependency warning in `Assignments.tsx`.
- Automated coverage includes BMI and unit validation, new empty profiles, portal and granular RBAC denial, view/manage separation, allergy and condition creation contracts, immunization and examination creation contracts, and critical-alert/read-only UI behavior.
- A destructive manual write against a real Student was intentionally not performed because it would fabricate sensitive medical data. Persistence was validated through the configured schema/read smoke check, API contracts, versioned repository writes, and automated UI refresh behavior. An authorized Clinic user should complete the prescribed real-data acceptance scenario with a designated test Student before production sign-off.

Phase 19 Group 2 is complete. Phase 19 Group 3 is planned, but it has not been started.
