> Database Design Review

Reviewer: Michael
Branch: `database-review`
Reviewed documents: `docs/database-design.md`, `docs/architecture.md` (also read: `docs/api-documentation.md`, `docs/implementation-plan.md`)

---

>> 1. Purpose and scope

Purpose: review planned MongoDB design: 4 collections (`users`, `books`, `book_copies`, `loans`). Including :fields, types, relationships, indexes, validation rules, and the borrow/return flow.

Out of scope: choosing business rules, changing the approved technology stack, and changing any code.

How findings were checked: design findings come from reading the project documents and tracing every planned endpoint against the indexes. Statements about MongoDB or PyMongo behaviour were checked against the official documentation where possible; each finding says how it was verified.

---

>> 2. Summary of findings

| ID | Collection | Severity | Finding | Verification |
|---|---|---|---|---|
| P1 | `books` | High until tested | Field `language` collides with the default text-index language setting | Default behaviour confirmed in MongoDB manual; error behaviour: test needed |
| P2 | `loans`, `book_copies` | Medium | Return step fails if a copy became `LOST`/`DAMAGED` while on loan (D8) | Design analysis |
| P3 | `loans` | Medium | The transaction helper may run the callback more than once, so borrow/return code must be safe to repeat | Confirmed in PyMongo docs |
| P4 | all | Medium | PyMongo returns naive datetimes by default, which can break UTC and overdue comparisons | Confirmed in PyMongo docs |
| P5 | `loans`, `books`, `users` | Low | Partial indexes are only used by queries that include the filter condition | Confirmed in MongoDB manual; test with `explain()` |
| P6 | `loans` | Low | No index supports "all loans of one copy" | Design analysis; may not be needed |
| P7 | `users` | Low | `GET /api/users` supports search, but only `email` and `student_id` are indexed | Endpoint trace |
| P8 | `book_copies` | Low | `GET /api/copies` can filter by `status` alone, but no index starts with `status` | Endpoint trace |
| G1 | `loans` | Low | `returned_at` / `received_by` are "required" but nullable: wording is unclear | Document reading |
| G2 | `loans` | Low | `loans.book_id` must equal the copy's `book_id`; only services enforce it | Document reading |
| G3 | `book_copies` | Low | `accession_number`: no normalization or immutability rule stated | Document reading |
| G4 | `books` | Low | The same book may be stored twice (ISBN-10 vs ISBN-13) | Design analysis |
| G5 | all | Info | Cross-field rules marked "services only" can partly be enforced by MongoDB validators | Confirmed in MongoDB manual |
| G6 | docs | Info | `database-design.md` Section 8 mentions deleting copies and users, but the API has no such endpoints | Document reading |
| G7 | Atlas | Info | Free-tier restrictions: some commands are blocked, transaction support not explicitly confirmed | Partly confirmed; test needed |

---

>> 3. Review of each collection

>>> 3.1 `users`

Pro's:
- Email stored lowercase and unique; password stored only as `password_hash`; `is_active` allows blocking without deleting.
- `student_id` unique only when present (partial index) is a sound way to allow optional unique values.

Problems 
- P7: user search has no supporting index beyond `email` and `student_id`. [RECOMMENDATION] Ask which fields staff search by (name? email? student number?) before choosing indexes.
- Question: should `student_id` be allowed only for `STUDENT` users? (new question, N7)
- `email` is normalized (lowercase, trimmed) but `student_id` normalization is not mentioned. Its format is D9.

>>> 3.2 `books`

Pro's:
- Pure bibliographic record: no availability or per-copy data is stored. This matches the book vs copy distinction.
- Availability is derived from copies, so it cannot become out of sync.

Problems 
- P1: `language` field and text index. MongoDB's default text-index behaviour reads a document field named `language` to choose the language rules for that document. `books` has a field called `language` and a proposed text index on `title` and `authors`. Values such as "English" or "en-US" may not be valid language values for the index and could cause problems on insert. [RECOMMENDATION] Test on a throw-away test database. If confirmed, the team chooses between renaming the field (for example `language_code`) or creating the index with the `language_override` option pointing at a different field name. This is a team decision (N1).
- G4: ISBN-10 and ISBN-13 for the same book are different digit strings, so the unique index will not catch them as duplicates. Question N2.
- `category` is D14. `publication_year` range is "reasonable" but not defined: define the numbers before writing the validator.

