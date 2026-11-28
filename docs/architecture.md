# Architecture

**Status:** Revised target architecture approved for planning. Implementation remains at the initial Flask scaffold; MongoDB Atlas and library features are not implemented.

## 1. Product scope

The Smart University Library Platform is a web application for students and library staff. It combines catalogue and circulation management with online **library entry time-slot reservations**.

The first demonstrator targets one library location. The domain model includes library locations so a later pilot can configure more than one library without redesigning core records.

### User-facing areas

- **Student portal:** authentication, catalogue search and availability, entry-slot discovery, booking creation/cancellation, booking history and own loan history.
- **Reception dashboard:** today's bookings, check-in, walk-in recording, slot capacity and booking status.
- **Librarian dashboard:** catalogue, physical copies, issue/return and loan history.
- **Admin dashboard:** user and role management, library locations, opening hours, slot generation/capacity and operational summaries.

Entry booking controls the number of people expected to arrive in a time window. It does not reserve a seat and does not by itself measure how many people are physically inside the library. Live occupancy/seat allocation is a later extension.

## 2. Technology and deployment shape

- Frontend: React + Vite, developed separately and integrated through a reviewed branch/PR.
- Backend: Python 3 + Flask.
- Database: MongoDB Atlas accessed only through PyMongo.
- API: REST endpoints exchanging JSON.
- Tests: pytest for backend; frontend test tooling selected during integration.

**Architecture style: layered modular monolith.** One Flask application is organized into domain modules and layers. It is deployed and tested as one backend. Microservices are explicitly not part of this project's scope.

```
React application
      | HTTPS + JSON (REST)
      v
Flask routes / API boundary
      v
Application services (business rules)
      v
Repositories (database access)
      v
MongoDB Atlas
```

The frontend never connects directly to MongoDB and never contains database credentials.

## 3. Backend layers

### Routes
Receive HTTP requests, authenticate/authorize at the API boundary, validate request shape, call a service and translate results/errors into HTTP responses. Routes do not contain business rules or PyMongo queries.

### Services
Own business rules and use cases. Examples: reserve a slot, cancel a booking, check a student in, issue a loan and return a copy. Services enforce ownership, role-sensitive rules and multi-document consistency. They do not depend on Flask request/response objects.

### Repositories
The only layer that reads or writes MongoDB. Provide focused operations for users, libraries, books, copies, loans, entry slots and bookings. Repositories do not implement application policy.

### Models
Represent domain records and validate/serialize their data. They do not call the database or handle HTTP.

### Database
Creates and manages the shared PyMongo client and database handles. Database setup scripts create collections, validators and indexes.

### Shared utilities
Contain narrowly scoped helpers such as time conversion, input validation, serialization, authentication support and application errors. Utilities must not import routes, services or repositories.

## 4. Domain modules and dependencies

Organize features by domain, while preserving the layer boundaries:

| Domain module | Responsibility |
|---|---|
| users/auth | Accounts, login, sessions and roles |
| libraries | Library locations, timezones, opening hours and operating configuration |
| books | Bibliographic catalogue and search |
| copies | Physical inventory and availability |
| loans | Issue, return, due dates and history |
| bookings | Entry slots, reservations, cancellations and check-in |
| admin/reports | Configuration, user administration and operational summaries |

Dependency direction:

```
routes -> services -> repositories -> database
                    -> models
all layers -----------------------> shared utils
```

Models are shared domain data structures; they must not become a second service or repository layer.

## 5. Entry booking design

### Slot lifecycle
1. An administrator or authorized staff member configures a library's opening hours, slot duration and arrival capacity.
2. The system creates bookable entry-slot records for a defined date range.
3. Students view only open future slots with remaining capacity.
4. A student reserves one slot. The backend checks eligibility, time window, duplicate booking and capacity.
5. Reception staff check the student in against the confirmed booking.
6. The system records cancellations and no-shows for operational reporting.

A slot's capacity means **maximum confirmed arrivals assigned to that arrival window**. It is not a real-time occupancy count.

### Booking statuses
- `CONFIRMED`: reservation holds capacity.
- `CHECKED_IN`: reception recorded arrival.
- `CANCELLED`: student or authorized staff cancelled before check-in.
- `NO_SHOW`: the arrival window and grace period passed without check-in.

The service must reject check-in for cancelled bookings, duplicate check-in and bookings outside the permitted grace period. No-show processing must be idempotent. Cancellation releases the reserved capacity atomically. A no-show remains in the historical record; it must not silently erase the booking.

### Concurrency and overbooking
Capacity must be enforced in the backend, not by a frontend count. Booking creation performs a conditional atomic capacity update and inserts the booking in one MongoDB transaction. If the capacity update or insert fails, the transaction is aborted. A unique partial index prevents the same student from holding duplicate confirmed bookings for the same slot. Transactions require a supported Atlas replica-set deployment; confirm the selected tier before implementing this flow.

## 6. Data ownership and time

- Each library location has an IANA timezone, e.g. `Europe/Berlin`.
- Persist timestamps as UTC BSON dates. Convert to/from the library's timezone at the API and UI boundaries.
- Every book copy belongs to a library location. A loan references the specific copy and borrower.
- Every entry slot belongs to one library location.
- Every booking references one slot and the student who made it.
- Do not trust a user-supplied role, user id or capacity count. Derive identity from the authenticated session and capacity from stored slot data.

## 7. Security

- Store salted password hashes only; never return hashes or log credentials.
- Use secure, HttpOnly session cookies and CSRF protection for state-changing requests.
- Enforce role permissions on every protected endpoint. Students can only view/manage their own bookings and loans.
- Only authorized reception/librarian roles can check in a student. Only administrators can configure locations, hours and capacity.
- Use a strict CORS allowlist; never combine wildcard origins with credentialed requests.
- Validate all inputs, ObjectIds, dates, status values, pagination and search parameters on the backend.
- Prevent NoSQL injection by constructing queries from validated fields; never pass user-supplied query operators to PyMongo.
- Keep secrets in environment configuration. Use individual, least-privilege Atlas database users and separate development/test databases.
- Log important staff actions (check-in, manual cancellation, capacity changes and circulation events) without logging passwords, tokens or unnecessary personal data.

## 8. Testing strategy

- Unit-test service rules using controlled/fake repository dependencies.
- Repository integration tests run against a separate test database.
- Route tests cover authentication, roles, validation and response codes.
- Booking tests cover capacity exhaustion, simultaneous booking attempts, duplicate bookings, cancellation capacity release, invalid check-in, grace-period expiry and idempotent no-show processing.
- Loan tests cover concurrent issue attempts and consistency between copies and loans.
- End-to-end browser tests cover student booking and reception check-in.
- Never run destructive tests against development or production data.

## 9. Future pilot readiness (not an MVP promise)

A real SRH pilot would additionally require institutional approval, privacy/security review, production hosting, monitoring, backups and recovery, staff acceptance testing, accessibility checks, support ownership and potentially institutional SSO. These are explicit deployment-readiness tasks, not features we should claim today.

## 10. Out of scope for the first release

Individual seat selection, live occupancy sensors, payments/fines, email/SMS notifications, institutional SSO, integrations with existing SRH systems, mobile native apps and microservices. These can be evaluated after the core platform is stable.

## 11. Open architecture decisions

See the decision register in `docs/implementation-plan.md`. In particular, finalize session/CSRF/CORS mechanisms, test database strategy, account provisioning, library opening-hours policy, slot duration/capacity policy, booking lead time and check-in grace period before their implementation phases.
