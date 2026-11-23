# Database Design

## Tables

### users
- id: Primary key
- name
- email: Unique
- password_hash
- role
- created_at

### books
- id: Primary key
- title
- author
- isbn
- category
- description

### book_copies
- id: Primary key
- book_id: Foreign key
- accession_number: Unique
- status

### loans
- id: Primary key
- user_id: Foreign key
- copy_id: Foreign key
- borrowed_at
- due_at
- returned_at

## Integrity

- Enforce foreign keys.
- Enforce unique email and accession numbers.
- Enforce one active loan per physical copy.
- Preserve historical loan records.
- Use transactions for borrowing and returns.
