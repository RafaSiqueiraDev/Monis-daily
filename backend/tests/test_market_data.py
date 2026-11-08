"""Testes offline do serviço de cotações (HTTP simulado com httpx.MockTransport)."""
import asyncio
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import httpx
import pytest

from app.core.config import settings
from app.models.enums import AssetCategory, CurrencyCode
from app.schemas.investment import InvestmentAssetCreate, InvestmentAssetRead
from app.services import market_data_service as mds


def _yahoo(price, currency, name="X", prev=None):
    return {"chart": {"result": [{"meta": {
        "regularMarketPrice": price, "currency": currency, "longName": name,
        "chartPreviousClose": prev}}], "error": None}}


class FakeMarket:
    """Router HTTP: regista os pedidos e responde conforme o host/símbolo."""

    def __init__(self, yahoo=None, brapi=None, twelve=None, yahoo_status=None):
        self.yahoo, self.brapi, self.twelve = yahoo or {}, brapi or {}, twelve or {}
        self.yahoo_status = yahoo_status  # força um status (ex: 429) no Yahoo
        self.calls: list[str] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        host, path = request.url.host, request.url.path
        self.calls.append(f"{host}{path}")
        if "yahoo" in host:
            if self.yahoo_status:
                return httpx.Response(self.yahoo_status, json={})
            symbol = path.rsplit("/", 1)[-1]
            if symbol in self.yahoo:
                return httpx.Response(200, json=self.yahoo[symbol])
            return httpx.Response(404, json={"chart": {"result": None}})
        if "brapi" in host:
            code = path.rsplit("/", 1)[-1]
            if code in self.brapi:
                return httpx.Response(200, json={"results": [self.brapi[code]]})
            return httpx.Response(404, json={"error": True})
        if "twelvedata" in host:
            symbol = request.url.params["symbol"]
            if symbol in self.twelve:
                return httpx.Response(200, json=self.twelve[symbol])
            return httpx.Response(200, json={"status": "error", "code": 404})
        return httpx.Response(500)


@pytest.fixture
def market(monkeypatch):
    def install(**kwargs):
        fake = FakeMarket(**kwargs)
        monkeypatch.setattr(mds, "_transport", httpx.MockTransport(fake))
        return fake
    mds.clear_cache()
    monkeypatch.setattr(settings, "TWELVE_DATA_API_KEY", None)
    monkeypatch.setattr(settings, "BRAPI_TOKEN", None)
    yield install
    mds.clear_cache()


# --- normalização ----------------------------------------------------------

@pytest.mark.parametrize("raw, expected", [
    (" aapl ", "AAPL"), ("vwce.de", "VWCE.DE"), ("PETR4", "PETR4.SA"),
    ("bova11", "BOVA11.SA"), ("PETR4.SA", "PETR4.SA"), ("BRK-B", "BRK-B"),
])
def test_normalize_ticker(raw, expected):
    assert mds.normalize_ticker(raw) == expected


@pytest.mark.parametrize("raw", ["", "   ", "AAPL US", "A" * 21, "$$$"])
def test_normalize_ticker_rejects_invalid(raw):
    with pytest.raises(ValueError):
        mds.normalize_ticker(raw)


def test_pence_are_converted_to_pounds():
    assert mds.normalize_price(Decimal("612.4"), "GBp") == (Decimal("6.124"), "GBP")
    assert mds.normalize_price(Decimal("105.39"), "GBP") == (Decimal("105.39"), "GBP")


# --- cadeia de provedores ----------------------------------------------------

def test_yahoo_quote_with_pence(market):
    market(yahoo={"HSBA.L": _yahoo(612.4, "GBp", "HSBC", prev=600)})
    quote = asyncio.run(mds.get_quote("hsba.l"))
    assert quote.price == Decimal("6.124000") and quote.currency == "GBP"
    assert quote.previous_close == Decimal("6") and quote.provider == "yahoo"


