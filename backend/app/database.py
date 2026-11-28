"""MongoDB collection, validator, and index setup for the LMS.

This setup is idempotent and never drops collections or application data.
"""

from pymongo import ASCENDING, DESCENDING
from pymongo.errors import CollectionInvalid

COLLECTION_VALIDATORS = {
    "users": {"$jsonSchema": {"bsonType": "object", "required": ["email", "password_hash", "full_name", "role", "is_active", "created_at", "updated_at"], "properties": {"email": {"bsonType": "string", "minLength": 3}, "password_hash": {"bsonType": "string", "minLength": 1}, "full_name": {"bsonType": "string", "minLength": 1}, "role": {"enum": ["STUDENT", "LIBRARIAN", "ADMIN"]}, "student_id": {"bsonType": "string"}, "is_active": {"bsonType": "bool"}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "library_locations": {"$jsonSchema": {"bsonType": "object", "required": ["name", "code", "address", "timezone", "is_active", "created_at", "updated_at"], "properties": {"name": {"bsonType": "string", "minLength": 1}, "code": {"bsonType": "string", "minLength": 1}, "address": {"bsonType": "string"}, "timezone": {"bsonType": "string", "minLength": 1}, "is_active": {"bsonType": "bool"}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "books": {"$jsonSchema": {"bsonType": "object", "required": ["title", "authors", "created_at", "updated_at"], "properties": {"title": {"bsonType": "string", "minLength": 1}, "authors": {"bsonType": "array", "minItems": 1, "items": {"bsonType": "string"}}, "isbn": {"bsonType": "string"}, "publisher": {"bsonType": "string"}, "publication_year": {"bsonType": ["int", "long"]}, "category": {"bsonType": "string"}, "description": {"bsonType": "string"}, "language": {"bsonType": "string"}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "book_copies": {"$jsonSchema": {"bsonType": "object", "required": ["book_id", "library_id", "accession_number", "status", "created_at", "updated_at"], "properties": {"book_id": {"bsonType": "objectId"}, "library_id": {"bsonType": "objectId"}, "accession_number": {"bsonType": "string", "minLength": 1}, "status": {"enum": ["AVAILABLE", "ON_LOAN", "LOST", "DAMAGED", "WITHDRAWN"]}, "shelf_location": {"bsonType": "string"}, "condition_note": {"bsonType": "string"}, "acquired_at": {"bsonType": "date"}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "loans": {"$jsonSchema": {"bsonType": "object", "required": ["copy_id", "user_id", "issued_by", "borrowed_at", "due_at", "status", "created_at", "updated_at"], "properties": {"copy_id": {"bsonType": "objectId"}, "user_id": {"bsonType": "objectId"}, "issued_by": {"bsonType": "objectId"}, "received_by": {"bsonType": "objectId"}, "borrowed_at": {"bsonType": "date"}, "due_at": {"bsonType": "date"}, "returned_at": {"bsonType": "date"}, "status": {"enum": ["ACTIVE", "RETURNED"]}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "entry_slots": {"$jsonSchema": {"bsonType": "object", "required": ["library_id", "starts_at", "ends_at", "capacity", "booked_count", "status", "created_at", "updated_at"], "properties": {"library_id": {"bsonType": "objectId"}, "starts_at": {"bsonType": "date"}, "ends_at": {"bsonType": "date"}, "capacity": {"bsonType": ["int", "long"], "minimum": 1}, "booked_count": {"bsonType": ["int", "long"], "minimum": 0}, "status": {"enum": ["OPEN", "CLOSED", "CANCELLED"]}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "bookings": {"$jsonSchema": {"bsonType": "object", "required": ["slot_id", "library_id", "user_id", "status", "booked_at", "created_at", "updated_at"], "properties": {"slot_id": {"bsonType": "objectId"}, "library_id": {"bsonType": "objectId"}, "user_id": {"bsonType": "objectId"}, "status": {"enum": ["CONFIRMED", "CHECKED_IN", "CANCELLED", "NO_SHOW"]}, "booked_at": {"bsonType": "date"}, "checked_in_at": {"bsonType": "date"}, "checked_in_by": {"bsonType": "objectId"}, "cancelled_at": {"bsonType": "date"}, "cancellation_reason": {"bsonType": "string"}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
}

INDEX_DEFINITIONS = [
    ("users", [("email", ASCENDING)], {"unique": True, "name": "unique_user_email"}),
    ("users", [("student_id", ASCENDING)], {"unique": True, "partialFilterExpression": {"student_id": {"$type": "string"}}, "name": "unique_student_id"}),
    ("library_locations", [("code", ASCENDING)], {"unique": True, "name": "unique_library_code"}),
    ("books", [("isbn", ASCENDING)], {"unique": True, "partialFilterExpression": {"isbn": {"$type": "string"}}, "name": "unique_book_isbn"}),
    ("book_copies", [("accession_number", ASCENDING)], {"unique": True, "name": "unique_accession_number"}),
    ("book_copies", [("library_id", ASCENDING), ("status", ASCENDING)], {"name": "copies_by_library_and_status"}),
    ("loans", [("copy_id", ASCENDING)], {"unique": True, "partialFilterExpression": {"status": "ACTIVE"}, "name": "one_active_loan_per_copy"}),
    ("loans", [("user_id", ASCENDING), ("borrowed_at", DESCENDING)], {"name": "user_loan_history"}),
    ("entry_slots", [("library_id", ASCENDING), ("starts_at", ASCENDING)], {"unique": True, "name": "unique_library_slot_start"}),
    ("entry_slots", [("starts_at", ASCENDING), ("status", ASCENDING)], {"name": "upcoming_open_slots"}),
    ("bookings", [("slot_id", ASCENDING), ("status", ASCENDING)], {"name": "slot_booking_roster"}),
    ("bookings", [("user_id", ASCENDING), ("booked_at", DESCENDING)], {"name": "user_booking_history"}),
    ("bookings", [("user_id", ASCENDING), ("slot_id", ASCENDING)], {"unique": True, "partialFilterExpression": {"status": "CONFIRMED"}, "name": "one_confirmed_booking_per_user_slot"}),
]

COLLECTIONS = tuple(COLLECTION_VALIDATORS)

def initialize_database(db):
    """Create/update validators and indexes without deleting existing data."""
    existing = set(db.list_collection_names())
    for name, validator in COLLECTION_VALIDATORS.items():
        if name not in existing:
            try:
                db.create_collection(name, validator=validator, validationLevel="strict", validationAction="error")
            except CollectionInvalid:
                # A concurrent initializer may have created the collection.
                pass
        else:
            db.command("collMod", name, validator=validator, validationLevel="strict", validationAction="error")
    for name, keys, options in INDEX_DEFINITIONS:
        db[name].create_index(keys, **options)
    return {"collections": list(COLLECTIONS), "collection_count": len(COLLECTIONS), "index_count": len(INDEX_DEFINITIONS)}