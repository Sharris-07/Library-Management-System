
from flask import Flask, jsonify
from flask_cors import CORS

from .config import Config
from .extensions import db, migrate


def create_app(config_class=Config):

    app = Flask(__name__)

    app.config.from_object(config_class)

    # Allow our separate frontend to communicate with Flask.
    CORS(
        app,
        origins=[
            "http://127.0.0.1:5500",
            "http://localhost:5500"
        ],
        supports_credentials=True
    )

    # Initialize database and migrations.
    db.init_app(app)
    migrate.init_app(app, db)

    @app.get("/api/health")
    def health_check():

        return jsonify({
            "status": "ok",
            "service": "library-management-system"
        }), 200

    return app
