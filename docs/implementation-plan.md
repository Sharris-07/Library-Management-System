# Implementation Roadmap

**Academic delivery target:** Tuesday, 1 December 2026.

**Product baseline:** Full Smart University Library Management System. The required product includes catalogue and copy management, loans/returns, both types of reservation, fines, payment recording, entry management, administration and reporting. The deadline affects delivery sequencing; it does not silently remove core requirements from the agreed product architecture.

## 1. Delivery strategy

Build a coherent, testable system in vertical slices. Keep the complete target architecture documented, but distinguish clearly between:
- **Target scope:** all features the product is intended to provide.
- **Implemented:** code exists and is integrated.
- **Verified:** automated/manual tests demonstrate the behavior.
- **Deferred integration:** an external service such as an online payment gateway or institutional SSO that is not required for the initial payment-recording workflow.

A screen, schema, API endpoint description or mock record alone does not make a feature implemented.

## 2. Product workstreams and acceptance criteria

### A. Accounts and access control
- Student, reception, librarian and admin roles.
- Authentication with secure server-side session handling.
- Backend authorization and ownership checks on every protected operation.
- Password hashing, CSRF protection, secure cookie settings and strict CORS.
- Tests for role boundaries and inactive accounts.

### B. Catalogue and physical inventory
- Create/update/archive catalogue records.
- Manage physical copies and accession numbers.
- Search catalogue and show availability by library.
- Enforce valid copy-state transitions.
- Prevent hard deletion of referenced catalogue/circulation records.

### C. Circulation
- Librarian issues an available copy to a user.
- Return records receiving staff and return timestamp.
- Due date and loan duration are based on configured policy.
- Prevent issuing the same copy twice, including concurrent requests.
- Preserve loan history.

### D. Book reservations — both modes required
- If a copy is available, reserve and hold a specific copy for collection.
- If all copies are unavailable, create a FIFO waiting-queue reservation.
- When a copy is returned/available, allocate it to the oldest eligible waiting user.
- A held copy has a collection deadline; expiry releases it to the next waiting user.
- Only the reservation owner can collect the held copy.
- Fulfilment and loan creation are consistent and auditable.
- Tests cover available-copy reservation, queue order, allocation, expiry, cancellation, duplicates and concurrent workers.

### E. Fines and payment management
- Calculate overdue charges using configured fine policy.
- Expose student fine list and outstanding balance.
- Librarian can record payment received at the library desk.
- Support partial and full payments and multiple payment records per fine.
- Maintain payment history and receipts/references where applicable.
- Fine balance/status updates are transactional and use exact money arithmetic (integer cents or Decimal128).
- Support authorized waiver/adjustment with reason and audit trail.
- Tests cover due-date boundaries, partial/full settlement, duplicate payment requests, balance reconciliation and reversals/waivers.
- Online payment gateway is a separate integration, not a prerequisite for core fine/payment management.

### F. Library entry-slot booking
- Configure library opening hours, slot duration, booking horizon and arrival capacity.
- Generate and expose future slots.
- Student can view availability, book and cancel within policy.
- Enforce capacity atomically to prevent overbooking.
- Reception can view daily roster and check in confirmed users.
- Handle grace period and no-show status idempotently.
- Tests cover simultaneous booking, capacity exhaustion, duplicate bookings, cancellation and check-in rules.

### G. Administration, audit and reporting
- Manage users, roles, libraries and policies.
- Configure loan period, maximum active loans and fine rate.
- Configure book-reservation hold period and entry-booking policies.
- Record audit events for circulation, reservations, fines, payments and check-in.
- Provide useful operational summaries without exposing records to unauthorized roles.

## 3. Database target

The revised target schema contains twelve collections:

1. `users`
2. `library_locations`
3. `books`
4. `book_copies`
5. `loans`
6. `book_reservations`
7. `fines`
8. `payments`
9. `entry_slots`
10. `bookings` (library entry bookings only)
11. `activity_logs`
12. `system_settings`

