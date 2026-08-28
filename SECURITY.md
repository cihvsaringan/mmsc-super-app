# Security

## Registration activation and Admission files

Public draft creation requires an enabled registration period for the submitted authoritative School Year and returns the expected `REGISTRATION_CLOSED` business error otherwise. Public status access remains token-bound. Staff activation and intake use existing Admissions permissions; Under Review edits and document mutations require `admission.review`, while protected document reads require `admission.view`. Files remain MIME/signature/size validated, randomly keyed, path-confined, and unavailable through permanent public URLs.

## Phase 20 manual credential hardening

Visitor scan values are normalized and digested server-side through the shared Credential resolver, never returned, stored in Library, or written to audit metadata. Only active, unexpired RFID/barcode records proceed. Revoked, inactive, lost, replaced, suspended, or expired records are rejected before identity use. `library.visitors.log` remains mandatory, and Student/Employee eligibility is checked after resolution. Library audit actions use the lowercase dotted format enforced by the immutable audit table.

## Phase 20 final Library controls

Every Library route retains `library.portal.access` plus its granular permission. Reports require `library.reports.view`; CSV additionally requires shared `report.export`, preserves server-side filters, caps output, and excludes unnecessary sensitive columns. Report ranges are validated and bounded. Student My Library derives the Student from the session, Parent Child Library rechecks the active Guardian relationship, and patron/copy/loan identifiers do not bypass mutation permissions or transactional state checks. Library visitors never write Attendance. Audit metadata excludes raw credentials, authentication secrets, and unnecessary PII.

## Phase 20 Group 6 overdue and portal controls

The librarian queue and reminder action use separate `library.overdue.view` and `library.overdue.manage` permissions. Student Library data is resolved only from the authenticated User's Student relationship; the Parent endpoint revalidates its Guardian–Student relationship server-side and returns 404 for unrelated children. Reminder recipients are authoritative Student Users and communication-enabled linked Guardians, with idempotent dispatch and centralized audit records. Raw credentials, internal identities for unrelated patrons, fines, and payment data are not exposed.

## Phase 20 Group 2 catalog controls

Catalog reads require `library.catalog.view`; copy detail/lookup also requires `library.copies.view`. Bibliographic/classification writes require `library.catalog.manage`, while copy creation, metadata changes, and controlled status changes require `library.copies.manage`. The server normalizes identifiers, validates payloads and UUIDs, parameterizes values, enforces optimistic versions, and rejects direct checked-out/reserved transitions. Unique indexes close concurrent duplicate races. Title/copy audit metadata contains identifiers and changed field names, not patron data.

## Phase 20 Group 1 Library boundary

Library entry requires the authenticated session and `library.portal.access`; each API and frontend route also requires its granular Library permission. Role assignment through centralized Security & Access is the only activation mechanism. Settings writes accept only validated circulation defaults, use parameterized SQL and a transaction, and append `library.setting.changed` audit metadata without PII. Dashboard entry appends `library.portal.access_used`. Future patron responses must remain least-data and resolve only from authoritative Student/Employee and centralized Credential services; Attendance transaction data is outside the Library boundary.

## Phase 19 Group 3 consultation boundary

Consultation detail and the daily log require `clinic.portal.access` plus `clinic.encounter.view`. Visit creation, clinical updates, interventions, Guardian contact/follow-up completion, and disposition require `clinic.encounter.manage`. Dispensing additionally requires `clinic.inventory.manage`; stock discovery requires `clinic.inventory.view`. Guardian identifiers are accepted only after validating the active canonical Student relationship. Completion audit metadata contains disposition and boolean workflow outcomes, not clinical notes.

## Phase 19 Group 2 health-record boundary

Every Student Health Record endpoint requires `clinic.portal.access` plus `clinic.health_records.view` or `clinic.health_records.manage`. View-only users cannot mutate records. School Administrator does not receive either detailed clinical permission by default, and Administration Student pages contain no added EHR content. Mutations use optimistic versions and recoverable archival where applicable. Audit metadata records operation and changed-field names without copying sensitive narrative values.

## Phase 19 Group 1 Clinic boundary

