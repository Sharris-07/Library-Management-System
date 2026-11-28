# Architecture

**Status:** Revised target architecture for the complete Library Management System. This document defines intended product scope and design; it does not claim that all workflows are implemented. The current backend foundation and seven-collection Atlas initialization are an initial technical baseline only.

## 1. Product scope

The Smart University Library Management System is a web application for students and library staff. It combines catalogue and physical-copy management, borrowing and returns, book reservations, library entry-slot bookings, overdue fines, payment recording, administration and reporting.

The first demonstrator may target one library location, but the data model supports multiple locations.

### User roles and areas

- **Student:** account, catalogue search, copy availability, loans, book reservations, fines/payment history, entry-slot bookings and booking history.
- **Reception:** daily entry roster, check-in, capacity monitoring and policy-controlled walk-in recording.
- **Librarian:** catalogue/copy management, issue/return, book-reservation queue, overdue-fine review and payment recording.
- **Admin:** user/role management, library configuration, borrowing and fine policies, reports and activity logs.

The backend is authoritative for identity, roles, ownership and permissions. A role displayed or selected by the frontend is never trusted as authorization evidence.

## 2. Two independent reservation workflows

The word "reservation" refers to two different domain processes. They must have separate models, endpoints, statuses and business rules.

### 2.1 Book reservation

A book reservation is a request for a particular catalogue title, not a reservation to enter the library.

The system supports both modes:

1. **Available-copy reservation:** if a physical copy is available, the service assigns a specific copy to the requesting user and places it on hold for collection. The reservation enters `READY_FOR_PICKUP`, the copy enters `RESERVED`, and a `hold_until` deadline is recorded.
2. **Waiting queue:** if no copy is available, the user enters the title's FIFO waiting queue with status `WAITING`. Queue order is determined by the reservation creation timestamp plus a stable tie-breaker, not by a client-supplied position.

When a copy is returned or otherwise becomes available, the reservation service allocates it to the oldest eligible waiting reservation. The service changes the reservation to `READY_FOR_PICKUP`, assigns the copy and sets a collection deadline. When the deadline expires without collection, the hold expires, the copy is released and offered to the next eligible waiting user.

Initial reservation statuses:
- `WAITING`: waiting for a copy.
- `READY_FOR_PICKUP`: a specific copy is held for the user until `hold_until`.
- `FULFILLED`: the user collected the copy and the loan was issued.
- `CANCELLED`: cancelled by the owner or authorized staff.
- `EXPIRED`: a collection hold expired.

Rules:
- A user cannot hold more than one active reservation for the same title unless an explicit policy allows it.
- A user may cancel their own eligible reservation; staff may cancel with an audit reason.
- Only the reservation owner may collect a held copy.
- A held copy cannot be issued to another user.
- When a held copy is issued, the reservation is marked `FULFILLED` and the loan is created consistently.
- Expiration and queue allocation must be idempotent. Re-running a scheduled task must not allocate the same copy twice.
- Queue priority is server-controlled. Users cannot jump the queue by submitting a position.

### 2.2 Library entry-slot booking

An entry booking reserves an arrival window at a particular library location. It is independent of the book-reservation workflow. A user can reserve a book and separately book a library visit.

Lifecycle:
1. Authorized staff configure a library's timezone, opening hours, slot duration and arrival capacity.
2. The system generates bookable entry slots for a defined future period.
3. Students view open future slots and their remaining capacity.
4. A student reserves one slot. The backend checks eligibility, booking lead time, duplicate booking and capacity.
5. Reception checks the student in against the confirmed booking.
6. Cancellations and no-shows remain in the operational history.

Entry-booking statuses:
- `CONFIRMED`
- `CHECKED_IN`
- `CANCELLED`
- `NO_SHOW`

A slot capacity is the maximum number of confirmed arrivals assigned to that time window. It does not reserve a seat or represent live occupancy.

The service must reject check-in for cancelled bookings, duplicate check-in and bookings outside the configured grace period. No-show processing must be idempotent. Cancellation releases capacity exactly once. A no-show remains in history.

