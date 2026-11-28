"""MongoDB collection, validator, and index setup for the LMS.

This setup is idempotent and never drops collections or application data.
"""

from pymongo import ASCENDING, DESCENDING
from pymongo.errors import CollectionInvalid

COLLECTION_VALIDATORS = {
    "users": {"$jsonSchema": {"bsonType": "object", "required": ["email", "password_hash", "full_name", "role", "is_active", "created_at", "updated_at"], "properties": {"email": {"bsonType": "string", "minLength": 3}, "password_hash": {"bsonType": "string", "minLength": 1}, "full_name": {"bsonType": "string", "minLength": 1}, "role": {"enum": ["STUDENT", "RECEPTION", "LIBRARIAN", "ADMIN"]}, "student_id": {"bsonType": "string"}, "is_active": {"bsonType": "bool"}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "library_locations": {"$jsonSchema": {"bsonType": "object", "required": ["name", "code", "address", "timezone", "is_active", "created_at", "updated_at"], "properties": {"name": {"bsonType": "string", "minLength": 1}, "code": {"bsonType": "string", "minLength": 1}, "address": {"bsonType": "string"}, "timezone": {"bsonType": "string", "minLength": 1}, "is_active": {"bsonType": "bool"}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "books": {"$jsonSchema": {"bsonType": "object", "required": ["title", "authors", "created_at", "updated_at"], "properties": {"title": {"bsonType": "string", "minLength": 1}, "authors": {"bsonType": "array", "minItems": 1, "items": {"bsonType": "string"}}, "isbn": {"bsonType": "string"}, "publisher": {"bsonType": "string"}, "publication_year": {"bsonType": ["int", "long"]}, "category": {"bsonType": "string"}, "description": {"bsonType": "string"}, "language": {"bsonType": "string"}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "book_copies": {"$jsonSchema": {"bsonType": "object", "required": ["book_id", "library_id", "accession_number", "status", "created_at", "updated_at"], "properties": {"book_id": {"bsonType": "objectId"}, "library_id": {"bsonType": "objectId"}, "accession_number": {"bsonType": "string", "minLength": 1}, "status": {"enum": ["AVAILABLE", "RESERVED", "ON_LOAN", "LOST", "DAMAGED", "WITHDRAWN"]}, "shelf_location": {"bsonType": "string"}, "condition_note": {"bsonType": "string"}, "acquired_at": {"bsonType": "date"}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "loans": {"$jsonSchema": {"bsonType": "object", "required": ["copy_id", "user_id", "issued_by", "borrowed_at", "due_at", "status", "created_at", "updated_at"], "properties": {"copy_id": {"bsonType": "objectId"}, "user_id": {"bsonType": "objectId"}, "issued_by": {"bsonType": "objectId"}, "received_by": {"bsonType": "objectId"}, "borrowed_at": {"bsonType": "date"}, "due_at": {"bsonType": "date"}, "returned_at": {"bsonType": "date"}, "status": {"enum": ["ACTIVE", "RETURNED"]}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "entry_slots": {"$jsonSchema": {"bsonType": "object", "required": ["library_id", "starts_at", "ends_at", "capacity", "booked_count", "status", "created_at", "updated_at"], "properties": {"library_id": {"bsonType": "objectId"}, "starts_at": {"bsonType": "date"}, "ends_at": {"bsonType": "date"}, "capacity": {"bsonType": ["int", "long"], "minimum": 1}, "booked_count": {"bsonType": ["int", "long"], "minimum": 0}, "status": {"enum": ["OPEN", "CLOSED", "CANCELLED"]}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "bookings": {"$jsonSchema": {"bsonType": "object", "required": ["slot_id", "library_id", "user_id", "status", "booked_at", "created_at", "updated_at"], "properties": {"slot_id": {"bsonType": "objectId"}, "library_id": {"bsonType": "objectId"}, "user_id": {"bsonType": "objectId"}, "status": {"enum": ["CONFIRMED", "CHECKED_IN", "CANCELLED", "NO_SHOW"]}, "booked_at": {"bsonType": "date"}, "checked_in_at": {"bsonType": "date"}, "checked_in_by": {"bsonType": "objectId"}, "cancelled_at": {"bsonType": "date"}, "cancellation_reason": {"bsonType": "string"}, "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}}}},
    "book_reservations": {"$jsonSchema": {"bsonType": "object", "required": ["book_id", "user_id", "status", "requested_at", "created_at", "updated_at"], "properties": {
        "book_id": {"bsonType": "objectId"}, "user_id": {"bsonType": "objectId"},
        "status": {"enum": ["WAITING", "READY_FOR_PICKUP", "FULFILLED", "CANCELLED", "EXPIRED"]},
        "copy_id": {"bsonType": "objectId"}, "hold_until": {"bsonType": "date"},
        "requested_at": {"bsonType": "date"}, "allocated_at": {"bsonType": "date"},
        "fulfilled_at": {"bsonType": "date"}, "cancelled_at": {"bsonType": "date"},
        "expired_at": {"bsonType": "date"}, "cancelled_by": {"bsonType": "objectId"},
        "cancellation_reason": {"bsonType": "string"},
        "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}
    }}},
    "fines": {"$jsonSchema": {"bsonType": "object", "required": ["loan_id", "user_id", "assessed_amount_cents", "amount_paid_cents", "currency", "status", "created_at", "updated_at"], "properties": {
        "loan_id": {"bsonType": "objectId"}, "user_id": {"bsonType": "objectId"},
        "assessed_amount_cents": {"bsonType": ["int", "long"], "minimum": 0},
        "amount_paid_cents": {"bsonType": ["int", "long"], "minimum": 0},
        "currency": {"bsonType": "string", "minLength": 3, "maxLength": 3},
        "daily_rate_cents": {"bsonType": ["int", "long"], "minimum": 0},
        "days_overdue": {"bsonType": ["int", "long"], "minimum": 0},
        "assessed_through": {"bsonType": "date"},
        "status": {"enum": ["UNPAID", "PARTIALLY_PAID", "PAID", "WAIVED"]},
        "waived_amount_cents": {"bsonType": ["int", "long"], "minimum": 0},
        "waived_by": {"bsonType": "objectId"}, "waiver_reason": {"bsonType": "string"},
        "waived_at": {"bsonType": "date"},
        "created_at": {"bsonType": "date"}, "updated_at": {"bsonType": "date"}
    }}},
    "payments": {"$jsonSchema": {"bsonType": "object", "required": ["fine_id", "user_id", "received_by", "amount_cents", "currency", "method", "status", "paid_at", "created_at"], "properties": {
        "fine_id": {"bsonType": "objectId"}, "user_id": {"bsonType": "objectId"},
        "received_by": {"bsonType": "objectId"},
        "amount_cents": {"bsonType": ["int", "long"], "minimum": 1},
        "currency": {"bsonType": "string", "minLength": 3, "maxLength": 3},
        "method": {"enum": ["CASH"]}, "status": {"enum": ["RECORDED", "REVERSED"]},
        "paid_at": {"bsonType": "date"}, "receipt_number": {"bsonType": "string"},
        "reference": {"bsonType": "string"}, "idempotency_key": {"bsonType": "string", "minLength": 1},
        "created_at": {"bsonType": "date"}
    }}},
    "activity_logs": {"$jsonSchema": {"bsonType": "object", "required": ["action", "entity_type", "entity_id", "occurred_at"], "properties": {
        "actor_user_id": {"bsonType": ["objectId", "null"]},
        "action": {"bsonType": "string", "minLength": 1},
        "entity_type": {"bsonType": "string", "minLength": 1},
        "entity_id": {"bsonType": ["objectId", "string"]},
        "occurred_at": {"bsonType": "date"},
        "details": {"bsonType": "object"}, "correlation_id": {"bsonType": "string"}
    }}},
    "system_settings": {"$jsonSchema": {"bsonType": "object", "required": ["key", "value", "updated_by", "updated_at"], "properties": {
        "key": {"bsonType": "string", "minLength": 1},
        "value": {}, "updated_by": {"bsonType": "objectId"},
        "version": {"bsonType": ["int", "long"], "minimum": 1},
        "updated_at": {"bsonType": "date"}
    }}}}
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
    ("book_reservations", [("book_id", ASCENDING), ("status", ASCENDING), ("requested_at", ASCENDING), ("_id", ASCENDING)], {"name": "book_reservation_fifo_queue"}),
    ("book_reservations", [("user_id", ASCENDING), ("created_at", DESCENDING)], {"name": "user_book_reservation_history"}),
    ("book_reservations", [("user_id", ASCENDING), ("book_id", ASCENDING)], {"unique": True, "partialFilterExpression": {"status": {"$in": ["WAITING", "READY_FOR_PICKUP"]}}, "name": "one_active_reservation_per_user_book"}),
    ("book_reservations", [("copy_id", ASCENDING)], {"unique": True, "partialFilterExpression": {"status": "READY_FOR_PICKUP", "copy_id": {"$type": "objectId"}}, "name": "one_active_reservation_per_copy"}),
    ("book_reservations", [("status", ASCENDING), ("hold_until", ASCENDING)], {"name": "reservation_hold_expiry"}),
    ("fines", [("loan_id", ASCENDING)], {"unique": True, "name": "one_fine_per_loan"}),
    ("fines", [("user_id", ASCENDING), ("status", ASCENDING)], {"name": "user_fines_by_status"}),
    ("payments", [("fine_id", ASCENDING), ("paid_at", DESCENDING)], {"name": "fine_payment_history"}),
    ("payments", [("user_id", ASCENDING), ("paid_at", DESCENDING)], {"name": "user_payment_history"}),
    ("payments", [("idempotency_key", ASCENDING)], {"unique": True, "partialFilterExpression": {"idempotency_key": {"$type": "string"}}, "name": "unique_payment_idempotency_key"}),
    ("activity_logs", [("entity_type", ASCENDING), ("entity_id", ASCENDING), ("occurred_at", DESCENDING)], {"name": "entity_activity_history"}),
    ("activity_logs", [("actor_user_id", ASCENDING), ("occurred_at", DESCENDING)], {"name": "actor_activity_history"}),
    ("system_settings", [("key", ASCENDING)], {"unique": True, "name": "unique_setting_key"})
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