Every `/api/v1/clinic/*` request first requires `clinic.portal.access`. Dashboard, queue, student lookup, EHR, encounter, inventory, appointment, follow-up, reporting, and configuration surfaces then require their granular Clinic permission. Frontend route and navigation checks mirror these rules for usability but are not the security boundary. Clinic Staff is operational and least-privilege; it does not receive `clinic.config.manage` by default.

## Clinic portal access through RBAC

Portal eligibility remains derived from centralized roles and permissions rather than a second per-user application registry. Clinic requires `clinic.portal.access` at both the frontend `/clinic/*` route boundary and every `/api/v1/clinic/*` API boundary, followed by the granular `clinic.*` permission required by each operation. The default Clinic Staff role includes the portal permission and its intended operational grants; Super Administrator receives Clinic permissions through the existing all-permissions semantics.

## Phase 19 clinical confidentiality

Clinic application access, EHR reads/writes, encounters, inventory, appointments, reporting, and configuration use separate server-enforced permissions. School Administrator receives governance and high-level report access but no automatic detailed EHR permission. Search is limited to actively enrolled Students; Guardian contacts require an authoritative active relationship. Audit metadata identifies actions and targets without copying clinical notes, and Parent/Student delivery uses privacy-safe centralized notifications rather than exposing internal consultation records.

## Attendance Terminal device boundary

The terminal runtime stores no administrator password or ordinary User token. A short-lived, single-use, terminal-bound code creates one revocable device identity. The raw credential is returned once and kept in the PWA's IndexedDB; the API stores only its digest. `Authorization: Device` is limited to bootstrap, the minimum credential snapshot, heartbeat, and idempotent attendance synchronization.

## Standalone Attendance Terminal trust boundary

The kiosk’s separate origin changes deployment scope, not authority. Fresh provisioning requires a User with `attendance.terminal.operate`; the password goes only to centralized authentication and is not stored by the terminal. The one-time device secret is stored in IndexedDB and represented server-side only by a digest. Revocation, terminal status, credential eligibility, Philippine school-day policy, idempotency, and attendance writes remain API-authoritative.

Development CORS allows both `http://localhost:15173` and `http://localhost:15174`. Production requires HTTPS and explicit deployed origins. The kiosk service worker must not cache API responses or broaden the minimal offline identity dataset.

Credential lifecycle writes require `credential.manage`, use optimistic version checks and explicit state transitions, and atomically record previous/new status audit metadata with the mutation. Known missing-record, version-conflict, duplicate, and invalid-transition conditions return domain errors; unexpected failures log request, actor, credential, target state, and database code without raw credential material.

Credential issuance rejects expiration timestamps that are not in the future. Web-2 distinguishes not-found, lifecycle-status, expiration, and owner-eligibility rejection reasons in safe local diagnostics; it logs credential/owner identifiers but never the scanned RFID/QR value or digest.

## Offline Attendance Terminal boot boundary

An initialized terminal uses a random, revocable device credential instead of a cached operator identity. Only its digest is stored server-side; the one-time plaintext value is retained in managed IndexedDB. The credential is accepted only for terminal validation, minimal credential-cache synchronization, and attendance synchronization. HTTP 401/403 pauses capture; transport failure preserves locally authorized offline capture and pending events. API and managed-media responses remain excluded from service-worker caching.

Offline Manual Verification may search the minimal cached identity index and enqueue a normal Time In against its canonical cached identity reference. It cannot edit times, delete attendance, change eligibility, register credentials, or access Administration. The server revalidates the identity and current eligibility before accepting the synchronized event.

## Academic Assignment mutation boundary

All Assignment reads continue to require `academic.assignment.view`; creation, update, reassignment, and archival require `academic.assignment.manage`. The API validates School Year, Grade Level, curriculum Subject, Section, active Teacher profile/Employee, and Teacher School-Year placement scope. Teacher changes audit previous/new placement IDs and roles. Closed School Year records are read-only on the server, independent of UI state.

## Academic lifecycle authorization

School Year detail requires `academic.config.view`, activation requires `academic.config.manage`, and lifecycle changes are enforced on the server. Calendar arrays are omitted without `academic.calendar.view`; lifecycle history is omitted without `audit.view`. Clients cannot select a creation status or mutate School Year status through the generic update endpoint. Every successful activation is audited, including the automatic closure of the previously Active year, under the authenticated actor and correlated request.

## Post-Phase-29 Teacher workspace stabilization

