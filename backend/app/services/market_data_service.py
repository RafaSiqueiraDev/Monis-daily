"""
Cotações de ações/ETFs com cadeia de provedores e cache em memória (L1).

Convenção de tickers (estilo Yahoo):
    AAPL, MSFT        -> EUA (USD)
    VWCE.DE, IWDA.AS  -> Xetra / Euronext Amesterdão (EUR)
    EDP.LS            -> Euronext Lisboa (EUR)
    VUSA.L, HSBA.L    -> Londres (GBP, ou GBp/pence -> normalizado para GBP)
    PETR4.SA          -> B3 (BRL); "PETR4" sem sufixo também é aceite

Cadeia: Yahoo (sem chave, cobre tudo) -> brapi (só B3) -> Twelve Data (só
EUA, e só se TWELVE_DATA_API_KEY estiver definida). O primeiro provedor que
devolver um preço válido ganha.

A cache L2 (último preço persistido na BD) é gerida em investment_service:
este módulo não conhece a base de dados.
"""
from __future__ import annotations

import asyncio
import logging
import re
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Optional, Protocol

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_HTTP_TIMEOUT = httpx.Timeout(6.0, connect=4.0)
# O Yahoo recusa pedidos sem um User-Agent de browser.
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Accept": "application/json",
}
_MAX_CONCURRENCY = 5
_NEGATIVE_TTL_SECONDS = 5 * 60  # ticker "não encontrado" fica em cache menos tempo

# Ticker B3 sem sufixo: 4 letras + 1-2 dígitos (PETR4, ITUB4, BOVA11, TAEE11)
_B3_BARE = re.compile(r"^[A-Z]{4}\d{1,2}$")
_VALID_TICKER = re.compile(r"^[A-Z0-9][A-Z0-9.\-=^]{0,19}$")

# Moedas cotadas em subunidades (1/100): o Yahoo devolve "GBp" para pence.
_SUBUNIT_CURRENCIES = {"GBp": "GBP", "GBX": "GBP", "ZAc": "ZAR", "ILA": "ILS"}


@dataclass(frozen=True)
class Quote:
    symbol: str  # ticker normalizado pedido (ex: "PETR4.SA")
    price: Decimal  # já na unidade principal (GBp/100 -> GBP)
    currency: str  # ISO 4217
    provider: str
    fetched_at: datetime
    name: Optional[str] = None
    previous_close: Optional[Decimal] = None


class QuoteProvider(Protocol):
    name: str

    def supports(self, symbol: str) -> bool: ...

    async def fetch(self, client: httpx.AsyncClient, symbol: str) -> Optional[Quote]:
        """Devolve a cotação, None se o ticker não existir; levanta em erro de rede/HTTP."""
        ...


# --- Normalização ---------------------------------------------------------


def normalize_ticker(raw: str) -> str:
    """'  petr4 ' -> 'PETR4.SA'; 'vwce.de' -> 'VWCE.DE'. Levanta ValueError se inválido."""
    symbol = raw.strip().upper()
    if _B3_BARE.match(symbol):
        symbol = f"{symbol}.SA"
    if not _VALID_TICKER.match(symbol):
        raise ValueError(f"Ticker inválido: {raw!r}")
    return symbol


def _to_decimal(value: object) -> Optional[Decimal]:
    if value is None or isinstance(value, bool):
        return None
    try:
        dec = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None
    return dec if dec.is_finite() and dec > 0 else None


def normalize_price(price: Decimal, currency: str) -> tuple[Decimal, str]:
    """Converte subunidades (pence, etc.) para a unidade principal."""
    if currency in _SUBUNIT_CURRENCIES:
        return price / Decimal(100), _SUBUNIT_CURRENCIES[currency]
    return price, currency.upper()


def _build_quote(symbol: str, provider: str, price: object, currency: object,
                 name: object = None, previous_close: object = None) -> Optional[Quote]:
    price_dec = _to_decimal(price)
    if price_dec is None or not isinstance(currency, str) or not currency:
        return None
    price_dec, currency_norm = normalize_price(price_dec, currency)
    prev = _to_decimal(previous_close)
    if prev is not None:
        prev, _ = normalize_price(prev, currency)
    return Quote(
        symbol=symbol,
        price=price_dec.quantize(Decimal("0.000001")),
        currency=currency_norm,
        provider=provider,
        fetched_at=datetime.now(timezone.utc),
        name=name if isinstance(name, str) and name else None,
        previous_close=prev,
    )


# --- Provedores -----------------------------------------------------------


class YahooProvider:
    name = "yahoo"
    _URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"

    def supports(self, symbol: str) -> bool:
        return True

    async def fetch(self, client: httpx.AsyncClient, symbol: str) -> Optional[Quote]:
        resp = await client.get(self._URL.format(symbol=symbol),
                                params={"range": "1d", "interval": "1d"})
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        results = (resp.json().get("chart") or {}).get("result") or []
        if not results:
            return None
        meta = results[0].get("meta") or {}
        return _build_quote(
            symbol, self.name,
            meta.get("regularMarketPrice"), meta.get("currency"),
            meta.get("longName") or meta.get("shortName"),
            meta.get("chartPreviousClose"),
        )