The existing integration branch has the original seven collection definitions and the user has successfully initialized those seven collections and thirteen indexes on Atlas. The revised schema must be implemented additively: retain existing collections, validators and indexes, add the five new collections and required indexes, and safely update existing validators/status enums where needed. Never drop/recreate the database as a shortcut.

## 4. Current baseline (as of 28 November 2026)

| Workstream | Verified status |
|---|---|
| Flask application/configuration scaffold | Present on integration branch |
| MongoDB Atlas connection | Successfully tested by project owner |
| Original seven collections and thirteen indexes | Successfully initialized on Atlas |
| Configuration/schema/health tests | Eight tests passed in GitHub Actions |
| Full twelve-collection target schema | Documented in this architecture revision; not yet implemented |
| Authentication and role authorization | Not implemented |
| Catalogue/copy/loan services | Not implemented as complete backend workflows |
| Available-copy and queue reservations | Not implemented in backend |
| Fine assessment/payment ledger | Not implemented in backend |
| Entry-slot booking/check-in | Not implemented in backend |
| React frontend | Exists on separate frontend feature branch; API integration incomplete |
| End-to-end integration tests | Not implemented |

The eight passing CI tests validate the initial scaffold/schema declarations; they do not prove all workflows or live Atlas transaction behavior.

## 5. Recommended implementation phases

### Phase 0 — Architecture and contract alignment
1. Treat this architecture, database design and roadmap as the shared baseline.
2. Reconcile Reza's API contract: retain catalogue, loans, book reservations, fines, payment recording, users, settings and logs; add entry slots/bookings/check-in.
3. Reconcile Michael's database review against all twelve collections, validators, indexes and transaction boundaries.
4. Align Nandani's React screens and routes to the API contract; preserve the existing Fines, Reservations, Overdue Books, Issue/Return and administration screens.
5. Agree all open business policies before coding affected workflows.

**Exit gate:** one approved architecture, database schema and API contract; no conflicting "out of scope" statements.

### Phase 1 — Database foundation and security
1. Confirm least-privilege Atlas development and test users.
2. Add the five new collection validators and indexes through idempotent initialization.
3. Review existing collection validators and extend allowed roles/status values additively (including RECEPTION and RESERVED where appropriate).
4. Verify all twelve collections and indexes in Atlas.
5. Add repository integration tests using a separate test database.
6. Confirm Atlas transactions work on the selected deployment.

**Exit gate:** clean initialization works repeatedly without data loss; validators/indexes are inspected; CI passes.

### Phase 2 — Authentication, roles and catalogue
1. Implement account/session lifecycle and authorization.
2. Implement users and library repositories/services.
3. Implement book and copy management/search.
4. Implement student, reception, librarian and admin permissions.
5. Connect login, catalogue and administration UI.

**Exit gate:** role and ownership tests pass; frontend can authenticate and search the real catalogue.

### Phase 3 — Circulation and book reservations
1. Implement issue/return with transactional copy/loan updates.
2. Implement available-copy reservation and hold deadline.
3. Implement FIFO waiting queue for unavailable titles.
4. Implement allocation on return/availability and hold expiry/reallocation.
5. Implement reservation fulfilment into a loan.
6. Connect student reservation and librarian reservation queue screens.

**Exit gate:** concurrent allocation/issue tests pass; a student can reserve an available copy or queue for an unavailable title and complete collection.

### Phase 4 — Fines and payment management
1. Implement policy-driven overdue fine calculation and idempotent assessment.
2. Implement student fine list, outstanding balance and payment history.
3. Implement librarian desk payment recording, initially including cash.
4. Support partial/full payment, multiple payments, waiver/adjustment and audit trail.
5. Connect student Fines and librarian Overdue Books screens.

**Exit gate:** money arithmetic is exact; payment retries cannot duplicate charges; ledger and outstanding balances reconcile.

