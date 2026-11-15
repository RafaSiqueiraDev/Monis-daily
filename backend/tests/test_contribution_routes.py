"""Contrato das rotas de aportes (regressão do bug da Fase 3: POST devolvia 405/500)."""
from app.main import app
from app.schemas.investment_contribution import (
    InvestmentContributionCreate,
    InvestmentContributionCreateForAsset,
)


def _methods(path: str) -> set[str]:
    return {m for r in app.routes if getattr(r, "path", None) == path for m in r.methods}


def test_frontend_route_accepts_post():
    # O frontend faz POST /investments/assets/{id}/contributions
    assert "POST" in _methods("/investments/assets/{asset_id}/contributions")
    assert "GET" in _methods("/investments/assets/{asset_id}/contributions")


def test_flat_route_schema_has_asset_id():
    # A rota antiga lia payload.asset_id, que não existia no schema -> 500
    assert "asset_id" in InvestmentContributionCreateForAsset.model_fields
    assert "asset_id" not in InvestmentContributionCreate.model_fields
