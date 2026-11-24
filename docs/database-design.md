# Database Design (MongoDB Atlas)

**Status:** Design document. **MongoDB Atlas is not connected yet and none of these collections, indexes or validators exist yet.** They are created in Phases 2-4 of `docs/implementation-plan.md`.

Labels: **[APPROVED]**, **[PROPOSED]**, **[OPEN]**.

---

## 1. Glossary (for beginners)

| Term | Meaning |
|---|---|
| Collection | A group of documents, similar to a table |
| Document | One record, stored as JSON-like data (BSON), similar to a row |
| ObjectId | MongoDB's 12-byte unique id. Every document has one in `_id` |
| Reference | A field that stores another document's ObjectId (like a foreign key) |
| Index | A lookup structure that makes searches fast |
| Unique index | An index that refuses duplicate values |
| Partial index | An index that only covers documents matching a condition |
| Transaction | A group of changes that either **all** succeed or **all** are undone |

---

## 2. Overview [APPROVED]

Four collections: `users`, `books`, `book_copies`, `loans`.

```
users (1) ------------------------< loans (many)
books (1) ---< book_copies (many) --< loans (many)
```

- One **book** has many **copies**.
- One **copy** appears in many **loans** over time, but in **at most one active loan** at any moment.
- One **user** has many **loans**.
- A **Loan** references **one specific physical copy** (`copy_id`) and **one user** (`user_id`).

---

## 3. General conventions

| Convention | Rule | Status |
|---|---|---|
| Ids | `_id` is an ObjectId. All references store ObjectIds, not strings | APPROVED |
| API form | ObjectIds are sent to the frontend as strings (field named `id`) | PROPOSED |
| Time | All timestamps are BSON dates in **UTC**. The API shows them as ISO 8601 with `Z` | APPROVED |
| Names | `snake_case` fields | APPROVED |
| Timestamps | Every document has `created_at` and `updated_at` | PROPOSED |
| Deleting | No hard delete of records that other records reference. Use `is_active = false` or a status such as `WITHDRAWN` | PROPOSED |
| Physical copy id | Always called **`accession_number`** | APPROVED |

---

## 4. Collections

### 4.1 `users`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | yes | |
| `email` | string | yes | Stored lowercase and trimmed. Unique |
| `password_hash` | string | yes | Salted hash only. Never returned by the API |
| `full_name` | string | yes | 1-200 characters |
| `role` | string | yes | `STUDENT`, `LIBRARIAN` or `ADMIN` |
| `student_id` | string | no | University student number. Unique when present. Name and format **[OPEN] D9** |
| `is_active` | bool | yes | `false` blocks login |
| `created_at` | date (UTC) | yes | |
| `updated_at` | date (UTC) | yes | |

### 4.2 `books` (bibliographic record)

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | yes | |
| `title` | string | yes | 1-500 characters |
| `authors` | array of string | yes | At least one author |
| `isbn` | string | no | Normalized to digits only (10 or 13). Unique when present |
| `publisher` | string | no | |
| `publication_year` | int | no | Reasonable range, validated |
| `category` | string | no | Free text or a fixed list: **[OPEN] D14** |
| `description` | string | no | |
| `language` | string | no | |
| `created_at` / `updated_at` | date (UTC) | yes | |

A book stores **no** availability information. Availability is derived from its copies (Section 9).

### 4.3 `book_copies` (one physical copy)

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | yes | |
| `book_id` | ObjectId | yes | References `books._id` |
| `accession_number` | string | yes | The library's identifier for this physical copy. Unique. Format **[OPEN] D9** |
| `status` | string | yes | See Section 5 |
| `shelf_location` | string | no | |
| `condition_note` | string | no | |
| `acquired_at` | date (UTC) | no | |
| `created_at` / `updated_at` | date (UTC) | yes | |

