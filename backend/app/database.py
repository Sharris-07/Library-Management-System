
from pymongo import ASCENDING, DESCENDING


COLLECTIONS = [
    "users",
    "books",
    "book_copies",
    "loans",
]


def initialize_database(db):
    """
    Create the LMS collections and their indexes.
    """

    existing_collections = set(db.list_collection_names())

    # Create collections if they do not exist.
    for collection_name in COLLECTIONS:
        if collection_name not in existing_collections:
            db.create_collection(collection_name)

    # USERS
    db.users.create_index(
        [("email", ASCENDING)],
        unique=True,
        name="unique_user_email"
    )

    # BOOKS
    db.books.create_index(
        [("isbn", ASCENDING)],
        unique=True,
        partialFilterExpression={"isbn": {"$type": "string"}},
        name="unique_book_isbn"
    )

    db.books.create_index(
        [("title", ASCENDING)],
        name="book_title_index"
    )

    # BOOK COPIES
    db.book_copies.create_index(
        [("accession_number", ASCENDING)],
        unique=True,
        name="unique_accession_number"
    )

    db.book_copies.create_index(
        [("book_id", ASCENDING)],
        name="book_copy_book_id"
    )

    db.book_copies.create_index(
        [("status", ASCENDING)],
        name="book_copy_status"
    )

    # LOANS
    db.loans.create_index(
        [("user_id", ASCENDING)],
        name="loan_user_id"
    )

    db.loans.create_index(
        [("copy_id", ASCENDING)],
        name="loan_copy_id"
    )

    db.loans.create_index(
        [("user_id", ASCENDING), ("borrowed_at", DESCENDING)],
        name="user_loan_history"
    )

    db.loans.create_index(
        [("copy_id", ASCENDING)],
        unique=True,
        partialFilterExpression={"status": "ACTIVE"},
        name="one_active_loan_per_copy"
    )

    print("LMS database initialized successfully.")
    print("Collections:", ", ".join(COLLECTIONS))
    print("Indexes created successfully.")
