from datetime import date
from decimal import Decimal, ROUND_DOWN
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.credit_card import CreditCard, CardInvoice, CardPurchase, CardInstallment
from app.schemas.credit_card import CardPurchaseCreate


def _add_months(source_date: date, months: int) -> date:
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    return date(year, month, 1)


async def _get_or_create_invoice(
    db: AsyncSession,
    card: CreditCard,
    reference_month: date,
) -> CardInvoice:
    ref_first = reference_month.replace(day=1)
    stmt = select(CardInvoice).where(
        CardInvoice.credit_card_id == card.id,
        CardInvoice.reference_month == ref_first,
    )
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()

    if invoice is None:
        invoice = CardInvoice(
            credit_card_id=card.id,
            reference_month=ref_first,
        )
        db.add(invoice)
        await db.flush()

    return invoice


async def create_purchase_with_installments(
    db: AsyncSession,
    card: CreditCard,
    payload: CardPurchaseCreate,
) -> CardPurchase:
    purchase = CardPurchase(
        credit_card_id=card.id,
        category_id=payload.category_id,
        description=payload.description,
        total_amount=payload.total_amount,
        installments_count=payload.installments_count,
        purchase_date=payload.purchase_date,
    )
    db.add(purchase)
    await db.flush()

    # Regra de fecho: após closing_day entra na fatura do mês seguinte
    if payload.purchase_date.day > card.closing_day:
        first_invoice_month = _add_months(
            payload.purchase_date.replace(day=1), 1)
    else:
        first_invoice_month = payload.purchase_date.replace(day=1)

    # Divisão sem perda de cêntimos
    total = payload.total_amount
    n = payload.installments_count
    base_amount = (total / n).quantize(Decimal("0.01"), rounding=ROUND_DOWN)
    remainder = total - (base_amount * n)

    for i in range(1, n + 1):
        target_month = _add_months(first_invoice_month, i - 1)
        invoice = await _get_or_create_invoice(db, card, target_month)
        installment_amount = base_amount + \
            (remainder if i == 1 else Decimal("0.00"))

        installment = CardInstallment(
            card_purchase_id=purchase.id,
            card_invoice_id=invoice.id,
            installment_number=i,
            amount=installment_amount,
        )
        db.add(installment)

    await db.commit()
    await db.refresh(purchase)
    return purchase
