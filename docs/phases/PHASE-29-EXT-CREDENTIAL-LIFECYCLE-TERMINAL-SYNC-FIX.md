# Post-Phase-29 Extension — Credential Lifecycle and Terminal Sync Fix

Implemented on 2026-08-26 as a focused correction to the existing Credential domain and standalone Attendance Terminal Web-2.

## Implemented

- Credential lifecycle controls are explicit non-submit buttons and call only the authoritative `POST /api/v1/credentials/:id/status` route.
- A committed lifecycle mutation is reported independently from the subsequent credential-list refresh.
- Replacement response state is read inside the same PostgreSQL transaction as the old/new credential updates and audit record.
- Web-2 manual synchronization now refreshes both the durable attendance queue and the complete minimal Student/Employee credential snapshot.
- Automatic credential refresh is bounded to five minutes; startup and reconnect refresh behavior remains intact and concurrent sync runs remain coalesced.
- IndexedDB schema, trusted device identity, terminal assignment, and pending attendance records are unchanged. Full snapshot replacement propagates new and lifecycle-changed credentials without clearing the attendance queue.

## Verification

- Follow-up inspection reproduced Deactivate, Mark Lost, and Revoke failures as PostgreSQL SQLSTATE `42P08`: `$2` was inferred as both `text` in the `CASE` comparison and `varchar` in the status assignment. The parameter is now explicitly cast, and all three transitions were executed successfully against PostgreSQL.
- Explicit transition rules now permit Active to Inactive/Lost/Replaced/Revoked, Inactive to Active/Revoked, and Lost to Active/Replaced/Revoked. Replaced and Revoked are terminal states. Invalid transitions return `CREDENTIAL_TRANSITION_INVALID` instead of `INTERNAL_ERROR`.
- Audit metadata records previous and new status. Unexpected repository failures log request ID, credential ID, action, actor, target status, exception, and database code without credential values.
- A live temporary-data trace returned an eligible Student RFID and Employee RFID from the same terminal snapshot with matching trim-only SHA-256 lookup digests. It also confirmed inactive, lost, and revoked states propagate in the snapshot. Temporary credential rows were removed afterward.
- The Employee snapshot name was initially empty because `concat_ws` on the null Student join produced `''` and won `COALESCE`; explicit owner branching now returns the authoritative Employee name.
- Live PostgreSQL inspection found 3 active eligible Student RFID credentials and 2 active eligible Employee RFID credentials; the cache query includes both authoritative owner types and all lifecycle states.
- Targeted API credential/terminal tests: passed (4 files, 16 tests).
- Targeted Web-2 scanner/sync tests: passed (2 files, 4 tests).
- Administration credential component tests: passed after correcting the test selector (4 tests).
- API, Administration web, and Web-2 TypeScript checks: passed.
- Follow-up full gate: 30 migrations validated; API 43 files/188 tests, Administration 18 files/62 tests, and Web-2 2 files/9 tests passed; all three typechecks, lint (one pre-existing Assignments hook warning), and production builds passed.

## Remaining live acceptance

No provisioned Attendance Terminal tab was exposed to browser control during the follow-up. The live PostgreSQL → terminal snapshot → normalized digest/cache-key trace passed, and IndexedDB replacement/lookup behavior is covered by the Web-2 code and regression suite, but the user's installed PWA IndexedDB contents and a physical RFID scan were not directly inspected. No re-registration, cache clearing, or queue reset was performed.

### Credential-not-valid follow-up

The two reported newly added RFID rows were both found, Active, correctly owned, returned by the terminal snapshot, and `eligible=true`. Their `expires_at` timestamps were 45 and 18 seconds earlier than `created_at`; Web-2 therefore reached its shared expiration check. Issuance now rejects a non-future expiration before opening a transaction, Administration prevents selecting the current/past minute and explains that expiration may be blank, and Web-2 returns `Credential has expired.` with safe `CREDENTIAL_EXPIRED` diagnostics.

A fresh non-expiring Student RFID and Employee RFID were each inserted temporarily, returned by the live terminal snapshot, matched after trim-only digest normalization, and passed Active/eligible/unexpired validation. Separate temporary Student credentials propagated Inactive, Lost, and Revoked states and were rejected. All temporary trace rows were removed afterward. The originally reported rows remain expired by their stored policy and require authorized replacement or a new credential with a future/blank expiration; the repair does not silently weaken existing expiration controls.

## Local RFID Test Reset

Added guarded `pnpm reset:test-rfid` and API `db:reset:test-rfid` commands. The reset removes only authoritative Student/Employee RFID credential rows after validating a non-production local `mmsc` database and an explicit confirmation token. Replacement links are detached before deletion; identities, attendance history/events, other credential types, logical terminals, devices, trusted installations, assignments/sessions, and the Web-2 attendance queue are retained.

The 2026-08-26 local reset removed 5 Student and 7 Employee RFID rows. Post-reset PostgreSQL verification reported zero Student RFID, zero Employee RFID, 2 retained Student attendance records, 61 retained Employee attendance records, 9 retained terminal events, 5 terminals, 4 devices, 8 trusted installations, and 13 terminal sessions. No provisioned terminal tab was exposed to automated browser control, so its IndexedDB refresh is not claimed; **Sync Now** on the actual terminal will consume the empty full snapshot and clear only its credential store.

This Phase 29 credential lifecycle and terminal synchronization fix is implemented and automated/live database verification passed, but installed-PWA IndexedDB and physical-reader acceptance remain open. The next planned roadmap phase remains unchanged and has not been started.