>>> 3.3 `book_copies`

Pro's:
- One document per physical item with a unique `accession_number`, exactly as the task describes (one book, five copies, five accession numbers).
- `ON_LOAN` can only be set by the borrow operation.

Problems 
- G3: unlike `users.email`, `accession_number` has no stated normalization (trim, letter case). [RECOMMENDATION] State it, so that "AC-001" and "ac-001" cannot be two different copies. Format is D9.
- G3: state whether `accession_number` and `book_id` can change after creation. The API only lets staff edit location, note and status, which suggests they cannot.
- P2: see Section 7.
- P8: see Section 5.
- Question N6: can a `WITHDRAWN` copy ever return to circulation? The status list does not say.

>>> 3.4 `loans`

Pro's:
- One loan references one specific copy (`copy_id`) and one user (`user_id`). This matches the book/copy model.
- Overdue is derived (`ACTIVE` and `due_at` in the past) and not stored.
- `issued_by` / `received_by` record which staff member acted.

Problems 
- G1: `returned_at` and `received_by` are listed as "required: yes" and also "null while active". [RECOMMENDATION] Reword: "always stored; `null` while the loan is active".
- G2: `book_id` is copied from the copy "for easy history queries". Nothing but the service checks it matches the copy's `book_id`. This is a risk, and a service test should cover it.
- P6: see Section 5.
- Status and `returned_at` express the same fact twice (`RETURNED` exactly when `returned_at` is set). This is a deliberate trade-off, but it needs a consistency check (see G5 in Section 6).

>>> 3.5 Recommended structure: summary of changes

No new fields are recommended. Fields that depend on undecided rules (anything about renewals, fines or reservations, D7) are correctly absent and should not be added before D7 is decided. The recommended changes to the documented structure are wording and normalization only, and all depend on team agreement:

| Collection | Recommended change to the documented structure | Depends on |
|---|---|---|
| `users` | State the normalization of `student_id`; state whether it applies only to `STUDENT` | D9, N7 |
| `books` | Resolve the `language` field name or set `language_override`; decide ISBN-10/13 normalization; define the `publication_year` range | N1, N2 |
| `book_copies` | State normalization and immutability of `accession_number`; state that `book_id` does not change | D9, N9 |
| `loans` | Reword `returned_at` / `received_by` as "always stored, `null` while active"; state that `book_id` is always taken from the copy, never from the request | G1, G2 |

---

>> 4. Relationships

```
books (1) ---< book_copies (many) ---< loans (many) >--- (1) users
                                          loans.book_id (copied from the copy)
                                          loans.issued_by / received_by --> users
```

| Relationship | Stored as | Checked by | Note |
|---|---|---|---|
| book to copies | `book_copies.book_id` (ObjectId) | Services (MongoDB has no foreign keys) | Copy cannot exist without a book |
| copy to loans | `loans.copy_id` | Services + partial unique index | At most one `ACTIVE` loan per copy |
| user to loans | `loans.user_id` | Services | Borrower must be active |
| staff to loans | `loans.issued_by`, `loans.received_by` | Services | Confirm in the service rules that these users must be staff |
| book to loans | `loans.book_id` | Services | Redundant copy of `copy.book_id` (G2) |

---

>> 5. Indexes and constraints

>>> 5.1 Index review

| Collection | Index | Status | Comment |
|---|---|---|---|
| `users` | `email` unique | Keep | Verified suitable |
| `users` | `student_id` unique, partial (`$type: string`) | Keep | Partial filter with `$type` is supported by MongoDB |
| `users` | search fields | Missing (P7) | Depends on answer to N4 |
| `books` | `isbn` unique, partial | Keep | See G4 (ISBN-10 vs 13) and P5 |
| `books` | text on `title`, `authors` | Keep, review (P1) | Language-field collision |
| `book_copies` | `accession_number` unique | Keep | See G3 |
| `book_copies` | `book_id`, `status` | Keep | Supports availability counts |
| `book_copies` | `status` alone | Missing (P8) | Only if filtering by status alone is wanted (N12) |
| `loans` | `copy_id` unique, partial (`status = "ACTIVE"`) | Keep | Verified: equality filters are allowed; uniqueness applies only to matching documents |
| `loans` | `user_id`, `status` | Keep | |
| `loans` | `status`, `due_at` | Keep | Overdue queries |
| `loans` | `book_id` | Keep | |
| `loans` | `copy_id` (non-unique) | Optional (P6) | Only if a "loan history of a copy" feature is wanted (N5) |

