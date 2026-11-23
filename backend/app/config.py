
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATABASE_PATH = PROJECT_ROOT / "instance" / "library.db"

# Make sure the database directory exists.
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)


class Config:
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "development-only-change-me"
    )

    SQLALCHEMY_DATABASE_URI = (
        os.getenv("DATABASE_URL")
        or f"sqlite:///{DATABASE_PATH.as_posix()}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
