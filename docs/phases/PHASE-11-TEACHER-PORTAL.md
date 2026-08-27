# Phase 11 — Teacher Portal

> Post-Phase-26 stabilization: Teacher Portal accounts authenticate through the centralized User domain with authoritative Employee Number. Activation reuses the Employee-linked User, grants the Teacher role/access explicitly, and requires first-login password replacement for newly created accounts.

## Status

Completed

## Objective

Provide teachers with a focused, mobile-friendly workspace backed by shared authentication and authoritative academic data.

## Implementation

- Added a dedicated `/teacher/*` shell; teacher-only accounts no longer receive the administrative sidebar.
- Resolves identity through `users → employees.user_id → teacher_profiles`.
- Provides teacher-limited school years, advisory context, assigned subjects/classes, roster counts, student rosters, read-only class attendance status, and published upcoming calendar events.
- Provides schedule foundation through section, subject, term, and school-year assignment context without fabricating timetable periods.
- Post-Phase-29 manual-testing correction makes My Classes the `/teacher` home, keeps only My Classes, Grades, and Calendar in primary navigation, and moves existing Notifications and Account destinations to header icons.
- Class rosters prefer assignment-scoped attendance and otherwise show same-day campus attendance from the shared Attendance domain. A Time In is recorded even while Time Out remains open; campus attendance is labeled as school-premise context rather than converted into class-period attendance.

## API and Security

- `GET /api/v1/teacher-portal/dashboard?schoolYearId=`
- `GET /api/v1/teacher-portal/classes/:assignmentId/roster?attendanceDate=`
- Both require `teacher.portal.access` and derive teacher scope from the authenticated user. Arbitrary teacher IDs are never accepted.
- Unlinked accounts, unassigned years, and unrelated assignments are rejected server-side.

## Database

No schema migration was required. The repeatable seed adds the portal permission and records Phase 11. Existing User, Employee, Teacher, assignments, Enrollment, Attendance, and Calendar records remain authoritative.

## Verification

Completed on 2026-08-20:

- Migration validation passed; schema remains current at `0013_reporting_and_administration.sql` and no Phase 11 schema migration was required.
- Repeatable Phase 11 seed passed and installed `teacher.portal.access`.
- Backend and frontend typechecks passed.
- Backend and frontend lint passed.
- Backend tests: 63/63 passed across 19 files.
- Frontend tests: 4/4 passed across 2 files.
- Backend production build passed.
- Frontend production build passed; 1,702 modules transformed and `index-COv7E1Ea.js` emitted at 362.33 kB (98.55 kB gzip).
- Docker API and web images rebuilt and restarted successfully.
- Live web, API health, and API readiness returned HTTP 200 on ports `15173` and `14000`; PostgreSQL remained healthy on `15432`.
- Repository currently contains no linked teacher account; an administrator must create/link an account, Employee record, Teacher profile, school-year placement, and teaching assignment before real portal data can be displayed.

## Known Limitations

- Grading is Phase 12 and has not been implemented.
- A structured timetable does not yet exist.
- Portal attendance is read-only; assignment-scoped attendance mutation is deferred.
- Audience-targeted announcements remain part of the future Notification Center; the portal shows published school events.

## Next Phase

Phase 12 — Grading System is planned but has not been started.
