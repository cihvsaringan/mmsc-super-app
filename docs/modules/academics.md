# Academics Module

## Implemented scope

Phase 2 implements MMSC institution configuration, campuses, school years, academic terms, departments, grade levels, year-scoped sections, subjects, classrooms, configurable statuses, and calendar events. The post-Phase 29 correction makes the institution model explicit: operators edit one MMSC Institution Profile, cannot add/archive internal institutions, and use campuses for MMSC locations. The API automatically assigns MMSC to institution-scoped records.

School Year is the historical anchor: terms belong to it and sections represent placement configuration for a specific year. Later enrollment, assignments, attendance, and grading must reference these stable records rather than copy names or assume only the current year matters.

## API and permissions

Resources are available under `/api/v1/academics/:resource` with GET, POST, PATCH, and archival DELETE operations. For `schools`, GET/PATCH represent the protected MMSC Institution Profile; POST and DELETE return conflict responses by design. Configuration uses `academic.config.view/manage`; events use `academic.calendar.view/manage`. Writes are strictly validated, version-checked, audited, and allowlisted.

## User interface

The Academics workspace is permission-aware and offers tabs, live relationship options, responsive forms, record summaries, editing, and archive confirmations. Archived records are hidden from operational lists but retained in PostgreSQL.

## Deferred

Employees, teachers, students, guardians, enrollment, teaching assignments, attendance, grades, portals, and notifications are not part of this module yet.