Teacher list/detail and mutations retain server-side Teacher permissions. Eligible-Employee lookup requires `teacher.profile.manage`, excludes inactive employment states, and duplicate specialization is checked again inside the creation transaction. Qualification, School Year placement, Academic Assignment, and audit arrays are independently removed when their view permissions are absent. Employee-owned data is read-only in Teachers, portal provisioning stays in Security & Access, and Teacher archival/deactivation does not delete or deactivate the Employee or centralized User.

## Post-Phase-29 Enrollment completion boundary

Queue and review reads require `enrollment.view`; confirmation requires `enrollment.manage`. Approved Grade and School Year are not client-editable during completion. The server revalidates approved Admission state, existing Student ownership for returning applicants, active Section scope, configured curriculum, duplicates, and Enrollment status under row lock. The legacy Admissions conversion route no longer creates SIS records. Completion remains audited and does not provision portal credentials.

## Post-Phase-29 public Admissions stabilization

The `/register` correction preserves strict Zod validation, consent, token-digest storage, token expiry, generic returning-student verification failures, rate limits, upload signature/size controls, and public-safe responses. Returning lookup is constrained by Student Number, birth date, optional LRN, and the selected MMSC school; it never exposes a student directory. Known placement, verification, duplicate, and lifecycle failures now return safe business errors while unexpected database errors retain correlation-aware server logging.

## Phase 29 extension — workspace and navigation boundaries

Application-workspace discovery is separate from Employee position. Administration requires at least one granted Administration capability; Teacher, Student, Parent/Guardian, and Attendance Terminal experiences retain their role relationship plus access permission. One User may satisfy several workspace predicates without another account or session. Navigation omits unauthorized items and empty groups, while direct routes and APIs keep their existing server-side guards.

Future operational workspaces must be added only with an implemented route and centralized access grant. A sidebar or switcher entry never grants access.

## Phase 29 extension — Security & Access operations UI

The four `/security` tabs are independently permission-scoped: Accounts requires `security.user.view`, Roles and Permissions requires `security.role.view`, Portal Activation requires `security.account.provision`, and Recent Security Activity requires `audit.view`. The page route and sidebar are available when any one of these permissions exists, but client visibility is never treated as authorization; each existing endpoint retains its server-side permission middleware. Mutations continue to require their narrower management permissions.

Portal enable/disable uses the existing centralized Teacher, Student, or Parent/Guardian role assignment. It does not create portal-local credentials. Recent activity shows action, actor, target, result, source IP when recorded, and timestamp; the API omits audit metadata and all password/session/credential material.

## Phase 29 experience boundary

Frontend experience discovery requires both the matching role and access permission so a broad permission grant cannot invent a linked Teacher, Student, or Guardian identity. This is navigation hardening, not a replacement for API authorization: every destination retains its existing server-side permission and identity-scope checks. Unauthorized or unknown browser routes return to the account's valid home experience without exposing a different application shell.

## Phase 28 operational administration

`administration.operations.view` protects the aggregated control-plane read; `administration.operations.manage` independently protects maintenance. Returned audit failures omit private metadata, and operational counts contain no credentials, tokens, or sensitive person details. Stale-session closure requires an exact confirmation value, uses a transaction, cannot revoke valid active sessions, and records operator plus affected count in the immutable audit trail. School Administrator manages, Principal is view-only, and Super Administrator inherits both permissions.

## Post-Phase-26 authentication identity stabilization

Email is no longer accepted at login. One generic resolver uses globally unique normalized aliases and applies User plus authoritative person eligibility before password verification. New accounts receive random one-time temporary credentials, store only scrypt hashes, and remain behind a non-bypassable password-change gate. `security.user.change_password` protects administrative replacement; it revokes the target's sessions and audits no secret material. Recovery requests are enumeration-safe, but email delivery/reset tokens remain deferred until outbound infrastructure exists.

## Phase 26 controls

Unsafe browser requests must originate from `CORS_ORIGIN` and cannot declare cross-site fetch metadata. API responses are non-cacheable. Login and public Admissions are throttled; account lockout remains persistent. New passwords require uppercase, lowercase, number, symbol, and 12+ characters. Users retain at most five active sessions. Admissions files require matching signatures and request IDs accept bounded safe characters.

