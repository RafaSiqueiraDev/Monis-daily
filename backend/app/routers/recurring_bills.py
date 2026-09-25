import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.bill import RecurringBill
from app.schemas.recurring_bill import (
    RecurringBillCreate,
    RecurringBillUpdate,
    RecurringBillRead,
    GenerateMonthResult,
)
from app.schemas.bill_instance import BillInstanceRead
from app.services.bill_service import generate_month_instances

router = APIRouter(prefix="/recurring-bills",
                   tags=["Contas Fixas e Variaveis"])


@router.post("", response_model=RecurringBillRead, status_code=status.HTTP_201_CREATED)
async def create_recurring_bill(
    payload: RecurringBillCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bill = RecurringBill(**payload.model_dump(), user_id=current_user.id)
    db.add(bill)
    await db.commit()
    await db.refresh(bill)
    return bill


@router.get("", response_model=list[RecurringBillRead])
async def list_recurring_bills(
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(RecurringBill).where(
        RecurringBill.user_id == current_user.id)
    if active_only:
        stmt = stmt.where(RecurringBill.active.is_(True))
    stmt = stmt.order_by(RecurringBill.due_day)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/generate-month/{reference_month}", response_model=GenerateMonthResult)
async def generate_month(
    reference_month: date,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    new_instances, skipped_count = await generate_month_instances(
        db=db, user_id=current_user.id, reference_month=reference_month
    )

    instances_read = [
        BillInstanceRead(
            id=inst.id,
            recurring_bill_id=inst.recurring_bill_id,
            reference_month=inst.reference_month,
            amount=inst.amount,
            status=inst.status,
            paid_at=inst.paid_at,
            description=inst.recurring_bill.description,
            due_day=inst.recurring_bill.due_day,
        )
        for inst in new_instances
    ]

    return GenerateMonthResult(
        reference_month=reference_month.replace(day=1),
        created_count=len(new_instances),
        skipped_count=skipped_count,
        instances=instances_read,
    )


async def _get_owned_recurring_bill(bill_id: uuid.UUID, current_user: User, db: AsyncSession) -> RecurringBill:
    result = await db.execute(
        select(RecurringBill).where(RecurringBill.id == bill_id,
                                    RecurringBill.user_id == current_user.id)
    )
    bill = result.scalar_one_or_none()
    if bill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Conta recorrente nao encontrada")
    return bill


@router.get("/{bill_id}", response_model=RecurringBillRead)
async def get_recurring_bill(
    bill_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_owned_recurring_bill(bill_id, current_user, db)


@router.patch("/{bill_id}", response_model=RecurringBillRead)
async def update_recurring_bill(
    bill_id: uuid.UUID,
    payload: RecurringBillUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bill = await _get_owned_recurring_bill(bill_id, current_user, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bill, field, value)
    await db.commit()
    await db.refresh(bill)
    return bill


@router.delete("/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring_bill(
    bill_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    bill = await _get_owned_recurring_bill(bill_id, current_user, db)
    await db.delete(bill)
    await db.commit()
