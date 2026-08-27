# MMSC MVP Demo Dataset

## Purpose and safety

This post-Phase 29 dataset supports local manual testing and prospective-client demonstrations. It is not a production seed. The reset is transactional and refuses production mode, non-local database hosts, database names other than `mmsc`, missing explicit confirmation, or a demo password shorter than 12 characters.

```powershell
$env:MMSC_DEMO_RESET='RESET_LOCAL_MMSC_DEMO'
$env:MMSC_DEMO_PASSWORD='<choose a local-only 12+ character password>'
pnpm demo:reset
pnpm demo:validate
```

The command retains exactly one active Super Administrator, its role, authentication identity, and immutable audit history. Replaceable accounts are archived and their sessions/identities are disabled before new demo accounts are provisioned. The normal `pnpm db:seed` remains the production-safe reference seed.

## Expected dataset

| Domain | Records |
|---|---:|
| Active school year / quarters | 1 / 4 |
| Departments / grade levels / sections | 16 / 14 / 28 |
| Subjects / classrooms / calendar events | 24 / 20 / 10 |
| Employees / linked teachers | 30 / 20 |
| Enrolled students / reusable guardians | 196 / 112 |
| Admissions applications / requirements | 24 / 72 |
| External schools / demo accounts | 5 / 8 |

Every grade level from Prep through Grade 12 has two sections and seven students per section. Students have current placements and primary guardians. Subjects have grade-level offerings and section/teacher assignments. Admissions covers draft, submitted, under review, information requested, approved, rejected, and withdrawn states. Limited employee/student attendance supports dashboard and filter testing.

## Demo personas

All personas use the password supplied through `MMSC_DEMO_PASSWORD`; it is never stored in source or documentation.

| Username | Persona | Roles and access |
|---|---|---|
| `schooladmin` | School Administrator | Administration and operational school management |
| `principal` | Principal | Academic oversight, reports, and permitted operations |
| `registrar` | Registrar / Admissions | Admissions, Students, Enrollment, reference data |
| `hrstaff` | HR staff | Workforce and employee-attendance responsibilities |
| `teacher` | Teacher | Teacher Portal, classes, attendance, and grading permissions |
| `multiteacher` | Multi-role teacher | Teacher plus HR staff access for workspace switching |
| `studentdemo` | Student | Linked Student Portal identity |
| `parentdemo` | Parent / Guardian | Linked Family Portal identity and authorized child |

The retained Super Administrator keeps its existing username and password.

## Recommended walkthrough

1. Sign in as Super Administrator and review Security & Access.
2. Confirm eight active demo personas and inspect role assignments.
3. Open the dashboard and review meaningful student/workforce counts.
4. Browse Workforce departments, positions, and 30 employees.
5. Browse 20 linked Teacher profiles and teaching assignments.
6. Review the MMSC Institution Profile, Main Campus, SY 2026–2027, and quarters.
7. Inspect Prep–Grade 12, two sections per level, subjects, classrooms, and Calendar.
8. Open Admissions and filter the seven populated workflow states.
9. Inspect requirement combinations and an external previous-school reference.
10. Browse Students, Enrollment placement, and shared Guardian relationships.
11. Sign in as `teacher` and inspect the purpose-built Teacher Portal.
12. Sign in as `multiteacher` and exercise workspace switching.
13. Sign in as `studentdemo` and review the linked Student Portal.
14. Sign in as `parentdemo` and review the authorized child in Family Portal.
15. Compare permitted and denied navigation/actions across personas.

## Known limitations

- Admission document rows use metadata-only logical demo keys; no fake binary document files are written.
- The seed does not fabricate terminal credentials or offline terminal events because secure terminal registration remains an explicit operational workflow.
- Grades, notification delivery, report exports, and applicant conversion remain available for manual workflow testing against the seeded dependencies; the reset does not pre-complete those actions.
- Deferred Phases 19–23 (Clinic, Library, Laboratory, Credits, and Canteen) are not populated or simulated.
