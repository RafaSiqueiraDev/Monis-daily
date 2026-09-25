import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import PaymentStatus

# --- CARTÕES ---


class CreditCardBase(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    closing_day: int = Field(ge=1, le=31)
    due_day: int = Field(ge=1, le=31)
    credit_limit: Optional[Decimal] = Field(
        default=None, gt=0, decimal_places=2)


class CreditCardCreate(CreditCardBase):
    pass


class CreditCardUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    closing_day: Optional[int] = Field(default=None, ge=1, le=31)
    due_day: Optional[int] = Field(default=None, ge=1, le=31)
    credit_limit: Optional[Decimal] = Field(
        default=None, gt=0, decimal_places=2)


class CreditCardRead(CreditCardBase):
    id: uuid.UUID
    user_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)

# --- PARCELAS ---


class CardInstallmentRead(BaseModel):
    id: uuid.UUID
    installment_number: int
    amount: Decimal
    description: str
    purchase_date: date
    category_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)

# --- FATURAS ---


class CardInvoiceRead(BaseModel):
    id: uuid.UUID
    credit_card_id: uuid.UUID
    reference_month: date
    status: PaymentStatus
    total_amount: Decimal
    installments: list[CardInstallmentRead] = []

    model_config = ConfigDict(from_attributes=True)


class CardInvoiceUpdate(BaseModel):
    status: Optional[PaymentStatus] = None

# --- COMPRAS ---


class CardPurchaseCreate(BaseModel):
    credit_card_id: uuid.UUID
    description: str = Field(min_length=1, max_length=150)
    total_amount: Decimal = Field(gt=0, decimal_places=2)
    installments_count: int = Field(default=1, ge=1, le=48)
    purchase_date: date = Field(default_factory=date.today)
    category_id: Optional[uuid.UUID] = None


class CardPurchaseRead(BaseModel):
    id: uuid.UUID
    credit_card_id: uuid.UUID
    description: str
    total_amount: Decimal
    installments_count: int
    purchase_date: date
    category_id: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
