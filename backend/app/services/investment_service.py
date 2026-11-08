import logging
import time
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.investment import InvestmentAsset, InvestmentSnapshot
from app.models.enums import CurrencyCode
from app.schemas.investment import (
    InvestmentAssetRead,
    InvestmentSnapshotCreate,
    PortfolioSummaryRead,
    AssetPositionRead,
    CurrencyGroupTotal,
    QuoteSyncItem,
    QuoteSyncResult,
)
from app.services.market_data_service import get_quotes, normalize_ticker


logger = logging.getLogger(__name__)

# Taxas de último recurso com base EUR (quantas unidades de X valem 1 EUR).
# Só são usadas se a API falhar E não houver nada em cache. Qualquer base
# é derivada daqui por taxa cruzada, por isso ficam sempre coerentes.
_FALLBACK_RATES_EUR: dict[str, Decimal] = {
    "EUR": Decimal("1.00"),
    "USD": Decimal("1.08"),
    "BRL": Decimal("6.10"),
    "GBP": Decimal("0.85"),
    "CHF": Decimal("0.94"),
}

_RATES_TTL_SECONDS = 60 * 60  # 1h — câmbio de referência diário chega e sobra
_RATES_API_URL = "https://open.er-api.com/v6/latest/{base}"

# Cache em memória por moeda base: {base: (timestamp, rates)}.
# O Render corre uma única instância, por isso um dict de processo basta.
_rates_cache: dict[str, tuple[float, dict[str, Decimal]]] = {}


def _fallback_rates(base_currency: CurrencyCode) -> dict[str, Decimal]:
    base_in_eur = _FALLBACK_RATES_EUR[base_currency.value]
    return {
        code: (rate / base_in_eur).quantize(Decimal("0.000001"))
        for code, rate in _FALLBACK_RATES_EUR.items()
    }


async def get_exchange_rates(base_currency: CurrencyCode) -> dict[str, Decimal]:
    """
    Devolve {moeda: unidades dessa moeda por 1 unidade da base}, para todas
    as moedas de CurrencyCode. Converter: valor_na_base = valor_nativo / taxa.

    Ordem: cache fresca → API → cache expirada → fallback estático.
    """
    key = base_currency.value
    cached = _rates_cache.get(key)
    if cached and time.monotonic() - cached[0] < _RATES_TTL_SECONDS:
        return cached[1]

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(_RATES_API_URL.format(base=key))
            resp.raise_for_status()
            api_rates = resp.json().get("rates", {})

        rates: dict[str, Decimal] = {}
        for currency in CurrencyCode:
            if currency.value not in api_rates:
                raise ValueError(f"Taxa em falta para {currency.value}")
            rates[currency.value] = Decimal(str(api_rates[currency.value]))

        _rates_cache[key] = (time.monotonic(), rates)
        return rates
    except Exception as exc:  # rede, HTTP != 2xx, JSON inválido, moeda em falta
        logger.warning("Falha ao obter câmbio (base=%s): %s", key, exc)
        if cached:
            return cached[1]  # melhor uma taxa de há umas horas do que a estática
        return _fallback_rates(base_currency)


async def save_or_update_snapshot(
    db: AsyncSession,
    asset: InvestmentAsset,
    payload: InvestmentSnapshotCreate,
) -> InvestmentSnapshot:
    ref_first = payload.reference_month.replace(day=1)

    stmt = select(InvestmentSnapshot).where(
        InvestmentSnapshot.asset_id == asset.id,
        InvestmentSnapshot.reference_month == ref_first,
    )
    result = await db.execute(stmt)
    snapshot = result.scalar_one_or_none()

    if snapshot is None:
        snapshot = InvestmentSnapshot(
            asset_id=asset.id,
            reference_month=ref_first,
            balance=payload.balance,
            contribution=payload.contribution,
        )
        db.add(snapshot)
    else:
        snapshot.balance = payload.balance
        snapshot.contribution = payload.contribution

    await db.commit()
    await db.refresh(snapshot)
    return snapshot


