# Phase 29 Extension — Attendance Date Filtering Fix

Status: Completed

## Scope

Correct the Student and Employee Attendance transaction/history behavior so a selected date or date range shows only identities with an actual attendance record in that period. Preserve existing record, correction, terminal, RBAC, and domain ownership workflows without redesigning the workspaces.

## Implementation

- Student Attendance list and count queries now start from `student_attendance_records` and filter `attendance_date` before joining Enrollment, Student, School Year, Grade Level, Section, and Subject display data.
- Removed the synthetic `not_recorded` list status and the implicit active School Year filter. Optional School Year and academic filters now narrow actual records only.
- Student date changes reload the transaction list and date-scoped holiday context. Search, filters, sorting, totals, and pagination use the same server record set.
- Employee Attendance remains rooted in `employee_attendance_records`; regression coverage protects that behavior.
- Records with only Time In, only Time Out, or a valid status with null timestamps remain legitimate attendance transactions and are not filtered out.
- No migration or new index was required; existing attendance indexes cover the corrected date-driven reads.

## Verification

- Focused API repository and route tests: passed, 4 files and 10 tests.
- Backend TypeScript typecheck: passed.
- Frontend TypeScript typecheck: passed.
- Focused frontend lint for Student Attendance: passed.
- Full API and frontend lint: passed. Frontend lint retains one pre-existing `Assignments.tsx` exhaustive-deps warning and no errors.
- Full API unit suite: passed, 37 files and 162 tests.
- Full frontend unit suite: passed, 16 files and 54 tests (using Vite's runner config loader because the default temporary-config path is not writable in this environment).
- Backend and frontend production builds: passed using clean workspace-local `.build` output directories. The configured API `dist` directory is locked read-only in this environment, so the equivalent backend compiler build was directed to `.build/api`.
- Migration validation was attempted but the local `tsx` launcher failed before connecting to PostgreSQL with `uv_os_get_passwd returned ENOMEM`. This fix adds no migration; the repository contains the existing ordered migration set and the database design review found no schema change necessary.

## Deferred

No future Attendance phase or unrelated interface redesign was started.