`TRUST_PROXY` defaults false. Enable only behind one controlled proxy hop. Multi-replica production requires shared/edge throttling.

## Phase 25 reporting authorization

All reports require `report.view`; CSV additionally requires `report.export`. Names are allowlisted and date intervals validated server-side. Deferred domains are excluded.

Terminal setup uses centralized authentication plus `attendance.terminal.operate`; administration uses `attendance.terminal.manage`. Runtime validation, cache refresh, and sync may instead use the separately revocable terminal device credential. Lifecycle/session/sync actions are audited, and disabling or revoking ends active sessions.

Credential lifecycle administration uses `credential.manage`, returns masked suffixes after issuance, and audits registration, activation, deactivation, loss, replacement, and revocation without raw credential material. Generated QR values are random opaque identifiers displayed once. A terminal cache synchronization requires an active operator-owned terminal session and exposes only digest lookup, canonical identity reference, display number/name, optional managed-photo reference, credential/eligibility status, last attendance date, and synchronization cursor. Offline storage excludes passwords, sessions secrets, administrator tokens, complete Student/Employee records, academics, HR details, medical data, and financial data.

After one successful authenticated provisioning, the dedicated terminal route retains its versioned device configuration and one-time-issued terminal credential in IndexedDB. It never constructs a User or grants another application experience. Reconnection validates the device credential; rejection pauses capture, while transport failure leaves locally queued scans intact. Server synchronization still revalidates the enabled terminal, active device session, scanned credential, eligible identity, school day, and idempotency key.

## Post-Phase 24 logout and account-creation stabilization

Logout continues to revoke the HTTP-only server session before clearing local authenticated state. After successful revocation, the client replaces any protected experience URL with `/` and triggers router synchronization, preventing stale `/teacher`, `/student`, `/parent`, administrative, terminal, or operations paths from remaining visible. Account creation retains server-side validation and database uniqueness; the frontend now consumes the returned created account before refreshing instead of misreporting a successful transaction as a failure.

## Phase 24 calendar visibility

`calendar.experience.access` protects the shared calendar routes and is granted through centralized roles. The API—not the route shell—controls publication visibility: users without `academic.calendar.manage` can retrieve only published, non-archived events. Calendar managers may preview other lifecycle states and continue to create or change records only through the separately protected, audited Academic Calendar management endpoints. Date, type, Campus, and School Year filters are validated server-side.

## Phase 18 attendance operations controls

`attendance.operations.view`, `attendance.identity.lookup`, `attendance.manual.capture`, and `attendance.exception.resolve` separate workspace visibility, limited identity search, capture, and exception disposition. Lookup returns only identity and eligibility fields needed for verification. Every capture revalidates the registered active terminal and authoritative Student Enrollment or Employee status, and records the authenticated operator. Client event IDs provide retry idempotency; database history and security audit entries are immutable. Resolution requires its own permission and preserves resolver, timestamp, notes, and prior state.

## Phase 17 notification authorization

`notification.inbox.access` permits access only to recipient rows matching the authenticated `user_id`; the API accepts no alternate inbox owner. `notification.manage` separately protects context, draft creation, and publication. Audience identifiers are validated against active authoritative records before storage, publication uses a transaction and optimistic version check, and internal action URLs cannot point to an external origin. Grade Level and Section targeting reaches only actively enrolled Students and communication-enabled Guardian relationships with active linked accounts.

## Phase 16 guardian isolation

`parent.portal.access` protects the Parent / Guardian Portal. The backend derives Guardian identity from the session, never accepts a Guardian ID, and rejects any child or Enrollment not reachable through that Guardian's active `student_guardians` relationships. Grades require a published or locked Gradebook. Responses omit LRN, addresses, internal notes, other Guardians, audit records, and unrelated Students.

## Phase 15 public intake boundary

Public Registration routes are mounted separately before authentication and cannot invoke privileged Admissions review or conversion endpoints. Access requires both a public application reference and a 256-bit resume token; only its SHA-256 digest is persisted, tokens expire after 30 days, and invalid access returns one generic response. Endpoint-specific request counters limit creation, status, resume, submission, and upload attempts. Uploads are memory-limited to 8 MB and allowlisted to PDF/JPEG/PNG; storage keys are server-generated. Public DTOs exclude Registrar notes, duplicate candidates, staff history, audit data, and unrelated applicants.

