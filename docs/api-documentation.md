# API Documentation

**Status:** Planning document. **Only the health endpoint exists in the scaffold. Every other endpoint below is planned and not implemented.** Request and response schemas are **not finalized** unless stated.

Labels: **[APPROVED]**, **[PROPOSED]**, **[OPEN]**.

---

## 1. General conventions

| Topic | Convention | Status |
|---|---|---|
| Base path | `/api` | PROPOSED (matches `/api/health` in the scaffold) |
| Format | JSON requests and responses (`Content-Type: application/json`) | APPROVED |
| Field names | `snake_case` | APPROVED |
| Ids | ObjectIds are sent as strings in a field called `id` | PROPOSED |
| Dates | ISO 8601 in UTC, e.g. `2026-01-31T10:00:00Z` | APPROVED |
| Authentication | Session cookie (mechanism **OPEN D1**) | APPROVED (cookie-based) |
| CSRF | A CSRF token is required on `POST`, `PATCH`, `PUT`, `DELETE` (mechanism **OPEN D2**) | APPROVED (requirement) |
| Error body format | **Not finalized (D10)** | OPEN |
| Pagination, sorting, filtering parameters | **Not finalized (D10)** | OPEN |

### Roles used in the tables

`STUDENT`, `LIBRARIAN`, `ADMIN`. "Staff" means `LIBRARIAN` or `ADMIN`. "Authenticated" means any logged-in role. "Self" means the logged-in user, for their own data only. All role rules are **[PROPOSED]** until the team approves them.

### Common HTTP status codes (planned use)

| Code | Meaning |
|---|---|
| 200 / 201 / 204 | Success / created / success without body |
| 400 | Invalid request (validation failed) |
| 401 | Not logged in |
| 403 | Logged in but not allowed (wrong role, or not your data, or missing CSRF token) |
| 404 | Not found |
| 409 | Conflict (duplicate value, copy not available, loan already returned) |
| 500 | Server error (no internal details shown) |

---

## 2. Health

| Method | Path | Roles | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/health` | Public | Check that the backend is running. After Phase 3 it may also check the MongoDB connection | Exists in scaffold (per README; not yet re-verified); database check is planned |

---

## 3. Authentication

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public **(OPEN D5)** | Create a `STUDENT` account. Whether self-registration exists at all is undecided. Never lets the caller choose a role |
| POST | `/api/auth/login` | Public | Verify email and password and start a session |
| POST | `/api/auth/logout` | Authenticated | End the session |
| GET | `/api/auth/me` | Authenticated | Return the logged-in user's profile (never the password hash) |
| GET | `/api/auth/csrf` | Authenticated | Provide a CSRF token. Exists only if the chosen CSRF mechanism needs it (D2) |

---

## 4. Users

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/api/users` | Staff | List and search users |
| GET | `/api/users/<user_id>` | Staff, or Self | Get one user's profile |
| PATCH | `/api/users/<user_id>` | Self (limited fields), `ADMIN` | Update profile fields such as `full_name`. Role and active status are **not** changed here |

---

## 5. Books (catalogue)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/api/books` | Authenticated (**OPEN D6**: public browsing?) | Search and list books, including how many copies are available |
| GET | `/api/books/<book_id>` | Authenticated (**OPEN D6**) | Get one book's bibliographic details and availability |
| POST | `/api/books` | Staff | Create a book record |
| PATCH | `/api/books/<book_id>` | Staff | Update a book record |
| DELETE | `/api/books/<book_id>` | `ADMIN` | Delete a book only if it has no copies. Otherwise rejected with 409 |

---

