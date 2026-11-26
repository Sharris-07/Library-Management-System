
from getpass import getpass
from pathlib import Path
from secrets import token_hex
from urllib.parse import quote_plus

# Project configuration
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"

MONGODB_USERNAME = "shakibhasib10_db_user"
MONGODB_HOST = "lms.tx8kypc.mongodb.net"

def main():
    print("\n=== LMS Environment Setup ===")
    print("Enter the NEW MongoDB password you just created in Atlas.")
    print("Your password will not be displayed while typing.\n")

    password = getpass("New MongoDB password: ")
    confirmation = getpass("Confirm MongoDB password: ")

    if not password:
        print("ERROR: Password cannot be empty.")
        return

    if password != confirmation:
        print("ERROR: Passwords do not match. Nothing was changed.")
        return

    # Encode reserved URI characters safely.
    encoded_password = quote_plus(password)

    # Generate a fresh Flask secret key.
    secret_key = token_hex(32)

    # Construct the MongoDB Atlas connection URI.
    mongodb_uri = (
        f"mongodb+srv://{MONGODB_USERNAME}:{encoded_password}"
        f"@{MONGODB_HOST}/"
        "?retryWrites=true&w=majority&appName=LMS"
    )

    env_content = f"""# LMS local development environment
# DO NOT COMMIT THIS FILE.

FLASK_DEBUG=1
SECRET_KEY={secret_key}

MONGODB_URI={mongodb_uri}
MONGODB_DB_NAME=library_management_dev
MONGODB_TEST_DB_NAME=library_management_test

SESSION_COOKIE_SECURE=0
SESSION_LIFETIME_MINUTES=60

CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5500
"""

    ENV_FILE.write_text(env_content, encoding="utf-8")

    print("\nEnvironment file created successfully.")
    print("Location:", ENV_FILE)
    print("MongoDB password: encoded automatically")
    print("Flask secret key: generated automatically")
    print("Secrets were not displayed.")

if __name__ == "__main__":
    main()
