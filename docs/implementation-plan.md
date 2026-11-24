# Implementation Plan

**Status:** Phase 1 in progress. All other phases are not started. **MongoDB Atlas is not connected and no library feature is implemented.**

Labels: **[APPROVED]**, **[PROPOSED]**, **[OPEN]**.

---

## How we work

- Phases are done **in order**. A phase is finished only when its tasks are done, its tests pass and its documentation is updated.
- At the end of each phase the team reviews the result before the next phase starts.
- Never implement future phases early. Never claim a feature works until it is tested and merged.
- Only add dependencies that the phase needs, and only after team approval.

## Progress overview

| # | Phase | Status |
|---|---|---|
| 1 | Architecture and documentation approval | In progress |
| 2 | MongoDB Atlas configuration | Not started |
| 3 | PyMongo foundation | Not started |
| 4 | Collections and indexes | Not started |
| 5 | Authentication | Not started |
| 6 | Book catalogue | Not started |
| 7 | Physical copy management | Not started |
| 8 | Borrowing and returns | Not started |
| 9 | Loan history | Not started |
| 10 | Frontend integration | Not started |
| 11 | Testing and security review | Not started |

---

## Phase 1: Architecture and documentation approval

**Goal:** Everyone agrees on the architecture, data model and security approach before code is written.

Tasks:
- Replace the old SQLite/SQLAlchemy documentation with this MongoDB-based documentation set.
- Review all documents as a team and with an independent reviewer.
- Resolve or schedule every open decision (register below).
- Check that no document claims anything is already implemented.

Done when: the team has approved the documents, and each open decision has an owner and a target phase.

## Phase 2: MongoDB Atlas configuration

**Goal:** A properly secured Atlas setup and a clean, MongoDB-ready configuration.

Tasks:
- Create the Atlas project and cluster. Create a limited database user. Restrict Network Access to needed IP addresses.
- Agree on separate development and test database names.
- Confirm the Atlas tier supports multi-document transactions (D11).
- Align `.env.example` and `config.py` (variable names, `.env` location).
- Remove SQLite/SQLAlchemy packages and settings from `requirements.txt` and the configuration. Add only what is needed (`pymongo` with SRV support, `python-dotenv`).
- Review `extensions.py` and `backend/instance/` and decide what to keep or remove (D12).
- Confirm `.env` is git-ignored.

Done when: every team member can load their own `.env` without any secret in git, and no SQL-era dependency remains.

## Phase 3: PyMongo foundation

**Goal:** The application can connect to Atlas in a clean, testable way.

Tasks:
- Add the database module that creates one MongoDB client from configuration and exposes the database handle.
- Make `/api/health` report whether the database is reachable.
- Add the shared error types and time helpers (UTC).
- Decide the test database approach (D4) and prepare test fixtures.

Done when: the app starts, connects to Atlas, health reports database status, and tests cover the connection setup and failure case.

## Phase 4: Collections and indexes

**Goal:** The database structure from `docs/database-design.md` exists in Atlas.

Tasks:
- Write a setup script in `scripts/` that creates the four collections, the validators (D11) and every index, including the partial unique index on active loans.
- Make the script safe to run more than once.
- Write the four models and four repositories skeletons for the data shapes.
- Test that unique constraints and the partial unique index behave as documented.

Done when: running the script on an empty database produces exactly the documented structure, and tests prove duplicate emails, accession numbers and second active loans for one copy are rejected.

## Phase 5: Authentication

**Goal:** Users can log in securely and roles are enforced.

Tasks:
- Decide D1 (session), D2 (CSRF), D3 (CORS), D5 (registration and first admin), D13 (password rules, login limits).
- Implement the user repository/service, password hashing, login, logout and current-user endpoints.
- Implement role-checking and the CSRF and CORS protections.
- Create the first admin by the approved method.
- Test: wrong password, deactivated user, missing role, missing CSRF token, disallowed origin.

Done when: authenticated sessions work against Atlas, roles are enforced, and security tests pass.

## Phase 6: Book catalogue

**Goal:** Staff can manage books; users can search them.

