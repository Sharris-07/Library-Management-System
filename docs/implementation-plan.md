# Implementation Plan

**Status:** Architecture and documentation revision underway on `architecture-smart-access`. The current application is still an early Flask scaffold. Atlas, authentication, catalogue, copies, loans, entry booking and React integration are not implemented.

## 1. Delivery strategy

Target: a strong academic project and a credible prototype that could be demonstrated to SRH for feedback and possible pilot consideration. This is **not** a commitment that SRH has approved deployment.

Build in controlled increments:
1. Establish a secure and testable backend foundation.
2. Deliver the core library workflow.
3. Deliver entry booking and reception check-in.
4. Integrate the React frontend and complete end-to-end testing.
5. Prepare a pilot-readiness package and demonstrate the system.

A phase is complete only when code, tests, review and documentation are complete. Do not claim planned features as implemented.

## 2. Progress overview

| # | Phase | Status |
|---|---|---|
| 1 | Architecture and product requirements | In progress |
| 2 | Atlas setup and configuration | Not started |
| 3 | PyMongo foundation and test setup | Not started |
| 4 | Domain models, collections and indexes | Not started |
| 5 | Authentication and authorization | Not started |
| 6 | Library locations and operating configuration | Not started |
| 7 | Book catalogue and physical copies | Not started |
| 8 | Borrowing, returns and loan history | Not started |
| 9 | Entry slots and booking engine | Not started |
| 10 | Reception dashboard and staff workflows | Not started |
| 11 | React integration and student portal | Not started |
| 12 | System, security and concurrency testing | Not started |
| 13 | Demonstration and pilot-readiness review | Not started |

## 3. Phases and acceptance criteria

### Phase 1 — Architecture and product requirements
- Review this document and the architecture, database and API documents as a team.
- Confirm the product scope: entry booking, not seat booking; academic delivery plus possible pilot; ambitious but manageable scope.
- Resolve decisions that block implementation and assign an owner to each.
- Align frontend documentation with the React + Vite branch.
- Keep implementation status statements accurate.

**Done when:** team agrees on documents, branch responsibilities and decision owners.

### Phase 2 — MongoDB Atlas and environment configuration
- Confirm Atlas project/cluster and transaction support for the selected tier.
- Create separate development and test databases.
- Give each developer an individual least-privilege database user; never share credentials.
- Restrict network access to required IPs.
- Align `.env.example`, `config.py` and actual secret-loading location.
- Remove stale SQLite/SQLAlchemy configuration and dependencies.
- Confirm `.env` is ignored by Git.

**Done when:** each developer can connect using their own credentials and no secrets or SQL-era remnants remain.

### Phase 3 — PyMongo foundation and testing setup
- Create one shared MongoClient/database module.
- Add connection lifecycle handling and database-aware health check.
- Add UTC/time utilities and common application errors.
- Choose test strategy: isolated Atlas test database for transaction/integration tests; fakes for fast service unit tests.
- Add fixtures and prove tests cannot accidentally target development data.

**Done when:** connection success/failure paths and test isolation are verified.

### Phase 4 — Domain models, collections and indexes
- Implement models and repositories for users, libraries, books, copies, loans, entry slots and bookings as the relevant phases require.
- Create an idempotent database setup script with validators and indexes.
- Add partial unique indexes for one active loan per copy and one confirmed booking per student/slot.
- Verify unique email, accession number, library code and slot identity rules.

**Done when:** fresh database setup is repeatable and automated tests verify key constraints.

### Phase 5 — Authentication and authorization
- Decide session storage, CSRF, CORS, registration/account provisioning, first admin creation and password/rate-limit policy.
- Implement password hashing, login, logout and current-user endpoint.
- Implement role checks and ownership checks.
- Test invalid credentials, deactivated accounts, forbidden roles, CSRF failure and disallowed origins.

**Done when:** protected endpoints reject unauthorized access and security tests pass.

### Phase 6 — Library locations and operating configuration
- Implement library location model/repository/service/routes.
- Store IANA timezone and active status.
- Define opening hours, exception dates, slot duration, booking horizon, arrival capacity, cancellation cutoff and check-in grace period.
- Start with one configured library for the demonstration; retain multi-location support in the data model.
- Implement admin controls for location and schedule configuration.

**Done when:** an admin can configure a library and the backend reliably interprets its local opening schedule.

### Phase 7 — Book catalogue and physical copies
- Implement catalogue search/create/update.
- Implement physical copy registration and status management.
- Assign each copy to a library location.
- Enforce accession-number uniqueness and prevent manual setting of `ON_LOAN`.
- Show copy availability accurately.

**Done when:** staff can manage books/copies and students can search catalogue/availability under approved access rules.

### Phase 8 — Borrowing, returns and loan history
- Decide loan duration, maximum active loans, renewal policy and whether fines are excluded.
- Implement issue and return as transaction-safe service operations.
- Implement staff search and student self-service loan history.
- Derive overdue status from due date.
- Test concurrent issue attempts and transaction rollback.

**Done when:** copy and loan records remain consistent and all role/ownership tests pass.

