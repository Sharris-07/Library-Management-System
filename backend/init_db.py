
from app import create_app
from app.extensions import mongo
from app.database import initialize_database


app = create_app()

try:
    with app.app_context():
        print("Connecting to MongoDB Atlas...")

        mongo.ping()

        print("MongoDB connection successful.")

        initialize_database(mongo.db)

finally:
    mongo.close()