def test_falls_back_to_brapi_when_yahoo_down(market):
    fake = market(yahoo_status=429, brapi={"PETR4": {"regularMarketPrice": 45.3, "currency": "BRL"}})
    quote = asyncio.run(mds.get_quote("PETR4"))
    assert quote.provider == "brapi" and quote.price == Decimal("45.300000")
    assert any("yahoo" in c for c in fake.calls) and any("brapi" in c for c in fake.calls)


def test_twelvedata_only_used_with_key(market, monkeypatch):
    market(yahoo_status=503, twelve={"AAPL": {"close": "342.1", "currency": "USD", "name": "Apple"}})
    with pytest.raises(ConnectionError):  # sem chave: só o Yahoo, que está em baixo
        asyncio.run(mds.get_quote("AAPL"))
    mds.clear_cache()
    monkeypatch.setattr(settings, "TWELVE_DATA_API_KEY", "k")
    assert asyncio.run(mds.get_quote("AAPL")).provider == "twelvedata"


def test_unknown_ticker_returns_none_and_is_negatively_cached(market):
    fake = market()
    assert asyncio.run(mds.get_quote("NAOEXISTE")) is None
    assert asyncio.run(mds.get_quote("NAOEXISTE")) is None
    assert len(fake.calls) == 1  # 2.ª chamada veio da cache negativa


def test_provider_errors_are_not_cached(market):
    fake = market(yahoo_status=500)
    for _ in range(2):
        with pytest.raises(ConnectionError):
            asyncio.run(mds.get_quote("AAPL"))
    assert len(fake.calls) == 2  # falha temporária não fica em cache


def test_get_quotes_dedupes_and_uses_cache(market):
    fake = market(yahoo={"AAPL": _yahoo(342, "USD"), "VWCE.DE": _yahoo(165.8, "EUR")})
    quotes, errors = asyncio.run(mds.get_quotes(["AAPL", "aapl", "VWCE.DE", "bad ticker"]))
    assert set(quotes) == {"AAPL", "VWCE.DE"} and "bad ticker" in errors
    assert len(fake.calls) == 2
    asyncio.run(mds.get_quotes(["AAPL", "VWCE.DE"]))
    assert len(fake.calls) == 2  # tudo da cache L1


# --- schemas ---------------------------------------------------------------

def _asset_read(**overrides) -> InvestmentAssetRead:
    data = dict(
        id=uuid.uuid4(), user_id=uuid.uuid4(), created_at=datetime.now(timezone.utc),
        name="VWCE", category=AssetCategory.FUND, currency=CurrencyCode.EUR,
        ticker="VWCE.DE", shares_quantity=Decimal("10"), average_price=Decimal("100"),
        last_price=Decimal("120"), last_price_currency="EUR",
    )
    data.update(overrides)
    return InvestmentAssetRead(**data)


def test_pnl_computed_for_same_currency():
    read = _asset_read()
    assert read.market_value == Decimal("1200.00")
    assert read.cost_basis == Decimal("1000.00")
    assert read.unrealized_pnl == Decimal("200.00")
    assert read.unrealized_pnl_pct == Decimal("20.00")


def test_pnl_negative():
    read = _asset_read(last_price=Decimal("75"))
    assert read.unrealized_pnl == Decimal("-250.00") and read.unrealized_pnl_pct == Decimal("-25.00")


def test_pnl_left_empty_when_currency_differs_or_data_missing():
    assert _asset_read(last_price_currency="USD").market_value is None  # o router converte
    assert _asset_read(shares_quantity=None).market_value is None
    no_avg = _asset_read(average_price=None)
    assert no_avg.market_value == Decimal("1200.00") and no_avg.unrealized_pnl is None


def test_asset_create_normalizes_ticker():
    base = dict(name="x", category="stock", currency="BRL")
    assert InvestmentAssetCreate(**base, ticker=" petr4 ").ticker == "PETR4.SA"
    assert InvestmentAssetCreate(**base, ticker="").ticker is None
    with pytest.raises(ValueError):
        InvestmentAssetCreate(**base, ticker="AAPL US")
