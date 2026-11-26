
import os
from pathlib import Path

from dotenv import load_dotenv

# The .env file is in the project root, one level above backend/.
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env", override=False)


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")

    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"

    MONGODB_URI = os.getenv("MONGODB_URI")
    MONGODB_DB_NAME = os.getenv(
        "MONGODB_DB_NAME",
        "library_management_dev",
    )

    MONGODB_TEST_DB_NAME = os.getenv(
        "MONGODB_TEST_DB_NAME",
        "library_management_test",
    )

    MONGODB_SERVER_SELECTION_TIMEOUT_MS = 5000

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.getenv(
        "SESSION_COOKIE_SECURE", "0"
    ) == "1"

    SESSION_LIFETIME_MINUTES = int(
        os.getenv("SESSION_LIFETIME_MINUTES", "60")
    )

    CORS_ALLOWED_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ALLOWED_ORIGINS",
            "http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]
