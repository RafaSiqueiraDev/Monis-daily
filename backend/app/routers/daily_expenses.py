import uuid
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.bill import DailyExpense
from app.schemas.daily_expense import DailyExpenseCreate, DailyExpenseUpdate, DailyExpenseRead

router = APIRouter(prefix="/daily-expenses", tags=["Despesas Diarias"])


@router.post("", response_model=DailyExpenseRead, status_code=status.HTTP_201_CREATED)
async def create_daily_expense(
    payload: DailyExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expense = DailyExpense(**payload.model_dump(), user_id=current_user.id)
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.get("", response_model=list[DailyExpenseRead])
async def list_daily_expenses(
    date_from: date | None = Query(
        default=None, description="Filtra a partir desta data (inclusive)"),
    date_to: date | None = Query(
        default=None, description="Filtra ate esta data (inclusive)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(DailyExpense).where(DailyExpense.user_id == current_user.id)
    if date_from is not None:
        stmt = stmt.where(DailyExpense.expense_date >= date_from)
    if date_to is not None:
        stmt = stmt.where(DailyExpense.expense_date <= date_to)
    stmt = stmt.order_by(DailyExpense.expense_date.desc(),
                         DailyExpense.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/total")
async def get_daily_expenses_total(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    stmt = select(func.coalesce(func.sum(DailyExpense.amount), 0)).where(
        DailyExpense.user_id == current_user.id
    )
    if date_from is not None:
        stmt = stmt.where(DailyExpense.expense_date >= date_from)
    if date_to is not None:
        stmt = stmt.where(DailyExpense.expense_date <= date_to)
    result = await db.execute(stmt)
    total: Decimal = result.scalar_one()
    return {"total": total, "date_from": date_from, "date_to": date_to}


async def _get_owned_expense(expense_id: uuid.UUID, current_user: User, db: AsyncSession) -> DailyExpense:
    result = await db.execute(
        select(DailyExpense).where(DailyExpense.id == expense_id,
                                   DailyExpense.user_id == current_user.id)
    )
    expense = result.scalar_one_or_none()
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Despesa nao encontrada")
    return expense


@router.get("/{expense_id}", response_model=DailyExpenseRead)
async def get_daily_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_owned_expense(expense_id, current_user, db)


@router.patch("/{expense_id}", response_model=DailyExpenseRead)
async def update_daily_expense(
    expense_id: uuid.UUID,
    payload: DailyExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expense = await _get_owned_expense(expense_id, current_user, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_daily_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expense = await _get_owned_expense(expense_id, current_user, db)
    await db.delete(expense)
    await db.commit()