### Phase 5 — Library entry booking
1. Implement opening hours, slot generation and availability.
2. Implement student booking/cancellation with atomic capacity enforcement.
3. Implement reception roster and check-in.
4. Implement no-show processing and audit.
5. Connect student and reception entry-booking screens.

**Exit gate:** concurrent capacity tests prevent overbooking; check-in/no-show rules pass.

### Phase 6 — Administration, reports and full integration
1. Complete policy settings and role administration.
2. Complete audit views and operational reports.
3. Connect all remaining React pages to tested API endpoints.
4. Run end-to-end workflows across student, reception, librarian and admin roles.
5. Perform security, validation, error-handling and usability review.

**Exit gate:** all agreed core workflows work through the React UI and Flask API with automated tests.

### Phase 7 — Release preparation
- Reproduce setup from a clean clone and clean environment.
- Run backend and frontend tests.
- Verify no secrets or sample credentials are committed.
- Prepare architecture explanation, database diagram, API contract and demonstration script.
- Document any incomplete functionality honestly.
- Freeze features before final assessment; fix release-blocking defects only.

## 6. Suggested work allocation

| Team role | Primary responsibility | Required coordination |
|---|---|---|
| Project lead / backend integration | Architecture, Flask application, service boundaries, integration and quality gates | Owns API/schema compatibility and final review |
| Database reviewer (Michael) | Validate collection design, indexes, schema validation and transactions | Review actual implementation, not only diagrams |
| API contract owner (Reza) | Endpoint/request/response contract and role matrix | Align both reservation workflows and financial endpoints |
| Frontend owner (Nandani) | React screens, routing, API client and integration | Preserve current screens and agree response contracts |
| All members | Tests, documentation, code review and oral explanation | No unreviewed changes to shared integration branch |

Adjust assignments with the team's agreement; ownership does not remove the need for peer review.

## 7. Quality gates

- Keep `main` unchanged until reviewed PRs and acceptance tests pass.
- Use feature branches and PR review; do not merge incompatible architecture documents.
- Never commit `.env`, Atlas credentials, passwords or private keys.
- Use separate development and test databases.
- Do not use the development database for destructive tests.
- Derive user identity and role from authenticated server-side state.
- Enforce book-copy allocation, payment recording and entry-slot capacity transactionally where multiple documents are involved.
- Use exact money arithmetic and idempotency for financial writes.
- Do not claim features as implemented without executable tests.
- Preserve audit history for financial and privileged operations.

## 8. Open decisions register

The following policies require explicit team agreement. The architecture defines the capability; these values/rules must be decided before implementation.

| Area | Decision required |
|---|---|
| Accounts | Who may self-register? Who creates reception/librarian/admin accounts? |
| Sessions | Cookie session implementation, CSRF mechanism, session expiry and CORS origins |
| Catalogue | Public or authenticated catalogue; required ISBN/category validation |
| Copy policy | Allowed statuses, damaged/lost handling and withdrawal rules |
| Loans | Loan duration, maximum active loans, renewals and eligibility |
| Book reservations | Hold duration, reservation limits, FIFO eligibility, priority exceptions, cancellation and expiry rules |
| Fines | Fine rate, grace period, calendar-day vs 24-hour calculation, accrual cutoff and maximum fine |
| Payments | Initial accepted methods, partial payments, receipt format, overpayment, reversal/refund and waiver permissions |
| Entry booking | Slot duration, booking horizon, arrival capacity, cancellation cutoff, grace period and no-show policy |
| Walk-ins | Whether reception may record walk-ins and how they consume capacity |
| Notifications | Whether in-app/email notifications are required for ready-for-pickup and entry reminders |
| Operations | Test DB strategy, scheduled-job mechanism, backup/retention and audit-log retention |

## 9. Scope boundaries

Core LMS scope includes both book-reservation modes, entry-slot booking, fines and payment recording. The following are external or advanced integrations and should be planned separately unless the team explicitly adds them: online payment gateway, bank reconciliation, email/SMS provider, institutional SSO, integrations with existing SRH systems, live seat occupancy sensors, native mobile apps and microservices.
