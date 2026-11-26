
from flask import Flask
from flask_cors import CORS

from .config import Config
from .extensions import mongo
from .routes import register_routes


def create_app(test_config=None):
    app = Flask(__name__)

    app.config.from_object(Config)

    if test_config:
        app.config.update(test_config)

    if not app.config.get("SECRET_KEY"):
        raise RuntimeError("SECRET_KEY is not configured in .env.")

    mongo.init_app(app)

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["CORS_ALLOWED_ORIGINS"]
            }
        },
        supports_credentials=True,
    )

    register_routes(app)

    return app
