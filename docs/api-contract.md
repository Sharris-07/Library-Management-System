# API Contract — Library Management System

**Author:** Reza (API Design and Frontend Integration)  
**Branch:** `api-contract`  
**Date:** 2026-11-27  
**Status:** Draft — pending team review

---

## How to Read This Document

- Every endpoint is derived directly from the React frontend in `frontend-react/`.
- Fields marked **[OPEN]** are unanswered business-rule questions listed in [Section 10](#10-open-questions-for-the-team).
- All request and response bodies are JSON unless stated otherwise.
- All dates are ISO 8601 strings in UTC, e.g. `"2026-11-27T14:00:00Z"`.
- All IDs are MongoDB ObjectId strings (24-character hex).
- The base URL for every endpoint is `http://localhost:5000` in development (the Flask default port). The frontend reads this from the environment variable `VITE_API_BASE_URL`.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Current User](#2-current-user)
3. [Books — Catalogue](#3-books--catalogue)
4. [Books — Management (Librarian)](#4-books--management-librarian)
5. [Book Copies](#5-book-copies)
6. [Loans — Borrowing and Returning](#6-loans--borrowing-and-returning)
7. [Loans — Student History and Dashboard](#7-loans--student-history-and-dashboard)
8. [Fines](#8-fines)
9. [Reservations](#9-reservations)
10. [Members (Librarian View)](#10-members-librarian-view)
11. [Admin — User Management](#11-admin--user-management)
12. [Admin — Dashboard Statistics](#12-admin--dashboard-statistics)
13. [Admin — Activity Logs](#13-admin--activity-logs)
14. [Admin — System Settings](#14-admin--system-settings)
15. [Health Check](#15-health-check)
16. [Open Questions for the Team](#16-open-questions-for-the-team)

---

## Common Error Responses

These errors can be returned by any endpoint and are not repeated for every endpoint below.

| HTTP Status | `error` value | Meaning |
|---|---|---|
| `400 Bad Request` | `"validation_error"` | A required field is missing or has an invalid value. |
| `401 Unauthorized` | `"not_authenticated"` | The request has no valid session. The user must log in. |
| `403 Forbidden` | `"forbidden"` | The user is logged in but their role does not allow this action. |
| `404 Not Found` | `"not_found"` | The requested resource does not exist. |
| `409 Conflict` | `"conflict"` | The action cannot be completed because of a business-rule conflict (e.g. copy already on loan). |
| `500 Internal Server Error` | `"server_error"` | An unexpected server error occurred. |

**Error response body (all errors):**
```json
{
  "error": "not_found",
  "message": "No book with that id exists."
}
```

---

## 1. Authentication

### POST /api/auth/register

Registers a new user account. The new account always receives the role `student`. **[OPEN Q1]**

**Roles allowed:** Public (no login required).

**Request body:**
```json
{
  "name": "Aarav Sharma",
  "email": "aarav@college.edu",
  "password": "SecurePass123"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Full name. Must not be blank. |
| `email` | string | Yes | Must be a valid email address. Must be unique. |
| `password` | string | Yes | Minimum length **[OPEN Q2]** (frontend enforces 8 characters). |

**Success response — `201 Created`:**
```json
{
  "message": "Account created. Please log in."
}
```

**Additional error responses:**

| Status | `error` | Situation |
|---|---|---|
| `409 Conflict` | `"email_taken"` | An account with this email already exists. |

---

### POST /api/auth/login

Logs in with an email and password. Returns the authenticated user's data. **[OPEN Q3]**

**Roles allowed:** Public (no login required).

**Request body:**
```json
{
  "email": "aarav@college.edu",
  "password": "SecurePass123"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | Yes | — |
| `password` | string | Yes | — |

**Success response — `200 OK`:**
```json
{
  "user": {
    "id": "674f1a2b3c4d5e6f7a8b9c0d",
    "name": "Aarav Sharma",
    "email": "aarav@college.edu",
    "role": "student",
    "status": "active"
  }
}
```

> **Note:** The frontend stores the user object in `localStorage`. **[OPEN Q3]** — the team must decide whether to use sessions (cookies) or JWTs and how the token is returned.

**Additional error responses:**

| Status | `error` | Situation |
|---|---|---|
| `401 Unauthorized` | `"invalid_credentials"` | Email or password is wrong. |
| `403 Forbidden` | `"account_inactive"` | The account exists but has been deactivated. |

---

### POST /api/auth/logout

Ends the current session.

**Roles allowed:** Any authenticated user.

**Request body:** None.

**Success response — `200 OK`:**
```json
{
  "message": "Logged out successfully."
}
```

---

## 2. Current User

### GET /api/auth/me

Returns the profile of the currently logged-in user. Used by the frontend to restore session state after a page refresh.

**Roles allowed:** Any authenticated user.

**Success response — `200 OK`:**
```json
{
  "id": "674f1a2b3c4d5e6f7a8b9c0d",
  "name": "Aarav Sharma",
  "email": "aarav@college.edu",
  "role": "student",
  "status": "active",
  "created_at": "2026-09-01T08:00:00Z"
}
```

---

## 3. Books — Catalogue

### GET /api/books

Returns a paginated list of books from the catalogue. Supports searching by title or author and filtering by category. Used by both the Student Catalogue page and the Librarian Manage Books page.

**Roles allowed:** **[OPEN Q4]** (student, librarian, admin — or public).

**Query parameters:**

| Parameter | Type | Required | Default | Notes |
|---|---|---|---|---|
| `q` | string | No | — | Full-text search across title and authors. |
| `category` | string | No | — | Filter by category name. |
| `page` | integer | No | `1` | Page number, starts at 1. |
| `per_page` | integer | No | `20` | Results per page. Maximum: 100. |

**Success response — `200 OK`:**
```json
{
  "books": [
    {
      "id": "674f1a2b3c4d5e6f7a8b9c0d",
      "title": "Introduction to Algorithms",
      "authors": ["Thomas H. Cormen"],
      "isbn": "9780262046305",
      "publisher": "MIT Press",
      "category": "Computer Science",
      "description": "A comprehensive guide to algorithms...",
      "total_copies": 3,
      "available_copies": 2,
      "archived": false
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20,
  "pages": 3
}
```

---

### GET /api/books/:id

Returns the full details of a single book, including all its physical copies.

**Roles allowed:** **[OPEN Q4]** (student, librarian, admin — or public).

**URL parameter:** `:id` — the book's MongoDB ObjectId.

**Success response — `200 OK`:**
```json
{
  "id": "674f1a2b3c4d5e6f7a8b9c0d",
  "title": "Introduction to Algorithms",
  "authors": ["Thomas H. Cormen"],
  "isbn": "9780262046305",
  "publisher": "MIT Press",
  "category": "Computer Science",
  "description": "A comprehensive guide to algorithms...",
  "archived": false,
  "created_at": "2026-09-01T08:00:00Z",
  "copies": [
    {
      "id": "674f1a2b3c4d5e6f7a8b9c10",
      "accession_number": "CS-001",
      "status": "available"
    },
    {
      "id": "674f1a2b3c4d5e6f7a8b9c11",
      "accession_number": "CS-002",
      "status": "on_loan"
    }
  ]
}
```

---

## 4. Books — Management (Librarian)

### POST /api/books

Adds a new book title to the catalogue.

**Roles allowed:** Librarian, Admin.

**Request body:**
```json
{
  "title": "Clean Code",
  "authors": ["Robert C. Martin"],
  "isbn": "9780132350884",
  "publisher": "Prentice Hall",
  "category": "Computer Science",
  "description": "A handbook of practices for writing readable software."
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | Must not be blank. |
| `authors` | array of strings | Yes | At least one author required. |
| `isbn` | string | No | 10 or 13 digits. Must be unique if provided. **[OPEN Q5]** |
| `publisher` | string | No | — |
| `category` | string | No | **[OPEN Q6]** Free text or a fixed list? |
| `description` | string | No | — |

**Success response — `201 Created`:**
```json
{
  "id": "674f1a2b3c4d5e6f7a8b9c0d",
  "message": "Book added successfully."
}
```

**Additional error responses:**

| Status | `error` | Situation |
|---|---|---|
| `409 Conflict` | `"isbn_exists"` | A book with this ISBN already exists. |

---

### PUT /api/books/:id

Replaces all editable fields of an existing book. Used by the Librarian's Edit Book form.

**Roles allowed:** Librarian, Admin.

**Request body:** Same fields as `POST /api/books`. All fields are required for a full replacement.

**Success response — `200 OK`:**
```json
{
  "message": "Book updated successfully."
}
```

---

### PATCH /api/books/:id/archive

Archives a book so it no longer appears in the student catalogue. Does not delete it. A book with active loans cannot be archived. **[OPEN Q7]**

**Roles allowed:** Librarian, Admin.

**Request body:** None.

**Success response — `200 OK`:**
```json
{
  "message": "Book archived."
}
```

**Additional error responses:**

| Status | `error` | Situation |
|---|---|---|
| `409 Conflict` | `"has_active_loans"` | One or more copies of this book are currently on loan. |

---

## 5. Book Copies

### POST /api/books/:id/copies

Adds a new physical copy to an existing book record.

**Roles allowed:** Librarian, Admin.

**Request body:**
```json
{
  "accession_number": "CS-003"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `accession_number` | string | Yes | Must be unique across all copies. Format **[OPEN Q8]** |

**Success response — `201 Created`:**
```json
{
  "id": "674f1a2b3c4d5e6f7a8b9c12",
  "accession_number": "CS-003",
  "status": "available",
  "message": "Copy added."
}
```

**Additional error responses:**

| Status | `error` | Situation |
|---|---|---|
| `409 Conflict` | `"accession_number_exists"` | This accession number is already in use. |

---

### PATCH /api/copies/:copy_id/status

Changes the status of a physical copy manually (e.g. mark as lost or withdrawn). Normal borrowing and returning is handled through the loans endpoints and must not use this endpoint directly.

**Roles allowed:** Librarian, Admin.

**Request body:**
```json
{
  "status": "lost"
}
```

| Field | Type | Required | Allowed values |
|---|---|---|---|
| `status` | string | Yes | `"available"`, `"lost"`, `"withdrawn"` **[OPEN Q9]** |

**Success response — `200 OK`:**
```json
{
  "message": "Copy status updated."
}
```

---

## 6. Loans — Borrowing and Returning

### POST /api/loans

Issues a book to a member (creates a new loan). The librarian provides the member's identifier and the copy's accession number. The backend sets `borrowed_at` to now (UTC) and calculates `due_at` using the loan period from settings. **[OPEN Q10]**

**Roles allowed:** Librarian, Admin.

**Request body:**
```json
{
  "user_id": "674f1a2b3c4d5e6f7a8b9c0d",
  "accession_number": "CS-001"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `user_id` | string | Yes | The borrowing member's MongoDB ObjectId. |
| `accession_number` | string | Yes | Identifies the physical copy to issue. |

**Success response — `201 Created`:**
```json
{
  "loan_id": "674f1a2b3c4d5e6f7a8b9c20",
  "book_title": "Introduction to Algorithms",
  "accession_number": "CS-001",
  "borrowed_at": "2026-11-27T14:00:00Z",
  "due_at": "2026-12-11T14:00:00Z",
  "message": "Book issued successfully."
}
```

**Additional error responses:**

| Status | `error` | Situation |
|---|---|---|
| `404 Not Found` | `"copy_not_found"` | No copy with this accession number exists. |
| `404 Not Found` | `"user_not_found"` | No member with this ID exists. |
| `409 Conflict` | `"copy_not_available"` | The copy is currently on loan, reserved, or lost. |
| `409 Conflict` | `"max_loans_reached"` | The member already holds the maximum number of active loans. **[OPEN Q11]** |
| `403 Forbidden` | `"user_inactive"` | The member's account has been deactivated. |

---

### PATCH /api/loans/:loan_id/return

Records the return of a book. Sets the loan to `returned`, records `returned_at`, and makes the copy `available` again. These two changes are done in a single transaction. **[OPEN Q12]**

**Roles allowed:** Librarian, Admin.

**Request body:** None.

**Success response — `200 OK`:**
```json
{
  "loan_id": "674f1a2b3c4d5e6f7a8b9c20",
  "returned_at": "2026-12-05T10:30:00Z",
  "days_overdue": 0,
  "fine_amount": 0.00,
  "message": "Book returned successfully."
}
```

If the book is overdue, the response also includes the calculated fine:
```json
{
  "loan_id": "674f1a2b3c4d5e6f7a8b9c21",
  "returned_at": "2026-12-17T09:00:00Z",
  "days_overdue": 6,
  "fine_amount": 30.00,
  "message": "Book returned. A fine has been recorded."
}
```

**Additional error responses:**

| Status | `error` | Situation |
|---|---|---|
| `409 Conflict` | `"already_returned"` | This loan has already been closed. |

---

### GET /api/loans

Returns a filtered list of loans. Used by the Librarian's Issue & Return page and the Overdue Books page.

**Roles allowed:** Librarian, Admin.

**Query parameters:**

| Parameter | Type | Required | Default | Notes |
|---|---|---|---|---|
| `status` | string | No | — | Filter by `active`, `returned`, or `overdue`. |
| `user_id` | string | No | — | Filter loans for a specific member. |
| `page` | integer | No | `1` | — |
| `per_page` | integer | No | `20` | — |

**Success response — `200 OK`:**
```json
{
  "loans": [
    {
      "loan_id": "674f1a2b3c4d5e6f7a8b9c20",
      "user_id": "674f1a2b3c4d5e6f7a8b9c0d",
      "member_name": "Aarav Sharma",
      "book_title": "Introduction to Algorithms",
      "accession_number": "CS-001",
      "borrowed_at": "2026-11-14T10:00:00Z",
      "due_at": "2026-11-28T10:00:00Z",
      "returned_at": null,
      "status": "active",
      "days_overdue": 0,
      "fine_amount": 0.00
    }
  ],
  "total": 15,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

---

## 7. Loans — Student History and Dashboard

### GET /api/loans/my

Returns all loans belonging to the currently logged-in student. Used by the Student Dashboard and the Student Borrowing History page.

**Roles allowed:** Student (own data only).

**Query parameters:**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `status` | string | No | Filter by `active`, `returned`, or `overdue`. |

**Success response — `200 OK`:**
```json
{
  "loans": [
    {
      "loan_id": "674f1a2b3c4d5e6f7a8b9c20",
      "book_title": "Introduction to Algorithms",
      "accession_number": "CS-001",
      "borrowed_at": "2026-11-14T10:00:00Z",
      "due_at": "2026-11-28T10:00:00Z",
      "returned_at": null,
      "status": "active",
      "days_overdue": 0,
      "fine_amount": 0.00
    }
  ]
}
```

---

### GET /api/students/me/summary

Returns the summary statistics shown on the Student Dashboard (books borrowed, due soon, overdue count, unpaid fines total).

**Roles allowed:** Student.

**Success response — `200 OK`:**
```json
{
  "active_loans": 2,
  "due_within_5_days": 1,
  "overdue_count": 1,
  "unpaid_fines_total": 30.00
}
```

---

## 8. Fines

### GET /api/fines/my

Returns the list of fines for the currently logged-in student. Used by the Student Fines page.

**Roles allowed:** Student.

**Success response — `200 OK`:**
```json
{
  "summary": {
    "unpaid_total": 30.00,
    "paid_total": 20.00,
    "overdue_books": 1
  },
  "fines": [
    {
      "fine_id": "674f1a2b3c4d5e6f7a8b9c30",
      "loan_id": "674f1a2b3c4d5e6f7a8b9c21",
      "book_title": "Clean Code",
      "days_overdue": 6,
      "amount": 30.00,
      "payment_status": "unpaid",
      "created_at": "2026-12-17T09:00:00Z"
    }
  ]
}
```

---

### GET /api/fines

Returns all fines. Used by the Librarian Overdue Books page and Admin dashboard.

**Roles allowed:** Librarian, Admin.

**Query parameters:**

| Parameter | Type | Notes |
|---|---|---|
| `payment_status` | string | Filter by `paid` or `unpaid`. |
| `user_id` | string | Filter fines for a specific member. |
| `page` | integer | — |
| `per_page` | integer | — |

**Success response — `200 OK`:**
```json
{
  "fines": [
    {
      "fine_id": "674f1a2b3c4d5e6f7a8b9c30",
      "user_id": "674f1a2b3c4d5e6f7a8b9c0d",
      "member_name": "Aarav Sharma",
      "book_title": "Clean Code",
      "loan_id": "674f1a2b3c4d5e6f7a8b9c21",
      "days_overdue": 6,
      "amount": 30.00,
      "payment_status": "unpaid",
      "created_at": "2026-12-17T09:00:00Z"
    }
  ],
  "total": 8,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

---

### PATCH /api/fines/:fine_id/pay

Records that a fine has been paid in cash at the library desk. The librarian confirms the payment. **[OPEN Q13]**

**Roles allowed:** Librarian, Admin.

**Request body:** None.

**Success response — `200 OK`:**
```json
{
  "fine_id": "674f1a2b3c4d5e6f7a8b9c30",
  "payment_status": "paid",
  "message": "Fine marked as paid."
}
```

**Additional error responses:**

| Status | `error` | Situation |
|---|---|---|
| `409 Conflict` | `"already_paid"` | This fine has already been marked as paid. |

---

## 9. Reservations

### GET /api/reservations

Returns the list of reservations. Used by the Librarian Reservations page.

**Roles allowed:** Librarian, Admin.

**Query parameters:**

| Parameter | Type | Notes |
|---|---|---|
| `status` | string | Filter by `pending` or `ready`. |

**Success response — `200 OK`:**
```json
{
  "reservations": [
    {
      "reservation_id": "674f1a2b3c4d5e6f7a8b9c40",
      "user_id": "674f1a2b3c4d5e6f7a8b9c0d",
      "member_name": "Aarav Sharma",
      "book_id": "674f1a2b3c4d5e6f7a8b9c0e",
      "book_title": "Computer Networks",
      "requested_at": "2026-11-22T10:00:00Z",
      "status": "pending"
    }
  ]
}
```

---

### POST /api/reservations

Creates a new reservation request for a book. **[OPEN Q14]** — the team must decide whether students can reserve directly or only librarians can create reservations.

**Roles allowed:** **[OPEN Q14]** Student, or Librarian on behalf of a student.

**Request body:**
```json
{
  "book_id": "674f1a2b3c4d5e6f7a8b9c0e",
  "user_id": "674f1a2b3c4d5e6f7a8b9c0d"
}
```

**Success response — `201 Created`:**
```json
{
  "reservation_id": "674f1a2b3c4d5e6f7a8b9c40",
  "message": "Reservation created."
}
```

---

### PATCH /api/reservations/:reservation_id/ready

Marks a reservation as ready for collection (a copy is now being held for this member).

**Roles allowed:** Librarian, Admin.

**Request body:** None.

**Success response — `200 OK`:**
```json
{
  "message": "Reservation marked as ready."
}
```

---

### DELETE /api/reservations/:reservation_id

Cancels a reservation that has not yet been fulfilled.

**Roles allowed:** Librarian, Admin. **[OPEN Q14]** — can a student cancel their own?

**Success response — `200 OK`:**
```json
{
  "message": "Reservation cancelled."
}
```

---

## 10. Members (Librarian View)

### GET /api/users

Returns a paginated, searchable list of members. Used by the Librarian Members page.

**Roles allowed:** Librarian, Admin.

**Query parameters:**

| Parameter | Type | Notes |
|---|---|---|
| `q` | string | Search by name or email. |
| `role` | string | Filter by `student`, `librarian`, or `admin`. |
| `status` | string | Filter by `active` or `inactive`. |
| `page` | integer | — |
| `per_page` | integer | — |

**Success response — `200 OK`:**
```json
{
  "users": [
    {
      "id": "674f1a2b3c4d5e6f7a8b9c0d",
      "name": "Aarav Sharma",
      "email": "aarav@college.edu",
      "role": "student",
      "status": "active",
      "active_loans": 2,
      "unpaid_fines": 30.00,
      "created_at": "2026-09-01T08:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "per_page": 20,
  "pages": 3
}
```

---

### GET /api/users/:id

Returns the full profile of a single member, including their active loans and unpaid fines.

**Roles allowed:** Librarian, Admin.

**Success response — `200 OK`:**
```json
{
  "id": "674f1a2b3c4d5e6f7a8b9c0d",
  "name": "Aarav Sharma",
  "email": "aarav@college.edu",
  "role": "student",
  "status": "active",
  "created_at": "2026-09-01T08:00:00Z",
  "active_loans": 2,
  "unpaid_fines": 30.00
}
```

---

## 11. Admin — User Management

### POST /api/users

Creates a new user account with a specified role (used by the Admin to add librarian or admin accounts). **[OPEN Q1]**

**Roles allowed:** Admin.

**Request body:**
```json
{
  "name": "Meera Patel",
  "email": "meera.p@college.edu",
  "role": "librarian"
}
```

| Field | Type | Required | Allowed values |
|---|---|---|---|
| `name` | string | Yes | — |
| `email` | string | Yes | Unique. |
| `role` | string | Yes | `"student"`, `"librarian"`, `"admin"` |

> **[OPEN Q15]** What is the initial password? Options: a temporary password sent by email, or a fixed default that the user must change on first login.

**Success response — `201 Created`:**
```json
{
  "id": "674f1a2b3c4d5e6f7a8b9c0f",
  "message": "User account created."
}
```

---

### PATCH /api/users/:id/role

Changes the role of an existing user account.

**Roles allowed:** Admin.

**Request body:**
```json
{
  "role": "librarian"
}
```

| Field | Type | Required | Allowed values |
|---|---|---|---|
| `role` | string | Yes | `"student"`, `"librarian"`, `"admin"` |

**Success response — `200 OK`:**
```json
{
  "message": "Role updated."
}
```

**Additional error responses:**

| Status | `error` | Situation |
|---|---|---|
| `409 Conflict` | `"cannot_demote_self"` | An admin cannot remove their own admin role. **[OPEN Q16]** |

---

### PATCH /api/users/:id/status

Activates or deactivates a user account. A deactivated user cannot log in and cannot be issued a book.

**Roles allowed:** Admin.

**Request body:**
```json
{
  "status": "inactive"
}
```

| Field | Type | Required | Allowed values |
|---|---|---|---|
| `status` | string | Yes | `"active"`, `"inactive"` |

**Success response — `200 OK`:**
```json
{
  "message": "Account status updated."
}
```

---

## 12. Admin — Dashboard Statistics

### GET /api/admin/stats

Returns the summary statistics shown on the Admin Dashboard.

**Roles allowed:** Admin.

**Success response — `200 OK`:**
```json
{
  "total_members": 842,
  "total_books": 1248,
  "active_loans": 186,
  "unpaid_fines_total": 1240.00,
  "overdue_count": 14,
  "pending_reservations": 9,
  "monthly_loans": [
    { "month": "2026-06", "count": 120 },
    { "month": "2026-07", "count": 150 },
    { "month": "2026-08", "count": 98 },
    { "month": "2026-09", "count": 210 },
    { "month": "2026-10", "count": 185 },
    { "month": "2026-11", "count": 240 }
  ],
  "loans_by_category": [
    { "category": "Computer Science", "count": 72 },
    { "category": "Artificial Intelligence", "count": 46 }
  ]
}
```

---

### GET /api/librarian/stats

Returns the summary statistics shown on the Librarian Dashboard.

**Roles allowed:** Librarian, Admin.

**Success response — `200 OK`:**
```json
{
  "total_books": 1248,
  "active_loans": 186,
  "overdue_count": 14,
  "pending_reservations": 9
}
```

---

## 13. Admin — Activity Logs

### GET /api/logs

Returns a paginated, searchable list of system activity log entries. **[OPEN Q17]**

**Roles allowed:** Admin.

**Query parameters:**

| Parameter | Type | Notes |
|---|---|---|
| `q` | string | Search by user name or detail text. |
| `action` | string | Filter by action type (e.g. `"Issued"`, `"Returned"`, `"Fine Paid"`, `"User Added"`). |
| `page` | integer | — |
| `per_page` | integer | — |

**Success response — `200 OK`:**
```json
{
  "logs": [
    {
      "log_id": "674f1a2b3c4d5e6f7a8b9c50",
      "action": "Issued",
      "performed_by": "Meera Patel",
      "detail": "Issued Introduction to Algorithms to Aarav Sharma",
      "timestamp": "2026-11-27T10:20:00Z"
    }
  ],
  "total": 120,
  "page": 1,
  "per_page": 20,
  "pages": 6
}
```

---

## 14. Admin — System Settings

### GET /api/admin/settings

Returns the current borrowing policy settings.

**Roles allowed:** Admin.

**Success response — `200 OK`:**
```json
{
  "loan_days": 14,
  "fine_per_day": 5.00,
  "max_active_loans": 5
}
```

---

### PUT /api/admin/settings

Saves updated borrowing policy settings. **[OPEN Q18]**

**Roles allowed:** Admin.

**Request body:**
```json
{
  "loan_days": 14,
  "fine_per_day": 5.00,
  "max_active_loans": 5
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `loan_days` | integer | Yes | Must be ≥ 1. |
| `fine_per_day` | number | Yes | Must be ≥ 0. |
| `max_active_loans` | integer | Yes | Must be ≥ 1. |

**Success response — `200 OK`:**
```json
{
  "message": "Settings saved."
}
```

---

## 15. Health Check

### GET /api/health

Returns the health status of the backend and its database connection. Already implemented in the Phase 1 scaffold.

**Roles allowed:** Public.

**Success response — `200 OK`:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

**Degraded response — `200 OK` (backend up, database down):**
```json
{
  "status": "degraded",
  "database": "disconnected"
}
```

---

## 16. Open Questions for the Team

The following questions involve business rules or design decisions that must be agreed as a team before the backend implements the affected endpoints. **Do not implement any of these independently.**

| # | Question | Affects |
|---|---|---|
| Q1 | Who can register through `/api/auth/register`? Only students, or also librarians? How are librarian/admin accounts created — by an existing admin, or through registration? | `POST /api/auth/register`, `POST /api/users` |
| Q2 | What is the minimum password length? The frontend currently enforces 8 characters. Should there be additional complexity rules (uppercase, digits, symbols)? | `POST /api/auth/register` |
| Q3 | What authentication mechanism should the backend use — server-side sessions (cookies) or JWTs? If JWT, where is the token returned (response body or `Set-Cookie`)? Does the frontend need a CSRF token? | All authenticated endpoints |
| Q4 | Can a student browse the catalogue without logging in? The frontend currently requires login for all pages. Should the catalogue be public? | `GET /api/books`, `GET /api/books/:id` |
| Q5 | Is ISBN mandatory when adding a book? Should the backend reject a book with no ISBN? | `POST /api/books` |
| Q6 | Is `category` a free-text field or a fixed list? If a fixed list, what categories are allowed and who can add new ones? | `POST /api/books`, `PUT /api/books/:id` |
| Q7 | What happens to reservations when a book is archived? Are they automatically cancelled? | `PATCH /api/books/:id/archive` |
| Q8 | What is the required format for `accession_number`? The frontend shows examples like `"CS-001"` but does not enforce a pattern. | `POST /api/books/:id/copies` |
| Q9 | What copy statuses are allowed? The frontend's `constants.js` lists `available`, `borrowed` (or `on_loan`), `reserved`, and `lost`. Should `withdrawn` also be a valid status? | `PATCH /api/copies/:copy_id/status` |
| Q10 | The loan period (days until due) is 14 in the frontend's constants. Should this come from the system settings stored in the database, or be a fixed backend constant? | `POST /api/loans` |
| Q11 | The frontend's constants set `MAX_ACTIVE_LOANS = 5`. Should the backend enforce this? Should it come from the database settings? | `POST /api/loans` |
| Q12 | Should the backend automatically create a fine record when a book is returned overdue, or only when a librarian explicitly records it? | `PATCH /api/loans/:loan_id/return` |
| Q13 | Is online payment out of scope? The frontend says "fines are paid at the library desk". Should the API simply record that cash was received, with no payment gateway? | `PATCH /api/fines/:fine_id/pay` |
| Q14 | Can students create or cancel their own reservations, or is reservations a librarian-only feature? | `POST /api/reservations`, `DELETE /api/reservations/:id` |
| Q15 | When an admin creates a user account via `POST /api/users`, how is the initial password set? A temporary auto-generated password? A fixed default? An email invitation? | `POST /api/users` |
| Q16 | Should the backend prevent an admin from removing their own admin role? | `PATCH /api/users/:id/role` |
| Q17 | Should the backend maintain an activity log automatically (write a log entry on every significant action), or is this out of scope for now? | `GET /api/logs` |
| Q18 | If the loan period setting changes, do existing active loans keep their original `due_at` date? The answer should be yes (settings only affect new loans), but this needs team confirmation. | `PUT /api/admin/settings` |

---

## Endpoint Summary Table

| Method | URL | Roles | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new account |
| `POST` | `/api/auth/login` | Public | Log in |
| `POST` | `/api/auth/logout` | Any | Log out |
| `GET` | `/api/auth/me` | Any | Get current user profile |
| `GET` | `/api/books` | **[Q4]** | List and search books |
| `GET` | `/api/books/:id` | **[Q4]** | Get one book with copies |
| `POST` | `/api/books` | Librarian, Admin | Add a book |
| `PUT` | `/api/books/:id` | Librarian, Admin | Edit a book |
| `PATCH` | `/api/books/:id/archive` | Librarian, Admin | Archive a book |
| `POST` | `/api/books/:id/copies` | Librarian, Admin | Add a physical copy |
| `PATCH` | `/api/copies/:copy_id/status` | Librarian, Admin | Manually change copy status |
| `POST` | `/api/loans` | Librarian, Admin | Issue a book |
| `PATCH` | `/api/loans/:loan_id/return` | Librarian, Admin | Return a book |
| `GET` | `/api/loans` | Librarian, Admin | List all loans (with filters) |
| `GET` | `/api/loans/my` | Student | Student's own loan history |
| `GET` | `/api/students/me/summary` | Student | Student dashboard stats |
| `GET` | `/api/fines/my` | Student | Student's own fines |
| `GET` | `/api/fines` | Librarian, Admin | All fines |
| `PATCH` | `/api/fines/:fine_id/pay` | Librarian, Admin | Record a fine payment |
| `GET` | `/api/reservations` | Librarian, Admin | List reservations |
| `POST` | `/api/reservations` | **[Q14]** | Create a reservation |
| `PATCH` | `/api/reservations/:id/ready` | Librarian, Admin | Mark reservation as ready |
| `DELETE` | `/api/reservations/:id` | Librarian, Admin | Cancel a reservation |
| `GET` | `/api/users` | Librarian, Admin | List members |
| `GET` | `/api/users/:id` | Librarian, Admin | Get one member |
| `POST` | `/api/users` | Admin | Create a user account |
| `PATCH` | `/api/users/:id/role` | Admin | Change a user's role |
| `PATCH` | `/api/users/:id/status` | Admin | Activate or deactivate a user |
| `GET` | `/api/admin/stats` | Admin | Admin dashboard statistics |
| `GET` | `/api/librarian/stats` | Librarian, Admin | Librarian dashboard statistics |
| `GET` | `/api/logs` | Admin | System activity logs |
| `GET` | `/api/admin/settings` | Admin | Get borrowing policy settings |
| `PUT` | `/api/admin/settings` | Admin | Save borrowing policy settings |
| `GET` | `/api/health` | Public | Backend and database health |
