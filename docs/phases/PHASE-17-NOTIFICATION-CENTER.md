# Phase 17 — Notification Center

## Status

Completed

## Implementation

Added a centralized in-app Notification Center shared by the Administrative, Teacher, Student, and Parent / Guardian experiences. Each authenticated recipient has a personal inbox, unread count, All/Unread filtering, individual read state, and Mark all read. Internal action links can lead recipients to an authorized MMSC route.

Authorized publishers receive a publishing desk and the standard shared creation modal. They can create reviewed drafts and publish to all active users, a role, linked employees, linked teachers, enrolled students, linked Guardians, a Grade Level, a Section, or one active user. Publishing resolves the audience from authoritative platform relationships and materializes a deduplicated recipient set in one transaction.

Grade Level and Section targeting includes enrolled Students with linked accounts and active Guardians whose relationship receives communications. It does not create module-local people or contact lists.

## Data and Security

Migration `0018_notification_center.sql` adds notifications, declarative targets, per-user recipients/read state, and immutable lifecycle events. Published content and its recipient snapshot are preserved. Expired messages are excluded from active inboxes without deleting history.

`notification.inbox.access` is granted to built-in roles. `notification.manage` is granted to School Administrator and Principal; Super Administrator receives it through the existing complete permission grant. Inbox access is always derived from the authenticated user ID. A user cannot request another person's inbox or mark another person's recipient row read. Target keys are validated before draft creation, action URLs must be internal MMSC paths, and publishing uses optimistic version checks.

## Known Limitations

- Phase 17 provides in-app delivery only. Email, SMS, web push, and mobile push adapters are deferred and are not simulated.
- Delivery is a publish-time recipient snapshot. Accounts linked to an audience after publication do not retroactively receive that message.
- The initial publishing UI creates one audience target per draft; the API and schema support multiple deduplicated targets for future workflow expansion.
- Draft editing, scheduled publication, per-user inbox archive controls, templates, attachments, and delivery analytics are not included.
- Attendance operational alerts are not automated because Phase 18 has not started.

## Verification

- Migration `0018_notification_center.sql` applied and all 18 migration files validated.
- Phase 17 repeatable seed completed successfully.
- Backend and frontend typechecks and lint passed.
- Backend tests: 86/86 passed across 26 files, including four Notification Center route, permission, validation, and recipient-isolation tests.
- Frontend tests: 4/4 passed across two files.
- Backend and frontend production builds passed; Vite transformed 1,713 modules and emitted a 426.41 kB JavaScript bundle (112.54 kB gzip).
- Docker API, web, and PostgreSQL services run on isolated host ports `14000`, `15173`, and `15432`. All four notification SPA route groups, API health, and readiness returned HTTP 200; the protected inbox API returned the expected HTTP 401 without a session.
- Live browser inspection confirmed the notification route is served through the centralized MMSC authentication boundary.
- A live authenticated draft → publish → one-recipient inbox → mark-read exercise passed. Its temporary verification notification was expired and archived afterward; immutable lifecycle history was intentionally retained.

## Next Phase

Phase 17 is complete. The next planned phase is Phase 18, but it has not been started.