async def calculate_portfolio_summary(
    db: AsyncSession,
    user_id: uuid.UUID,
    reference_month: date,
    base_currency: CurrencyCode = CurrencyCode.EUR,
) -> PortfolioSummaryRead:
    ref_first = reference_month.replace(day=1)

    stmt = (
        select(InvestmentAsset)
        .where(InvestmentAsset.user_id == user_id)
        .options(selectinload(InvestmentAsset.snapshots))
    )
    result = await db.execute(stmt)
    assets = result.scalars().all()

    rates = await get_exchange_rates(base_currency)

    # 1. Agrupar saldos nativos por cada moeda existente
    currency_totals: dict[CurrencyCode, dict[str, Decimal]] = {
        c: {"balance": Decimal("0.00"), "contribution": Decimal("0.00")}
        for c in CurrencyCode
    }

    raw_positions = []
    total_consolidated_balance = Decimal("0.00")
    total_consolidated_contrib = Decimal("0.00")

    for asset in assets:
        # Busca o snapshot deste mês
        snap = next(
            (s for s in asset.snapshots if s.reference_month == ref_first), None)
        bal_native = snap.balance if snap else Decimal("0.00")
        contrib_native = snap.contribution if snap else Decimal("0.00")

        # Acumula no grupo da moeda pura
        currency_totals[asset.currency]["balance"] += bal_native
        currency_totals[asset.currency]["contribution"] += contrib_native

        # Converte para a moeda de exibição solicitada
        rate = rates.get(asset.currency.value, Decimal("1.00"))
        if asset.currency == base_currency:
            bal_conv = bal_native
            contrib_conv = contrib_native
        else:
            # Fórmula: Valor / Taxa da moeda em relação à base
            bal_conv = (bal_native / rate).quantize(Decimal("0.01"))
            contrib_conv = (contrib_native / rate).quantize(Decimal("0.01"))

        total_consolidated_balance += bal_conv
        total_consolidated_contrib += contrib_conv

        raw_positions.append({
            "asset": asset,
            "balance_native": bal_native,
            "contribution_native": contrib_native,
            "balance_converted": bal_conv,
        })

    # 2. Monta a lista de totais por moeda (apenas moedas que tenham ativos ou saldo)
    totals_by_currency = [
        CurrencyGroupTotal(
            currency=curr,
            total_balance=data["balance"],
            total_contributions=data["contribution"],
        )
        for curr, data in currency_totals.items()
        if data["balance"] > 0 or data["contribution"] > 0 or any(a.currency == curr for a in assets)
    ]

    # 3. Calcula a percentagem de alocação de cada ativo no património consolidado
    positions: list[AssetPositionRead] = []
    for pos in raw_positions:
        share = Decimal("0.00")
        if total_consolidated_balance > Decimal("0.00"):
            share = ((pos["balance_converted"] / total_consolidated_balance)
                     * 100).quantize(Decimal("0.01"))

        positions.append(
            AssetPositionRead(
                asset_id=pos["asset"].id,
                name=pos["asset"].name,
                category=pos["asset"].category,
                currency=pos["asset"].currency,
                balance_native=pos["balance_native"],
                contribution_native=pos["contribution_native"],
                balance_converted=pos["balance_converted"],
                portfolio_share_pct=share,
            )
        )

    return PortfolioSummaryRead(
        reference_month=ref_first,
        base_display_currency=base_currency,
        totals_by_currency=totals_by_currency,
        consolidated_balance=total_consolidated_balance,
        consolidated_contributions=total_consolidated_contrib,
        exchange_rates=rates,
        positions=positions,
    )


# --- COTAÇÕES DE MERCADO ----------------------------------------------------


async def convert_price(price: Decimal, from_currency: str, to_currency: str) -> Optional[Decimal]:
    """
    Converte um preço entre moedas com as taxas em cache. None se alguma das
    moedas não for suportada (ex: ativo em EUR cotado em SEK).
    """
    if from_currency == to_currency:
        return price
    try:
        base = CurrencyCode(to_currency)
    except ValueError:
        return None
    rates = await get_exchange_rates(base)
    rate = rates.get(from_currency)
    if not rate:
        return None
    return price / rate  # rates[X] = unidades de X por 1 unidade da base


