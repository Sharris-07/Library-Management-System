# Library Management System

An academic Library Management System developed by a small student team.

## Current status

> **Early scaffold.** The Flask project structure, a health-check endpoint and a first test exist. **MongoDB Atlas is not connected yet, and no library features (login, books, copies, loans) are implemented.** See `docs/implementation-plan.md` for the roadmap.

## Technology stack

| Area | Technology |
|---|---|
| Backend language | Python 3 |
| Web framework | Flask |
| Database | MongoDB Atlas (cloud), accessed with PyMongo |
| Frontend | HTML5, CSS3, vanilla JavaScript |
| API style | REST, JSON |
| Testing | pytest |

This project does **not** use SQLite, SQLAlchemy, PostgreSQL, React or a Node.js backend.

## Architecture in one minute

The backend is a **layered modular monolith**: one Flask application split into layers.

```
Browser (frontend)  --REST/JSON-->  Routes -> Services -> Repositories -> MongoDB Atlas
```

- **Routes** handle HTTP. **Services** hold the library rules. **Repositories** talk to MongoDB.
- **Models** describe documents. **Database** creates the MongoDB connection. **Utils** are shared helpers.
- The frontend is a separate app and only communicates with the backend through the REST API.

More detail: `docs/architecture.md`.

## Data model in one minute

Four MongoDB collections:

| Collection | Meaning |
|---|---|
| `users` | People who use the system, with a role: `STUDENT`, `LIBRARIAN` or `ADMIN` |
| `books` | A book as a catalogue record (title, authors, ISBN...) |
| `book_copies` | One physical copy of a book, identified by its `accession_number` |
| `loans` | One borrowing of one physical copy by one user |

More detail: `docs/database-design.md`.

## Project structure (current)

```
backend/      Flask application, tests, requirements
frontend/     Separate HTML/CSS/JavaScript frontend
docs/         Architecture, database, API and planning documents
scripts/      Development utilities (currently empty)
CLAUDE.md     Rules for contributors and AI assistants
.env.example  Template for environment variables (no real secrets)
```

The planned final backend structure is described in `docs/architecture.md`.

## Prerequisites

- Python 3 (Windows examples below use the `py` launcher)
- Git
- A free MongoDB Atlas account (needed from Phase 2 onwards; see the roadmap)

## MongoDB Atlas setup (needed from Phase 2)

The application does not connect to Atlas yet. When Phase 2 starts, each team member needs:

1. Access to the team's Atlas project and cluster (or your own cluster for development).
2. A **database user** for the application. Give it only the permissions it needs on this project's database, not administrator rights.
3. Your IP address added to Atlas **Network Access**. Do not open access to every IP address.
4. The cluster **connection string** from Atlas ("Drivers" -> Python).
5. A local `.env` file created from `.env.example` with your own values.

**Never commit `.env`, passwords or connection strings.** If a secret is ever committed, change it in Atlas immediately; deleting the commit is not enough.

## Backend setup (Windows PowerShell)

From the repository root:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
cd backend
python -m pip install --upgrade pip
pip install -r requirements.txt
python run.py
```

Create your local environment file by copying the template, then edit the copy:

```powershell
Copy-Item .env.example .env
```

(The exact location where the app loads `.env` is confirmed in Phase 2.)

Health endpoint (exists in the scaffold):

http://127.0.0.1:5000/api/health

> **Known gap:** `backend/requirements.txt` and some configuration files may still list SQLite/SQLAlchemy-era packages or settings. They are removed in Phase 2. Do not rely on them.

## Frontend setup

Open a second terminal at the repository root:

```powershell
py -m http.server 5500 --directory frontend
```

Open http://127.0.0.1:5500

**Use `127.0.0.1` for both the frontend and the backend (not a mix of `localhost` and `127.0.0.1`).** Browsers treat them as different sites, which breaks cookie-based login later.

## Tests

From the `backend` directory:

```powershell
python -m pytest -v
```

## Roles

| Role | Intended purpose (proposed) |
|---|---|
| `STUDENT` | Browse the catalogue, see their own loans |
| `LIBRARIAN` | Manage books and copies, issue and return loans |
| `ADMIN` | Everything a librarian can do, plus manage user accounts and roles |

The exact permissions per endpoint are in `docs/api-documentation.md`.

## Documentation

| File | Content |
|---|---|
| `CLAUDE.md` | Project rules |
| `docs/architecture.md` | Layers, dependency rules, security |
| `docs/database-design.md` | Collections, fields, indexes, consistency |
| `docs/api-documentation.md` | Planned REST endpoints |
| `docs/implementation-plan.md` | Eleven implementation phases, open decisions |

## Team rules

- Do not commit secrets.
- Do not add dependencies without team approval.
- Keep code and documentation consistent.
- Work phase by phase; do not skip ahead.