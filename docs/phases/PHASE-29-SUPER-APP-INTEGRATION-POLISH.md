# Phase 29 — Super App Integration Polish

Status: Completed on 2026-08-21

The separately requested Security & Access and Administration navigation work is documented in `PHASE-29-EXT-SECURITY-ACCESS-OPERATIONS-UI.md` and `PHASE-29-EXT-ADMIN-NAVIGATION-MULTI-ASSIGNMENT.md`; both preserve this phase's integration boundaries.

## Scope and outcome

Phase 29 completes the planned initial MVP by polishing how implemented MMSC experiences connect. It centralizes role-aware home routing, provides an experience switcher for accounts that genuinely hold multiple role-backed experiences, aligns portal navigation with server permissions, removes hard page reloads from in-page portal links, and standardizes keyboard route focus and skip navigation. It introduces no new business domain, schema, API, or deferred Phase 19–23 functionality.

## Central experience resolution

The frontend now derives available experiences from both role membership and the matching portal permission. This distinction prevents a broad Super Administrator permission set from implying a Teacher, Student, or Guardian identity that does not exist. Administration is available to implemented staff roles; Teacher, Student, Parent/Guardian, and Attendance Terminal experiences require their corresponding role and access permission.

One resolver supplies the default home path, valid switcher choices, and current experience. Unauthorized and unknown routes return to the caller's valid home instead of rendering an administrative dashboard beneath an invalid URL. Dedicated portal routes additionally require their authoritative role as well as their existing server-backed permission.

## Navigation and accessibility polish

- Multi-role accounts receive a compact native workspace switcher inside the active shell; single-experience accounts see no unnecessary control.
- Teacher, Student, and Parent navigation hides Notifications, Calendar, or Grades when the matching permission is absent.
- In-page Classes, Subjects, and Grades links use React Router navigation and preserve the current application session without a document reload.
- Shared route focus moves keyboard/screen-reader focus to the new main landmark or requested section. Every integrated shell now offers a visible-on-focus skip link.
- Focus styles, touch targets, state transitions, and reduced-motion handling are shared through the existing MMSC token system.
- The administrative dashboard now displays user-facing “Live records” status instead of an internal implementation-phase label.

## Data and deployment impact

No migration, backend endpoint, permission, port, environment variable, or external service was added. The repeatable seed advances application metadata and release history to `phase-29-super-app-integration-polish` without changing existing grants.

## Verification

### Automated and live verification — 2026-08-21

- All 21 migrations validated; Phase 29 adds no migration.
- API and web TypeScript checks and lint passed.
- API tests: 113 tests across 30 files passed unchanged.
- Web tests: 24 tests across 9 files passed, including new role/permission experience resolution, multi-role choice, and dedicated-home regressions.
- API and web production builds passed. Vite transformed 1,725 modules; the initial JavaScript chunk is 256.93 kB (80.29 kB gzip) and shared CSS is 76.21 kB (14.74 kB gzip).
- Docker rebuilt and restarted PostgreSQL, API, and web on isolated ports `15432`, `14000`, and `15173`; all services are running and PostgreSQL is healthy.
- The repeatable seed completed as `phase-29-super-app-integration-polish`.
- Web root, API health, and API readiness returned HTTP 200.
- Authenticated desktop (1440 × 1000) and mobile (390 × 844) browser passes confirmed the administrative landing, “Live records” status, skip link, main landmark, no horizontal overflow, and no post-login console errors.
- Directly opening `/student` as the configured Super Administrator returned to `/`, proving that broad Super Administrator grants no longer imply a linked Student experience. The switcher correctly remained hidden for this single role-backed experience; multi-role switching is covered by deterministic regression tests because no live multi-role account was fabricated for verification.
- Visual inspection found and fixed an overflowing long administrative sidebar by making the navigation rail independently scrollable; the final rebuilt image includes that correction.

## Completion boundary

Phase 29 completes the planned initial MVP sequence. Deferred Phases 19–23 remain unimplemented Post-MVP modules and must still be started only by explicit instruction.

## Post-completion manual-testing correction — 2026-08-26

Manual MVP testing found that the frontend incorrectly treated broadly shared permissions such as Dashboard, Notifications, and Calendar as proof of Administration application access. Because all built-in roles receive some of those permissions, portal-only accounts could enter the Administration route group and briefly mount its shell before redirection.

Application discovery now uses the existing role-backed application assignments for Administration, combined with the existing role-and-permission checks for Teacher, Student, and Parent portals. The same centralized resolver supplies normal login, session bootstrap, forced-password-change completion, switcher options, and unauthorized-route fallback. Administration route protection now sits above `AppShell`, single-experience accounts render no switcher, and an account with no application assignment receives a neutral access message instead of the Administration shell. No API, schema, permission grant, or authentication behavior changed.

### Administration workspace consistency correction — 2026-08-26

Grade Review and Workforce now reuse the enhanced Students directory presentation for page hierarchy, integrated search and filters, responsive record tables, status treatments, loading and empty states, and bounded pagination. Employee Attendance reuses the enhanced Student Attendance workspace presentation for its date range, employee/status filters, holiday context, record table, time display, and responsive behavior. Existing grade workflow actions, employee profile and configuration workflows, protected HR access, manual attendance capture, permissions, API contracts, and domain-specific rules are unchanged.
