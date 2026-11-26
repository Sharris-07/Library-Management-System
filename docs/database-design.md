# Database Design (MongoDB Atlas)

**Status:** Target design only. MongoDB Atlas is not connected and these collections, indexes and validators have not been created. Implement in phases as listed in `docs/implementation-plan.md`.

## 1. Core concepts

MongoDB stores BSON documents in collections (similar to records in relational tables). References use ObjectIds. Timestamps are stored in UTC.

The platform distinguishes:
- **Book:** bibliographic title/edition.
- **Book copy:** one physical item with its own accession number.
- **Loan:** a borrowing event for one physical copy.
- **Library location:** a branch/library with its own timezone and operating rules.
- **Entry slot:** a bookable arrival window at one library.
- **Booking:** one student's reservation for one entry slot.

## 2. Collections and relationships

Initial collections:

| Collection | Purpose |
|---|---|
| `users` | Student, librarian and admin accounts |
| `library_locations` | Library identity, timezone and operational configuration |
| `books` | Bibliographic catalogue |
| `book_copies` | Physical copies, each assigned to a library |
| `loans` | Issue/return history |
| `entry_slots` | Bookable arrival windows and capacity counters |
| `bookings` | Student reservations and check-in outcomes |

Relationships:

```
library_locations 1 --- many book_copies
books             1 --- many book_copies
book_copies       1 --- many loans (at most one ACTIVE loan at a time)
users             1 --- many loans
library_locations 1 --- many entry_slots
entry_slots       1 --- many bookings
users             1 --- many bookings
```

## 3. Common conventions

- `_id` is an ObjectId; references store ObjectIds, not strings.
- API responses expose ids as strings named `id`.
- Dates are BSON dates in UTC; API timestamps use ISO 8601 UTC.
- Field names use `snake_case`.
- Documents have `created_at` and `updated_at`.
- Do not hard-delete referenced operational records; use inactive/withdrawn states.
- Store a library's IANA timezone (e.g. `Europe/Berlin`) and convert local opening/slot times to UTC instants for storage and comparison.

## 4. Collection fields

### 4.1 `users`
- `_id`, `email` (lowercase, trimmed, unique), `password_hash`, `full_name`
- `role`: `STUDENT`, `LIBRARIAN`, `ADMIN`
- optional `student_id` (unique when present; exact format to be decided)
- `is_active`, `created_at`, `updated_at`

### 4.2 `library_locations`
- `_id`, `name`, `code` (unique stable identifier), `address`
- `timezone` (IANA timezone identifier)
- `is_active`, `created_at`, `updated_at`
- Opening hours and booking policy may initially be embedded configuration fields, or stored in a separate collection if multiple schedules/exception dates become necessary. Choose the simplest model that supports the approved first use case.

### 4.3 `books`
- `_id`, `title`, `authors` (non-empty array)
- optional `isbn` (normalized digits; unique when present), `publisher`, `publication_year`, `category`, `description`, `language`
- `created_at`, `updated_at`

A book is a catalogue record, not a physical copy.

### 4.4 `book_copies`
- `_id`, `book_id`, `library_id`, `accession_number` (unique)
- `status`: `AVAILABLE`, `ON_LOAN`, `LOST`, `DAMAGED`, `WITHDRAWN`
- optional `shelf_location`, `condition_note`, `acquired_at`
- `created_at`, `updated_at`

### 4.5 `loans`
- `_id`, `copy_id`, `user_id`, `issued_by`
- `borrowed_at`, `due_at`, optional `returned_at`, optional `received_by`
- `status`: `ACTIVE` or `RETURNED`
- `created_at`, `updated_at`

Overdue is derived when status is `ACTIVE` and `due_at` is earlier than the current time. Do not store a separate overdue status.

### 4.6 `entry_slots`
- `_id`, `library_id`
- `starts_at`, `ends_at` (UTC instants)
- `capacity` (maximum number of confirmed arrivals assigned to this window)
- `booked_count` (number of capacity places currently held/consumed)
- `status`: `OPEN`, `CLOSED`, `CANCELLED`
- `created_at`, `updated_at`

