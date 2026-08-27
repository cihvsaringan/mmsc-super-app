# Post-Phase-29 Extension — Attendance Terminal Multi-Session Processing

Implemented on 2026-08-26 as a focused Attendance Terminal and attendance-session enhancement. Deferred roadmap phases were not started.

## Model and processing

Student and Employee attendance continue using `student_attendance_records` and `employee_attendance_records`; each row now represents one session rather than the only daily record. `attendance_terminal_events` remains the immutable/idempotent capture receipt and now records accepted `time_in` or `time_out` direction.

The server sorts each synchronization batch by original capture time, locks the authoritative person/date sequence, rejects accepted scans less than one minute apart, derives the next direction from the latest accepted event, inserts TIME IN sessions, and closes the latest unmatched session on TIME OUT. Direction is shared across terminals and never trusted from Web-2. The existing terminal/device event ID remains the retry boundary.

Web-2 stores synchronized last direction/time in the existing credential cache DTO and combines it with queued captures for offline prediction. Local sub-minute duplicates are rejected before enqueue. Online results use the authoritative receipt. IndexedDB version, trusted device, configuration, credential store, and attendance queue stores are unchanged.

## Verification

- Migration 0037 applied; 31 migration files validated.
- Live temporary-data Student sequence: TIME IN, two duplicates, TIME OUT, TIME IN, TIME OUT, TIME IN, TIME OUT; three completed sessions.
- Live temporary-data Employee sequence submitted in reverse order: server processed TIME IN/OUT three times chronologically; three completed sessions.
- Live two-terminal sequence: Terminal A TIME IN, Terminal B TIME OUT.
- Live concurrent two-terminal scan: one TIME IN accepted, one duplicate rejected.
- Live idempotent retry returned the original accepted TIME IN receipt.
- API: 44 files, 194 tests passed. Administration: 18 files, 62 tests passed. Web-2: 3 files, 14 tests passed.
- Temporary credentials, device, terminal events, and session rows were removed after verification. Existing provisioned PWA/device data and attendance records were not changed by cleanup.

This Phase 29 Attendance Terminal multi-session extension is complete. The next planned roadmap phase remains unchanged, but it has not been started.

## Synchronization conflict correction — 2026-08-26

The reported `CONFLICT` was reproduced as PostgreSQL `23505` on `student_attendance_open_campus_session_key` (`student_attendance_records(enrollment_id, attendance_date)`). The constraint itself was correct: the affected Student already had one open session. The sequencer ignored pre-enhancement accepted receipts because their new `attendance_direction` column was null, inferred another TIME IN, and attempted to create a second open session.

The server now falls back to the authoritative open Student/Employee session when no preceding directional receipt exists, includes legacy accepted receipts in the one-minute duplicate check, and serializes capture IDs before checking for prior receipts. Replays return `already_processed`; expected rejections are final per-capture results; unexpected terminal-sync uniqueness errors are logged with PostgreSQL constraint metadata and returned as `ATTENDANCE_PERSISTENCE_CONFLICT` rather than generic `CONFLICT`. Web-2 removes accepted/idempotent receipts and permanently finalizes domain rejections instead of retrying them.

Live verification recovered the reported capture as TIME OUT and its exact retry returned the same stored receipt with one terminal event. Temporary-data verification produced two Student sessions, three Employee sessions, chronological offline OUT/IN reconciliation, and an idempotent retry. Automated Web-2 tests confirm both already-processed and duplicate receipts reduce the pending queue to zero. No accessible installed-PWA browser session was available to inspect the operator device's existing IndexedDB badge directly.

This Phase 29 Attendance Terminal multi-session synchronization correction is complete. The next planned roadmap phase remains unchanged, but it has not been started.
