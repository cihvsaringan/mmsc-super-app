---
target: authenticated admin dashboard and shared app shell
total_score: 17
p0_count: 0
p1_count: 3
timestamp: 2026-08-19T23-35-32Z
slug: apps-web-src-pages-dashboard-tsx
---
# MMSC Admin Dashboard Critique

Method: dual-agent (A: design_review · B: detector_evidence)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 2/4 | No freshness timestamp or retry; notifications expose no state. |
| 2 | Match system / real world | 2/4 | School terminology is sound, but `Phase 10` and ambiguous activity copy expose system language. |
| 3 | User control and freedom | 2/4 | Navigation exits are clear, but users cannot refresh/retry and denied routes silently return home. |
| 4 | Consistency and standards | 3/4 | Cohesive tokens and icons; an inert notification affordance and mixed card treatment undermine consistency. |
| 5 | Error prevention | 2/4 | Permission-aware navigation helps, but missing and restricted data are not distinguished. |
| 6 | Recognition rather than recall | 2/4 | Nav labels are explicit, but as many as 12 ungrouped destinations impose scanning and memory cost. |
| 7 | Flexibility and efficiency | 1/4 | No search, shortcuts, favorites, quick actions, bulk paths, or dashboard drill-downs. |
| 8 | Aesthetic and minimalist design | 2/4 | Orderly palette and spacing, but nine equal-weight panels and internal phase labeling dilute hierarchy. |
| 9 | Error recovery | 1/4 | Errors have no local alert semantics, retry, recovery advice, or stale-data fallback. |
| 10 | Help and documentation | 0/4 | No contextual help or task-focused guidance is visible. |
| **Total** | | **17/40** | **Poor — coherent shell, weak operational usefulness and recovery.** |

## Anti-Patterns Verdict

The interface has a moderate AI-template feel. The school crest, conservative palette, text-labeled navigation, and domain vocabulary create trust, but the composition is interchangeable with generic admin dashboards: repeated uppercase eyebrows, icon-and-number metric cards, equal white-card panels, and a development-facing `Phase 10` badge.

The deterministic scan found one `side-tab` warning at `apps/web/src/styles.css:79` for `.next-card { border-left: 4px ... }`. Repository-wide usage inspection confirms `.next-card` is unused, so this is dead-CSS cleanup rather than a visible dashboard defect. Browser visualization was blocked by local-navigation security policy, so no reliable overlay or live screenshot evidence exists.

## Overall Impression

The shell looks official and internally consistent, but the dashboard is a passive inventory rather than an administrative decision surface. Its biggest opportunity is to answer “what needs attention now?” and provide a direct path to resolve it.

## What's Working

1. Institutional trust cues are strong: crest, school name, named user, restrained navy/blue palette, and one icon family feel appropriate for MMSC.
2. Permission-aware, text-labeled navigation reduces irrelevant destinations and avoids icon-only ambiguity.
3. Responsive structure is sensible: the sidebar collapses, major grids stack, and the mobile backdrop/close affordances are explicit.

## Priority Issues

### [P1] The dashboard is passive, not operational

**Why it matters:** Totals and recent records do not reveal urgent work, exceptions, trends, or deadlines. Administrators must manually visit modules to discover problems.

**Fix:** Lead with one attention queue for attendance anomalies, pending enrollments, staffing issues, or other real exceptions. Show severity, ownership, freshness, and direct resolution links. Demote raw totals to supporting context and display the existing `asOf` value.

**Suggested command:** `$impeccable shape` or `$impeccable layout`

### [P1] The sidebar is a flat wall of destinations

**Why it matters:** Up to 12 peer links obscure workflow relationships and increase scanning cost for both new and repeat users.

**Fix:** Group navigation around stable staff tasks—Overview, People, Academics, Operations, Administration—with 4–5 top-level groups and progressively disclosed children. Preserve active parent context.

**Suggested command:** `$impeccable distill`

### [P1] Empty, restricted, stale, and failed states are ambiguous

**Why it matters:** “Activity is hidden or no events exist” gives users no way to determine whether data is absent, inaccessible, outdated, or broken. Errors offer no recovery path.

**Fix:** Show “Updated [time],” add Retry, separate permission copy from true-empty copy, announce failures with alert semantics, and explain access-denied redirects.

**Suggested command:** `$impeccable harden` or `$impeccable clarify`

### [P2] Visual hierarchy is undifferentiated

**Why it matters:** Three metric cards, four summary cards, and two recent lists receive nearly equal visual weight, so users lack a confident starting point.

**Fix:** Remove `Phase 10`, reduce card count, establish one dominant operational region, and use quieter inline/table structures for supporting data. Reserve accent color for actions and meaningful state.

**Suggested command:** `$impeccable layout` or `$impeccable polish`

### [P2] Controls and rows imply functionality they do not provide

**Why it matters:** The Notifications button has no behavior, while recent records and summary rows look like natural pathways but are static. This damages trust and slows expert users.

**Fix:** Hide notifications until implemented, consistent with project rules, or ship a real state/panel. Convert appropriate dashboard rows into descriptive links with complete focus and hover states.

**Suggested command:** `$impeccable harden`

## Persona Red Flags

**Alex, power user:** Cannot identify and resolve urgent work from the dashboard. There is no search, shortcut, favorite, refresh, quick action, or drill-down path; 12 flat nav destinations and nine equal panels slow repeated work.

**Sam, accessibility-dependent:** Semantic landmarks and labeled icon buttons are positive, but nav/icon buttons lack explicit global `:focus-visible` styling, errors lack alert semantics, status changes are not announced, 11–12px uppercase labels are common, and several targets are smaller than the 44px mobile guideline.

**Jordan, first-timer:** `Phase 10` is unexplained, `Operations` is vague, the activity empty state is non-diagnostic, and no help is visible. The first useful action is not apparent within five seconds.

## Cognitive Load and Emotional Journey

Cognitive load is high: there is no single focus, the flat nav and dashboard each present more than four choices, panels have near-equal hierarchy, lists can grow without visible bounds, and progressive disclosure is absent. The trusted institutional entry gives way to uncertainty because the dashboard does not reveal priorities. Confidence falls further at ambiguous empty/error/permission states, and there is no actionable ending that reassures staff urgent work is handled.

## Minor Observations

- Product headings use fluid `clamp()` sizing where a fixed rem scale would be more stable.
- Serif headings support institutional character, but 24px card headings make every section loud.
- The Google Fonts import introduces a network dependency and possible fallback flash.
- The detector's only finding is unused `.next-card` CSS and should be removed during cleanup.

## Questions to Consider

1. At 7:30 AM, should the dashboard answer “How many people are in the system?” or “What needs staff action before classes start?”
2. Is `Phase 10` meaningful to any staff user, or is implementation progress leaking into the product?
3. Which 4–5 task families match how MMSC staff actually describe their work?
4. Does recent system activity reassure administrators, or does it belong in Operations/Security?
