import uuid
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.bill import BillInstance, RecurringBill
from app.models.enums import PaymentStatus
from app.schemas.bill_instance import BillInstanceUpdate, BillInstanceRead

router = APIRouter(prefix="/bill-instances", tags=["Instancias de Contas"])


def _to_read_schema(instance: BillInstance) -> BillInstanceRead:
    return BillInstanceRead(
        id=instance.id,
        recurring_bill_id=instance.recurring_bill_id,
        reference_month=instance.reference_month,
        amount=instance.amount,
        status=instance.status,
        paid_at=instance.paid_at,
        description=instance.recurring_bill.description,
        due_day=instance.recurring_bill.due_day,
    )


@router.get("", response_model=list[BillInstanceRead])
async def list_bill_instances(
    reference_month: date | None = Query(
        default=None, description="Ex: 2026-10-01"),
    status_filter: PaymentStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(BillInstance)
        .join(RecurringBill)
        .where(RecurringBill.user_id == current_user.id)
        .options(selectinload(BillInstance.recurring_bill))
    )
    if reference_month is not None:
        stmt = stmt.where(BillInstance.reference_month ==
                          reference_month.replace(day=1))
    if status_filter is not None:
        stmt = stmt.where(BillInstance.status == status_filter)
    stmt = stmt.order_by(RecurringBill.due_day)
    result = await db.execute(stmt)
    instances = result.scalars().all()
    return [_to_read_schema(inst) for inst in instances]


async def _get_owned_instance(instance_id: uuid.UUID, current_user: User, db: AsyncSession) -> BillInstance:
    result = await db.execute(
        select(BillInstance)
        .join(RecurringBill)
        .where(BillInstance.id == instance_id, RecurringBill.user_id == current_user.id)
        .options(selectinload(BillInstance.recurring_bill))
    )
    instance = result.scalar_one_or_none()
    if instance is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Instancia nao encontrada")
    return instance


@router.get("/{instance_id}", response_model=BillInstanceRead)
async def get_bill_instance(
    instance_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    instance = await _get_owned_instance(instance_id, current_user, db)
    return _to_read_schema(instance)


@router.patch("/{instance_id}", response_model=BillInstanceRead)
async def update_bill_instance(
    instance_id: uuid.UUID,
    payload: BillInstanceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    instance = await _get_owned_instance(instance_id, current_user, db)
    update_data = payload.model_dump(exclude_unset=True)

    if "status" in update_data:
        if update_data["status"] == PaymentStatus.PAID and instance.status != PaymentStatus.PAID:
            instance.paid_at = datetime.now(timezone.utc)
        elif update_data["status"] == PaymentStatus.PENDING:
            instance.paid_at = None

    for field, value in update_data.items():
        setattr(instance, field, value)

    await db.commit()
    await db.refresh(instance, attribute_names=["status", "amount", "paid_at"])
    return _to_read_schema(instance)