class BrapiProvider:
    """B3. Sem token só cobre alguns tickers (ex: PETR4, ITUB4)."""
    name = "brapi"
    _URL = "https://brapi.dev/api/quote/{code}"

    def supports(self, symbol: str) -> bool:
        return symbol.endswith(".SA")

    async def fetch(self, client: httpx.AsyncClient, symbol: str) -> Optional[Quote]:
        code = symbol.removesuffix(".SA")
        params = {"token": settings.BRAPI_TOKEN} if settings.BRAPI_TOKEN else None
        resp = await client.get(self._URL.format(code=code), params=params)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        results = resp.json().get("results") or []
        if not results:
            return None
        r = results[0]
        return _build_quote(
            symbol, self.name,
            r.get("regularMarketPrice"), r.get("currency") or "BRL",
            r.get("longName") or r.get("shortName"),
            r.get("regularMarketPreviousClose"),
        )


class TwelveDataProvider:
    """Fallback para tickers dos EUA (sem sufixo de bolsa)."""
    name = "twelvedata"
    _URL = "https://api.twelvedata.com/quote"

    def supports(self, symbol: str) -> bool:
        return bool(settings.TWELVE_DATA_API_KEY) and "." not in symbol

    async def fetch(self, client: httpx.AsyncClient, symbol: str) -> Optional[Quote]:
        resp = await client.get(self._URL, params={
            "symbol": symbol, "apikey": settings.TWELVE_DATA_API_KEY})
        resp.raise_for_status()
        data = resp.json()
        if data.get("status") == "error":
            # A Twelve Data responde 200 com {"status":"error"}; 404 = símbolo inexistente
            if data.get("code") == 404:
                return None
            raise RuntimeError(data.get("message", "erro Twelve Data"))
        return _build_quote(
            symbol, self.name, data.get("close"), data.get("currency"),
            data.get("name"), data.get("previous_close"),
        )


PROVIDERS: list[QuoteProvider] = [YahooProvider(), BrapiProvider(), TwelveDataProvider()]


# --- Cache L1 + orquestração ----------------------------------------------

# Ponto de injeção para testes (httpx.MockTransport); None = rede real.
_transport: Optional[httpx.AsyncBaseTransport] = None

# symbol -> (monotonic_ts, Quote | None). None = "não encontrado" (cache negativa).
_cache: dict[str, tuple[float, Optional[Quote]]] = {}


def _cache_get(symbol: str) -> tuple[bool, Optional[Quote]]:
    entry = _cache.get(symbol)
    if entry is None:
        return False, None
    ts, quote = entry
    ttl = settings.QUOTES_CACHE_TTL_SECONDS if quote else _NEGATIVE_TTL_SECONDS
    if time.monotonic() - ts > ttl:
        return False, None
    return True, quote


def clear_cache() -> None:
    _cache.clear()


async def _fetch_from_chain(client: httpx.AsyncClient, symbol: str) -> Optional[Quote]:
    """
    Tenta cada provedor por ordem. Devolve None só se TODOS os provedores
    aplicáveis responderam "não existe"; se algum falhou por erro (rede, 429,
    5xx) e nenhum teve sucesso, levanta para não cachear um falso negativo.
    """
    last_error: Optional[Exception] = None
    for provider in PROVIDERS:
        if not provider.supports(symbol):
            continue
        try:
            quote = await provider.fetch(client, symbol)
        except Exception as exc:  # um provedor em baixo não deve parar a cadeia
            logger.warning("Provedor %s falhou para %s: %s", provider.name, symbol, exc)
            last_error = exc
            continue
        if quote is not None:
            return quote
    if last_error is not None:
        raise last_error
    return None


async def get_quotes(raw_symbols: list[str]) -> tuple[dict[str, Quote], dict[str, str]]:
    """
    Cotações para vários tickers (deduplicados), com cache e concorrência limitada.
    Devolve (cotações por ticker normalizado, erros por ticker normalizado/original).
    """
    quotes: dict[str, Quote] = {}
    errors: dict[str, str] = {}
    pending: list[str] = []

    for raw in dict.fromkeys(raw_symbols):  # dedupe preservando ordem
        try:
            symbol = normalize_ticker(raw)
        except ValueError as exc:
            errors[raw] = str(exc)
            continue
        if symbol in quotes or symbol in pending:
            continue
        hit, cached = _cache_get(symbol)
        if hit:
            if cached:
                quotes[symbol] = cached
            else:
                errors[symbol] = "Ticker não encontrado"
        else:
            pending.append(symbol)

    if pending:
        semaphore = asyncio.Semaphore(_MAX_CONCURRENCY)

        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT, headers=_HEADERS,
                                     follow_redirects=True, transport=_transport) as client:
            async def worker(symbol: str) -> None:
                async with semaphore:
                    try:
                        quote = await _fetch_from_chain(client, symbol)
                    except Exception:
                        errors[symbol] = "Provedores de cotações indisponíveis"
                        return  # não cachear: pode ser falha temporária
                _cache[symbol] = (time.monotonic(), quote)
                if quote:
                    quotes[symbol] = quote
                else:
                    errors[symbol] = "Ticker não encontrado"

            await asyncio.gather(*(worker(s) for s in pending))

    return quotes, errors


async def get_quote(raw_symbol: str) -> Optional[Quote]:
    """Cotação de um ticker; None se não existir. Levanta ValueError se o formato for inválido."""
    symbol = normalize_ticker(raw_symbol)
    quotes, errors = await get_quotes([symbol])
    if symbol in quotes:
        return quotes[symbol]
    if errors.get(symbol) == "Provedores de cotações indisponíveis":
        raise ConnectionError(errors[symbol])
    return None