P5: partial indexes and queries. MongoDB only uses a partial index when the query includes the filter condition (or something that implies it). A lookup such as "find the active loan of this copy" must include `status = "ACTIVE"` to use the partial index. The manual also notes that this "subset matching" does not behave the same for every operator, so queries on `isbn` and `student_id` should be checked with `explain()`. The unique rule on inserts is enforced regardless.

>>> 5.2 Endpoint trace

Every endpoint in `docs/api-documentation.md` was checked against the indexes. A compound index can serve queries on its first field(s), so `book_id` alone is served by `book_id, status`.

| Endpoint | Query it needs | Supported by |
|---|---|---|
| `POST /api/auth/login` | user by `email` | `users.email` unique |
| `POST /api/auth/register` | duplicate `email` / `student_id` | Unique indexes |
| `GET /api/auth/me`, `GET /api/users/<id>`, `PATCH` user, admin user endpoints | by `_id` | Default `_id` index |
| `GET /api/users` (list and search) | search on undefined fields | Gap (P7) |
| `GET /api/books`, `GET /api/books/<id>` | text search; count copies by `book_id` and `status` | Text index (see P1); `book_id, status` |
| `POST /api/books` | duplicate `isbn` | `books.isbn` unique, partial |
| `DELETE /api/books/<id>` | any copies with this `book_id` | `book_id, status` (first field) |
| `GET /api/copies` | filters `accession_number`, `book_id`, `status` | Unique index; `book_id, status`; `status` alone is a gap (P8) |
| `GET /api/books/<id>/copies`, `POST` copy | by `book_id`; duplicate `accession_number` | `book_id, status`; unique index |
| `POST /api/loans` | copy by `accession_number`; one active loan per copy | Unique index; partial unique index on insert |
| `POST /api/loans/<id>/return` | loan by `_id` | Default `_id` index |
| `GET /api/loans` | filters `status`, `user_id`, `book_id`, overdue | `status, due_at`; `user_id, status`; `book_id` |
| `GET /api/loans/me` | by `user_id` | `user_id, status` |
| `GET /api/admin/summary` | counts | Not assessed: contents not finalized |

---

>> 6. Validation recommendations

| Rule | Application layer (services/utils) | MongoDB `$jsonSchema` validator [PROPOSED, D11] |
|---|---|---|
| Required fields and types | Yes | Yes |
| Allowed `role`, `status` values | Yes | Yes |
| ObjectId and date types (not strings) | Yes | Yes |
| ISBN is 10 or 13 digits | Yes | Yes |
| `publication_year` range | Yes | Yes (numbers to be defined) |
| Email format | Yes | Application only |
| `due_at` later than `borrowed_at` | Yes | Possible (G5) |
| `RETURNED` exactly when `returned_at` is set | Yes | Possible (G5) |
| Referenced user/book/copy exist | Yes | No (MongoDB validators check one document only) |
| `loans.book_id` equals the copy's `book_id` | Yes | No |

G5. The current design says cross-field rules are checked in services only. MongoDB validators can combine `$jsonSchema` with query-operator checks such as `$expr`, so some cross-field rules could also be enforced by the database. Whether to do this is a team decision (N3). The manual lists operators that cannot be used inside a validator; check that list before writing any rule.

---

>> 7. Borrow and return review

Reviewed against `docs/database-design.md` Section 10.

Pro's:
- Two protections: a conditional update on the copy and the partial unique index. Both stop two staff members borrowing the same copy.
- Both operations change two documents inside one transaction.

Findings
- P2: return vs D8. Return sets the copy to `AVAILABLE` "only if it is currently `ON_LOAN`". If the team allows a copy to become `LOST` or `DAMAGED` while on loan (D8), this step would fail and the whole return would be aborted. The return flow must be revisited when D8 is decided.
- P3: callback may run more than once. PyMongo's transaction helper retries the whole callback on transient errors, so the callback "may be invoked multiple times". Borrow and return code inside the callback must only do database work through the session, with no outside side effects.
- P4: dates. PyMongo returns naive `datetime` values by default (they represent UTC). Comparing a naive value with an aware one raises an error in Python, which would affect the overdue check. Phase 3 should decide one approach: timezone-aware datetimes everywhere (`tz_aware=True` via codec options) and always create times with `datetime.now(tz=timezone.utc)`.
- G7: transactions on Atlas. Transactions need a replica set. Atlas Free clusters are documented as three-node replica sets, but I did not find an explicit statement that multi-document transactions are supported on the Free tier, and Free clusters block some database commands. This is already open as D4/D11. [RECOMMENDATION] Run a tiny transaction test and the Phase 4 setup commands (indexes, validators) on the team's real cluster early.

