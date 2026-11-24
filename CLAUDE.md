# CLAUDE.md: Project Rules for Contributors and AI Assistants

This file tells every contributor (human or AI assistant) how this project is built and what is not allowed. Read it before changing anything.

## 1. Project summary

An academic Library Management System built by a small student team.

- Backend: Flask REST API, layered modular monolith.
- Database: MongoDB Atlas, accessed with PyMongo.
- Frontend: separate HTML5 / CSS3 / vanilla JavaScript app that talks to the backend over REST + JSON.

## 2. Decision status labels

All documentation in this repository uses three labels:

| Label | Meaning |
|---|---|
| **[APPROVED]** | The team has decided this. Do not change it without team agreement. |
| **[PROPOSED]** | A recommendation written down for review. Not final. |
| **[OPEN]** | Not decided yet. Do not guess. Ask, and record the answer in `docs/implementation-plan.md`. |

## 3. Current status (be honest)

- The repository contains an **initial Flask scaffold only**.
- **MongoDB Atlas is not connected yet.**
- **No library feature is implemented**: no authentication, books, copies or loans.
- Some existing configuration files (`backend/requirements.txt`, `backend/app/config.py`, `backend/app/extensions.py`, `backend/instance/`) may still contain SQLite/SQLAlchemy-era assumptions. They are cleaned up in Phase 2 of `docs/implementation-plan.md`.
- Never write documentation or commit messages that claim a feature works unless it exists, is tested, and is merged.

## 4. Approved technology stack [APPROVED]

Python 3, Flask, MongoDB Atlas, PyMongo, HTML5, CSS3, vanilla JavaScript, REST API, JSON, pytest.

**Forbidden** (do not add, suggest or reference as the project's technology): SQLite, SQLAlchemy, Flask-SQLAlchemy, Flask-Migrate, PostgreSQL, React, a Node.js backend, microservices.

**No unnecessary dependencies.** Every new package needs a short written justification and team approval. Packages that are still undecided are listed as open decisions (CORS, CSRF, test database).

## 5. Architecture rules [APPROVED]

Layered modular monolith. Dependencies point **downward only**:

```
routes  ->  services  ->  repositories  ->  database
```

| Layer | Allowed to do | Must NOT do |
|---|---|---|
| Routes | Read the HTTP request, check login and role, call one service, return the HTTP response | Contain business rules, call PyMongo, touch collections |
| Services | Business rules (e.g. "a copy that is ON_LOAN cannot be borrowed"), orchestrate repositories, manage transactions | Import Flask request/response objects, build HTTP responses |
| Repositories | The only place that reads or writes MongoDB collections | Contain business rules, import from routes or services |
| Models | Describe the shape of each document and convert to/from stored form | Talk to the database or to HTTP |
| Database | Create and expose the single MongoDB client and database handle | Contain queries for specific collections |
| Utils | Small shared helpers (validation, error types, time, serialization) | Import routes, services or repositories |
| Tests | Verify behaviour at each layer | Use real production data |

The frontend never touches MongoDB. It only calls the REST API.

## 6. Data conventions [APPROVED unless marked]

- Collections: `users`, `books`, `book_copies`, `loans`. No other collections without team approval.
- Relationships use MongoDB **ObjectId** references.
- A **Book** is bibliographic information. A **BookCopy** is one physical copy. A **Loan** references exactly one copy and one user.
- Physical copies are identified by **`accession_number`** everywhere (code, docs, API, UI). Do not use "barcode", "copy_code" or other names.
- Roles: `STUDENT`, `LIBRARIAN`, `ADMIN`.
- All timestamps are stored in **UTC**.
- Field names are `snake_case`.
- Statuses are uppercase strings from the fixed lists in `docs/database-design.md`.
- Full detail: `docs/database-design.md`.

## 7. Security rules [APPROVED as requirements; mechanisms may be OPEN]

- **Never hardcode or commit secrets** (database URI, passwords, secret keys). They live in `.env`, which is git-ignored. Only `.env.example` with placeholders is committed.
- Passwords are stored only as salted hashes. Never log, return or store plain passwords or hashes in API responses.
- Authentication, authorization, CSRF protection, CORS restrictions and backend validation are required. Details are in `docs/architecture.md`.
- The backend validates every input. The frontend's validation is only a convenience.
- Never trust the role or user id sent by the browser. Take them from the authenticated session.

## 8. Testing rules

- Use pytest. Run from `backend/`: `python -m pytest -v`.
- New behaviour needs tests. Services are tested with fake repositories where possible. Repository and route tests use a **separate test database**, never the development or production data. How the test database is provided is **[OPEN]**.
- A phase is only finished when its tests pass and its documentation is updated.

## 9. Working rules for AI assistants

1. Do exactly what the current task asks. Do not implement future phases.
2. Do not edit files outside the task. Say which files you would change and why.
3. If a decision is **[OPEN]**, stop and ask. Do not silently choose.
4. Do not add dependencies, collections, endpoints or roles that are not in the docs.
5. Keep documentation and code consistent. If you change behaviour, update the matching file in `docs/`.
6. Explain code and decisions so a first-year computer science student can follow them.
7. Never paste real credentials into code, docs, commits, issues or chat.

## 10. Where to find things

| Topic | File |
|---|---|
| Setup and running | `README.md` |
| Layers, security, structure | `docs/architecture.md` |
| Collections, indexes, consistency | `docs/database-design.md` |
| Endpoints | `docs/api-documentation.md` |
| Phases and the open-decision register | `docs/implementation-plan.md` |