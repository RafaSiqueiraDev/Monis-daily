import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.bill import Income
from app.schemas.income import IncomeCreate, IncomeUpdate, IncomeRead

router = APIRouter(prefix="/incomes", tags=["Receitas"])


@router.post("", response_model=IncomeRead, status_code=status.HTTP_201_CREATED)
async def create_income(
    payload: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    income = Income(**payload.model_dump(), user_id=current_user.id)
    db.add(income)
    await db.commit()
    await db.refresh(income)
    return income


@router.get("", response_model=list[IncomeRead])
async def list_incomes(
    reference_month: date | None = Query(
        default=None,
        description="Filtra por mes, ex: 2026-06-01. Se omitido, devolve todos os meses.",
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Income).where(Income.user_id == current_user.id)
    if reference_month is not None:
        stmt = stmt.where(Income.reference_month ==
                          reference_month.replace(day=1))
    stmt = stmt.order_by(Income.reference_month.desc(),
                         Income.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def _get_owned_income(income_id: uuid.UUID, current_user: User, db: AsyncSession) -> Income:
    result = await db.execute(
        select(Income).where(Income.id == income_id,
                             Income.user_id == current_user.id)
    )
    income = result.scalar_one_or_none()
    if income is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Receita nao encontrada")
    return income


@router.get("/{income_id}", response_model=IncomeRead)
async def get_income(
    income_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_owned_income(income_id, current_user, db)


@router.patch("/{income_id}", response_model=IncomeRead)
async def update_income(
    income_id: uuid.UUID,
    payload: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    income = await _get_owned_income(income_id, current_user, db)
    update_data = payload.model_dump(exclude_unset=True)
    if "reference_month" in update_data and update_data["reference_month"] is not None:
        update_data["reference_month"] = update_data["reference_month"].replace(
            day=1)
    for field, value in update_data.items():
        setattr(income, field, value)
    await db.commit()
    await db.refresh(income)
    return income


@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_income(
    income_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    income = await _get_owned_income(income_id, current_user, db)
    await db.delete(income)
    await db.commit()