The initial version may generate slots for a rolling future period from configured opening hours. Do not create overlapping slots for the same library unless an explicit policy allows it. Capacity is an arrival quota, **not live occupancy**.

### 4.7 `bookings`
- `_id`, `slot_id`, `library_id`, `user_id`
- `status`: `CONFIRMED`, `CHECKED_IN`, `CANCELLED`, `NO_SHOW`
- `booked_at`, optional `checked_in_at`, optional `checked_in_by`
- optional `cancelled_at`, `cancellation_reason`
- `created_at`, `updated_at`

The library id is retained for efficient staff reporting and audit context; service logic must verify it matches the referenced slot. The backend derives the user id from the authenticated session, never from a student-supplied request field.

## 5. Indexes and validation

Create indexes through an idempotent setup script. At minimum:

- `users.email`: unique.
- `users.student_id`: unique partial index when present.
- `library_locations.code`: unique.
- `books.isbn`: unique partial index when present.
- `book_copies.accession_number`: unique.
- `book_copies.library_id + status`: support location inventory filters.
- `loans.copy_id + status`: partial unique index for one `ACTIVE` loan per copy.
- `loans.user_id + borrowed_at`: user loan history.
- `entry_slots.library_id + starts_at`: unique slot start per library.
- `entry_slots.starts_at + status`: find upcoming open slots.
- `bookings.slot_id + status`: reception roster.
- `bookings.user_id + booked_at`: student booking history.
- Partial unique `bookings.user_id + slot_id` for `CONFIRMED` bookings, preventing duplicate active reservations for one student and slot. Cancelled bookings do not block a later rebooking.

Use MongoDB schema validators for required fields, types and allowed status values where supported. Application validation remains mandatory.

## 6. Transaction and capacity rules

### Create booking
1. Authenticate the student and derive `user_id` from the session.
2. Confirm the slot exists, belongs to an active library, is OPEN and is in the future within the booking lead-time policy.
3. Confirm the student is eligible and has no existing confirmed booking for that slot.
4. In one transaction, atomically increment `booked_count` only if `status = OPEN` and `booked_count < capacity`.
5. Insert the `CONFIRMED` booking.
6. If the conditional update or insert fails, abort the transaction. Return a conflict when capacity is full or a duplicate booking exists.

The conditional update is essential: checking the count in Python and then incrementing it separately can overbook when two students book simultaneously.

### Cancel booking
- Only the booking owner or authorized staff may cancel.
- Only a `CONFIRMED` booking can be cancelled under the initial policy.
- In one transaction, change status to `CANCELLED` and decrement the slot's `booked_count` exactly once.
- A repeated cancellation must not decrement capacity again.

### Check-in and no-show
- Reception/librarian staff check in only a `CONFIRMED` booking within the configured grace period; record staff id and UTC timestamp.
- `CHECKED_IN` is terminal for the first release; check-in does not release the arrival quota.
- A scheduled/idempotent process marks un-checked-in confirmed bookings as `NO_SHOW` after the slot and grace period. No-show records remain for reporting and do not retroactively reopen a past slot.
- Staff may record walk-ins separately as an explicitly approved workflow; do not silently create fake reservations.

### Loan issue/return
Borrow/return update the copy and loan within one transaction. A conditional copy status update and a partial unique active-loan index prevent two staff members from issuing the same physical copy simultaneously.

## 7. MongoDB transaction requirements

Multi-document transactions require a replica set or sharded cluster. Confirm transaction support for the selected Atlas tier before booking and circulation transaction work. Keep transactions short. Use PyMongo sessions and test transaction failure paths against a real test deployment where possible; mocks do not reproduce all MongoDB concurrency behavior.

## 8. Privacy and retention

Collect only data needed to operate the service. Limit access to student booking/loan records by role and ownership. Define retention and deletion/anonymization rules with the institution before a real pilot. Do not treat this student-project schema as an approved institutional GDPR policy.

## 9. Open decisions

See `docs/implementation-plan.md`: opening hours and exceptions, slot duration, arrival capacity, booking lead time, check-in grace period, no-show handling, walk-in workflow, account provisioning, loan rules and test database strategy.
