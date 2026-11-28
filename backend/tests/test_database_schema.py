from backend.app.database import COLLECTIONS, COLLECTION_VALIDATORS, INDEX_DEFINITIONS


def test_all_twelve_domain_collections_are_defined():
    assert set(COLLECTIONS) == {
        "users", "library_locations", "books", "book_copies",
        "loans", "entry_slots", "bookings", "book_reservations",
        "fines", "payments", "activity_logs", "system_settings",
    }


def test_every_collection_has_a_json_schema_validator():
    assert set(COLLECTION_VALIDATORS) == set(COLLECTIONS)
    for validator in COLLECTION_VALIDATORS.values():
        assert validator["$jsonSchema"]["bsonType"] == "object"


def test_unique_and_query_indexes_are_defined():
    indexes = {options["name"]: (collection, keys, options)
               for collection, keys, options in INDEX_DEFINITIONS}
    assert len(indexes) == 26
    assert indexes["one_active_loan_per_copy"][2]["partialFilterExpression"] == {"status": "ACTIVE"}
    assert indexes["one_confirmed_booking_per_user_slot"][2]["partialFilterExpression"] == {"status": "CONFIRMED"}
    assert indexes["unique_library_slot_start"][2]["unique"] is True


def test_entry_slot_schema_requires_positive_capacity_and_nonnegative_count():
    properties = COLLECTION_VALIDATORS["entry_slots"]["$jsonSchema"]["properties"]
    assert properties["capacity"]["minimum"] == 1
    assert properties["booked_count"]["minimum"] == 0



def test_reception_role_and_reserved_copy_status_are_supported():
    user_roles = COLLECTION_VALIDATORS["users"]["$jsonSchema"]["properties"]["role"]["enum"]
    copy_statuses = COLLECTION_VALIDATORS["book_copies"]["$jsonSchema"]["properties"]["status"]["enum"]
    assert "RECEPTION" in user_roles
    assert "RESERVED" in copy_statuses


def test_new_collection_validators_and_indexes_are_defined():
    new_collections = {
        "book_reservations", "fines", "payments", "activity_logs", "system_settings",
    }
    assert new_collections.issubset(COLLECTION_VALIDATORS)
    indexes = {options["name"] for _, _, options in INDEX_DEFINITIONS}
    assert {
        "book_reservation_fifo_queue",
        "one_active_reservation_per_user_book",
        "one_active_reservation_per_copy",
        "one_fine_per_loan",
        "unique_payment_idempotency_key",
        "entity_activity_history",
        "unique_setting_key",
    }.issubset(indexes)


def test_fines_and_payments_use_integer_minor_units():
    fine_properties = COLLECTION_VALIDATORS["fines"]["$jsonSchema"]["properties"]
    payment_properties = COLLECTION_VALIDATORS["payments"]["$jsonSchema"]["properties"]
    assert fine_properties["assessed_amount_cents"]["bsonType"] == ["int", "long"]
    assert payment_properties["amount_cents"]["bsonType"] == ["int", "long"]
