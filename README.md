# Smart University Library Platform

An academic Library Management System designed as a potential university pilot. The first demonstrator targets one library location while the data model supports multiple locations.

## Product scope

- **Students:** sign in, search the catalogue, view copy availability, reserve a library entry time slot, manage bookings and view loan history.
- **Reception:** view daily bookings, check students in and monitor slot capacity.
- **Librarians:** manage books and physical copies, issue and return loans.
- **Administrators:** manage users, libraries, opening hours, slot capacity and operational reports.

The booking feature reserves an arrival window. It does not reserve a seat or measure live occupancy.

## Technology

| Area | Technology |
|---|---|
| Frontend | React + Vite (integration branch) |
| Backend | Python 3 + Flask |
| Database | MongoDB Atlas via PyMongo |
| API | REST + JSON |
| Testing | pytest |
| Architecture | Layered modular monolith |

React communicates only with Flask. It must never connect directly to MongoDB.

## Current implementation status

The architecture and API documents describe the target product. The integration branch is implementing the MongoDB foundation: seven collection definitions, validators and indexes. Authentication, booking operations, circulation workflows and complete React integration must not be described as available until implemented and tested.

## Repository layout

- backend/: Flask application, database setup and tests
- frontend-react/: React + Vite application on the frontend feature branch
- docs/: architecture, database design, API contract and implementation plan

## Backend setup

1. Install Python 3.11 or later.
2. Create and activate a virtual environment.
3. Install dependencies: `pip install -r backend/requirements.txt`.
4. Create a local environment file: `python backend/setup_env.py`.
5. Enter the Atlas database username, cluster hostname and password when prompted. Use a least-privilege development database user.
6. Confirm the Atlas network access list permits your current development IP.
7. Initialize the database:

   `cd backend`
   `python init_db.py`

8. Run the backend: `python run.py`.

The API runs locally on port 5000. The health endpoint is `http://127.0.0.1:5000/api/health`.

## Tests

From the repository root, run `pytest backend/tests -q`.

Tests must use a separate test database. Never run destructive tests against development or production data.

## Security rules

- Never commit .env, Atlas credentials, passwords or private keys.
- Use individual least-privilege Atlas users.
- Keep development, test and production databases separate.
- Backend authorization is mandatory; frontend role checks are not security controls.
- Do not expose MongoDB credentials to the browser.

## Documentation

- docs/architecture.md — system architecture and security
- docs/database-design.md — collections, validators, indexes and consistency rules
- docs/api-documentation.md — planned REST API
- docs/implementation-plan.md — deadline plan, acceptance criteria and remaining decisions
