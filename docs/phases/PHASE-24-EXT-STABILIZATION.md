# Post-Phase 24 Stabilization — Manual Test Issues

Status: Completed on 2026-08-20

## Issue 1 — Security user creation false failure

Root cause: the frontend constructed `FormData` before the asynchronous POST but called `event.currentTarget.reset()` after the await. React no longer guaranteed a usable `currentTarget` at that point, so the account had already committed and returned HTTP 201 before the client threw a runtime error and displayed the fallback failure message.

Fix: capture the form element in a stable local reference before awaiting, consume the typed created-user response, reset and close the modal, insert the returned account idempotently into visible state, show success feedback, and refresh the authoritative list. Database uniqueness and the existing HTTP 409 conflict response continue to prevent duplicate email accounts on a real retry.

## Issue 2 — Logout protected URL

Root cause: centralized logout revoked the server session and cleared React authentication state but did not update browser history. The login screen rendered at the old protected path.

Fix: after successful server revocation, logout clears user state, replaces browser history with `/`, and dispatches router history synchronization. All shells use this shared logout function, so Teacher, Student, Parent, administrative, Attendance Terminal, and Attendance Operations routes behave consistently.

## Issue 3 — Attendance Verify Identity

The functional lookup flow is unchanged. Scoped CSS now provides a stable three-control grid, equal 42px control heights, minimum textbox width, consistent button alignment, readable placeholder contrast, a clear keyboard focus ring, and single-column stacking at narrow widths. No broader Attendance Operations redesign was performed.

## Issue 4 — Registration and Admissions

The authenticated Registrar workspace now has two explicit tabs:

- Application Queue contains search, status filter, result count, queue selection, review, transition, conversion, and history.
- Staff-assisted Application explains the assisted-intake purpose and initiates the existing new/returning Student form. Saved drafts return to the same Application Queue.

Public `/register` remains separate. Both experiences continue to use the same Admissions domain; no second queue or applicant database was introduced.

## Issue 5 — Student status validation

Root cause: the Student page always generated `status=${status}`. The “All statuses” option uses an empty string, which reached the backend as `status=` and correctly failed the canonical enum validator.

Fix: a centralized Student query builder now sends `status` only when it matches one of `prospective`, `enrolled`, `not_enrolled`, `inactive`, `graduated`, `transferred`, or `withdrawn`. Empty, `all`, display labels, and other unsupported values are omitted; backend validation remains strict.

## Database and API impact

No migration, schema, seed, or API contract change was required. Existing authentication revocation, Security user creation, Admissions, Student, and Attendance endpoints remain authoritative.

## Regression coverage

- User creation: successful POST closes the modal, renders the returned account without manual refresh, refreshes the list, and displays success.
- Logout: a simulated Teacher protected path becomes `/` and authenticated UI clears after server logout.
- Students: “All” and unsupported statuses omit the parameter; all seven canonical statuses and trimmed search serialization are covered.
- Admissions: Queue renders initially and Staff-assisted content renders separately after tab navigation.
- Existing Attendance backend coverage continues to verify the unchanged lookup/capture contract; production build and live visual inspection cover the CSS-only adjustment.

## Verification

- Migration validation: all 19 existing migration files passed; no stabilization migration was required.
- Backend typecheck, lint, and production build: passed.
- Backend tests: 95 passed across 28 files.
- Frontend typecheck, lint, and production build: passed.
- Frontend tests: 18 passed across 6 files.
- Docker services: API, web, and PostgreSQL running on isolated ports `14000`, `15173`, and `15432`; PostgreSQL healthy.
- Authenticated live checks: login 200; Student directory without status 200; canonical `prospective` filter 200; Admissions queue 200.
- Deployed frontend routes: `/security`, `/students`, `/admissions`, and `/attendance-operations` each returned 200.
- Manual-test issue verification: stable form reference and success state reviewed for user creation; centralized history replacement exercised by logout regression; Student URL serialization exercised for All and all canonical statuses; Admissions tabs exercised through DOM interaction; Attendance control layout verified through production compilation and responsive CSS inspection.

## Known limitations

- The staff-assisted application remains a modal because it is a complex multi-section entry workflow; the dedicated tab separates initiation and intent while preserving the established shared modal convention.
- No temporary real user or Admissions record is created during verification solely to prove UI behavior; deterministic regression tests cover those mutations without polluting school data.

Post-Phase 24 Stabilization is complete. Phase 25 — Reporting and Analytics Expansion remains the next planned MVP phase, but it has not been started.
