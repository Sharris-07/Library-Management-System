# Architecture

**Status:** Approved architecture; implementation not started beyond the initial Flask scaffold. MongoDB Atlas is **not connected yet.**

Labels used: **[APPROVED]**, **[PROPOSED]**, **[OPEN]** (see `CLAUDE.md`).

---

## 1. Overview [APPROVED]

The system is a **layered modular monolith**:

- **Monolith:** one Flask application, deployed as one unit.
- **Layered:** the code is divided into layers, each with one job.
- **Modular:** inside each layer, code is grouped by topic (users, books, copies, loans).

The frontend is a separate application (HTML5, CSS3, vanilla JavaScript). It communicates with Flask only through a REST API that sends and receives JSON.

```
+-------------------+   HTTP + JSON   +------------------------------------------+
|     Frontend      | --------------> |               Flask backend              |
| (HTML/CSS/JS)     | <-------------- |  Routes -> Services -> Repositories      |
+-------------------+                 |                          |               |
                                      |                       Database           |
                                      +--------------------------|---------------+
                                                                 v
                                                          MongoDB Atlas
```

---

## 2. Layer responsibilities [APPROVED]

### Routes
- Receive the HTTP request and return the HTTP response (status code + JSON).
- Check that the user is logged in and has the required role.
- Do basic checks on the request shape, then call **one service function**.
- Convert errors raised by services into HTTP status codes.
- **Never** contain library rules and **never** call PyMongo.

### Services
- Contain the **business rules** of the library. Example: "A copy can only be borrowed if its status is `AVAILABLE`."
- Combine several repository calls into one operation (e.g. borrowing changes both a copy and a loan).
- Own **transactions** (see `docs/database-design.md`).
- Check **ownership rules** (a student may only see their own loans).
- Know nothing about HTTP (no Flask request or response objects).

### Repositories
- The **only** layer allowed to read or write MongoDB collections.
- One repository per collection: users, books, book copies, loans.
- Provide simple operations ("find by accession number", "insert loan") and return model objects or plain data.
- Contain no business rules.

### Models
- Describe what a stored document looks like (fields, types, allowed values).
- Convert between database documents and Python objects, including ObjectId <-> string and UTC dates.
- Never talk to the database or to HTTP.

### Database
- Creates **one** MongoDB client from configuration and exposes the database handle.
- Is used by repositories. Contains no collection-specific queries.
- Later also hosts the setup of indexes and validators through a script in `scripts/` (Phase 4).

### Utils
- Small, general helpers: input validation helpers, custom error classes, time helpers (always UTC), serialization helpers, authentication/authorization helpers.
- Must not import routes, services or repositories.

### Tests
- Unit tests for services (with fake repositories), repository tests and route tests against a separate test database.
- The test database approach is **[OPEN]** (see Section 10).

---

## 3. Dependency direction [APPROVED]

Each layer may only use the layer(s) below it.

```
routes -> services -> repositories -> database
            \             \
             +-------------+--> models
all layers  ---------------------> utils (utils depends on nothing above it)
```

| Rule | Why |
|---|---|
| Routes never import repositories or PyMongo | Business rules must not be skipped |
| Services never import routes or Flask request objects | Services stay testable without a web server |
| Repositories never import services or routes | The database layer must not depend on business logic |
| Utils never import routes, services or repositories | Prevents circular imports |
| Models never import repositories or services | Models are plain descriptions |

**Why this matters:** if you change how data is stored, only repositories change. If you change a library rule, only services change. If you change the URL shape, only routes change.

### Example: "A librarian issues a loan" (plain-language flow, planned)

1. **Route** receives `POST /api/loans`, checks the user is logged in and is a `LIBRARIAN` or `ADMIN`, and checks the request body has the expected fields.
2. **Service** loads the borrower and the copy through repositories, applies the library rules, and starts a transaction.
3. **Repositories** update the copy's status and insert the loan document.
4. **Service** finishes the transaction and returns the result.
5. **Route** turns the result into a JSON response with an HTTP status code.

---

## 4. Folder structure

### Current (verified from `git ls-files`)

```
backend/
  run.py
  requirements.txt
  instance/.gitkeep
  app/
    __init__.py
    config.py
    extensions.py
    models/__init__.py
    repositories/__init__.py
    routes/__init__.py
    services/__init__.py
    utils/__init__.py
  tests/
    __init__.py
    conftest.py
    test_health.py
docs/   (architecture, database-design, api-documentation, implementation-plan)
frontend/
  index.html
  css/styles.css
  js/api.js
  js/dashboard.js
scripts/
```

### Planned additions [PROPOSED]

Files are added phase by phase, only when a phase needs them.

```
backend/app/
  database.py            MongoDB client and database handle (location/name OPEN, see D12)
  models/                user, book, book_copy, loan
  repositories/          one per collection
  services/              auth, users, books, copies, loans
  routes/                one blueprint per topic: auth, users, books, copies, loans, admin
  utils/                 validation, errors, time, auth helpers
backend/tests/           may be split into unit/ and integration/ folders when it grows
scripts/                 database setup script (indexes and validators)
```

