import logging
import time
import uuid
from datetime import date
from decimal import Decimal
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.investment import InvestmentAsset, InvestmentSnapshot
from app.models.enums import CurrencyCode
from app.schemas.investment import (
    InvestmentSnapshotCreate,
    PortfolioSummaryRead,
    AssetPositionRead,
    CurrencyGroupTotal,
)


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
