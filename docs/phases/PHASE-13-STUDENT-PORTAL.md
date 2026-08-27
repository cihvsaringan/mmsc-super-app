# Phase 13 — Student Portal

> Post-Phase-26 stabilization: eligible Student Portal accounts use authoritative Student Number through centralized login identities. Activation is controlled and idempotent; bulk activation returns unique temporary credentials once and does not grant Administration access.

## Status

Completed

## Implementation

Added `/student/*`, a purpose-built mobile-friendly shell, and a self-scoped dashboard containing student profile summary, school-year enrollment selection, subjects and assigned teachers, attendance summary, published grades, school events, and account settings.

## Security and Data

`student.portal.access` is granted to the Student role. The API derives Student from `students.user_id`; it accepts no Student ID. Enrollment selection is validated against that identity. Grades require Gradebook status `published` or `locked`, so drafts, submissions, and reviewed results never reach the portal. No guardian, LRN, or unrelated-student data is exposed. No migration was required.

## Known Limitations

Timetable periods and Notification Center announcements do not yet exist. The portal uses current academic assignments and published calendar events. Offline/PWA optimization is Phase 27 under the roadmap revision after Phase 14.

## Verification

- Migration validation passed; schema remains current at `0014_grading_system.sql` and Phase 13 required no migration.
- Phase 13 seed completed successfully.
- Backend/frontend typechecks and lint passed.
- Backend tests: 68/68 passed across 21 files.
- Frontend tests: 4/4 passed across 2 files.
- Backend/frontend production builds passed; Vite transformed 1,706 modules and emitted `index-CLEQgjrO.js` at 379.07 kB (102.86 kB gzip).
- Docker rebuilt and restarted successfully. Student route, API health, and API readiness returned HTTP 200 on dedicated ports `15173`, `14000`, and `15432`.

## Next Phase

Phase 14 — Offline-first Attendance Terminal is planned but has not been started.
