# Phase 19 Extension — Portal Switcher and Clinic UI Stabilization

Status: Completed on 2026-08-27. This focused Phase 19 extension does not start Phase 20.

## Portal Switcher root cause

The experience registry stored Clinic's landing route as `/clinic/dashboard`. The former active-experience helper compared a location to that complete landing path. Therefore deeper Clinic locations such as `/clinic/students`, `/clinic/visits`, and `/clinic/inventory` did not match Clinic and fell back to the first Administration experience.

## Switcher fix

The available workspace list still comes exclusively from centralized RBAC. Active workspace selection now independently resolves from the current route namespace: `/clinic/*` selects Clinic, `/teacher/*` selects Teacher, `/student/*` selects Student, `/parent/*` selects Family, and Administration remains the fallback for Administration routes. Selecting an option still performs the explicit navigation; navigation within a workspace no longer recalculates from permission order.

## Clinic UI stabilization

Clinic Portal and Clinic Management forms now share the Administration control treatment: 42px minimum field height, common border/radius/padding, placeholder and disabled states, hover/focus feedback, visible keyboard focus, practical vertical textarea resizing, responsive two-column form collapse, and consistent label treatment. The shared CSS selector covers health records, allergy/condition/immunization/examination forms, new visits and consultations, medication/inventory workflows, appointments, follow-ups, reports, and Clinic settings/item-master modals without altering Administration behavior.

Operational Alerts retains the same cards and navigation targets but now uses `clinic-operational-alert-grid`: four balanced columns on desktop, two at 1000px and below, and one at 600px and below. Card content can wrap rather than force horizontal page overflow.

## Validation

- Focused Portal Switcher and Operational Alert tests: 3 files / 11 tests passed.
- Full web regression before the final test-only cleanup: 23 files / 77 tests passed.
- Web TypeScript and production build: passed.
- Web lint: zero errors; two pre-existing hook-dependency warnings remain in Assignments and Clinic Inventory.
- Manual browser login walkthrough was not performed because it would require transmitting a privileged test-account password through the browser. The route-switching, Clinic-only availability, deep-route state, form structure, and responsive-grid behavior are covered by the automated UI suite and CSS breakpoint rules.

## RBAC and scope

No role, permission, API authorization, or database change was made. `clinic.portal.access` and granular `clinic.*` permissions remain the sole Clinic access model. No application registry or second application-access source was introduced.

Phase 19 is complete. The next planned phase is Phase 20, but it has not been started.
