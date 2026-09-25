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


async def get_exchange_rates(base_currency: CurrencyCode) -> dict[str, Decimal]:
    """
    Obtém cotações relativas à moeda base escolhida.
    Fallback estático garantido se a rede falhar.
    """
    # Exemplo: se base é EUR
    rates = {
        "EUR": Decimal("1.00"),
        "USD": Decimal("1.08"),
        "BRL": Decimal("6.10"),
    }

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"https://open.er-api.com/v6/latest/{base_currency.value}")
            if resp.status_code == 200:
                api_rates = resp.json().get("rates", {})
                for c in ["EUR", "USD", "BRL"]:
                    if c in api_rates:
                        rates[c] = Decimal(str(api_rates[c]))
    except Exception:
        # Se base_currency for BRL ou USD e o fallback precisar de inversão simples
        if base_currency == CurrencyCode.BRL:
            rates = {"BRL": Decimal("1.00"), "EUR": Decimal(
                "0.16"), "USD": Decimal("0.18")}
        elif base_currency == CurrencyCode.USD:
            rates = {"USD": Decimal("1.00"), "EUR": Decimal(
                "0.92"), "BRL": Decimal("5.65")}

    return rates


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
