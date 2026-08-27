# Phase 20 — Group 4: Borrowing Policies, Rules & Restrictions

Status: Completed on 2026-08-27. Phase 20 remains In Progress; Groups 5–7 have not been started.

## Policy hierarchy

The Library uses one institution-wide default policy from `library_settings` and optional overrides in `library_borrowing_policies` for Student, Teacher, and Employee. A disabled override falls back to the default policy. Migration defaults inherit the already configured loan period and renewal limit; they do not assert different patron-type rules as school policy.

Each policy controls maximum active loans, loan-period days, maximum renewals, grace-period days, and borrowing with overdue items. Teacher remains an Employee with an active Teacher specialization.

## Enforcement and dates

Checkout serializes operations for the patron, resolves the effective policy, verifies eligibility, borrowing limit, overdue restriction, and physical availability, then calculates `due_at` server-side. Lost, damaged, under-repair, withdrawn, reserved, and checked-out copies cannot be overridden. Errors include `LIBRARY_BORROW_LIMIT_REACHED`, `LIBRARY_PATRON_HAS_OVERDUE_ITEMS`, `LIBRARY_PATRON_NOT_ELIGIBLE`, and `LIBRARY_COPY_UNAVAILABLE`.

A loan is overdue only after `due_at + grace_period_days`; equality at the boundary is not overdue. Exact 24-hour days and `timestamptz` are used. Renewal applies the current policy and extends from the later of the current due timestamp or renewal timestamp. It rechecks eligibility, renewal limits, and applicable overdue restrictions.

Policy changes affect future checkout and renewal only and never rewrite stored active-loan due dates. Monetary fines, payments, cashier integration, and a generic rules engine are not part of this MVP.

## Settings, RBAC, and audit

Settings presents a Default Policy plus optional Student, Teacher, and Employee sections. `library.settings.view` is read-only; `library.settings.manage` permits saving. Transactional updates append `LIBRARY_SETTING_CHANGED` and `BORROWING_POLICY_CHANGED`. Operational bypass still requires `library.circulation.override`, a reason, and `CIRCULATION_OVERRIDE` evidence.

## Verification

- All 44 migrations validated and migration 0050 applied.
- Rollback acceptance passed patron policy slots, non-retroactive due dates, and grace boundaries; live effective-policy resolution passed.
- API typecheck, quiet lint, production build, and all 53 files / 258 tests passed.
- Web typecheck, quiet lint, production build, and all 27 files / 87 tests passed.

Phase 20 Group 4 is complete. The next planned group is Phase 20 Group 5, but it has not been started.
