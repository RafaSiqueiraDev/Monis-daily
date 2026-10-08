import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sa_func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.investment import InvestmentAsset, InvestmentSnapshot, InvestmentContribution
from app.models.enums import CurrencyCode
from app.schemas.investment import (
    InvestmentAssetCreate,
    InvestmentAssetUpdate,
    InvestmentAssetRead,
    InvestmentAssetBulkCreate,
    ContributionsTotal,
    InvestmentSnapshotCreate,
    InvestmentSnapshotRead,
    PortfolioSummaryRead,
)
from app.schemas.investment_contribution import (
    InvestmentContributionCreate,
    InvestmentContributionRead,
)
from app.services.investment_service import (
    save_or_update_snapshot,
    calculate_portfolio_summary,
)

router = APIRouter(prefix="/investments", tags=["Investimentos"])


async def _get_owned_asset(asset_id: uuid.UUID, current_user: User, db: AsyncSession) -> InvestmentAsset:
    result = await db.execute(
        select(InvestmentAsset).where(
            InvestmentAsset.id == asset_id, InvestmentAsset.user_id == current_user.id
        )
    )
    asset = result.scalar_one_or_none()
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ativo nao encontrado")
    return asset

# --- ATIVOS ---


@router.post("/assets", response_model=InvestmentAssetRead, status_code=status.HTTP_201_CREATED)
async def create_asset(
    payload: InvestmentAssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = payload.model_dump(exclude={"initial_balance"})
    asset = InvestmentAsset(**data, user_id=current_user.id)
    db.add(asset)
    await db.flush()

    if payload.initial_balance is not None and payload.initial_balance > 0:
        reference_month = date.today().replace(day=1)
        db.add(InvestmentSnapshot(
            asset_id=asset.id,
            reference_month=reference_month,
            balance=payload.initial_balance,
            contribution=0,
        ))

    await db.commit()
    await db.refresh(asset)
    return asset


@router.post("/assets/bulk", response_model=list[InvestmentAssetRead], status_code=status.HTTP_201_CREATED)
async def bulk_create_assets(
    payload: InvestmentAssetBulkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    created: list[InvestmentAsset] = []
    reference_month = date.today().replace(day=1)

    for item in payload.items:
        data = item.model_dump(exclude={"initial_balance"})
        asset = InvestmentAsset(**data, user_id=current_user.id)
        db.add(asset)
        await db.flush()

        if item.initial_balance is not None and item.initial_balance > 0:
            db.add(InvestmentSnapshot(
                asset_id=asset.id,
                reference_month=reference_month,
                balance=item.initial_balance,
                contribution=0,
            ))
        created.append(asset)

    await db.commit()
    for asset in created:
        await db.refresh(asset)
    return created


@router.get("/assets", response_model=list[InvestmentAssetRead])
async def list_assets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(InvestmentAsset).where(InvestmentAsset.user_id ==
                                         current_user.id).order_by(InvestmentAsset.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.patch("/assets/{asset_id}", response_model=InvestmentAssetRead)
async def update_asset(
    asset_id: uuid.UUID,
    payload: InvestmentAssetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    asset = await _get_owned_asset(asset_id, current_user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(asset, field, value)
    await db.commit()
    await db.refresh(asset)
    return asset


@router.delete("/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    asset = await _get_owned_asset(asset_id, current_user, db)
    await db.delete(asset)
    await db.commit()

# --- APORTES (INVESTMENT CONTRIBUTIONS) ---


@router.post("/contributions", response_model=InvestmentContributionRead, status_code=status.HTTP_201_CREATED)
async def record_contribution(
    payload: InvestmentContributionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    asset = await _get_owned_asset(payload.asset_id, current_user, db)
    contribution = InvestmentContribution(**payload.model_dump())
    db.add(contribution)
    await db.commit()
    await db.refresh(contribution)
    return contribution


@router.get("/assets/{asset_id}/contributions", response_model=list[InvestmentContributionRead])
async def list_asset_contributions(
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_asset(asset_id, current_user, db)
    stmt = (
        select(InvestmentContribution)
        .where(InvestmentContribution.asset_id == asset_id)
        .order_by(InvestmentContribution.contribution_date.desc(), InvestmentContribution.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/contributions/total", response_model=ContributionsTotal)
async def get_contributions_total(
    reference_month: date = Query(..., description="Ex: 2026-10-01"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    month_start = reference_month.replace(day=1)
    if month_start.month == 12:
        month_end = month_start.replace(year=month_start.year + 1, month=1)
    else:
        month_end = month_start.replace(month=month_start.month + 1)

    stmt = (
        select(sa_func.coalesce(sa_func.sum(InvestmentContribution.amount), 0))
        .select_from(InvestmentContribution)
        .join(InvestmentAsset, InvestmentContribution.asset_id == InvestmentAsset.id)
        .where(
            InvestmentAsset.user_id == current_user.id,
            InvestmentContribution.contribution_date >= month_start,
            InvestmentContribution.contribution_date < month_end,
        )
    )
    result = await db.execute(stmt)
    total = result.scalar_one()
    return ContributionsTotal(total=total, reference_month=month_start)


@router.delete("/contributions/{contribution_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contribution(
    contribution_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(InvestmentContribution)
        .join(InvestmentAsset)
        .where(
            InvestmentContribution.id == contribution_id,
            InvestmentAsset.user_id == current_user.id
        )
    )
    result = await db.execute(stmt)
    contribution = result.scalar_one_or_none()
    if contribution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Aporte nao encontrado"
        )
    await db.delete(contribution)
    await db.commit()

# --- SNAPSHOTS MENSAIS ---


@router.post("/snapshots", response_model=InvestmentSnapshotRead, status_code=status.HTTP_201_CREATED)
async def create_or_update_snapshot(
    payload: InvestmentSnapshotCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    asset = await _get_owned_asset(payload.asset_id, current_user, db)
    return await save_or_update_snapshot(db, asset, payload)


@router.get("/assets/{asset_id}/snapshots", response_model=list[InvestmentSnapshotRead])
async def list_asset_snapshots(
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_asset(asset_id, current_user, db)
    stmt = (
        select(InvestmentSnapshot)
        .where(InvestmentSnapshot.asset_id == asset_id)
        .order_by(InvestmentSnapshot.reference_month.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

# --- RESUMO PATRIMONIAL CONSOLIDADO ---


@router.get("/summary", response_model=PortfolioSummaryRead)
async def get_portfolio_summary(
    reference_month: date = Query(
        default_factory=lambda: date.today().replace(day=1),
        description="Mes de referencia (ex: 2026-10-01)"
    ),
    base_currency: CurrencyCode = Query(default=CurrencyCode.EUR),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await calculate_portfolio_summary(
        db, current_user.id, reference_month, base_currency
    )