### 2.3 Entry-booking concurrency

Capacity must be enforced by the backend, not by a frontend count. Booking creation uses a conditional atomic capacity update and inserts the booking in one MongoDB transaction. If either operation fails, abort the transaction. A partial unique index prevents duplicate active bookings by one user for one slot. Transactions require a supported Atlas replica-set deployment; verify the cluster supports transactions before implementing this flow.

## 3. Loans, fines and payments

### 3.1 Circulation

A loan represents the issue of one physical copy to one user. A book title may have many copies; a copy may have many historical loans but at most one active loan.

Issuing and returning a copy update the copy and loan consistently. A conditional copy-status update and a partial unique active-loan index prevent two librarians from issuing the same copy concurrently.

### 3.2 Fine assessment

Fines are a core product feature, not an optional extension. The system assesses overdue charges using configurable policy values such as loan duration, maximum active loans and fine rate per overdue day.

A fine is associated with a loan and borrower. It stores the assessed amount, currency, rate/policy snapshot, assessment period, outstanding amount/status and timestamps. The service must calculate money using integer minor units (for example, euro cents) or an exact decimal type; never use binary floating-point for financial arithmetic.

The fine workflow must define how accrued overdue amounts are refreshed, including when a student views a balance or makes a payment. Fine assessment must be idempotent so retries do not create duplicate charges for the same loan and assessment period. Waivers or adjustments require authorized roles and an audit reason.

### 3.3 Payment recording

Payments are separate immutable financial records linked to a fine and payer. The initial desk workflow allows authorized library staff to record money actually received (the current frontend describes payment at the library desk). The design supports full or partial payments and multiple payments against one fine. Outstanding balance is calculated from the assessed fine less valid payments and approved adjustments.

A payment record includes amount, currency, method, received timestamp, receiving staff member and an optional receipt/reference. The initial implementation may support `CASH` recording. An online payment gateway is not assumed; it would require a separately agreed provider, secure callback/webhook handling, reconciliation and refund design.

Payment recording and fine balance updates must be transactional and idempotent. Never mark a fine paid solely because the frontend says a payment succeeded. The backend records the payment and derives/updates the fine's payment state.

## 4. Technology and deployment shape

- Frontend: React + Vite.
- Backend: Python 3 + Flask.
- Database: MongoDB Atlas accessed only through PyMongo.
- API: REST endpoints exchanging JSON.
- Backend tests: pytest; frontend test tooling selected during integration.

**Architecture style: layered modular monolith.** One Flask application is organized into domain modules and layers. It is deployed and tested as one backend. Microservices are not part of this project's scope.

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

## 5. Backend layers

### Routes
Receive HTTP requests, authenticate/authorize at the API boundary, validate request shape, call a service and translate results/errors into HTTP responses. Routes do not contain business rules or PyMongo queries.

### Services
Own business rules and use cases: register/login, search catalogue, reserve/cancel a book, allocate a waiting-queue copy, issue/return a loan, assess a fine, record a payment, create/cancel an entry booking, check in a visitor and manage policies. Services do not depend on Flask request/response objects.

### Repositories
The only layer that reads or writes MongoDB. Provide focused operations for users, libraries, books, copies, loans, book reservations, fines, payments, entry slots, entry bookings, activity logs and system settings. Repositories do not implement application policy.

### Models
Represent domain records and validate/serialize their data. They do not call the database or handle HTTP.

### Database
Creates and manages the shared PyMongo client and database handles. Database setup scripts create collections, validators and indexes in an idempotent, additive manner.

### Shared utilities
Contain narrowly scoped helpers such as time conversion, money arithmetic, input validation, serialization, authentication support and application errors. Utilities must not import routes, services or repositories.

## 6. Domain modules and dependencies

