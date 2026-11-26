# Smart University Library Platform

An academic Library Management System designed as a potential university pilot. The initial demonstration will support one library location, while the data model is designed to accommodate multiple locations.

## Product vision

A web-based platform for students, receptionists, librarians and administrators:

- **Students:** sign in, search the catalogue, view copy availability, reserve a library entry time slot, manage bookings and view loans.
- **Reception/reception staff:** view the day's bookings, check students in, manage walk-ins and monitor slot capacity.
- **Librarians:** manage books and physical copies, issue and return loans, and view loan history.
- **Administrators:** manage users, library locations, opening hours, slot capacity, permissions and operational reports.

The first booking feature is **entry reservation**, not individual seat selection. A slot's capacity limits the number of arrivals booked in that time window; it does not represent live occupancy or guarantee a particular seat.

## Current implementation status

> **Early scaffold.** The Flask project structure, health-check endpoint and first test exist. MongoDB Atlas is not connected yet. Authentication, catalogue, physical copies, loans, entry slots, bookings, reports and frontend integration are not implemented. The documents describe the approved target design, not completed features.

## Technology and architecture

| Area | Technology |
|---|---|
| Frontend | React + Vite (separate frontend application) |
| Backend | Python 3 + Flask |
| Database | MongoDB Atlas via PyMongo |
| API | REST + JSON |
| Testing | pytest; frontend tests to be selected |
| Architecture | Layered modular monolith |

```
React frontend -> Flask REST API -> Routes -> Services -> Repositories -> MongoDB Atlas
```

The frontend communicates only with the Flask API. It must never connect directly to MongoDB. We will not split this student project into microservices.

## Main data areas

- `users`: student, librarian and administrator accounts.
- `library_locations`: library identity, timezone and operational settings.
- `books`: bibliographic catalogue records.
- `book_copies`: individual physical items.
- `loans`: borrowing and return history.
- `entry_slots`: bookable arrival windows and capacity.
- `bookings`: a student's reservation for one entry slot.

See `docs/database-design.md`.

## Repository layout

The backend currently lives in `backend/`. The React frontend is being developed on the separate `frontend-react-ui` branch, under `frontend-react/`; it will be integrated through a reviewed pull request. Do not replace or merge branches directly without review.

```
backend/       Flask application and tests
frontend-react/ React + Vite application (integration target)
docs/          Architecture, database, API and roadmap
scripts/       Database setup and maintenance utilities
```

## Development rules

- Work on assigned feature branches and open pull requests; do not push feature work directly to `main`.
- Never commit `.env`, passwords, Atlas connection strings or other secrets.
- Give each developer their own database credentials with minimum required permissions.
- Keep development, test and any future production data separate.
- Backend validation and authorization are mandatory; frontend checks are not security controls.
- A phase is complete only when implementation, tests, review and documentation are complete.

## Setup

Backend setup instructions are maintained with the backend scaffold and will be finalized in the MongoDB foundation phase. The application currently exposes the scaffold health endpoint at `/api/health`; a successful health response does not yet mean library features are available.

## Documentation

| File | Purpose |
|---|---|
| `docs/architecture.md` | System architecture, modules, dependencies and security |
| `docs/database-design.md` | MongoDB collections, indexes and consistency rules |
| `docs/api-documentation.md` | Planned REST endpoints and permissions |
| `docs/implementation-plan.md` | Phases, acceptance criteria and open decisions |
