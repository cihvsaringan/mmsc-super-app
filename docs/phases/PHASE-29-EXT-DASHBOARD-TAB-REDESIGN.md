# Phase 29 Extension — Dashboard Tab-Based UI Redesign

Status: Completed — 2026-08-23

## Scope

This extension redesigns only **Overview → Dashboard**. It uses the established **System & Reports → Operations** interaction hierarchy and does not begin a deferred roadmap phase.

## Implemented architecture

```text
Dashboard
├── Students
│   ├── Enrollment by Grade
│   ├── Students by Section
│   └── Attendance Today
├── Employees
│   └── Employee Attendance Today
├── Teachers
│   └── Teacher Attendance Today
└── More Operations
    ├── Admissions
    ├── Enrollment Operations
    ├── Attendance Exceptions
    └── Academic / Grade Review
```

Primary and Student secondary selections are encoded as `area` and `view` query parameters, so the current operational context survives normal navigation and supports direct links. Tabs are horizontally scrollable on narrow screens.

## Data and authorization

`GET /api/v1/dashboard/admin` remains protected by `dashboard.view`. Its aggregate response is now assembled by a dashboard-specific repository and includes only areas supported by the authenticated account's source permissions.

- Current enrollment uses the active School Year and `pending`/`enrolled` Enrollment records.
- Grade and Section distributions use Academic Core identities and Enrollment placement.
- Student attendance uses current-date, campus-scoped Student Attendance records.
- Employee attendance uses active/on-leave Employee identities and current-date Employee Attendance records.
- Teacher attendance is derived from Employee attendance joined to active Teacher profiles; it does not duplicate teacher identities or attendance records.
- More Operations exposes only implemented and authorized Admissions, Enrollment, Attendance Operations, and Grade Review status aggregates.
- Library, Clinic, Computer Laboratory, and Canteen dashboard areas remain future capabilities and are not exposed.

The dashboard intentionally uses an “attendance has not yet been recorded” state when expected people exist but no current-date records exist. It does not present a misleading zero-percent rate or infer a school schedule that the current data model cannot authoritatively prove.

## Presentation and interaction

Each selected view follows the operational-question → summary → visualization → supporting data → drill-down hierarchy. Bar charts use actual aggregates, expose keyboard-focusable values and native tooltips, and retain a visible data table so meaning is not color- or chart-dependent. Grade Level, Department, and Employee Type filters update the selected dataset without reloading the full dashboard.

The Impeccable product-interface guidance informed the restrained color usage, familiar tab vocabulary, data density, responsive structure, loading skeleton, honest empty states, and avoidance of generic card grids.

## Verification

- Live Docker API returned `SY 2026-2027`, 14 Grade Levels, 28 Sections, 30 Employees, and 20 Teachers.
- Teacher count was derived from Employee/Teacher relationships.
- No Student Attendance records existed for the test date; the truthful not-recorded state was returned.
- API tests: 121 passed.
- Web tests: 27 passed.
- Backend and frontend typechecks: passed.
- Backend and frontend lint: passed.
- Backend and frontend production builds: passed locally and in Docker.
- Docker API and web services were rebuilt and restarted on ports `14000` and `15173`.
- Migration execution was attempted. The existing Windows Node/tsx runtime limitation remained: `uv_os_get_passwd` returned `ENOMEM`. This extension introduces no migration or schema change.

No Phase 19–23 implementation was started.
