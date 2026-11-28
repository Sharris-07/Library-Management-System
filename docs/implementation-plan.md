# Implementation Plan

**Academic delivery target:** Tuesday, 1 December 2026.

## 1. Deadline strategy

The remaining time is limited. Prioritize a stable, reproducible academic demonstrator and do not claim future functionality as complete.

### Must be complete before submission
1. Flask application starts with documented configuration.
2. MongoDB Atlas connection works using a local, uncommitted .env file.
3. All seven domain collections, validators and required indexes are initialized.
4. Backend automated tests pass.
5. The team can demonstrate the implemented workflow end to end.
6. README, API documentation and known limitations match the actual code.

### Stretch goals, only after the above pass
- Authentication and role authorization.
- Student entry-slot booking and cancellation.
- Reception roster and check-in.
- React integration for implemented endpoints.
- Catalogue and circulation operations.

A feature is not complete merely because its UI, schema or API is documented. It requires working code and tests.

## 2. Progress overview

| Workstream | Status on this branch |
|---|---|
| Product and architecture baseline | Defined |
| Seven MongoDB collection validators | Added; Atlas verification pending |
| Thirteen MongoDB indexes | Added; Atlas verification pending |
| Environment configuration | Updated; local credentials/Atlas verification pending |
| Database setup script | Updated; execution pending |
| Automated schema/configuration tests | Added; execution pending |
| Authentication | Not implemented |
| Entry booking services/routes | Not implemented |
| Reception check-in | Not implemented |
| Catalogue and circulation services | Not implemented |
| React integration | Not completed |
| End-to-end tests | Not implemented |

## 3. Work schedule

### Saturday — foundation and verification
- Set up a least-privilege Atlas development user and network access.
- Generate .env using backend/setup_env.py.
- Run database initialization against the development database.
- Inspect all seven collections and thirteen indexes in Atlas.
- Run pytest and resolve failures.
- Confirm .env is ignored by Git and no credentials are present in tracked files.

### Sunday — minimum working vertical slice
- Implement authentication and server-side role checks.
- Implement entry-slot availability and student booking.
- Use an atomic capacity update and MongoDB transaction.
- If the Atlas deployment does not support transactions, do not ship a non-atomic booking workaround. Demonstrate the database foundation and document the limitation instead.
- Add tests for authorization, duplicate bookings and full capacity.

### Monday — staff flow and UI integration
- Implement staff booking roster and check-in.
- Align React API base URL, cookie credentials, CSRF and response shapes.
- Connect only the screens backed by tested endpoints.
- Run a complete local demonstration.

### Tuesday — freeze
- Run the full backend test suite.
- Verify setup from a clean environment.
- Check secrets, role boundaries and error handling.
- Prepare the demo script, screenshots and known-limitations list.
- Freeze features; only fix release-blocking defects.

## 4. Quality gates

- Never commit .env, Atlas credentials, passwords or private keys.
- Use separate development and test databases.
- Do not use the development database for destructive tests.
- Derive user identity and role from authenticated server-side state.
- Enforce booking capacity atomically in the database.
- Keep main unchanged until review and acceptance tests pass.
- Do not claim features as implemented without executable tests.

## 5. Decisions still required

Confirm first-admin provisioning, registration policy, CSRF mechanism, catalogue visibility, opening hours and exception dates, slot duration, booking horizon, arrival capacity, cancellation cutoff, check-in grace period, no-show handling, walk-ins, loan duration and maximum active loans.

## 6. Pilot limitations

A successful academic demonstration is not institutional deployment approval. A real SRH pilot additionally requires institutional ownership, privacy/security review, production hosting, monitoring, backups and recovery, accessibility checks, support ownership and any required integration approvals.
