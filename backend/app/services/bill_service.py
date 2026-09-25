import uuid
from datetime import date
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.bill import RecurringBill, BillInstance
from sqlalchemy import select, or_


async def generate_month_instances(
    db: AsyncSession,
    user_id: uuid.UUID,
    reference_month: date,
) -> tuple[list[BillInstance], int]:
    reference_month = reference_month.replace(day=1)

    # 1. Todas as recurring_bills ativas do utilizador
    active_bills_result = await db.execute(
        select(RecurringBill).where(
            RecurringBill.user_id == user_id,
            RecurringBill.active.is_(True),
            or_(
                RecurringBill.active_until.is_(None),
                RecurringBill.active_until >= reference_month,
            ),
        )
    )
    active_bills = active_bills_result.scalars().all()

    if not active_bills:
        return [], 0

    # 2. Instances ja existentes para este mes
    bill_ids = [bill.id for bill in active_bills]
    existing_result = await db.execute(
        select(BillInstance.recurring_bill_id).where(
            BillInstance.recurring_bill_id.in_(bill_ids),
            BillInstance.reference_month == reference_month,
        )
    )
    existing_bill_ids = set(existing_result.scalars().all())

    # 3. Cria apenas as instances que faltam
    new_instances: list[BillInstance] = []
    skipped_count = 0

    for bill in active_bills:
        if bill.id in existing_bill_ids:
            skipped_count += 1
            continue

        instance = BillInstance(
            recurring_bill_id=bill.id,
            reference_month=reference_month,
            amount=bill.default_amount,
        )
        # Atribui o objeto em memoria para evitar consulta lazy posterior
        instance.recurring_bill = bill
        db.add(instance)
        new_instances.append(instance)

    await db.commit()

    for instance in new_instances:
        await db.refresh(instance, attribute_names=["id", "created_at"])

    return new_instances, skipped_count
