import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import PaymentStatus


class BillInstanceUpdate(BaseModel):
    amount: Optional[Decimal] = Field(default=None, gt=0, decimal_places=2)
    status: Optional[PaymentStatus] = None


class BillInstanceRead(BaseModel):
    id: uuid.UUID
    recurring_bill_id: uuid.UUID
    reference_month: date
    amount: Decimal
    status: PaymentStatus
    paid_at: Optional[datetime] = None
    description: str
    due_day: int

    model_config = ConfigDict(from_attributes=True)
