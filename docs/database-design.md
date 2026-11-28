# Database Design (MongoDB Atlas)

**Status:** Revised target schema for the complete LMS. The integration branch currently initializes the original seven collections, validators and indexes. This document expands the target to twelve collections. The five additional collections and their validators/indexes must be added through an additive, idempotent setup update. Do not drop or recreate existing collections or indexes.

## 1. Core concepts

- **Book:** bibliographic title/edition.
- **Book copy:** one physical item with its own accession number and status.
- **Loan:** issue/return event for one physical copy.
- **Book reservation:** a user's request for a title, either holding an available copy or waiting for one.
- **Fine:** an overdue charge associated with a loan.
- **Payment:** a record of money received against a fine.
- **Library location:** a branch/library with timezone and operating rules.
- **Entry slot:** a bookable arrival window at one library.
- **Entry booking:** one user's reservation for one entry slot.

All references use MongoDB ObjectIds. Timestamps are BSON dates stored in UTC.

## 2. Target collections and relationships

The target model contains twelve collections:

| Collection | Purpose |
|---|---|
| `users` | Student, reception, librarian and admin accounts |
| `library_locations` | Library identity, timezone and operational configuration |
| `books` | Bibliographic catalogue |
| `book_copies` | Physical copies assigned to a library |
| `loans` | Issue/return history |
| `book_reservations` | Available-copy holds and waiting queues |
| `fines` | Assessed overdue charges and outstanding balances |
| `payments` | Individual payment transactions against fines |
| `entry_slots` | Bookable arrival windows and capacity counters |
| `bookings` | Entry reservations and check-in outcomes |
| `activity_logs` | Auditable record of important actions |
| `system_settings` | Borrowing, fine and entry-booking policies |

Relationships:

```
books             1 --- many book_copies
library_locations 1 --- many book_copies
book_copies       1 --- many loans (at most one ACTIVE loan at a time)
users             1 --- many loans
books             1 --- many book_reservations
users             1 --- many book_reservations
book_copies       0 --- 1 active READY_FOR_PICKUP reservation
loans             1 --- 0/1 fine (one assessed fine record per loan)
fines             1 --- many payments
users             1 --- many payments (payer)
library_locations 1 --- many entry_slots
entry_slots       1 --- many bookings
users             1 --- many bookings
users             1 --- many activity_logs (actor, where applicable)
```

## 3. Common conventions

- `_id` is an ObjectId; references store ObjectIds, not strings.
- API responses expose ids as strings named `id`.
- Dates are BSON dates in UTC; API timestamps use ISO 8601 UTC.
- Field names use `snake_case`.
- Documents have `created_at` and `updated_at` where applicable.
- Do not hard-delete referenced operational records; use inactive/withdrawn states.
- Store each library's IANA timezone (e.g. `Europe/Berlin`).
- Monetary amounts use integer minor units (e.g. euro cents) plus an ISO currency code; do not use binary floating-point.

## 4. Collection fields

### 4.1 `users`
- `_id`, `email` (lowercase, trimmed, unique), `password_hash`, `full_name`
- `role`: `STUDENT`, `RECEPTION`, `LIBRARIAN`, `ADMIN`
- optional `student_id` (unique when present; exact format to be decided)
- `is_active`, `created_at`, `updated_at`

### 4.2 `library_locations`
- `_id`, `name`, `code` (unique stable identifier), `address`
- `timezone` (IANA timezone identifier)
- `is_active`, `opening_hours`, optional `opening_exceptions`, `created_at`, `updated_at`
- Entry-slot duration, booking horizon, arrival capacity and check-in grace period may be configured per library or in `system_settings`; choose one authoritative source and document it.

### 4.3 `books`
- `_id`, `title`, `authors` (non-empty array)
- optional `isbn` (normalized; unique when present), `publisher`, `publication_year`, `category`, `description`, `language`
- `created_at`, `updated_at`

A book is a catalogue record, not a physical copy.

### 4.4 `book_copies`
- `_id`, `book_id`, `library_id`, `accession_number` (unique)
- `status`: `AVAILABLE`, `RESERVED`, `ON_LOAN`, `LOST`, `DAMAGED`, `WITHDRAWN`
- optional `shelf_location`, `condition_note`, `acquired_at`
- `created_at`, `updated_at`

A copy in `RESERVED` status must reference or be traceable to one active `READY_FOR_PICKUP` reservation. It cannot be issued to another user.

### 4.5 `loans`
- `_id`, `copy_id`, `user_id`, `issued_by`
- `borrowed_at`, `due_at`, optional `returned_at`, optional `received_by`
- `status`: `ACTIVE` or `RETURNED`
- `created_at`, `updated_at`

Overdue is derived when status is `ACTIVE` and `due_at` is earlier than the current time. Do not store a separate overdue status.

### 4.6 `book_reservations`
- `_id`, `book_id`, `user_id`
- `status`: `WAITING`, `READY_FOR_PICKUP`, `FULFILLED`, `CANCELLED`, `EXPIRED`
- optional `copy_id` (assigned when a copy is held), optional `hold_until`
- `requested_at`, optional `allocated_at`, optional `fulfilled_at`, optional `cancelled_at`, optional `expired_at`
- optional `cancelled_by`, `cancellation_reason`
- `created_at`, `updated_at`