## 6. Copies (physical copies)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/api/copies` | Staff | List/search copies. Planned filters: `accession_number`, `book_id`, `status` |
| GET | `/api/books/<book_id>/copies` | Staff | List the copies of one book |
| POST | `/api/books/<book_id>/copies` | Staff | Register a new physical copy (unique `accession_number`) |
| GET | `/api/copies/<copy_id>` | Staff | Get one copy |
| PATCH | `/api/copies/<copy_id>` | Staff | Update shelf location, condition note, or status (only to `AVAILABLE`, `LOST`, `DAMAGED`, `WITHDRAWN` and only when not on loan). `ON_LOAN` can never be set here |

There is **no** endpoint to delete a copy. Copies leave circulation by changing status to `WITHDRAWN`.

---

## 7. Loans

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/api/loans` | Staff | Borrow: issue a copy (identified by `accession_number`) to a user. Runs inside a transaction |
| POST | `/api/loans/<loan_id>/return` | Staff | Return: mark an active loan as returned and the copy as available. Runs inside a transaction |
| GET | `/api/loans` | Staff | List/search loans. Planned filters: `status`, `user_id`, `book_id`, overdue only |
| GET | `/api/loans/me` | Authenticated | The logged-in user's own loan history (current and past) |
| GET | `/api/loans/<loan_id>` | Staff, or the borrower | Get one loan |

Whether students can request or renew loans themselves is **OPEN (D7)**. Currently only staff issue and return loans. No renewal, reservation or fine endpoint is planned until D7 is decided.

---

## 8. Administration

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/api/admin/users` | `ADMIN` | Create a user with any role (e.g. a new librarian) |
| PATCH | `/api/admin/users/<user_id>/role` | `ADMIN` | Change a user's role |
| PATCH | `/api/admin/users/<user_id>/status` | `ADMIN` | Activate or deactivate a user (`is_active`) |
| GET | `/api/admin/summary` | `ADMIN` | Basic counts (users, books, copies, active and overdue loans). Contents not finalized |

How the very first `ADMIN` account is created is **OPEN (D5)**.

Safeguards planned: an admin cannot remove their own admin role or deactivate themselves, so the system is never left without an admin.

---

## 9. Request and response schemas: NOT FINALIZED

The tables below are **starting points for discussion**, not agreed contracts. Do not code against them until the team approves them in the relevant phase.

| Endpoint | Proposed request fields | Proposed response | Status |
|---|---|---|---|
| `POST /api/auth/login` | `email`, `password` | User profile (`id`, `email`, `full_name`, `role`) | NOT FINALIZED |
| `POST /api/auth/register` | `email`, `password`, `full_name`, optional `student_id` | Created profile | NOT FINALIZED |
| `POST /api/books` | `title`, `authors[]`, optional `isbn`, `publisher`, `publication_year`, `category`, `description`, `language` | Created book | NOT FINALIZED |
| `POST /api/books/<book_id>/copies` | `accession_number`, optional `shelf_location`, `condition_note`, `acquired_at` | Created copy | NOT FINALIZED |
| `POST /api/loans` | `user_id`, `accession_number` (due date set by the server) | Created loan | NOT FINALIZED |
| `POST /api/loans/<loan_id>/return` | none, or an optional note | Updated loan | NOT FINALIZED |
| Error responses (all endpoints) | n/a | Error code + human-readable message | NOT FINALIZED (D10) |
| List responses (all list endpoints) | Pagination and filter parameters | Items plus paging information | NOT FINALIZED (D10) |

Responses must **never** include `password_hash`.

---

## 10. API security notes

- Authentication and role checks are enforced by the backend on every request. Hiding a button in the frontend is not security.
- User id and role always come from the session, never from the request body.
- State-changing requests need a CSRF token. CORS only allows the configured frontend origin. See `docs/architecture.md`.
- All input is validated by the backend. Unknown fields are not saved.
- Never put passwords or secrets in URLs or query strings.
- Error responses must not leak internal details.

---

## 11. Open decisions for this document

D1 session mechanism, D2 CSRF mechanism, D5 self-registration and first admin, D6 public catalogue, D7 loan rules, D10 error format and pagination.

See `docs/implementation-plan.md`.