## Phase 15 admissions controls

`admission.view`, `admission.manage`, `admission.review`, and `admission.convert` separate queue access, intake, decisions, and SIS conversion. Registrar and School Administrator receive these grants. All writes are validated server-side; workflow transitions are allowlisted, version checked, audited, and preserved in immutable status history. Duplicate matching exposes only the minimum existing Student identity required by Registrar staff.

## Phase 14 terminal controls

Terminal operation, device administration, and credential issuance use separate server-side permissions. The restricted Attendance Operator receives only terminal operation (plus the existing dashboard baseline). Scanned credential values are hashed before lookup or durable persistence; audit records capture synchronization without the credential secret. Registered active terminals are required and student eligibility is resolved from authoritative Enrollment data.

## Phase 27 PWA boundaries

The service worker never intercepts or caches API or managed-media requests. Cached navigations contain only the static React application shell; authentication, authorization, identity resolution, attendance eligibility, and receipt acceptance remain server-side. The terminal's IndexedDB queue contains only pending attendance capture events and is not a permanent Student or Employee directory. Managed kiosk profiles still require physical access controls, disk encryption, browser-profile protection, HTTPS outside localhost, and secure sign-out/retirement procedures. A queued capture is not authoritative until the existing server sync contract accepts it.

## Phase 13 student isolation

`student.portal.access` protects the Student Portal. Requests derive identity from `students.user_id`, validate enrollment ownership, expose no arbitrary Student ID, and return grades only when their gradebook is `published` or `locked`.

## Phase 12 grade confidentiality

Teachers encode and submit only their own teaching assignments. Review, publication, locking, and reopening use separate permissions. Published or locked records cannot be edited, and every grade save and workflow transition is audited.

## Phase 11 teacher scope

`teacher.portal.access` protects dedicated portal endpoints. Every query resolves the authenticated account's linked Employee and active Teacher profile, then restricts years and classes to its academic assignments. Roster results expose no guardian data, LRN, broad SIS directory, or HRIS controls.

## Implemented foundation

- Helmet security headers and disabled Express signature
- explicit configured CORS allowlist and 1 MB JSON request limit
- request correlation IDs and structured logs with credential-field redaction
- configuration schema validation; `.env` and secrets excluded from version control
- generic internal errors that do not expose stack traces
- typed anonymous request context ready for centralized authentication
- minimal container runtime surface and no embedded production credentials

The Compose password is a documented local-development default and must be replaced outside local development.

## Authentication model

- Local account emails are normalized and unique among non-archived accounts.
- Passwords require at least 12 characters and are stored as random-salt scrypt hashes; plaintext is never persisted or logged.
- Five failed attempts create a 15-minute lock. Login responses remain generic to reduce account discovery.
- Sessions are 256-bit opaque tokens. Only SHA-256 digests are persisted; cookies are HTTP-only, SameSite Strict, path-scoped, expiring, and configurable as Secure.
- Password changes revoke every other active session. Account deactivation revokes every session.

## Authorization model

Permissions follow `<resource>.<action>` and are checked in API middleware. Roles aggregate permissions, users may have multiple roles, and the frontend uses grants only for presentation. Phase 5 independently grants student profile view/manage/archive, student sensitive view/manage, guardian view/manage, and guardian-relationship management. The Super Administrator permission set and the last active Super Administrator are protected against accidental removal.

Phase 6 adds separate `enrollment.view` and `enrollment.manage` boundaries. Registrar and School Administrator receive both permissions; Principal receives view-only access. Enrollment detail reads and every mutation are audited without copying private student attributes into audit metadata.

Phase 7 adds `academic.assignment.view` and `academic.assignment.manage`. School Administrator and Principal may manage assignments; Registrar and Teacher receive view access. Assignment mutations are server-authorized and audited, and context responses expose only the minimum teacher placement identity needed for configuration.

Phase 8 separates `employee.attendance.view`, `employee.attendance.manage`, `employee.attendance.correct.request`, and `employee.attendance.adjust`. School and HR Administrators hold all four; HR Staff can view, record, and request corrections; Principal and Teacher can view and request corrections. Every mutation is audited and every applied adjustment keeps immutable before/after values.