---

>> 8. Problems and suggested improvements (consolidated)

>>> 8.1 Problems

P1: `books.language` collides with the text index (High until tested)
- What is wrong: MongoDB reads a document field named `language` as the text-index language by default. `books.language` holds free text such as a language name.
- Why it matters: inserting or indexing books may fail or behave unexpectedly, which would break catalogue search.
- [RECOMMENDATION] Test on a throw-away test database first. If confirmed, either rename the field or create the text index with `language_override` set to a different field name.
- Decides: team (N1).

P2: Return fails if a copy is `LOST` or `DAMAGED` while on loan (Medium)
- What is wrong: the return step only sets the copy to `AVAILABLE` if it is `ON_LOAN`.
- Why it matters: if D8 allows other statuses during a loan, return would abort and the loan could not be closed.
- [RECOMMENDATION] Leave the flow unchanged until D8 is decided, then update the return step and its tests together.
- Decides: team (D8, N10).

P3: The transaction callback can run more than once (Medium)
- What is wrong: the design relies on the PyMongo transaction helper, which retries the callback on transient errors.
- Why it matters: any side effect outside the database (for example logging a "loan issued" event) could happen twice.
- [RECOMMENDATION] Keep the callback limited to database operations through the session; do everything else after the transaction commits.
- Decides: backend implementers in Phase 8.

P4: Naive datetimes from PyMongo (Medium)
- What is wrong: by default PyMongo returns datetimes without timezone information.
- Why it matters: comparing them with timezone-aware "now" values raises an error, which would break the overdue check.
- [RECOMMENDATION] Use timezone-aware UTC datetimes everywhere and configure the client accordingly in Phase 3.
- Decides: team (N8).

P5: Partial indexes need the filter in the query (Low)
- What is wrong: partial indexes (`loans.copy_id`, `books.isbn`, `users.student_id`) are only used by queries that include the filter condition.
- Why it matters: lookups that omit the filter may scan the collection instead of using the index. Uniqueness on insert is not affected.
- [RECOMMENDATION] Include `status = "ACTIVE"` in active-loan lookups and check `explain()` for `isbn` and `student_id` lookups when the indexes exist (Phase 4).
- Decides: backend implementers.

P6: No index for all loans of one copy (Low)
- What is wrong: the only `copy_id` index covers `ACTIVE` loans.
- Why it matters: no planned endpoint needs it today, so this is only a risk if a copy history view is added.
- [RECOMMENDATION] Add a plain `copy_id` index only if the feature is wanted.
- Decides: team (N5).

P7: User search has no index (Low)
- What is wrong: `GET /api/users` supports search, but the search fields are not defined and only `email` and `student_id` are indexed.
- Why it matters: searching by name would scan the whole collection.
- [RECOMMENDATION] Define the search fields first, then choose indexes.
- Decides: team (N4).

P8: Filtering copies by `status` alone has no index (Low)
- What is wrong: `GET /api/copies` can filter by `status`, but the only index with `status` starts with `book_id`.
- Why it matters: a query such as "all `DAMAGED` copies" would scan the collection.
- [RECOMMENDATION] Add a `status` index only if this filter is really needed.
- Decides: team (N12).

>>> 8.2 Gaps and inconsistencies

G1: Wording of `returned_at` and `received_by`
- What is wrong: both are "required: yes" and also "null while active".
- Why it matters: it is unclear whether the field may be absent, which affects validators and queries.
- [RECOMMENDATION] Reword as "always stored; `null` while the loan is active".
- Decides: team, in `database-design.md`.

G2: `loans.book_id` is not protected by the database
- What is wrong: it must equal the copy's `book_id`, but only services can enforce this.
- Why it matters: a wrong value would corrupt a book's loan history.
- [RECOMMENDATION] Always copy it from the loaded copy document, never from the request, and cover it with a service test.
- Decides: backend implementers.