async def build_asset_reads(assets: list[InvestmentAsset]) -> list[InvestmentAssetRead]:
    """
    Serializa ativos com os campos de mercado calculados. A mesma moeda é
    resolvida no próprio schema; aqui só tratamos cotações noutra moeda.
    """
    reads: list[InvestmentAssetRead] = []
    for asset in assets:
        read = InvestmentAssetRead.model_validate(asset)
        if (read.market_value is None and read.last_price is not None
                and read.last_price_currency and read.last_price_currency != read.currency.value):
            converted = await convert_price(read.last_price, read.last_price_currency, read.currency.value)
            if converted is not None:
                read.apply_price(converted)
        reads.append(read)
    return reads


async def sync_user_quotes(db: AsyncSession, user_id: uuid.UUID) -> QuoteSyncResult:
    """
    Atualiza o último preço (cache L2) de todos os ativos com ticker e, para
    os que também têm quantidade, grava o snapshot do mês corrente com
    balance = shares_quantity * preço (na moeda do ativo). A contribuição já
    registada nesse snapshot é preservada.

    Se um provedor falhar, o ativo mantém o last_price anterior: o resumo e
    a lista continuam a mostrar o último valor conhecido, com a data.
    """
    month = date.today().replace(day=1)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(InvestmentAsset).where(
            InvestmentAsset.user_id == user_id,
            InvestmentAsset.ticker.is_not(None),
            InvestmentAsset.ticker != "",
        )
    )
    assets = list(result.scalars().all())

    items: list[QuoteSyncItem] = []
    symbol_by_asset: dict[uuid.UUID, str] = {}
    for asset in assets:
        try:
            symbol_by_asset[asset.id] = normalize_ticker(asset.ticker)
        except ValueError as exc:
            items.append(QuoteSyncItem(asset_id=asset.id, ticker=asset.ticker,
                                       status="failed", reason=str(exc)))

    quotes, errors = await get_quotes(list(symbol_by_asset.values())) if symbol_by_asset else ({}, {})

    # Snapshots já existentes deste mês, numa só query
    existing: dict[uuid.UUID, InvestmentSnapshot] = {}
    if symbol_by_asset:
        snap_result = await db.execute(
            select(InvestmentSnapshot).where(
                InvestmentSnapshot.asset_id.in_(list(symbol_by_asset)),
                InvestmentSnapshot.reference_month == month,
            )
        )
        existing = {snap.asset_id: snap for snap in snap_result.scalars()}

    for asset in assets:
        symbol = symbol_by_asset.get(asset.id)
        if symbol is None:
            continue  # ticker inválido, já reportado
        quote = quotes.get(symbol)
        if quote is None:
            reason = errors.get(symbol, "Sem cotação")
            if asset.last_price_at:
                reason += f" (a usar último preço de {asset.last_price_at:%d/%m/%Y %H:%M})"
            items.append(QuoteSyncItem(asset_id=asset.id, ticker=symbol, status="failed", reason=reason))
            continue

        asset.last_price = quote.price
        asset.last_price_currency = quote.currency
        asset.last_price_at = now

        snapshot_updated = False
        reason = None
        if asset.shares_quantity:
            price = await convert_price(quote.price, quote.currency, asset.currency.value)
            if price is None:
                reason = f"Cotação em {quote.currency}: sem conversão para {asset.currency.value}"
            else:
                balance = (asset.shares_quantity * price).quantize(Decimal("0.01"))
                snapshot = existing.get(asset.id)
                if snapshot is None:
                    db.add(InvestmentSnapshot(asset_id=asset.id, reference_month=month,
                                              balance=balance, contribution=Decimal("0.00")))
                else:
                    snapshot.balance = balance
                snapshot_updated = True

        items.append(QuoteSyncItem(
            asset_id=asset.id, ticker=symbol, status="updated", price=quote.price,
            currency=quote.currency, snapshot_updated=snapshot_updated, reason=reason,
        ))

    await db.commit()

    updated = sum(1 for i in items if i.status == "updated")
    return QuoteSyncResult(
        synced_at=now,
        reference_month=month,
        updated_count=updated,
        failed_count=len(items) - updated,
        items=items,
    )