Phase 9 uses separate `student.attendance.view`, `student.attendance.manage`, and `student.attendance.adjust` boundaries. School Administrator, Principal, and Registrar hold all three; Teacher receives view/manage foundations, pending assignment-scoped portal restrictions in Phase 11. Writes validate Enrollment and class ownership server-side, are audited, and corrections preserve immutable before/after snapshots.

Phase 10 adds `report.view`, `report.export`, `administration.settings.view`, and `administration.settings.manage`. Dashboard activity is omitted unless the caller has `audit.view`; CSV requires explicit export permission. School Administrator manages settings, while Principal, Registrar, and HR Administrator have report/export and settings-view access. Setting mutations are audited.

## Audit and boundaries

Login success/failure, logout, password change, user creation/status/role changes, and role/permission changes are persisted with actor, request, network, target, outcome, metadata, and timestamp. Database triggers reject updates/deletes. Logs redact authorization, cookie, password, and token fields.

The local Student lifecycle reset never mutates or globally purges `audit_events`. Because the immutable audit table retains its User foreign key, historical Student/Guardian Users are deactivated and archived rather than physically deleted. Their sessions, authoritative login identities, and role assignments are removed, leaving no usable portal access while preserving audit attribution. Production, remote databases, and unconfirmed execution are rejected before a connection is mutated.

Student directory summaries omit LRN, birth date, address, and contact details. Student profile reads and LRN access/mutations are explicitly audited, and LRN values never enter audit metadata. Guardian directory access and mutations are audited. Guardian data is returned on a student profile only with `guardian.view`; relationship changes require their own permission and enforce same-school ownership. Phase 6 enrollment access is separately authorized and audited; the API contains no class assignments, attendance, grades, medical, or portal data.

No default administrator exists. Bootstrap credentials must be supplied together through local environment variables and are never committed. Identifier values currently rely on database/storage encryption and deployment access controls; application-layer field encryption is deferred to security hardening. External SSO, MFA, password recovery email, student privacy, guardian isolation, grades, medical data, terminals, and wallet security remain deferred to their relevant phases.

Managed profile uploads require the existing Employee edit or Student profile-manage permission. The API limits files to 5 MB, allowlists JPEG/PNG/WebP MIME types, verifies actual image decoding, generates WebP variants with metadata removed, generates storage keys server-side, and never executes or trusts user filenames as paths.
# Post-Phase 29 external-school access

External Schools uses `reference.external_school.view` and `reference.external_school.manage`. School Administrators and Registrars can manage it; Principals can view it; Super Administrators inherit all permissions. Create/update actions use centralized audit logging. Academics authorization runs before the additional prohibition against creating or archiving MMSC.
## Trusted Attendance PWA registration

Fresh installations require a short-lived, single-use administrator-generated code plus successful centralized operator authentication and `attendance.terminal.operate`. Trust attempts are throttled, passwords are not persisted, plaintext registration codes are displayed once, and only credential digests are stored server-side. Installation credentials are purpose-limited and independently revocable. Loss of network is not revocation; an offline installation learns of revocation only when it reconnects.
## Trusted Attendance runtime authorization errors

Runtime failures distinguish missing/invalid trust, explicit revocation, missing assignment, inactive terminal, and assignment mismatch. A trusted installation never needs a second legacy terminal token. Synchronization uses the server-resolved assignment rather than trusting client-supplied terminal identifiers, and structured failures never log installation credentials or raw scanned credentials.
## Phase 19 Group 4 portal-safe Clinic delivery

Clinic notice publishing requires `clinic.portal.access` plus `clinic.notifications.send`. The API publishes only deliberately authored safe titles, summaries, and released instructions through shared Notifications. Student recipients are resolved from the canonical Student account; Guardian recipients and reads require active canonical relationships. Internal assessment, encounter notes, EHR detail, and audit payloads are never returned by Student/Parent Clinic endpoints.
## Phase 19 Group 5 administration and report boundaries

Clinic governance routes require `clinic.config.view/manage` without granting or requiring `clinic.portal.access`; normal consultations remain outside Administration. Operational inventory routes retain the Clinic Portal boundary plus `clinic.inventory.view/manage`. Clinic reports require `clinic.report.view`, with CSV additionally requiring the shared `report.export` permission. Administration report queries return aggregate dimensions and counts only and never select EHR detail, assessment, diagnosis, internal notes, or audit payloads.

