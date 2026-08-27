# Phase 29 Extension — Academic Assignments Workflow Revamp

Date: 2026-08-24  
Status: Implemented; final verification recorded below

## Scope

This focused post-Phase-29 extension refines the existing Academic Assignments domain only. It does not start deferred Phases 19–23 or create duplicate academic, Teacher, Employee, or Student records.

## User experience

```text
Academic Assignments
├── Grade-Level Curriculum
│   ├── Curriculum
│   └── Assign Subjects
└── Section Teaching Assignments
    ├── Teaching Assignments
    └── Assignment of Teacher
```

Operational list views use search, School Year/Grade/Section filters, 25-row pagination, keyboard-operable rows, and modal-only detail/history. Guided workflows retain selected School Year, Grade Level, and Section context. Primary selected tabs use the semantic on-primary foreground; secondary tabs use a quieter underline hierarchy.

## Domain flow

```text
School Year → Grade Level → Grade-Level Curriculum → Subjects
School Year → Grade Level → Section → Curriculum Subject → Teacher placement
```

Grade Levels use configured sequence order. Sections are limited to the selected School Year and Grade Level. Teaching Subjects are limited to the selected curriculum. Teacher selection consumes active Teacher School-Year placements—not generic Employees.

## Mutations and safety

- Curriculum creation and metadata editing preserve Subject master records.
- Teacher reassignment updates the existing Teaching Assignment ID and increments its optimistic version.
- Validation rejects cross-year/cross-grade Sections, non-curriculum Subjects, missing/inactive Teacher identities, stale records, and Closed School Year changes.
- Existing database indexes remain the authoritative duplicate and single-primary-Teacher constraints.
- Assignment details include immutable audit history; Teacher updates record previous/new placement IDs and roles.
- No database migration is required.

## Verification

Focused tests passed before the full gate: API 34 files/152 tests and web 14 files/48 tests. Coverage includes Assignment detail/not-found responses, same-identity Teacher update routing, primary/secondary workflow separation, dependent Section filtering, and modal Teacher update access.

Final verification passed:

- Root typecheck and lint passed for API and web.
- API: 34 files, 152 tests passed.
- Web: 14 files, 48 tests passed.
- API and Vite production builds passed.
- Docker images rebuilt; web `15173`, API `14000`, and PostgreSQL `15432` are healthy.
- All 24 migration files validated; no migration was added.
- Live data returned 144 curriculum assignments, 288 teaching assignments, 14 Grade Levels, 28 Sections, and 20 Teacher placements.
- Live curriculum and teaching detail endpoints returned authoritative existing IDs; `/assignments` returned HTTP 200.
- Live demo assignments were not mutated solely for verification; same-identity PATCH behavior and validation are covered by automated regressions.

## Completion boundary

## Workflow simplification extension

The curriculum list now has one sequence-ordered row per Grade Level; its modal exposes the authoritative Subject catalog as a searchable checklist and saves additions/removals atomically. The teaching list now has one sequence-ordered row per Section with assigned/unassigned completeness; its modal exposes one primary-Teacher selector per curriculum Subject and saves the matrix atomically.

Preview-first copy-forward supports Closed or other prior years as sources and Planned/Active years as editable targets. Curriculum copy uses reusable Grade Level and Subject identities. Teaching copy maps Sections by Grade Level plus normalized Section code, curriculum by target Grade Level and Subject, and Teachers by target-year placement. Existing target assignments are skipped, unresolved mappings are counted for review, and no Student, Enrollment, attendance, grade, or old assignment identifier is copied. No migration was required.

Extension verification on 2026-08-24: API and web typechecks passed; lint passed with one existing-style React hook dependency warning in the compact Assignment page; API production build passed and the web build command completed successfully. API tests passed (34 files, 152 tests) and web tests passed (14 files, 48 tests), including aggregate-grid, batch-editor, and preview-before-copy regressions. The running localhost web and health endpoints returned HTTP 200 on ports `15173` and `14000`. The Docker executable was unavailable in the Codex shell, so the images could not be rebuilt from this session. Migration execution was attempted but the bundled Node runtime stopped before the migration runner with `uv_os_get_passwd ENOMEM`; no migration was added by this extension.

The subsequent visual-alignment correction reuses the exact current Academics tab measurements and semantic selected state, plus the operational-directory heading hierarchy used by Admissions, Academics, Students, and Enrollments. Web typecheck and production build passed; all 48 web tests passed. Lint completed with the previously documented single hook-dependency warning. Live authenticated comparison could not be completed because the available localhost browser session opened at the MMSC sign-in screen; no credentials were entered or changed for this presentation-only task.

The exact School Years alignment correction also changed the markup hierarchy: Academic Assignments now uses the `academic-tabs` pattern, the blue directory header places the semantic icon/title/subtitle group on the left and the live filtered count on the right, and School Year selection appears in the filter toolbar beneath it. Web typecheck, all 48 web tests, and the Vite production build passed. No backend, database, assignment workflow, RBAC, or copy-forward behavior changed.

Phase 29 is complete. The next planned phases are the deferred post-MVP Phases 19–23, but none has been started.