### 4.4 `loans`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | yes | |
| `copy_id` | ObjectId | yes | References `book_copies._id` (one specific physical copy) |
| `book_id` | ObjectId | yes | References `books._id`. Copied from the copy for easy history queries. Never changes |
| `user_id` | ObjectId | yes | References `users._id` (the borrower) |
| `issued_by` | ObjectId | yes | References `users._id` (the staff member who issued the loan) |
| `borrowed_at` | date (UTC) | yes | |
| `due_at` | date (UTC) | yes | Must be later than `borrowed_at`. Loan length **[OPEN] D7** |
| `returned_at` | date (UTC) or null | yes | `null` while the loan is active |
| `received_by` | ObjectId or null | yes | Staff member who recorded the return. `null` while active |
| `status` | string | yes | See Section 5 |
| `created_at` / `updated_at` | date (UTC) | yes | |

Renewals, fines and reservations are **not** part of the current design. They need a decision first (D7).

---

## 5. Allowed statuses

### Copy status [PROPOSED]

| Status | Meaning |
|---|---|
| `AVAILABLE` | In the library and can be borrowed |
| `ON_LOAN` | Currently borrowed (there is exactly one `ACTIVE` loan for it) |
| `LOST` | Lost and cannot be borrowed |
| `DAMAGED` | Not currently lendable because of damage |
| `WITHDRAWN` | Permanently removed from circulation (used instead of deleting) |

Extra statuses (e.g. `RESERVED`, `MAINTENANCE`) and what happens to a copy that is lost while on loan are **[OPEN] D8**.

Rules:
- `ON_LOAN` is set **only** by the borrowing operation and cleared **only** by the return operation. It cannot be edited by hand.
- Only an `AVAILABLE` copy can be borrowed.

### Loan status [PROPOSED]

| Status | Meaning |
|---|---|
| `ACTIVE` | The copy has not been returned yet |
| `RETURNED` | The copy was returned (`returned_at` is set) |

**Overdue is not stored.** A loan is overdue when `status = ACTIVE` and `due_at` is earlier than now (UTC). Storing it would make it wrong as soon as time passes.

---

## 6. Indexes [APPROVED unless marked]

MongoDB always indexes `_id`. All other indexes must be created deliberately by a setup script (Phase 4). They do not exist yet.

| Collection | Fields | Type | Purpose |
|---|---|---|---|
| `users` | `email` | **Unique** | Login lookup, prevents duplicate accounts |
| `users` | `student_id` | **Unique, partial** (only when the field is present as text) | Optional unique student number |
| `books` | `isbn` | **Unique, partial** (only when present as text) | Prevents duplicate books without blocking books that have no ISBN |
| `books` | `title`, `authors` | Text index **[PROPOSED]** | Catalogue search |
| `book_copies` | `accession_number` | **Unique** | Identifies one physical copy |
| `book_copies` | `book_id`, `status` | Compound | Count/list copies of a book by status |
| `loans` | `copy_id` | **Unique, partial: only where `status = "ACTIVE"`** | **Guarantees a copy has at most one active loan** |
| `loans` | `user_id`, `status` | Compound | A user's current and past loans |
| `loans` | `status`, `due_at` | Compound | Overdue and due-soon queries |
| `loans` | `book_id` | Single | Loan history of a book |

### The partial unique index on active loans (important)

A normal unique index on `copy_id` would forbid ever borrowing the same copy twice, even after it was returned. The **partial** unique index applies the uniqueness rule **only to loans whose status is `ACTIVE`**. Result: many `RETURNED` loans for one copy are allowed, but a second `ACTIVE` loan for the same copy is rejected by the database itself, even if application code has a bug or two librarians act at the same moment.

---

## 7. Document validation

Validation happens in **two layers**:

1. **Application validation [APPROVED]:** services and utils validate all input before anything is saved. This gives friendly error messages.
2. **MongoDB schema validation [PROPOSED, D11]:** a `$jsonSchema` validator on each collection rejects documents that break the basic shape rules, even if the application has a bug. The setup script (Phase 4) applies them.

Rules to enforce (both layers unless noted):

| Collection | Rules |
|---|---|
| `users` | `email`, `password_hash`, `full_name`, `role`, `is_active`, timestamps required. `role` in the three allowed values. `email` lowercase and valid format (format check in application only) |
| `books` | `title` non-empty string. `authors` array with at least one non-empty string. `isbn` 10 or 13 digits when present. `publication_year` integer in a sensible range |
| `book_copies` | `book_id` ObjectId. `accession_number` non-empty string. `status` in allowed list |
| `loans` | `copy_id`, `book_id`, `user_id`, `issued_by` ObjectIds. `status` in allowed list. `borrowed_at`, `due_at` dates. `returned_at` and `received_by` are null or valid values |
| All | Date fields are real dates, not strings. IDs are ObjectIds, not strings |

