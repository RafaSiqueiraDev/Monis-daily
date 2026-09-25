import uuid
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.credit_card import CreditCard, CardInvoice, CardPurchase, CardInstallment
from app.schemas.credit_card import (
    CreditCardCreate,
    CreditCardUpdate,
    CreditCardRead,
    CardPurchaseCreate,
    CardPurchaseRead,
    CardInvoiceRead,
    CardInvoiceUpdate,
    CardInstallmentRead,
)
from app.services.installment_service import create_purchase_with_installments

router = APIRouter(prefix="/credit-cards", tags=["Cartoes de Credito"])


async def _get_owned_card(card_id: uuid.UUID, current_user: User, db: AsyncSession) -> CreditCard:
    result = await db.execute(
        select(CreditCard).where(CreditCard.id == card_id,
                                 CreditCard.user_id == current_user.id)
    )
    card = result.scalar_one_or_none()
    if card is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cartao nao encontrado")
    return card


@router.post("", response_model=CreditCardRead, status_code=status.HTTP_201_CREATED)
async def create_card(
    payload: CreditCardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    card = CreditCard(**payload.model_dump(), user_id=current_user.id)
    db.add(card)
    await db.commit()
    await db.refresh(card)
    return card


@router.get("", response_model=list[CreditCardRead])
async def list_cards(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CreditCard).where(CreditCard.user_id ==
                                    current_user.id).order_by(CreditCard.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{card_id}", response_model=CreditCardRead)
async def get_card(
    card_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_owned_card(card_id, current_user, db)


@router.patch("/{card_id}", response_model=CreditCardRead)
async def update_card(
    card_id: uuid.UUID,
    payload: CreditCardUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    card = await _get_owned_card(card_id, current_user, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(card, field, value)
    await db.commit()
    await db.refresh(card)
    return card


@router.post("/purchases", response_model=CardPurchaseRead, status_code=status.HTTP_201_CREATED)
async def record_purchase(
    payload: CardPurchaseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    card = await _get_owned_card(payload.credit_card_id, current_user, db)
    return await create_purchase_with_installments(db, card, payload)


@router.get("/{card_id}/invoices", response_model=list[CardInvoiceRead])
async def list_card_invoices(
    card_id: uuid.UUID,
    reference_month: date | None = Query(
        default=None, description="Ex: 2026-10-01"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_card(card_id, current_user, db)

    stmt = (
        select(CardInvoice)
        .where(CardInvoice.credit_card_id == card_id)
        .options(
            selectinload(CardInvoice.installments).selectinload(
                CardInstallment.purchase)
        )
        .order_by(CardInvoice.reference_month.desc())
    )
    if reference_month is not None:
        stmt = stmt.where(CardInvoice.reference_month ==
                          reference_month.replace(day=1))

    result = await db.execute(stmt)
    invoices = result.scalars().all()

    response_list = []
    for inv in invoices:
        inst_reads = [
            CardInstallmentRead(
                id=inst.id,
                installment_number=inst.installment_number,
                amount=inst.amount,
                description=inst.purchase.description,
                purchase_date=inst.purchase.purchase_date,
                category_id=inst.purchase.category_id,
            )
            for inst in inv.installments
        ]
        total_sum = sum(
            (inst.amount for inst in inv.installments), Decimal("0.00"))
        response_list.append(
            CardInvoiceRead(
                id=inv.id,
                credit_card_id=inv.credit_card_id,
                reference_month=inv.reference_month,
                status=inv.status,
                total_amount=total_sum,
                installments=inst_reads,
            )
        )
    return response_list


@router.patch("/invoices/{invoice_id}", response_model=dict)
async def update_invoice_status(
    invoice_id: uuid.UUID,
    payload: CardInvoiceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(CardInvoice)
        .join(CreditCard)
        .where(CardInvoice.id == invoice_id, CreditCard.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()
    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Fatura nao encontrada")

    if payload.status is not None:
        invoice.status = payload.status
        await db.commit()

    return {"status": "ok", "invoice_id": invoice_id, "new_status": invoice.status}