Rules:
- If a copy is available, create a reservation assigned to that copy with status `READY_FOR_PICKUP` and a collection deadline.
- If no copy is available, create a `WAITING` reservation.
- Queue order is FIFO by `requested_at`, then `_id` as a stable tie-breaker. Do not store a client-controlled queue position.
- On return/availability, atomically allocate the copy to the oldest eligible waiting reservation.
- On hold expiry, release the copy and offer it to the next eligible waiting user.
- The initial policy allows at most one active reservation per user per title. Active means `WAITING` or `READY_FOR_PICKUP`.
- When the reserved copy is issued to its owner, mark the reservation `FULFILLED` and create the loan in the same transaction.

### 4.7 `fines`
- `_id`, `loan_id` (unique), `user_id`
- `assessed_amount_cents`, `amount_paid_cents`, `currency` (e.g. `EUR`)
- `daily_rate_cents` or a policy snapshot, `days_overdue`, `assessed_through`
- `status`: `UNPAID`, `PARTIALLY_PAID`, `PAID`, `WAIVED`
- optional `waived_amount_cents`, `waived_by`, `waiver_reason`, `waived_at`
- `created_at`, `updated_at`

The fine service must calculate accrued overdue charges according to the configured policy and update the same fine record idempotently; it must not create duplicate fines on retries. The exact accrual cutoff, grace period and whether accrual stops on return must be defined in the policy. Preserve the rate/policy snapshot used to assess the fine.

Outstanding balance is derived from assessed amount less valid payments and approved waivers/adjustments. If a cached `amount_paid_cents` is maintained, update it transactionally with payment records and verify it against the ledger.

### 4.8 `payments`
- `_id`, `fine_id`, `user_id` (payer), `received_by` (staff user)
- `amount_cents`, `currency`, `method` (initially `CASH`; additional methods require approval)
- `status`: `RECORDED`, `REVERSED` (reversal requires an audit record; do not delete the original payment)
- `paid_at`, optional `receipt_number`, optional `reference`
- `idempotency_key` for safe request retries
- `created_at`

Payments are immutable ledger entries. A partial payment is valid; multiple payment records may settle one fine. A payment must not exceed the current outstanding amount unless an explicitly approved overpayment/refund policy exists. Payment recording, fine-balance update and audit entry must be committed consistently.

### 4.9 `entry_slots`
- `_id`, `library_id`
- `starts_at`, `ends_at` (UTC instants)
- `capacity` (maximum number of confirmed arrivals assigned to this window)
- `booked_count` (number of capacity places currently held/consumed)
- `status`: `OPEN`, `CLOSED`, `CANCELLED`
- `created_at`, `updated_at`

Capacity is an arrival quota, not live occupancy. Do not create overlapping slots for the same library unless an explicit policy allows it.

### 4.10 `bookings` (library entry bookings)
- `_id`, `slot_id`, `library_id`, `user_id`
- `status`: `CONFIRMED`, `CHECKED_IN`, `CANCELLED`, `NO_SHOW`
- `booked_at`, optional `checked_in_at`, optional `checked_in_by`
- optional `cancelled_at`, `cancellation_reason`
- `created_at`, `updated_at`

This collection is exclusively for library entry time-slot bookings. It is not used for reserving books.

### 4.11 `activity_logs`
- `_id`, `actor_user_id` (nullable only for explicitly approved system events)
- `action`, `entity_type`, `entity_id`, `occurred_at`
- optional `details` containing safe, minimal event metadata; do not copy credentials, tokens or unnecessary personal data
- optional `correlation_id` for tracing related operations

Log important events such as issue/return, reservation allocation/cancellation/expiry, fine assessment/waiver, payment recording/reversal, entry check-in/no-show and administrative policy changes. Logs are append-only for normal application workflows.

### 4.12 `system_settings`
- `_id` or stable `key` (unique), `value`, `updated_by`, `updated_at`
- Store versioned policy settings such as loan duration, maximum active loans, fine rate/currency, book-reservation hold duration, entry-slot duration, booking horizon, arrival capacity defaults, cancellation cutoff and check-in grace period.
- Validate setting types and ranges. Services read policy through a configuration/service boundary rather than embedding policy constants in route handlers.

## 5. Indexes and validation

The existing seven-collection indexes should be retained. Add and verify indexes for the new collections. At minimum:

### Existing domains
- `users.email`: unique.
- `users.student_id`: unique partial index when present.
- `library_locations.code`: unique.
- `books.isbn`: unique partial index when present.
- `book_copies.accession_number`: unique.
- `book_copies.library_id + status`: location inventory.
- `loans.copy_id + status`: partial unique index for one `ACTIVE` loan per copy.
- `loans.user_id + borrowed_at`: user loan history.
- `entry_slots.library_id + starts_at`: unique slot start per library.
- `entry_slots.starts_at + status`: upcoming open slots.
- `bookings.slot_id + status`: reception roster.
- `bookings.user_id + booked_at`: student entry-booking history.
- Partial unique `bookings.user_id + slot_id` for active `CONFIRMED` bookings.