Rules that need several fields or other documents are checked **in services only**: `due_at` later than `borrowed_at`; `status = RETURNED` exactly when `returned_at` is set; referenced user, book and copy exist.

---

## 8. Referential integrity (MongoDB has no foreign keys)

MongoDB does **not** check that a referenced id exists. The application must:

- Check that `book_id`, `copy_id`, `user_id` and `issued_by` refer to existing documents before saving.
- Refuse to delete a book that has copies, a copy that has loans, or a user that has loans. Use `WITHDRAWN` or `is_active = false` instead.
- Treat `loans.book_id` as read-only after creation.

---

## 9. Derived data (not stored)

| Information | How it is obtained |
|---|---|
| Number of available copies of a book | Count `book_copies` with that `book_id` and status `AVAILABLE` |
| Whether a loan is overdue | `status = ACTIVE` and `due_at < now (UTC)` |
| A user's current loans | Loans with that `user_id` and status `ACTIVE` |

A stored counter on `books` would be faster but must be kept exactly in sync. It is not part of the current design.

---

## 10. Borrowing and returning consistency [PROPOSED]

Borrowing and returning each change **two documents** (the copy and the loan). If only one change is saved, the data becomes inconsistent (e.g. a copy marked `ON_LOAN` with no loan). Therefore both changes are done in **one transaction**.

### Borrow (issue a loan)

1. Validate the request and the staff member's role.
2. Load the borrower. They must exist and have `is_active = true`.
3. Load the copy by its `accession_number`. It must exist and have status `AVAILABLE`.
4. Apply loan rules such as a maximum number of active loans (limits **[OPEN] D7**).
5. In **one transaction**:
   a. Change the copy from `AVAILABLE` to `ON_LOAN`, only if it is still `AVAILABLE` at that moment (a conditional update).
   b. Insert the `ACTIVE` loan with `borrowed_at`, `due_at`, `issued_by`.
6. If the conditional update matched nothing, or the unique index rejects the loan, abort and report a conflict.

### Return

1. Validate the request and role.
2. Find the loan. It must be `ACTIVE`.
3. In **one transaction**:
   a. Set the loan to `RETURNED` with `returned_at` and `received_by`.
   b. Set the copy back to `AVAILABLE`, only if it is currently `ON_LOAN`.
4. If either step fails, abort. Nothing changes.

### Safety nets

- The **partial unique index** (Section 6) rejects a second active loan for a copy even if the application logic fails.
- The **conditional update** on the copy's status prevents two staff members from borrowing the same copy at the same instant.

---

## 11. Transaction requirements and deployment assumptions

**Requirements [PROPOSED]:**
- Borrow and return use multi-document transactions as described above.
- Transactions need a MongoDB **replica set** (or sharded cluster). MongoDB Atlas clusters are replica sets, so this is satisfied. A single standalone local `mongod` does **not** support transactions.
- Transactions are done with a PyMongo client session. The driver's helper for transactions retries temporary errors automatically.
- Keep transactions short: only the copy update and the loan insert.

**Deployment assumptions [APPROVED unless marked]:**
- The database is hosted on **MongoDB Atlas** and accessed with a `mongodb+srv://` connection string over TLS.
- Development and tests need internet access to Atlas.
- The application connects with a **dedicated database user with limited permissions**, not an Atlas admin account.
- Atlas Network Access allows only the IP addresses that need it.
- Development, testing and any later production data use **different database names**.
- **[OPEN] D4/D11:** confirm that the chosen Atlas tier supports multi-document transactions before Phase 8 starts. If it does not, the fallback design is the conditional update plus the partial unique index, with a documented compensation step. That would need team approval.
- Backups, retention and hosting beyond development are out of scope for now.

---

## 12. Open decisions for this document

D4 test database, D7 loan rules (period, limits, renewals, fines, reservations), D8 extra copy statuses and lost-while-on-loan, D9 `student_id` and `accession_number` formats, D11 confirm `$jsonSchema` validators and transaction support, D14 categories.

See `docs/implementation-plan.md`.