### Phase 9 — Entry slots and booking engine
- Implement slot generation from library opening hours and configured slot duration.
- Make slot generation idempotent and prevent unintended overlapping slots.
- Implement availability search and remaining-capacity calculation.
- Implement booking creation with an atomic conditional capacity update and booking insert in one transaction.
- Implement cancellation with exactly-once capacity release.
- Enforce duplicate confirmed-booking prevention and booking lead-time/cancellation rules.
- Implement check-in eligibility and idempotent no-show processing.
- Test full capacity, two simultaneous last-place attempts, duplicate booking, cancellation/rebooking, expired slot and transaction failure.

**Done when:** automated tests demonstrate that overbooking cannot occur under concurrent requests and all booking state transitions obey policy.

### Phase 10 — Reception dashboard and staff workflows
- Build daily booking roster by library/date/slot.
- Search booking by student identifier or booking reference using minimum necessary personal data.
- Implement check-in with staff identity and timestamp.
- Show confirmed, checked-in, cancelled and no-show states.
- Decide and implement a clearly labelled walk-in workflow if approved.
- Provide basic capacity and daily-arrival summaries.

**Done when:** a receptionist can manage a realistic day of reservations without directly editing database records.

### Phase 11 — React integration and student portal
- Integrate the React + Vite frontend through a reviewed pull request; frontend calls Flask only through REST.
- Finalize API request/response schemas, errors, pagination and CSRF/session handling.
- Implement login, catalogue, availability, slot selection, booking confirmation/cancellation, booking history and loan history.
- Use accessible forms, clear validation, loading/error states and responsive layouts.
- Test in browser against the real backend.

**Done when:** a student can complete the end-to-end booking and catalogue workflows from the UI, and staff can check in that booking.

### Phase 12 — System, security and concurrency testing
- Unit tests for service rules; repository integration tests; route permission tests; browser end-to-end tests.
- Test booking capacity races, loan races, transaction rollback, duplicate requests and repeated status transitions.
- Review authentication, CSRF, CORS, validation, NoSQL injection, secrets, logging and role boundaries.
- Check privacy minimization, retention assumptions and accessibility.
- Fix all critical/high findings and document known limitations.

**Done when:** all required tests pass, security review findings are resolved or formally accepted, and documentation matches the code.

### Phase 13 — Demonstration and pilot-readiness review
- Prepare a reproducible demo environment with synthetic test data.
- Demonstrate student booking, receptionist check-in, catalogue search and librarian circulation.
- Prepare architecture diagram, database model, API summary, test evidence, known limitations and user guide.
- Gather feedback from teaching staff and, only if invited, relevant SRH library stakeholders.
- For any real pilot, obtain institutional approval and complete hosting, monitoring, backup/recovery, privacy, security, accessibility, support and integration reviews.

**Done when:** the academic deliverable is demonstrable and a separate, evidence-based decision can be made about whether a pilot is feasible.

## 4. Open decisions register

| ID | Decision | Needed by |
|---|---|---|
| D1 | Session storage: signed cookie or server-side revocable session | Phase 5 |
| D2 | CSRF mechanism | Phase 5 |
| D3 | CORS implementation and allowed origins | Phase 5 |
| D4 | Test database strategy; ensure integration tests use real MongoDB behavior | Phase 3 |
| D5 | Student registration/institutional account provisioning and first admin creation | Phase 5 |
| D6 | Whether catalogue browsing is public or requires login | Phase 7 |
| D7 | Loan duration, loan limit, renewals and fine policy | Phase 8 |
| D8 | Additional copy statuses and lost-item handling | Phase 7/8 |
| D9 | Student ID and accession-number formats | Phase 4/7 |
| D10 | Error response format, pagination and filtering conventions | Phase 11 |
| D11 | MongoDB validators and Atlas transaction support | Phase 2/4 |
| D12 | Database module location, legacy extensions/instance cleanup and .env loading | Phase 2 |
| D13 | Password rules and login rate limiting | Phase 5 |
| D14 | Book category policy | Phase 7 |
| D15 | Library opening hours, holidays and exception dates | Phase 6 |
| D16 | Slot duration and maximum arrivals per slot | Phase 6 |
| D17 | Booking lead time, cancellation cutoff and booking limits per student | Phase 6/9 |
| D18 | Check-in grace period and no-show policy | Phase 6/9 |
| D19 | Walk-in handling and staff override permissions | Phase 10 |
| D20 | Pilot hosting, retention, support and institutional integration requirements | Phase 13 |

Record the decision, date, rationale and responsible person when each item is resolved. Do not silently invent operational policies.

## 5. Team workflow

- Keep backend, frontend and database work on separate feature branches.
- Each task has one owner and a clear acceptance criterion.
- Open pull requests against the agreed integration branch; review before merging.
- Reza's database review/access must use an individual least-privilege database account. Read/write access to the project database is not Atlas project-admin access.
- Coordinate API contracts before frontend implementation; do not let React call MongoDB directly.
- Keep `main` stable and demonstrable. Merge only tested, reviewed work.
