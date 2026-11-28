from backend.app.database import COLLECTIONS, COLLECTION_VALIDATORS, INDEX_DEFINITIONS


def test_all_seven_domain_collections_are_defined():
    assert set(COLLECTIONS) == {
        "users", "library_locations", "books", "book_copies",
        "loans", "entry_slots", "bookings",
    }


def test_every_collection_has_a_json_schema_validator():
    assert set(COLLECTION_VALIDATORS) == set(COLLECTIONS)
    for validator in COLLECTION_VALIDATORS.values():
        assert validator["$jsonSchema"]["bsonType"] == "object"


def test_unique_and_query_indexes_are_defined():
    indexes = {options["name"]: (collection, keys, options)
               for collection, keys, options in INDEX_DEFINITIONS}
    assert len(indexes) == 13
    assert indexes["one_active_loan_per_copy"][2]["partialFilterExpression"] == {"status": "ACTIVE"}
    assert indexes["one_confirmed_booking_per_user_slot"][2]["partialFilterExpression"] == {"status": "CONFIRMED"}
    assert indexes["unique_library_slot_start"][2]["unique"] is True


def test_entry_slot_schema_requires_positive_capacity_and_nonnegative_count():
    properties = COLLECTION_VALIDATORS["entry_slots"]["$jsonSchema"]["properties"]
    assert properties["capacity"]["minimum"] == 1
    assert properties["booked_count"]["minimum"] == 0
