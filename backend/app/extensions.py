
from pymongo import MongoClient


class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None

    def init_app(self, app):
        uri = app.config.get("MONGODB_URI")
        database_name = app.config.get("MONGODB_DB_NAME")

        if not uri:
            raise RuntimeError("MONGODB_URI is not configured.")

        if not database_name:
            raise RuntimeError("MONGODB_DB_NAME is not configured.")

        self.client = MongoClient(
            uri,
            serverSelectionTimeoutMS=app.config[
                "MONGODB_SERVER_SELECTION_TIMEOUT_MS"
            ],
        )

        self.db = self.client[database_name]

        app.extensions["mongodb"] = self

    def ping(self):
        if self.client is None:
            raise RuntimeError("MongoDB has not been initialized.")

        self.client.admin.command("ping")
        return True

    def close(self):
        if self.client is not None:
            self.client.close()
            self.client = None
            self.db = None


mongo = MongoDB()
