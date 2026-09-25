import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import BillType


class RecurringBillBase(BaseModel):
    description: str = Field(min_length=1, max_length=150)
    type: BillType
    due_day: int = Field(ge=1, le=31)
    default_amount: Decimal = Field(gt=0, decimal_places=2)
    category_id: Optional[uuid.UUID] = None


class RecurringBillCreate(RecurringBillBase):
    pass


class RecurringBillUpdate(BaseModel):
    description: Optional[str] = Field(
        default=None, min_length=1, max_length=150)
    type: Optional[BillType] = None
    due_day: Optional[int] = Field(default=None, ge=1, le=31)
    default_amount: Optional[Decimal] = Field(
        default=None, gt=0, decimal_places=2)
    category_id: Optional[uuid.UUID] = None
    active: Optional[bool] = None


class RecurringBillRead(RecurringBillBase):
    id: uuid.UUID
    active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GenerateMonthResult(BaseModel):
    reference_month: date
    created_count: int
    skipped_count: int
    instances: list["BillInstanceRead"]


from app.schemas.bill_instance import BillInstanceRead  # noqa: E402
GenerateMonthResult.model_rebuild()