| Domain module | Responsibility |
|---|---|
| users/auth | Accounts, login, sessions and roles |
| libraries | Library locations, timezones and opening hours |
| catalogue/copies | Bibliographic records, physical inventory and availability |
| loans | Issue, return, due dates and history |
| book_reservations | Available-copy holds, waiting queue, allocation and expiry |
| fines/payments | Fine assessment, balances, payment recording and adjustments |
| entry_bookings | Entry slots, bookings, cancellations, check-in and no-shows |
| admin/reports | Configuration, user administration, reporting and audit views |

Dependency direction:

```
routes -> services -> repositories -> database
                    -> models
all layers -----------------------> shared utils
```

Models are shared domain data structures; they must not become a second service or repository layer.

## 7. Data ownership, time and money

- Each library location has an IANA timezone, e.g. `Europe/Berlin`.
- Persist timestamps as UTC BSON dates. Convert local library times at API/UI boundaries.
- Every physical copy belongs to one library location and one catalogue title.
- Every loan references one copy and borrower.
- Every book reservation references one title, owner and, when allocated, one specific copy.
- Every entry slot belongs to one library; every entry booking references one slot and user.
- Every fine references a loan and borrower; every payment references a fine and payer.
- Derive user identity and role from authenticated server-side state.
- Use integer minor units or exact decimal values for monetary amounts, with an explicit currency.

## 8. Security and audit

- Store salted password hashes only; never return hashes or log credentials.
- Use secure, HttpOnly session cookies and CSRF protection for state-changing requests.
- Enforce role permissions on every protected endpoint. Students can only view/manage their own loans, reservations, fines, payments and entry bookings.
- Only authorized reception/librarian roles can check in visitors. Librarians can manage circulation and record payments. Only administrators can configure roles and system-wide policies.
- Use a strict CORS allowlist; never combine wildcard origins with credentialed requests.
- Validate all inputs, ObjectIds, dates, status values, pagination, money amounts and search parameters on the backend.
- Prevent NoSQL injection by constructing queries from validated fields; never pass user-supplied query operators to PyMongo.
- Keep secrets in environment configuration. Use individual least-privilege Atlas users and separate development/test databases.
- Write audit records for privileged actions, book/copy issue and return, reservation allocation/cancellation/expiry, fine adjustments/waivers, payment recording, entry check-in and capacity/policy changes. Do not log passwords, tokens or unnecessary personal data.

## 9. Testing strategy

- Unit-test service rules using controlled/fake repository dependencies.
- Repository integration tests run against a separate test database.
- Route tests cover authentication, role permissions, ownership, validation and response codes.
- Book-reservation tests cover available-copy holds, FIFO queue order, queue allocation after return, hold expiry, cancellation, duplicate reservations and concurrent allocation.
- Entry-booking tests cover capacity exhaustion, simultaneous booking attempts, duplicate bookings, cancellation capacity release, invalid check-in, grace-period expiry and idempotent no-show processing.
- Loan tests cover concurrent issue attempts and consistency between copies and loans.
- Fine/payment tests cover overdue calculation, policy snapshots, partial/full payments, outstanding balance, duplicate payment requests, waivers/adjustments and audit history.
- End-to-end browser tests cover student book reservation, collection/issue, fine visibility/payment recording and independent entry booking/check-in.
- Never run destructive tests against development or production data.

## 10. Pilot readiness

A real university pilot additionally requires institutional approval, privacy/security review, production hosting, monitoring, backups and recovery, staff acceptance testing, accessibility checks, support ownership and potentially institutional SSO/integrations. These are deployment-readiness tasks, not features to claim today.

## 11. Explicitly deferred integrations (not core-feature exclusions)

The current core product includes fines and payment recording. The following integrations can be considered separately:
- Online payment gateway and automated bank reconciliation.
- Email/SMS/push notification provider.
- Institutional SSO and integration with existing university library systems.
- Individual seat selection and live occupancy sensors.
- Native mobile apps and microservices.

## 12. Open decisions

See the decision register in `docs/implementation-plan.md`. The team must agree detailed business policies such as hold duration, queue eligibility, fine accrual/waiver rules, payment methods, refund handling, slot duration/capacity and check-in grace period before those rules are coded.
