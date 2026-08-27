# Phase 26 — Security Hardening

Status: Completed on 2026-08-20

## Delivered scope

- Unsafe-method browser-origin and Fetch Metadata enforcement.
- No-store policy across the versioned API.
- Login throttling keyed by IP and normalized account, complementing persistent account lockout.
- Reusable bounded limiter with expiry sweeping and `Retry-After`; public Admissions uses it too.
- Strong composition for newly created/changed passwords; existing login compatibility remains.
- Five concurrent active sessions maximum per user, enforced transactionally.
- Safe request-ID validation and PDF/JPEG/PNG admissions upload signature checks.
- Production-only HSTS/insecure-request upgrades and explicit single-hop `TRUST_PROXY` configuration.

Opaque hashed sessions, HTTP-only SameSite Strict cookies, optional Secure cookies, scrypt hashes, RBAC, portal scoping, audit events, size limits, and generic errors remain intact.

## Limitations

Rate limiting is process-local; multi-instance production requires shared edge/distributed enforcement. MFA, breached-password services, external identity, WAF/SIEM, SBOM/signing, penetration tests, and secret rotation need external infrastructure and are not claimed. Enable `TRUST_PROXY` only behind the controlled single-hop proxy. Phase 27 was not started.

## Verification

- 20 migrations validated; no migration required.
- API typecheck, lint, build, and 105 tests across 29 files passed.
- Five new tests cover origin rejection, no-store, request IDs, passwords, and throttling.
- Frontend typecheck, lint, production build, and 18 tests across 6 files passed.
- Rebuilt Docker services ran on isolated ports `15173`, `14000`, and `15432`; readiness and web returned HTTP 200.
- Live probes confirmed `no-store`/`no-cache`, development-safe CSP without HSTS or HTTP upgrade, HTTP 403 `UNTRUSTED_ORIGIN` for a hostile browser origin, and HTTP 200 for the configured superadmin login and authenticated `/auth/me` request.

Phase 26 is complete. The next planned phase is Phase 27, but it has not been started.
