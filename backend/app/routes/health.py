
from flask import Blueprint, current_app, jsonify

from ..extensions import mongo

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    try:
        mongo.ping()

        return jsonify({
            "status": "ok",
            "application": "Library Management System API",
            "database": "connected",
        }), 200

    except Exception:
        current_app.logger.exception(
            "MongoDB health check failed."
        )

        return jsonify({
            "status": "degraded",
            "application": "Library Management System API",
            "database": "unavailable",
        }), 503
