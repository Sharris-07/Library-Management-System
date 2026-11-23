# System Architecture

## 1. Overview

The application uses a separate JavaScript frontend and Python Flask backend.

The backend follows a layered modular monolith architecture.

## 2. Technology

- Python 3
- Flask
- HTML5, CSS3 and Vanilla JavaScript
- SQLite
- SQLAlchemy
- Flask-Migrate
- pytest

## 3. Layers

### Presentation
HTML, CSS and JavaScript. Communicates through REST APIs.

### Application
Flask routes handle HTTP requests, authentication, authorization and validation.

### Business Logic
Services implement application rules, including borrowing, returns and catalogue management.

### Data Access
Repositories encapsulate database queries using SQLAlchemy.

### Persistence
SQLite stores users, books, physical copies and loans.

## 4. Domain entities

- User: account and role
- Book: bibliographic record
- BookCopy: individual physical copy
- Loan: borrowing transaction

## 5. Relationships

- User has many Loans.
- Book has many BookCopies.
- BookCopy has many historical Loans.
- A BookCopy can have only one active Loan.

## 6. Main business rules

- Only authorized users may borrow books.
- Only available copies may be borrowed.
- A physical copy cannot have two simultaneous active loans.
- Returning a copy closes its active loan.
- Historical loan records must be preserved.
- Database transactions protect borrowing and returning.

## 7. Communication

The frontend uses HTTP requests and JSON responses.
All application data operations are performed by the Flask backend.
