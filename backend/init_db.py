"""Initialize the configured LMS MongoDB database without dropping data."""
from app import create_app
from app.database import initialize_database
from app.extensions import mongo


def main():
    app = create_app()
    try:
        with app.app_context():
            print("Connecting to MongoDB...")
            mongo.ping()
            print("MongoDB connection successful.")
            result = initialize_database(mongo.db)
            print(
                "Database initialized: "
                f"{result['collection_count']} collections, "
                f"{result['index_count']} indexes."
            )
    finally:
        mongo.close()


if __name__ == "__main__":
    main()