### New domains
- `book_reservations.book_id + status + requested_at`: FIFO waiting queue.
- `book_reservations.user_id + created_at`: user reservation history.
- Partial unique `book_reservations.user_id + book_id` for active `WAITING` or `READY_FOR_PICKUP` reservations.
- Partial unique `book_reservations.copy_id` for `READY_FOR_PICKUP` reservations with a non-null copy.
- `book_reservations.status + hold_until`: find expired collection holds.
- `fines.user_id + status`: student outstanding-fine view.
- `fines.loan_id`: unique; one fine aggregate per loan.
- `payments.fine_id + paid_at`: payment history for a fine.
- `payments.user_id + paid_at`: student payment history.
- Unique `payments.idempotency_key` when present.
- `activity_logs.entity_type + entity_id + occurred_at`: audit history.
- `activity_logs.actor_user_id + occurred_at`: staff activity.
- `system_settings.key`: unique.

Use MongoDB schema validators for required fields, types and allowed status values where supported. Application validation remains mandatory. Validate cross-document invariants in services/transactions because JSON Schema validators cannot enforce references or business workflows across collections.

## 6. Transaction and consistency rules

### Book reservation when a copy is available
1. Authenticate user and derive `user_id` from the session.
2. Check for an active reservation for the same user/title.
3. In a transaction, conditionally claim one `AVAILABLE` copy by changing it to `RESERVED`.
4. Insert a `READY_FOR_PICKUP` reservation with that `copy_id` and `hold_until`.
5. Insert an activity event.
6. Abort if any step fails; never leave a reserved copy without its active reservation.

### Book reservation when no copy is available
1. Authenticate user and validate the title is reservable.
2. Check active duplicate reservation.
3. Insert a `WAITING` reservation with server timestamp.
4. The queue order is FIFO by timestamp and stable tie-breaker.
5. Do not let the client set queue position or status.

### Allocate a returned/available copy
1. Start a transaction and conditionally claim the available copy.
2. Select the oldest eligible `WAITING` reservation for that title.
3. If one exists, assign the copy, set `READY_FOR_PICKUP` and `hold_until`; otherwise leave the copy `AVAILABLE`.
4. Commit allocation and audit event together.
5. Use conditional updates/transaction retries so concurrent return/expiry workers cannot allocate the same copy twice.

### Expire a collection hold
- Find `READY_FOR_PICKUP` holds whose `hold_until` has passed.
- In one transaction, mark the reservation `EXPIRED`, release its copy and allocate it to the next waiting user if one exists.
- The operation must be idempotent.

### Fulfil a book reservation
- Only the reservation owner can collect the held copy.
- In one transaction, create the loan, change the copy from `RESERVED` to `ON_LOAN`, mark the reservation `FULFILLED` and add audit event.
- A reserved copy cannot be issued to another user.

### Fine assessment and payment
- Fine assessment uses the stored loan due date and the agreed policy; retries update the same fine record, not create duplicates.
- Record monetary values in cents and currency.
- In one transaction, validate the outstanding balance, insert the payment ledger record, update any cached fine totals/status and append an audit event.
- Use an idempotency key to prevent duplicate payment records on client/network retries.
- Reversals/waivers are explicit compensating records/actions with staff identity and reason; do not silently delete financial history.

### Entry booking create/cancel/check-in
- Create: authenticate, validate slot and ownership rules, conditionally increment `booked_count` only if slot is open and capacity remains, then insert booking in the same transaction.
- Cancel: only owner/authorized staff; atomically change eligible confirmed booking to cancelled and decrement capacity exactly once.
- Check-in: authorized reception/librarian; only confirmed booking within grace period; record actor/time.
- No-show: mark missed confirmed bookings idempotently after slot plus grace period. Preserve historical record.

### Loan issue/return
Borrow/return update the copy and loan within one transaction. A conditional copy status update and partial unique active-loan index prevent two staff members from issuing the same physical copy simultaneously. Returning a copy must invoke the reservation allocation service before leaving it generally available.

## 7. MongoDB transaction requirements

Multi-document transactions require a replica set or sharded cluster. Confirm transaction support for the selected Atlas tier before implementing reservation allocation, payment recording, entry booking and circulation workflows. Keep transactions short. Test failure and concurrency paths against a real test deployment where possible; mocks do not reproduce all MongoDB concurrency behavior.

## 8. Privacy and retention

Collect only data needed to operate the service. Limit access to student booking, loan, fine and payment records by role and ownership. Define retention and deletion/anonymization rules with the institution before a real pilot. This student-project schema is not an approved institutional GDPR policy.

## 9. Decisions to finalize

See the decision register in `docs/implementation-plan.md`. The team must confirm hold duration, queue eligibility, overdue fine accrual and grace rules, payment methods and overpayment/refund policy, slot duration/capacity, booking lead time, cancellation cutoff, check-in grace period, account provisioning and test database strategy.
