"""Autenticação dos endpoints /internal (offline: o serviço de sync é simulado)."""
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.routers import internal
from app.schemas.investment import QuoteSyncAllResult

URL = "/internal/quotes/sync-all"


@pytest.fixture
def client(monkeypatch):
    calls = []

    async def fake_sync(db):
        calls.append(db)
        return QuoteSyncAllResult(
            synced_at=datetime.now(timezone.utc), users_processed=2, users_failed=0,
            distinct_tickers=3, assets_updated=4, assets_failed=1, duration_seconds=0.5,
        )

    monkeypatch.setattr(internal, "sync_all_users_quotes", fake_sync)
    with TestClient(app) as c:
        c.calls = calls
        yield c


def test_disabled_when_secret_not_configured(client, monkeypatch):
    monkeypatch.setattr(settings, "INTERNAL_CRON_SECRET", None)
    r = client.post(URL, headers={"X-Internal-Token": "qualquer"})
    assert r.status_code == 503 and not client.calls


@pytest.mark.parametrize("headers", [{}, {"X-Internal-Token": ""}, {"X-Internal-Token": "errado"},
                                     {"X-Internal-Token": "segredo-longo-123 "}])
def test_rejects_missing_or_wrong_token(client, monkeypatch, headers):
    monkeypatch.setattr(settings, "INTERNAL_CRON_SECRET", "segredo-longo-123")
    r = client.post(URL, headers=headers)
    assert r.status_code == 401 and not client.calls


def test_user_jwt_is_not_accepted(client, monkeypatch):
    monkeypatch.setattr(settings, "INTERNAL_CRON_SECRET", "segredo-longo-123")
    r = client.post(URL, headers={"Authorization": "Bearer qualquer.jwt.aqui"})
    assert r.status_code == 401 and not client.calls


def test_accepts_correct_token(client, monkeypatch):
    monkeypatch.setattr(settings, "INTERNAL_CRON_SECRET", "segredo-longo-123")
    r = client.post(URL, headers={"X-Internal-Token": "segredo-longo-123"})
    assert r.status_code == 200 and len(client.calls) == 1
    assert r.json()["assets_updated"] == 4


def test_only_post_and_hidden_from_docs(client, monkeypatch):
    monkeypatch.setattr(settings, "INTERNAL_CRON_SECRET", "segredo-longo-123")
    assert client.get(URL, headers={"X-Internal-Token": "segredo-longo-123"}).status_code == 405
    assert not any(p.startswith("/internal") for p in client.get("/openapi.json").json()["paths"])
