# Phase 24 — Events and Calendar Experience

Status: Completed on 2026-08-20

The manual-test stabilization extension is documented separately in `PHASE-24-EXT-STABILIZATION.md` and does not alter Phase 25 status.

## Delivered scope

- One responsive Calendar experience available at `/calendar`, `/teacher/calendar`, `/student/calendar`, and `/parent/calendar` inside each appropriate application shell.
- Month and agenda views with previous/next/today navigation, event-type and Campus filters, current-day state, multi-day placement, event details, loading skeleton, instructive empty state, and mobile overflow handling.
- Permission-gated event creation for Calendar managers using the existing audited Academic Calendar API.
- Shared Calendar context and date-range endpoints backed by authoritative School Years, Campuses, and Calendar Events.
- Published-only visibility for non-managers. Calendar managers may preview planned, published, and cancelled records.
- Central `calendar.experience.access` role permission and navigation for staff, teachers, students, and parents.

## API

- `GET /api/v1/calendar/context`
- `GET /api/v1/calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD`

Optional validated filters are `eventType`, `campusId`, and `schoolYearId`. Existing `/api/v1/academics/events` endpoints remain the separately permissioned write boundary.

## Data and architecture

No migration was required. Phase 24 reuses `calendar_events` from migration `0004_academic_master_data.sql` and retains its School, Campus, School Year, Academic Term, lifecycle, archival, optimistic-version, and audit behavior. No role-specific event database or external provider was introduced.

## Explicit boundaries

- External Google/Outlook/ICS synchronization is not implemented.
- Private per-user or audience-targeted events are not introduced; published events are school calendar information.
- Automatic Notification Center publication is not implemented or simulated.
- Phases 19–23 remain deferred and no placeholder Clinic, Library, Laboratory, Credits, or Canteen calendar data was added.
- Phase 25 and later phases were not started.

## Verification

- Migration validation: all 19 existing migration files passed; no Phase 24 migration was required.
- Phase 24 repeatable seed: passed as `phase-24-events-calendar`.
- Backend typecheck and lint: passed.
- Backend tests: 95 passed across 28 files, including 4 Phase 24 route authorization/visibility/validation tests.
- Frontend typecheck and lint: passed.
- Frontend tests: 4 passed across 2 files.
- API and frontend production builds: passed; frontend transformed 1,715 modules.
- Docker services: API, web, and PostgreSQL running on isolated host ports `14000`, `15173`, and `15432`; PostgreSQL healthy.
- Live verification: API health 200, readiness 200, `/calendar` 200, and unauthenticated Calendar context correctly denied with 401.
- Authenticated verification: Super Administrator login, Calendar context, and August 2026 event query each returned 200 without creating fabricated events.
- Browser verification: the deployed Calendar route resolved through centralized session checking to the expected sign-in boundary without an authenticated browser session.

Phase 24 is complete. The next planned phase is Phase 25, but it has not been started.