**[OPEN] D12:** The role of the existing `extensions.py` and `instance/` folder (probably left over from the SQL-era design) must be reviewed in Phase 2.

---

## 5. Frontend-backend communication [APPROVED]

- The frontend calls the backend through `frontend/js/api.js` using HTTP and JSON.
- During development the frontend runs on `http://127.0.0.1:5500` and the backend on `http://127.0.0.1:5000`. These are **different origins**, so CORS rules apply (Section 7.5).
- The frontend stores no passwords and no secrets. It only displays what the API returns.

---

## 6. Configuration and environments

- All configuration comes from **environment variables**, loaded from a local `.env` file (never committed). `.env.example` lists the names with placeholder values.
- The Flask app is created through an application factory in `app/__init__.py` (already present as a scaffold).
- Separate database names are used for development and testing. Production deployment is out of scope for the current plan.
- Variable names in `.env.example` are **[PROPOSED]**. `config.py` is aligned with them in Phase 2.

---

## 7. Security

Security requirements are **[APPROVED]**. The specific mechanism is marked where it is **[OPEN]**. Nothing here is implemented yet.

### 7.1 Password hashing
- Passwords are never stored in plain text. Only a salted, slow hash (`password_hash`) is stored.
- **[PROPOSED]** Use the hashing helpers that ship with Flask's Werkzeug library, so no extra dependency is needed.
- Password hashes are never returned by the API and never written to logs.
- Password rules (minimum length) and login attempt limits are **[OPEN]** (D13).

### 7.2 Secure authentication sessions
- After login the backend identifies the user with a session cookie. The user id and role are taken from the server-side session, never from data sent by the browser.
- Cookie settings: `HttpOnly` (JavaScript cannot read it), `Secure` (HTTPS only; relaxed only for local development), and `SameSite` set to Lax or stricter.
- Sessions expire after a limited time and are cleared on logout.
- **[OPEN] D1:** whether the session is a signed cookie (Flask default, simple, cannot be revoked server-side before expiry) or a server-side session stored in MongoDB (revocable, more work).

### 7.3 Authorization
- Every endpoint (except login, registration if allowed, and health) requires an authenticated user.
- Role checks happen at the route boundary (is this role allowed?). **Ownership checks** happen in services (is this loan yours?).
- Default is deny: if an endpoint has no role rule, nobody except `ADMIN` may use it.
- Deactivated users (`is_active = false`) cannot log in and existing sessions are rejected.
- The role matrix is in `docs/api-documentation.md`.

### 7.4 CSRF protection
- Because login uses cookies, a malicious website could make the browser send requests with the user's cookie. CSRF protection defends against this.
- Required for all state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) in addition to `SameSite` cookies.
- **[OPEN] D2:** the mechanism (a library such as Flask-WTF, or a small custom token check). Either way, the frontend must send the token with each such request.

### 7.5 CORS
- Only the frontend's origin(s) listed in the environment variable `CORS_ALLOWED_ORIGINS` may call the API from a browser. Never use a wildcard `*` together with credentials.
- Credentials (cookies) are allowed only for those origins.
- **[OPEN] D3:** implementation (the Flask-CORS package, or manually set response headers).
- Dev detail: use `127.0.0.1` for both servers. Ports do not change the "site", but `localhost` and `127.0.0.1` do.

### 7.6 Environment variables and secrets
- Secrets (`SECRET_KEY`, `MONGODB_URI`) exist only in `.env` and in the deployment environment.
- `.env` is git-ignored. `.env.example` contains placeholders only.
- The Atlas database user follows least privilege. Atlas Network Access lists only the needed IP addresses.
- If a secret leaks, rotate it. Removing it from git history is not sufficient.

### 7.7 Backend validation
- The backend validates **every** request: required fields, types, lengths, allowed values (roles, statuses), formats (email, ISBN), and that referenced ids are valid ObjectIds that exist.
- Unknown or extra fields are rejected or ignored. They are never saved blindly.
- The client can never set protected fields (`role`, `status`, `password_hash`, timestamps) except through the endpoints designed for that.
- Query parameters are validated and treated as data, never as database operators (prevents NoSQL injection).
- MongoDB document validators (see `docs/database-design.md`) are a second safety net, not a replacement.

---

## 8. Error handling [PROPOSED, format OPEN]

- Services raise named errors (not found, validation failed, conflict, forbidden). Routes translate them into HTTP status codes.
- Internal details (stack traces, database messages) are never sent to the client.
- The JSON error format is **[OPEN]** (D10).

---

## 9. Out of scope (until decided)

Reservations, fines, email notifications, book cover uploads, deployment/hosting, microservices.

---

## 10. Open decisions affecting architecture

D1 session storage, D2 CSRF mechanism, D3 CORS mechanism, D4 test database approach (separate Atlas database vs an in-memory fake such as `mongomock`, which would be a new dependency and does not behave exactly like MongoDB), D10 error format, D12 database module location and fate of `extensions.py`, D13 password rules and login rate limiting.

The full register is in `docs/implementation-plan.md`.