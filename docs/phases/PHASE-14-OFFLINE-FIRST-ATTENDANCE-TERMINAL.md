# Phase 14 — Offline-first Attendance Terminal

## Status

Completed

## Implementation

Added `/attendance-terminal`, a purpose-built touch-first PWA for rapid student and employee attendance capture. The experience provides registered-terminal selection, QR/RFID/NFC/barcode modes, immediate online/offline and accepted/rejected feedback, a durable browser retry queue, automatic reconnection sync, and manual retry.

The shared API registers terminal devices, issues centralized person credentials, resolves credential digests to authoritative Student or Employee identities, checks active credentials and Student enrollment eligibility, and transactionally creates or updates the appropriate attendance record. Stable client event UUIDs and a per-terminal unique constraint make batch retries idempotent. Terminal events retain accepted and rejected receipts and each batch is audited.

## Security and Data

The phase adds `attendance.terminal.operate`, `attendance.terminal.manage`, and `credential.manage`. A restricted Attendance Operator role receives operation access; administrators separately control terminal registration and credential issuance. Only SHA-256 credential digests and a short display suffix are stored in PostgreSQL. The temporary offline queue is stored in the browser profile and deleted after successful synchronization; production terminal devices must use managed kiosk profiles, disk encryption, HTTPS, and physical access controls.

## Operations

Run migration `0015_attendance_terminal.sql` and the Phase 14 seed. An administrator must register at least one terminal and issue credentials through the protected API before scanning. The terminal is served at `http://localhost:15173/attendance-terminal` in the isolated MMSC Docker stack.

## Known Limitations

Phase 14 provides browser keyboard-emulation support for scanners; vendor-specific USB, serial, NFC, and RFID drivers remain device integration work. Terminal and credential administration currently use protected APIs rather than administrative screens. The offline queue uses browser local storage and is appropriate only for managed terminal devices; broader IndexedDB/background-sync hardening is Phase 27 PWA Optimization under the roadmap revision after Phase 14. The attendance rule treats the first daily scan as time-in and later scans as the latest time-out.

## Verification

- Migration `0015_attendance_terminal.sql` applied and all 15 migration files validated.
- Phase 14 seed completed successfully and preserved the temporary bootstrap administrator.
- Backend and frontend typechecks passed.
- Backend and frontend lint passed after adding explicit service-worker browser globals.
- Backend tests: 71/71 passed across 22 files, including three terminal route tests.
- Frontend tests: 4/4 passed across two files.
- Backend and frontend production builds passed; Vite transformed 1,707 modules and emitted a 384.33 kB JavaScript bundle (104.26 kB gzip).
- Docker API, web, and PostgreSQL services are running on isolated ports `14000`, `15173`, and `15432`. The terminal route, manifest, service worker, health endpoint, and readiness endpoint each returned HTTP 200.

## Next Phase

The original next-phase statement was superseded by the roadmap reprioritization after Phase 14. The next planned implementation phase is now Phase 15 — Registration and Admissions, but it has not been started.