## Phase 19 final authorization boundary

Clinic entry is derived only from centralized RBAC through `clinic.portal.access`; the rejected generalized application-access registry remains removed. Detailed EHR, encounters, inventory, appointments, notifications, reports, and configuration retain separate server-enforced permissions. Clinic Staff receives the intended operational grants, School Administrator receives governance and aggregate reporting without automatic detailed EHR access, and Student/Guardian reads remain constrained to deliberately released safe summaries and canonical relationships.
## Phase 20 Group 3 circulation controls

Patron and credential lookup require `library.patrons.view`; circulation reads and checkout/check-in/renew actions use their dedicated permissions. Credential scans are normalized and hashed before lookup, never returned, and excluded from audit metadata. Due dates, eligibility, copy state, active-loan state, and renewal limits are authoritative server decisions. Overrides additionally require `library.circulation.override`, a meaningful reason, and `CIRCULATION_OVERRIDE` audit evidence. Transactions and row locks prevent stale or concurrent operators from creating inconsistent copy/loan state.
## Phase 20 Group 4 policy enforcement

Only `library.settings.manage` may change borrowing rules; `library.settings.view` is read-only. Checkout and renewal resolve rules server-side and reject client control of due dates. Overrides cannot bypass unavailable physical states, require `library.circulation.override` plus a reason, and are audited. Policy changes and previous/new values are audited transactionally.
## Phase 20 Group 5 visitor controls

Visitor view, log, and report permissions are independent. Credential scans are digested and never returned or audited. Library visitor writes are isolated from every Attendance table and endpoint.

Lifecycle history does not authorize or suppress a credential by unordered row selection. The shared resolver deterministically selects an active, unexpired credential before historical inactive rows, while still returning inactive state when no current row exists. RFID/QR values remain strings, preserve case and leading zeroes, and are never exposed by visitor APIs. Analytics retains `library.visitors.reports`; scan/log retains `library.visitors.log`.
# Computer Laboratory access

Equipment reads and management use separate granular permissions. Assignment changes are available only through the server-side transactional transfer operation, which validates non-archived laboratory/workstation scope and writes both transfer history and centralized audit data. Generic metadata updates cannot bypass assignment history; retired/lost items cannot be reassigned.

Software inventory uses separate `computer_lab.software.view/manage` permissions. Assignment writes revalidate eligible software and workstations transactionally and use database uniqueness for concurrency. The schema deliberately has no product-key, activation-key, credential, token, script, remote-control, or endpoint-agent fields. Configuration statuses are manual administrative assertions, not automatically observed device state.

Computer Laboratory dashboard and reporting APIs require `computer_lab.dashboard.view` and `computer_lab.reports.view`. CSV additionally requires shared `report.export`, retains server filters, and is row-capped. These read models do not expose credentials or alter operational records, sessions, or official Attendance.

Issue and maintenance operations use separate granular view/manage permissions. Reporter and creator identities come from authentication; assignees and performers are authoritative active Employees. Lifecycle changes are server-controlled and audited. Workstation maintenance/offline actions are blocked while an active Student session exists.

The `/computer-lab/*` API requires `computer_lab.access` and a granular lab/workstation view or manage permission. Campus records remain authoritative, all mutations use the authenticated actor/request context and centralized audit log, and predictable validation/uniqueness failures use structured API errors.
# Computer Laboratory scheduling

Schedule reads require `computer_lab.access` plus `computer_lab.schedule.view`; mutations require `computer_lab.schedule.manage`. The server validates active authoritative Teaching Assignments and laboratories, serializes same-laboratory saves with a transaction-scoped advisory lock, detects laboratory/teacher/section collisions, and records lowercase dotted audit actions.

# Computer Laboratory sessions

Session reads require `computer_lab.sessions.view`; credential resolution and lifecycle operations require `computer_lab.sessions.manage`; schedule-priority exceptions additionally require `computer_lab.sessions.override` and a stored reason. Raw RFID/Barcode input passes only to the centralized resolver and is neither persisted nor audited. Start transactions revalidate enrollment, laboratory state, schedule, walk-in timing, and workstation occupancy. Partial unique indexes protect concurrent Student/workstation assignment. No session operation writes to official Attendance.
