# API Documentation

**Status:** Planned API contract. Only the scaffold health endpoint currently exists. All endpoints below are planned and must be implemented and tested before being described as available. Request/response schemas may be refined before implementation.

## 1. Conventions

- Base path: `/api`.
- JSON request and response bodies; field names use `snake_case`.
- ObjectIds are returned as strings in an `id` field.
- API timestamps are ISO 8601 UTC. Slot display times are converted to the library's timezone.
- Authentication uses a secure session cookie. State-changing requests require CSRF protection.
- Roles: `STUDENT`, `LIBRARIAN`, `ADMIN`. Staff means librarian or admin.
- Backend validation and authorization apply to every protected endpoint. Hiding frontend controls is not authorization.

Common status codes: 200 success, 201 created, 204 success without body, 400 invalid input, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict/capacity full, 500 generic server error. Error response format and pagination conventions must be finalized before frontend integration.

## 2. Health

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Backend health; planned to include database reachability after Atlas integration |

## 3. Authentication and users

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public, if enabled | Create student account; caller cannot choose role |
| POST | `/api/auth/login` | Public | Authenticate and start session |
| POST | `/api/auth/logout` | Authenticated | End session |
| GET | `/api/auth/me` | Authenticated | Current user's safe profile |
| GET | `/api/auth/csrf` | Authenticated | CSRF token if required by chosen mechanism |
| GET | `/api/users` | Staff | Search/list users |
| GET | `/api/users/<user_id>` | Staff or self | View permitted user profile |
| PATCH | `/api/users/<user_id>` | Self (limited fields) or admin | Update permitted profile fields |

## 4. Libraries and entry slots

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/libraries` | Authenticated | List active library locations |
| GET | `/api/libraries/<library_id>` | Authenticated | View library details and public opening information |
| GET | `/api/libraries/<library_id>/slots` | Authenticated | List future slots and remaining capacity |
| POST | `/api/admin/libraries` | Admin | Create a library location |
| PATCH | `/api/admin/libraries/<library_id>` | Admin | Update library configuration |
| POST | `/api/admin/libraries/<library_id>/slots/generate` | Admin or authorized staff | Generate slots for an approved future date range |
| PATCH | `/api/admin/slots/<slot_id>` | Admin or authorized staff | Close a slot or change capacity under validation |
| GET | `/api/admin/slots` | Staff | Staff view of slot schedules and capacity |

Slot generation must be idempotent: repeating a generation request must not create duplicate slots. Capacity cannot be reduced below the number of bookings already holding places.

## 5. Student entry bookings

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/bookings` | Student | Reserve one available entry slot |
| GET | `/api/bookings/me` | Student | View own upcoming and past bookings |
| GET | `/api/bookings/<booking_id>` | Booking owner or staff | View booking details |
| DELETE | `/api/bookings/<booking_id>` | Booking owner or staff | Cancel a confirmed booking |
| GET | `/api/staff/bookings` | Staff | View bookings by date, library and status |
| POST | `/api/staff/bookings/<booking_id>/check-in` | Staff | Check in the student and record staff/time |
| POST | `/api/staff/bookings/<booking_id>/no-show` | Staff or controlled system process | Record no-show after permitted window |

### Booking request (proposed)

```json
{
  "slot_id": "MongoDB ObjectId as a string"
}
```

The backend obtains `user_id` from the authenticated session. The client cannot submit its own booking status, capacity counter, check-in staff id or another student's id.

### Booking response (proposed)

```json
{
  "id": "booking id",
  "slot_id": "slot id",
  "library_id": "library id",
  "starts_at": "UTC ISO-8601 timestamp",
  "ends_at": "UTC ISO-8601 timestamp",
  "status": "CONFIRMED",
  "booked_at": "UTC ISO-8601 timestamp"
}
```

### Booking API rules

- A student may only create a booking for themselves.
- The slot must be open, future-dated, within the booking window and have remaining capacity.
- Duplicate confirmed bookings by the same student for the same slot are rejected.
- Capacity is enforced atomically in the database; a full slot returns 409.
- A student may cancel only their own confirmed booking, subject to the cancellation cutoff.
- Only staff can check in a student. Check-in must be within the configured grace period.
- A cancelled booking cannot be checked in. Duplicate check-in is rejected.
- No-show processing is idempotent and preserves the audit record.
- Staff reports expose only the information needed for reception operations.

## 6. Catalogue and physical copies

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/books` | Authenticated (public browsing decision open) | Search catalogue and availability |
| GET | `/api/books/<book_id>` | Authenticated | Catalogue details |
| POST | `/api/books` | Staff | Create catalogue record |
| PATCH | `/api/books/<book_id>` | Staff | Update catalogue record |
| GET | `/api/copies` | Staff | Search physical copies |
| POST | `/api/books/<book_id>/copies` | Staff | Register physical copy at a library |
| PATCH | `/api/copies/<copy_id>` | Staff | Update permitted copy details/status |

A book is a bibliographic record; each physical copy has its own accession number and library location. Copies are withdrawn rather than hard-deleted when they have history.

## 7. Loans

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/loans` | Staff | Issue a physical copy to a user |
| POST | `/api/loans/<loan_id>/return` | Staff | Return a loan |
| GET | `/api/loans` | Staff | Search loans and overdue items |
| GET | `/api/loans/me` | Authenticated | Own loan history |
| GET | `/api/loans/<loan_id>` | Staff or borrower | View permitted loan details |

Issue/return operations must preserve consistency between copy status and loan status in a transaction.

## 8. Administration and reports

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/admin/users` | Admin | Create account with approved role |
| PATCH | `/api/admin/users/<user_id>/role` | Admin | Change role |
| PATCH | `/api/admin/users/<user_id>/status` | Admin | Activate/deactivate account |
| GET | `/api/admin/summary` | Admin | Aggregate users, books, copies, loans and booking totals |
| GET | `/api/admin/reports/bookings` | Admin | Booking/check-in/no-show trends |
| GET | `/api/admin/reports/usage` | Admin | Operational summaries, not live occupancy unless a separate occupancy feature is implemented |

## 9. API implementation notes

- Do not leak stack traces, MongoDB errors, password hashes, session identifiers or secrets.
- Validate all ObjectIds, dates, filters, status values and pagination parameters.
- Do not accept MongoDB query operators from clients.
- Use consistent error codes/messages so React can display actionable feedback.
- Finalize schemas and pagination before frontend integration; keep this document synchronized with actual tested routes.