Tasks:
- Book repository, service, routes and validation (including ISBN normalization).
- Search by title/author, using the text index.
- Decide D6 (public browsing) and D14 (categories).
- Deletion rule: a book with copies cannot be deleted.

Done when: book endpoints work with correct roles and validation, and tests pass.

## Phase 7: Physical copy management

**Goal:** Staff can register and manage individual physical copies.

Tasks:
- Copy repository, service and routes using `accession_number`.
- Decide D9 (formats) and D8 (extra statuses, lost items).
- Enforce status rules: `ON_LOAN` can never be set manually; no deletion of copies.
- Show availability counts in book responses.

Done when: copies can be added, searched and updated within the rules, and duplicates are rejected.

## Phase 8: Borrowing and returns

**Goal:** Staff can issue and return copies, with consistent data.

Tasks:
- Decide D7 (loan period, limits, renewals, fines, reservations) and confirm D11 (transactions).
- Loan repository and service. Borrow and return in transactions as described in `docs/database-design.md`.
- Test the rules: copy not available, inactive user, loan limit, already returned loan.
- Test concurrency: two attempts to borrow the same copy, and failure halfway through a transaction (nothing must change).

Done when: borrow and return keep copies and loans consistent in all tested cases.

## Phase 9: Loan history

**Goal:** Loan history and overdue information are available to the right people.

Tasks:
- Endpoints for staff loan lists with filters and for a user's own history.
- Overdue is derived from `due_at`, never stored.
- Ownership checks: a student sees only their own loans.
- Decide pagination (D10).

Done when: history and overdue queries return correct, permission-checked results.

## Phase 10: Frontend integration

**Goal:** The existing frontend uses the real API.

Tasks:
- Finalize the request/response schemas and error format (D10), and update `docs/api-documentation.md` to match the real code.
- Update `frontend/js/api.js` (credentials, CSRF token) and the screens (login, catalogue, copies, loans, dashboard).
- Test the full flow in a browser with the frontend and backend on `127.0.0.1`.

Done when: a user can log in and complete the main flows from the browser.

## Phase 11: Testing and security review

**Goal:** The system is checked as a whole before it is considered complete.

Tasks:
- Review test coverage; add missing tests for services, repositories and routes.
- Security review against `docs/architecture.md`: password hashing, cookies, authorization on every endpoint, CSRF, CORS, validation, secrets (search git history for leaked secrets), error messages.
- Check that every document matches the final code.
- Independent review of the final result.

Done when: all tests pass, review findings are resolved, and documentation matches the system.

---

## Open decisions register

| ID | Decision | Needed by | Notes |
|---|---|---|---|
| D1 | Session storage: signed cookie (simple) or server-side session in MongoDB (revocable) | Phase 5 | |
| D2 | CSRF mechanism: a library (e.g. Flask-WTF) or a small custom token check | Phase 5 | A library is a new dependency |
| D3 | CORS mechanism: Flask-CORS or manual response headers | Phase 5 | A library is a new dependency |
| D4 | Test database: separate Atlas test database, or an in-memory fake such as `mongomock` | Phase 3 | `mongomock` is a new dependency and does not match MongoDB exactly (e.g. transactions, some index behaviour) |
| D5 | Do students self-register? How is the first `ADMIN` created? | Phase 5 | |
| D6 | Is the catalogue visible without login? | Phase 6 | |
| D7 | Loan rules: loan period, maximum loans per user, renewals, fines, reservations | Phase 8 | Out of scope until decided |
| D8 | Extra copy statuses (e.g. `RESERVED`, `MAINTENANCE`); handling a copy lost while on loan | Phase 7/8 | |
| D9 | Formats of `student_id` and `accession_number` | Phase 4/7 | |
| D10 | API error format, list pagination and filtering conventions | Phase 9/10 | |
| D11 | Use `$jsonSchema` validators? Confirm Atlas tier supports transactions | Phase 2/4 | |
| D12 | Database module name/location; keep or remove `extensions.py` and `backend/instance/`; `.env` location | Phase 2 | |
| D13 | Password rules and login attempt limiting | Phase 5 | |
| D14 | Book categories: free text or a fixed list | Phase 6 | |

Record every decision here with its date and the people who agreed.