G3: `accession_number` has no normalization or immutability rule
- What is wrong: `email` is trimmed and lowercased, `accession_number` is not mentioned.
- Why it matters: "AC-001" and "ac-001" could become two copies, and changing the number would confuse loan history.
- [RECOMMENDATION] State a normalization rule and that the value cannot change after creation.
- Decides: team (D9, N9).

G4: ISBN-10 and ISBN-13 duplicates
- What is wrong: both forms of the same book are different digit strings.
- Why it matters: the unique index would not detect a duplicate book.
- [RECOMMENDATION] Decide whether to normalize to one form.
- Decides: team (N2).

G5: Cross-field rules could also be database validators
- What is wrong: `database-design.md` says they are checked in services only, but MongoDB validators can express some of them.
- Why it matters: database-level checks are a second safety net against application bugs.
- [RECOMMENDATION] Decide whether to add them, after checking the manual's list of operators not allowed in validators.
- Decides: team (D11, N3).

G6: Delete rules without matching endpoints
- What is wrong: `database-design.md` Section 8 describes refusing to delete copies and users with loans, but the API has no endpoint to delete either.
- Why it matters: the rule may be unnecessary or may hint at a missing feature.
- [RECOMMENDATION] Clarify whether the rule is for future features or can be removed.
- Decides: team.

G7: Atlas Free-tier limits and transactions
- What is wrong: transaction support on the chosen tier and the availability of all setup commands are unconfirmed.
- Why it matters: the borrow and return design depends on transactions.
- [RECOMMENDATION] Test a small transaction and the setup commands on the real cluster early.
- Decides: team (D4, D11, N11).

---

>> 9. Questions for team decisions

| > | Question | Relates to | Affects |
|---|---|---|---|
| N1 | How should the `books.language` / text-index collision be handled: rename the field, or set `language_override`? | New (P1) | `books`, Phase 4/6 |
| N2 | Should ISBN-10 and ISBN-13 be normalized to one form to detect duplicates? | New (G4) | `books` |
| N3 | Should cross-field rules (`due_at` > `borrowed_at`; `RETURNED` iff `returned_at`) also be validators? | D11 | `loans` |
| N4 | Which fields does user search use (name, email, student number)? | New (P7) | `users` index |
| N5 | Is a "loan history of one copy" feature wanted? | New (P6) | `loans` index |
| N6 | Can a `WITHDRAWN` copy return to circulation? | D8 | `book_copies` |
| N7 | Is `student_id` only for `STUDENT` users? | New (D9 covers the format only) | `users` |
| N8 | Datetime approach: timezone-aware datetimes everywhere? | New (P4) | Phase 3 |
| N9 | Is `accession_number` normalized and immutable? Format? | D9 (G3) | `book_copies` |
| N10 | What happens to return if a copy is lost or damaged while on loan? | D8 (P2) | Return flow |
| N11 | Does the chosen Atlas tier support transactions, and are all setup commands allowed? | D4/D11 (G7) | Phase 2/4/8 |
| N12 | Is filtering copies by `status` alone needed? | New (P8) | `book_copies` index |

I have not answered any of these. D4, D7, D8, D9, D11 and D14 are already in the register of `docs/implementation-plan.md`.

---

>> 10. Items verified as correct

Checked against MongoDB and PyMongo documentation:
- The partial unique index on active loans is valid MongoDB: partial filters support equality, and the unique rule applies only to matching documents.
- Using `$type: "string"` for optional unique fields (`isbn`, `student_id`) is a supported partial filter.
- Transactions require a replica set; the PyMongo helper retries transient errors.
- Storing all timestamps as UTC BSON dates matches how MongoDB stores dates.

Checked by reading the project documents:
- Deriving overdue instead of storing it, and deriving availability from copies, avoids stale data.
- The model keeps book, copy and loan separate; `loans` points at a specific copy (`copy_id`), not only at a book.
- `accession_number` is the only name used for a physical copy in `database-design.md`, `architecture.md` and `api-documentation.md`.
- Field names are `snake_case` and role names (`STUDENT`, `LIBRARIAN`, `ADMIN`) are the same across the reviewed documents.
- The borrow flow identifies the copy by `accession_number`, matching `POST /api/loans`.
- `DELETE /api/books` (only when the book has no copies) is consistent with the no-hard-delete convention: copies are never deleted, so a book with loans always still has copies.
