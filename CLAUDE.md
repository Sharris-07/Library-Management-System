# Project Instructions: Library Management System

## Project objective

Build an academic Library Management System with clean object-oriented design.

## Approved technology stack

- Backend: Python 3 and Flask
- Frontend: HTML5, CSS3 and Vanilla JavaScript
- Communication: REST API using JSON
- Database: SQLite
- ORM: SQLAlchemy
- Migrations: Flask-Migrate
- Testing: pytest

## Architecture

Use a layered modular monolith.

1. Routes: HTTP handling, authentication and response formatting.
2. Services: business rules and application operations.
3. Repositories: database query operations.
4. Models: domain entities and database mappings.
5. Frontend: independent JavaScript client.

Never put business logic or database queries directly in routes.

The frontend must communicate with the backend through HTTP APIs.
It must never access the database directly.

## Core domain

- User
- Book
- BookCopy
- Loan

One Book can have multiple BookCopy records.
A Loan references one User and one specific BookCopy.

## User roles

- STUDENT
- LIBRARIAN
- ADMIN

Use one User model with role-based authorization.

## Mandatory functionality

- Registration and authentication
- Role-based access control
- Book catalogue and search
- Physical copy management
- Borrowing and returning
- Loan history
- Role-specific dashboards

## Security requirements

- Hash passwords using secure password hashing.
- Never store plaintext passwords.
- Validate all input on the backend.
- Enforce permissions on every protected endpoint.
- Protect state-changing requests against CSRF.
- Use secure session configuration.
- Use environment variables for secrets.
- Enforce database foreign keys and integrity constraints.
- Prevent multiple active loans for the same physical copy.
- Use database transactions for borrowing and returning.

## Coding rules

- Follow PEP 8.
- Use meaningful names.
- Prefer simple, readable implementations.
- Add docstrings to important classes and methods.
- Use type hints where appropriate.
- Avoid unnecessary inheritance and abstractions.
- Do not add dependencies without justification.
- Do not silently change the approved architecture.
- Never overwrite existing files without inspecting them.
- Write tests for important business rules.

## Development workflow

- Implement one phase at a time.
- Explain the purpose of created or modified files.
- Run relevant tests after each phase.
- Report changed files and test results.
- Do not proceed to the next phase if critical tests fail.
- Do not generate the entire application in one response.

## Scope restrictions

This is an academic MVP, not an enterprise platform.

Do not introduce:
- Microservices
- React or other frontend frameworks
- Node.js backend
- PostgreSQL
- Cloud infrastructure
- AI features
- Unnecessary architectural complexity

The approved architecture is documented in docs/.
If instructions conflict, ask before changing architectural decisions.
