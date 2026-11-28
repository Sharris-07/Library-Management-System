"""Create a local .env file without embedding Atlas credentials in source."""
from getpass import getpass
from pathlib import Path
from secrets import token_urlsafe
from urllib.parse import quote_plus

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


def main():
    print("\n=== LMS environment setup ===")
    print("Use the connection details from MongoDB Atlas. Password input is hidden.\n")
    username = input("Atlas database username: ").strip()
    host = input("Atlas cluster host (e.g. cluster.example.mongodb.net): ").strip()
    password = getpass("Atlas database password: ")
    confirmation = getpass("Confirm Atlas database password: ")

    if not username or not host or not password:
        raise SystemExit("Username, host, and password are required.")
    if password != confirmation:
        raise SystemExit("Passwords do not match. No file was written.")
    if "://" in host or "/" in host:
        raise SystemExit("Enter only the cluster hostname, without protocol or path.")

    uri = (
        f"mongodb+srv://{quote_plus(username)}:{quote_plus(password)}"
        f"@{host}/?retryWrites=true&w=majority&appName=LMS"
    )
    content = f"""# Local development only. Never commit this file.
FLASK_DEBUG=1
SECRET_KEY={token_urlsafe(48)}
MONGODB_URI={uri}
MONGODB_DB_NAME=library_management_dev
MONGODB_TEST_DB_NAME=library_management_test
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
SESSION_COOKIE_SECURE=0
SESSION_COOKIE_SAMESITE=Lax
SESSION_LIFETIME_MINUTES=60
CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
"""
    ENV_FILE.write_text(content, encoding="utf-8")
    print(f"\nEnvironment file created at: {ENV_FILE}")
    print("Credentials and generated secret were not displayed.")


if __name__ == "__main__":
    main()
