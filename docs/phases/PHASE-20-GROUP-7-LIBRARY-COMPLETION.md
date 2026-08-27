# Phase 20 Group 7 — Dashboard, reports, hardening, and completion

**Status:** Completed on 2026-08-27

## Final integration

- Completed the live Library dashboard with eight operational KPIs, bounded seven-day circulation activity, 30-day most-borrowed titles and categories, and alerts for lost, damaged, under-repair, and stale open visitor sessions.
- Added eight permission-scoped reports: Current Loans, Overdue Books, Borrowing History, Book Inventory, Lost/Damaged Books, Library Visitor Logs, Visitor Analytics, and Circulation Summary.
- Detailed reports are paginated. Date ranges are limited to 366 days and CSV exports are capped at 5,000 rows while retaining the submitted server-side filters.
- CSV requires both `library.reports.view` and shared `report.export`; viewing alone never authorizes export.
- Added responsive report navigation, semantic tables, labeled filters, useful empty/error/loading states, and existing MMSC Library visual conventions without redesigning other experiences.

## Hardening review

- Confirmed normalized unique accession and barcode indexes, one active loan per copy, active-loan due lookup, one open visitor session per person, visitor reporting indexes, and notification milestone uniqueness.
- Added targeted returned-loan, copy-status, and completed-visit reporting indexes in migration 0053.
- Library APIs retain the portal boundary plus granular server authorization. Student reads remain self-scoped and Parent reads remain Guardian-relationship-scoped.
- Reports select only operational fields needed for their purpose. Library visitor analytics remain explicitly separate from school Attendance.
- No fines, payments, holds, acquisitions, suppliers, stocktake, MARC, e-book, or RFID book-security features were introduced.

## Verification

- 47 migration files validated; migration 0053 applied successfully.
- Group 7 live PostgreSQL acceptance passed for all eight reports, the seven-day dashboard aggregate, ten critical indexes, and deferred finance absence.
- API and web TypeScript checks and lint passed.
- API: 54 test files and 270 tests passed after the manual-testing extension.
- Web: 29 test files and 89 tests passed.
- API and web production builds passed.
- The automated suite covers routing, multi-experience landing/switching, Library RBAC, circulation constraints, Student self-scope, Guardian relationship scope, visitor separation, report export authorization, and regressions across Administration, Clinic, Teacher, Student, Parent, Attendance, and Security surfaces. The manual-testing extension additionally exercised known active seeded Student and Employee RFID values against the live PostgreSQL repository and completed Entry/Exit without changing Attendance counts. An authenticated browser walkthrough with a physical reader was not possible because the in-app browser session had no authorized login credentials.

## Completed Phase 20 capabilities

Library Portal and RBAC; catalog and physical copies; authoritative patron/credential lookup; checkout, check-in, and renewal; borrowing policies and overrides; Library-owned visitor sessions; overdue management and Notifications; Student My Library; Parent Child Library; dashboard, reports, CSV exports, auditing, and security controls.

Phase 20 is complete. The next planned phase is Phase 21, but it has not been started.

## Manual testing extension — UI and visitor credentials

Manual review found that Library forms had accumulated page-specific native-control styling instead of consistently inheriting the current Administration/Clinic form vocabulary. A single Library-workspace control layer now standardizes text fields, search fields, textareas, selects, date controls, disabled/hover/focus-visible states, and button sizing while preserving scanner autofocus and Enter submission.

The Visitor scanner also duplicated credential hashing and lookup locally instead of using the centralized credential resolver. Resolution is now centralized over `credentials`, preserving case and leading zeroes while removing only surrounding whitespace and scanner CR/LF suffixes. Visitor scans accept active, unexpired RFID and barcode credentials linked to authoritative Students or Employees. Students must be unarchived and `enrollment_status='enrolled'`; Employees must be unarchived and `employment_status='active'`. Teachers continue to resolve as Employee specializations.

Live acceptance exposed a second transaction blocker: Visitor Entry/Exit used uppercase audit action names that violate the platform audit constraint requiring lowercase dotted names. Library visitor, circulation, settings/policy, and notification audit actions now use the compatible centralized convention. A known active seeded Student RFID and Employee RFID both completed Entry and Exit, including CR/LF scanner suffixes, while Student Attendance, Employee Attendance, and Attendance Terminal event counts remained unchanged.

Extension verification completed on 2026-08-27: 47 migrations validated; API and web typechecks, lint, and production builds passed; API 54/54 files and 270/270 tests passed; web 29/29 files and 89/89 tests passed; and the live Library credential acceptance passed. No database migration or schema change was required.

## Manual testing extension 2 — real credentials and visitor analytics

The real RFID failure was lifecycle selection, not hashing. Application-created RFID values can legitimately have an older revoked/replaced row and a current active row with the same digest. The shared resolver previously returned the database's unordered first match, so the seeded single-row credentials passed while a real reissued Student RFID selected its revoked history. Resolution now orders a current active, unexpired row first and otherwise returns the newest historical row for the existing inactive error contract.

Student Details and Employee Details both use `CredentialsPanel` → `POST /api/v1/credentials` → request validation → `CredentialRepository.register` → canonical normalization → UTF-8 SHA-256 digest → `credentials` with authoritative `student_id` or `employee_id`. Library Visitor now uses that same normalization/digest helper and accepts the UI's `rfid` and `qr` types, with `barcode` retained for historical compatibility. Surrounding whitespace and terminal CR/LF are removed; case, leading zeroes, internal characters, and string semantics are preserved. Existing digests required no migration.

Visitor Analytics failed with PostgreSQL `42601`: `hour` and `day` were used as unquoted output aliases. Both aliases are now quoted. Visitor daily filters, hourly buckets, and seven-day series use `(entry_at AT TIME ZONE 'Asia/Manila')::date`; the API accepts `YYYY-MM-DD`. Empty dates return zero summary metrics and empty series. Open visits count as currently inside and are excluded from average completed duration.

Live acceptance used pre-existing application-created Student credential `12ed54ed-451a-4cbf-bae3-effa60c5d417` (display suffix `567890`) and Employee credential `643395d6-dc7c-4552-b8d5-09c8ed52986c` (display suffix `789012`), each with inactive digest history plus a current active record. Raw credential values are deliberately omitted. Both resolved to the current authoritative owner and completed Entry/Exit. The acceptance also registered new Student and Employee RFID values through `CredentialRepository.register`, scanned the exact runtime values including leading zeroes and CR/LF, completed Entry/Exit, and revoked them through the official lifecycle service. Current/open and empty-date analytics succeeded, and Student Attendance, Employee Attendance, and Attendance Terminal counts were unchanged. No database migration or schema change was required.

Extension 2 completion gate: 47 migration files validated; API 54/54 files and 275/275 tests passed; web 29/29 files and 89/89 tests passed; API/web typechecks, package-scoped lint, and production builds passed; and the live PostgreSQL acceptance passed.
