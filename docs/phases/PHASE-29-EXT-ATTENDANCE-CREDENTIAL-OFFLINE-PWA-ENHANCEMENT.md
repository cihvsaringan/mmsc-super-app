# Phase 29 Extension — Attendance Credential, RFID/QR, and Offline PWA Enhancement

## Post-implementation Student Credential stabilization — 2026-08-26

The local PostgreSQL migration ledger stopped at `0031`, although the running API used the Phase 29 credential repository. Consequently, `GET /api/v1/credentials` selected missing `credentials.last_used_at`, and `POST /api/v1/credentials` inserted missing `credentials.updated_by`; PostgreSQL returned `42703 undefined_column`, which the centralized unexpected-error boundary exposed as `INTERNAL_ERROR`. Migrations 0032–0034 were applied transactionally and recorded with their repository checksums.

The Student Details UI already passes the authoritative `students.id` as `ownerId`; credentials belong directly to Student/Employee identities and do not require a portal User account. The existing SHA-256 digest, partial active uniqueness constraint, atomic audit transaction, masked list DTO, and Attendance Terminal lookup remain unchanged. Live verification returned an empty list for a Student with no credential, created one RFID credential once, refreshed it immediately, returned HTTP 409 for the duplicate, denied an unauthenticated read, and resolved the digest to Student `MMSC-2026-100082`. The isolated test credential was then revoked so no active test credential remains.

Stabilization gates passed: API and web typechecks; 173 API tests across 40 files; 62 web tests across 18 files; API and web production builds; and lint with no errors plus the pre-existing Assignments hook warning. The web build transformed 1,743 modules. The TSX migration check/apply commands were attempted but the bundled Windows Node runtime again failed before project code in `uv_os_get_passwd` with `ENOMEM`; the three SQL files were instead checksum-verified, applied transactionally through PostgreSQL, recorded in `schema_migrations`, and their expected columns were inspected live. Browser verification reached the local centralized sign-in boundary, but an authenticated UI walkthrough was not claimed because entering the administrator password through browser automation requires separate action-time authorization. Authenticated live API verification exercised the same Credentials panel endpoints.

## Status

Implemented on 2026-08-24. Automated verification passed. The extension is not marked Completed because a managed physical kiosk, USB RFID reader, USB QR reader, camera-capable device, installed-PWA restart, and authenticated disconnect/reconnect cycle were not all available for the required end-to-end operational test.

## Existing architecture found

Phase 14 already supplied centralized SHA-256 credential digests, registered terminals, Student/Employee resolution, terminal event receipts, and idempotent `(terminal_id, client_event_id)` processing. The Phase 24 extension added Campus-aware terminal registration and operator-owned terminal sessions. Phase 27 moved the pending event queue to IndexedDB, added background-sync handoff, cached the same-origin application shell and hashed assets, and split frontend routes. Before this extension, credential issuance was API-only, status values were limited, the browser stored no minimal credential index, HID capture required a focused form and a manually selected mode, repeated terminal scans wrote Time Out, no camera decoder existed, and result feedback contained only a message.

## Database changes

Migration `0032_attendance_credential_offline_enhancement.sql`:

- expands credential lifecycle status to active, inactive, lost, replaced, revoked, expired, and legacy suspended;
- adds credential `last_used_at`, required `updated_by`, replacement linkage, incremental-change and owner/status indexes;
- adds terminal-event `scan_source`, `synchronized_at`, and clock-offset metadata;
- indexes scan-source/time operations while preserving existing credential digest and terminal idempotency constraints.

No authoritative Student, Employee, Teacher, or attendance table was duplicated.

## Credential architecture

`GET/POST /api/v1/credentials` and `POST /api/v1/credentials/:id/status` manage the same credential records for Students and Employees. Teacher credentials attach to the underlying Employee. Values are normalized and hashed before persistence; list responses expose only the display suffix. Generated QR values are cryptographically random, returned once, and contain no personal information. The existing partial unique digest index rejects a credential assigned to more than one active identity, including Student/Employee conflicts, and the service converts concurrent unique violations to a stable conflict response. Registration and every lifecycle transition are audited.

The Student Details modal has a Credentials tab. Workforce Employee profiles expose the same reusable Credentials panel. Standard registration and replacement use the shared modal pattern.

## Scanner architecture

The terminal installs a document-level `HidScannerAdapter` while active. It buffers fast keyboard/HID input, accepts the reader's Enter terminator, rejects ordinary slow typing, and remains active while a result is visible. Cached credential type resolves ambiguous HID input to RFID or QR; prefixed RFID values are also recognized. Browser `BarcodeDetector` plus `getUserMedia` provides camera QR capture when the browser supports it. RFID, USB QR, and camera QR feed one `processScan` pipeline and retain `rfid`, `qr_scanner`, or `qr_camera` as the scan source.

## Offline PWA architecture

