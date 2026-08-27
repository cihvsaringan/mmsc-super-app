# Phase 12 — Grading System

## Status

Completed

## Implementation

Phase 12 adds grading periods, one gradebook per teaching assignment and period, enrollment-linked raw/final grades and remarks, immutable grade history, and the workflow `draft → submitted → reviewed → published → locked`. Reopening returns a gradebook to draft with an audited reason. Teachers can encode only their assigned classes; Principal and School Administrator review and publish through the administrative Grade Review workspace.

Gradebook roster membership comes from active section enrollment in the teaching assignment's School Year. Grade records are optional data left-joined to roster members for the selected Grading Period, so a newly enrolled Student appears with blank grade fields until a teacher saves the first grade.

Post-Phase-29 manual-testing correction: Administration configures Grading Periods under the owning School Year in Academics. Terms remain separate academic structure; a Grading Period may optionally reference a same-year Term. Teacher Portal lists only open periods from the teacher's active assigned School Year. The repeatable seed no longer mirrors Terms into Grading Periods.

## Database

Migration `0014_grading_system.sql` adds `grading_periods`, `gradebooks`, `student_grades`, `grade_history`, indexes, constraints, and a trigger enforcing Enrollment/Section/School Year scope.

Migration `0037_grading_period_scope.sql` validates same-year optional Term ownership and date containment without rewriting existing grading history.

## Security

Permissions: `grades.view`, `grades.encode`, `grades.submit`, `grades.review`, `grades.publish`, and `grades.reopen`. Published/locked gradebooks are read-only. Submission requires every active roster member to have a final grade. All saves and transitions are audited.

## Known Limitations

Student access to published grades is Phase 13 and has not been implemented. Detailed grading component formulas and report cards remain future enhancements; Phase 12 stores validated raw and final grades.

## Verification

- Migration `0014_grading_system.sql` applied successfully.
- Phase 12 seed completed successfully.
- Backend and frontend typechecks and lint passed.
- Backend tests: 66/66 passed across 20 files.
- Frontend tests: 4/4 passed across 2 files.
- Backend and frontend production builds passed; Vite transformed 1,704 modules and emitted `index-8-Cojk5v.js` at 372.13 kB (101.58 kB gzip).
- Docker rebuilt and restarted successfully. Web, API health, and API readiness returned HTTP 200 on dedicated ports `15173`, `14000`, and `15432`.

## Next Phase

Phase 13 — Student Portal is planned but has not been started.
