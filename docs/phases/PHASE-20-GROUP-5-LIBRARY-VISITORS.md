# Phase 20 — Group 5: Library Visitor Logging & Foot Traffic

Status: Completed on 2026-08-27. Phase 20 remains In Progress; Groups 6–7 have not started.

Library visitor logging is not Attendance. It reuses centralized credential digests and canonical identities but writes only `library_visits`. Migration 0051 stores canonical patron references, reporting snapshots, entry/exit times and operators, scan methods, stations, timestamps, and version. Partial unique indexes allow one open visit per patron.

ENTRY and EXIT are explicit modes. Duplicate entry returns the existing session; exit without entry returns `LIBRARY_VISITOR_NOT_INSIDE`; duration is computed. The Visitors workspace supports scanner and manual flows, daily/current-inside filters, and server analytics by hour, grade, section, and day.

Logging requires `library.visitors.log`, history requires `library.visitors.view`, and analytics requires `library.visitors.reports`. `VISITOR_ENTRY` and `VISITOR_EXIT` audits exclude raw credentials. Acceptance verifies zero Student Attendance, Employee Attendance, or Attendance Terminal writes.

All 45 migrations validated and 0051 applied. API/web verification results are recorded in the completion response.

Phase 20 Group 5 is complete. The next planned group is Phase 20 Group 6, but it has not been started.
