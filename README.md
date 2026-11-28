# Smart University Library Management System

A full-featured academic Library Management System for students and library staff. The target product combines catalogue management, book circulation, book reservations, library entry-slot bookings, fines, payment recording, administration and reporting.

This repository contains work in progress. A documented feature is not considered implemented until its backend/frontend code is integrated and its tests pass.

## Product scope

### Student
- Register/sign in and manage account details.
- Search the book catalogue and view physical-copy availability.
- Borrowing and return history.
- Reserve an available copy for collection.
- Join a waiting queue when all copies of a title are unavailable.
- View reservation status and cancel eligible reservations.
- View overdue fines, outstanding balances and payment history.
- Book and cancel library entry time slots independently of book reservations.
- View entry-booking history and check-in status.

### Reception
- View the daily library entry roster.
- Check in students with confirmed entry bookings.
- Record permitted walk-ins if enabled by library policy.
- Monitor slot capacity and entry-booking statuses.

### Librarian
- Manage catalogue records and physical copies.
- Issue and return books.
- Manage book-reservation queues and collection deadlines.
- Assess/inspect overdue fines and record payments received at the library desk.
- View member borrowing and payment records according to role permissions.

### Administrator
- Manage users and roles, library locations and operating hours.
- Configure slot capacity and booking policies.
- Configure loan periods, maximum active loans and fine rates.
- View operational reports and activity logs.

## Important distinction: two independent reservation workflows

1. **Book reservation** concerns a particular catalogue title/copy. If a copy is available, a reservation can hold it for collection. If all copies are unavailable, the user can join a FIFO waiting queue. When a copy becomes available, it is allocated to the next eligible user.
2. **Library entry booking** concerns a person's planned visit to a library location at a particular time. It reserves arrival capacity in a time slot; it does not reserve a seat or a book.

A user may have both types of reservation at the same time. Neither workflow replaces the other.

## Fines and payments

Overdue loans can generate fines according to the configured borrowing policy. Fine charges and payments are separate records so the system can preserve an auditable financial history, support partial payments and calculate outstanding balances. The initial payment-recording workflow supports payments received by library staff (for example, cash at the desk). An online payment gateway is a separate integration decision; it is not a reason to omit fines or payment management.

## Target technology

| Area | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Python 3 + Flask |
| Database | MongoDB Atlas via PyMongo |
| API | REST + JSON |
| Backend tests | pytest |
| Architecture | Layered modular monolith |

React communicates only with Flask. It must never connect directly to MongoDB or contain database credentials.

## Target data model

The proposed complete model contains twelve collections:

1. `users`
2. `library_locations`
3. `books`
4. `book_copies`
5. `loans`
6. `book_reservations`
7. `fines`
8. `payments`
9. `entry_slots`
10. `bookings`
11. `activity_logs`
12. `system_settings`

The integration branch currently initializes the original seven collections. The additional five collections and their business workflows are part of the revised target architecture and must be added through an additive, idempotent database update. Do not drop or recreate the existing collections.

## Repository layout

- `backend/`: Flask application, database setup and tests.
- `frontend-react/`: React + Vite application developed on the frontend feature branch.
- `docs/`: architecture, database design, API documentation and implementation roadmap.

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

- Never commit `.env`, Atlas credentials, passwords or private keys.
- Use individual least-privilege Atlas users.
- Keep development, test and production databases separate.
- Backend authorization is mandatory; frontend role checks are not security controls.
- Do not expose MongoDB credentials to the browser.
- Record financial operations and privileged actions in an auditable manner.

## Documentation

- `docs/architecture.md` — product scope, workflows, layers and security.
- `docs/database-design.md` — collections, validators, indexes and consistency rules.
- `docs/api-documentation.md` and the API contract — REST endpoints and request/response behavior.
- `docs/implementation-plan.md` — phased implementation roadmap, acceptance criteria and open decisions.
