import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.investment import InvestmentAsset, InvestmentSnapshot
from app.models.enums import CurrencyCode
from app.schemas.investment import (
    InvestmentAssetCreate,
    InvestmentAssetUpdate,
    InvestmentAssetRead,
    InvestmentSnapshotCreate,
    InvestmentSnapshotRead,
    PortfolioSummaryRead,
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
    asset = InvestmentAsset(**payload.model_dump(), user_id=current_user.id)
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


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
