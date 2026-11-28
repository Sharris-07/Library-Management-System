
from backend.app.extensions import mongo


def test_health_check_when_database_is_connected(client, monkeypatch):
    monkeypatch.setattr(mongo, "ping", lambda: True)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json["status"] == "ok"
    assert response.json["database"] == "connected"


def test_health_check_when_database_is_unavailable(client, monkeypatch):
    def failed_ping():
        raise ConnectionError("Database unavailable")

    monkeypatch.setattr(mongo, "ping", failed_ping)

    response = client.get("/api/health")

    assert response.status_code == 503
    assert response.json["status"] == "degraded"
    assert response.json["database"] == "unavailable"
