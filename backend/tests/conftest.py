import pytest

from app import create_app
from app.extensions import db


@pytest.fixture()
def app(tmp_path):
    class TestConfig:
        TESTING = True
        SECRET_KEY = "test-secret"
        SQLALCHEMY_DATABASE_URI = (
            f"sqlite:///{tmp_path / 'test.db'}"
        )
        SQLALCHEMY_TRACK_MODIFICATIONS = False

    application = create_app(TestConfig)

    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()
