# Phase 25 — Reporting and Analytics Expansion

Status: Completed on 2026-08-20

## Delivered scope

- A focused `/operations` workspace with a grouped report catalog, date controls, generated timestamp, loading and honest empty states, compact comparisons, detailed tables, print, and permission-protected CSV.
- Existing Enrollment by Grade, Students by Section, Employee Attendance, and Student Attendance reports retained.
- New Admissions Pipeline, Workforce Headcount, Grading Progress, Events Summary, and Notification Delivery reports.
- Application settings separated into a permission-scoped tab.
- Server-side reversed-date rejection and `generatedAt` response metadata.

Reports calculate directly from authoritative Enrollment, Students, Academic Core, Workforce, Teachers, Attendance, Admissions, Grading, Calendar, and Notifications. No reporting warehouse, cached totals, fabricated rows, or duplicate identities were introduced. Existing `report.view` and `report.export` permissions remain the boundary.

## Boundaries

Phases 19–23 remain deferred; no Clinic, Library, Laboratory, Credits, or Canteen reports exist. Native Excel, saved/scheduled reports, background generation, forecasting, and external BI remain future work. CSV and browser print are the implemented exports. No migration or new permission was required.

## Verification

- All 20 migrations validated; no Phase 25 migration required.
- API/web typechecks, lint, tests, and production builds passed.
- API: 100 tests across 28 files. Web: 18 tests across six files.
- All nine SQL contracts executed against PostgreSQL; empty domains returned zero rows and Notifications returned existing authoritative groups.
- Docker services ran on isolated ports 15173/14000/15432; `/operations` and readiness returned HTTP 200.
- Browser inspection loaded `/operations`, confirmed the centralized sign-in boundary, and found no console errors. The browser was not authenticated, so the protected report surface itself was not claimed as manually exercised.

Phase 25 is complete. The next planned phase is Phase 26, but it has not been started.
