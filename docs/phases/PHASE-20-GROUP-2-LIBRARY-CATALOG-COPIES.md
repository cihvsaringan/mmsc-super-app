# Phase 20 — Group 2: Book Catalog & Physical Copy Management

Status: Completed on 2026-08-27. Phase 20 remains In Progress; Groups 3–7 have not been started.

## Catalog model

`library_books` stores one practical bibliographic record per title/edition. It includes title, subtitle, non-unique optional ISBN, primary/additional authors, publisher, publication year, edition, language, description, call number, reusable Category/Subject/Shelf references, lifecycle timestamps, attribution, archive state, and optimistic version.

`library_book_copies` stores independently circulated physical items. Each copy has a title link, copy number, unique case-insensitive accession number, unique case-insensitive barcode, optional shelf override and acquisition date, condition, status, notes, attribution, timestamps, and optimistic version. A PostgreSQL sequence allocates concurrency-safe `LIB-000001` identifiers; generated barcode defaults to the accession number. Manual single-copy identifiers are trimmed and normalized to uppercase. Bulk creation supports 1–100 copies in one transaction.

`library_classifications` is the reusable, institution-scoped Category, Subject, and Shelf/location reference set. Database triggers enforce matching classification kind, school, active state, and archive state.

## Status and integrity

Supported statuses are `available`, `checked_out`, `reserved`, `lost`, `damaged`, `under_repair`, and `withdrawn`. Reservation remains future-safe only. Copy management permits operational transitions among available, damaged, repair, lost, and withdrawn states. It cannot change checked-out or reserved copies; those states must be resolved by their future circulation/hold owner. Withdrawn is terminal. Book archival is blocked while any copy is checked out or reserved, then archives the title and withdraws eligible copies transactionally.

## API and UI

The Library Catalog provides server-side search, category/availability/status filters, sorting, pagination, responsive table/detail views, reusable classification creation, Add/Edit Book modals, bulk copy creation, copy metadata editing, controlled status actions, barcode lookup readiness, loading/error/empty states, and view/manage separation.

API routes:

- `GET /api/v1/library/catalog/context`
- `POST /api/v1/library/catalog/classifications`
- `GET/POST /api/v1/library/books`
- `GET/PUT /api/v1/library/books/:id`
- `POST /api/v1/library/books/:id/archive`
- `POST /api/v1/library/books/:id/copies`
- `GET /api/v1/library/copies/barcode/:barcode`
- `PUT /api/v1/library/copies/:id`
- `POST /api/v1/library/copies/:id/status`

All routes retain the Group 1 `library.portal.access` boundary. Reads require `library.catalog.view` and, for copy data, `library.copies.view`; writes require `library.catalog.manage` or `library.copies.manage`. Audit actions follow the existing dotted convention: `library.book.created/updated/archived`, `library.copy.created/updated/status_changed/withdrawn`, and `library.classification.created`.

## Verification

- All 42 migration files validated; migrations 0047–0048 applied to the configured database, all three Group 2 tables were verified, and the repeatable Phase 20 Group 2 seed passed.
- PostgreSQL acceptance passed title creation, five-copy bulk allocation, generated identifiers, duplicate barcode rejection, duplicate accession rejection, normalized barcode lookup, search/pagination, and copy summaries. The transaction rolled back all test records; sequence values are intentionally monotonic and may contain gaps after rollbacks.
- API typecheck, lint, production build, and all 52 files / 247 tests passed.
- Web typecheck, lint, production build, and all 26 files / 85 tests passed with four bounded workers.
- Automated coverage includes schemas, transition rules, portal/granular RBAC, create/edit, bulk copies, lookup, server-side query parsing, view-only UI, and Group 1 navigation regression.

## Deferred

MARC21, automatic Dewey classification, physical-book RFID, reservations/holds, acquisitions/procurement, patron resolution, and loan history remain outside Group 2.

Phase 20 Group 2 is complete. The next planned group is Phase 20 Group 3, but it has not been started.