The `mmsc-attendance-terminal` IndexedDB database is version 2 with:

- `credential-cache`: digest-keyed minimal Student/Employee attendance identity data;
- `daily-attendance`: local first-Time-In markers used for duplicate prevention;
- `attendance-events`: durable, idempotent pending events with original capture time and source;
- `terminal-meta`: the incremental credential synchronization cursor.

The terminal cache endpoint requires an enabled terminal and active session and returns only opaque lookup digest, identity ID/type, number, display name, optional managed-photo reference, credential status, attendance eligibility, and last attendance date. It excludes academic, HR, medical, financial, password, token, and complete person data. Synchronization is incremental after the initial snapshot. Reconnect and Background Sync reuse the existing API contract; acknowledged IDs alone are removed. Service-worker cache v6 reads the Vite build manifest during installation and precaches the route/application shell plus every emitted hashed asset while excluding API and managed-media responses.

For an initialized installed kiosk to reopen without the API, the authentication provider retains a non-secret terminal-only operator snapshot containing display identity and only `attendance.terminal.operate`. It is considered only on `/attendance-terminal` while the browser is offline and registered terminal/session IDs exist. Reconnection revalidates the HTTP-only server session; rejection clears the snapshot and prevents synchronization. Offline captures are provisional until that server authorization succeeds.

## Attendance logic

The API derives the school day with PostgreSQL `Asia/Manila`, takes a transaction-scoped advisory identity/day lock, and checks the authoritative daily attendance row. With no row, it writes Time In using the original scan timestamp. With an existing row, it returns `already_timed_in` and does not update Time Out. Database daily uniqueness remains the final boundary. Offline processing checks both the last synchronized attendance date and durable local daily marker before queuing. Stable client event UUIDs preserve idempotency across network loss and restarts.

Each terminal event retains terminal/session, Campus through terminal registration, capture time, synchronization time, scan source, credential digest, identity reference when resolved, outcome, and estimated device/server clock offset. Terminal scan and sync actions are audited without raw credential values.

## Three-second result behavior

Successful and rejected scans immediately replace the Ready state. Results show the available managed photo, name, Student/Employee Number, Time In or Already Timed In, capture time, and source. One timer clears the result after 3 seconds. Every new scan cancels the prior timer, replaces the result immediately, and starts a fresh timer; scan intake is not disabled by result display or animation.

## Seed/demo data

The repeatable development seed assigns deterministic fake `DEMO-STUDENT-*` and `DEMO-EMPLOYEE-*` RFID/QR values to up to four existing Students and Employees when an actor User exists. Existing identities and credentials are preserved.

## Automated verification

- API typecheck: passed.
- Web typecheck: passed.
- API tests: 158 passed across 35 files.
- Web tests: 54 passed across 16 files.
- New tests cover Student RFID/QR and Employee RFID registration boundaries, lifecycle validation, terminal cache authorization, default QR source normalization, fast RFID input, ordinary-typing rejection, and consecutive HID scans.
- Static migration validation: all 25 SQL migration files are non-empty. The normal TSX migration validator could not start because the provided Windows Node runtime failed in `os.userInfo()` with `uv_os_get_passwd ENOMEM`; PostgreSQL migration application was not attempted because neither Docker nor `psql` is available in the session shell.
- API lint passed. Web lint passed with one pre-existing `Assignments.tsx` hook-dependency warning and no errors.
- API production build passed. Web production build passed after 1,741 modules transformed; the Attendance Terminal route chunk is 17.86 kB (6.10 kB gzip). The ordinary `dist` clean was denied by the workspace filesystem, so verification used a temporary project-local output directory and removed it afterward.
- Seed execution, authenticated browser/PWA behavior, and physical-device tests were not attempted because the database/container runtime and managed reader/camera kiosk were unavailable.
- In-app browser verification reached `http://localhost:15173/attendance-terminal`, rendered the centralized sign-in boundary, and reported no console warnings/errors. No test credentials were available, so the authenticated kiosk surface was not falsely claimed as visually or operationally verified.

## Remaining operational validation

Before production approval, test on the intended managed kiosk:

1. install and initialize the PWA online;
2. synchronize demo credentials and create one online Student and Employee Time In;
3. disconnect both WAN/API access, fully restart the installed PWA, and verify Student RFID plus Employee/QR-camera resolution;
4. scan rapidly, scan during the three-second result, and repeat the same identity;
5. restart again while pending, reconnect, and confirm original timestamps, one Time In per identity/day, source/terminal/Campus traceability, and queue acknowledgement;
6. test the actual USB reader models and camera browser because HID timing, prefixes, BarcodeDetector support, camera permission, and installed-PWA lifecycle vary by device.

Phase 29 Attendance Credential/Offline PWA Extension is implemented but not yet complete. The next planned roadmap phase remains Phase 30, but it has not been started.
