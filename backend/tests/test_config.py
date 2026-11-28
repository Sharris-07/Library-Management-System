from importlib import reload


def test_cors_defaults_include_vite_origins(monkeypatch):
    monkeypatch.delenv("CORS_ALLOWED_ORIGINS", raising=False)
    import backend.app.config as config_module
    reload(config_module)
    assert "http://localhost:5173" in config_module.Config.CORS_ALLOWED_ORIGINS
    assert "http://127.0.0.1:5173" in config_module.Config.CORS_ALLOWED_ORIGINS


def test_test_database_name_is_distinct_from_development(monkeypatch):
    monkeypatch.setenv("MONGODB_DB_NAME", "lms_dev")
    monkeypatch.setenv("MONGODB_TEST_DB_NAME", "lms_test")
    import backend.app.config as config_module
    reload(config_module)
    assert config_module.Config.MONGODB_TEST_DB_NAME != config_module.Config.MONGODB_DB_NAME
