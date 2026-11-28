
import pytest

from backend.app import create_app
from backend.app.extensions import mongo


@pytest.fixture
def app():
    test_config = {
        "TESTING": True,
        "SECRET_KEY": "test-secret-key",
        "MONGODB_URI": "mongodb://localhost:27017",
        "MONGODB_DB_NAME": "library_management_test",
        "MONGODB_SERVER_SELECTION_TIMEOUT_MS": 1000,
        "CORS_ALLOWED_ORIGINS": ["http://127.0.0.1:5173"],
    }

    application = create_app(test_config)

    yield application

    mongo.close()


@pytest.fixture
def client(app):
    return app.test_client()
