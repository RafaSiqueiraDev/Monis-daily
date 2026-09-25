import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DailyExpenseBase(BaseModel):
    description: str = Field(min_length=1, max_length=150)
    amount: Decimal = Field(gt=0, decimal_places=2)
    category_id: Optional[uuid.UUID] = None
    expense_date: date = Field(default_factory=date.today)


class DailyExpenseCreate(DailyExpenseBase):
    pass


class DailyExpenseUpdate(BaseModel):
    description: Optional[str] = Field(
        default=None, min_length=1, max_length=150)
    amount: Optional[Decimal] = Field(default=None, gt=0, decimal_places=2)
    category_id: Optional[uuid.UUID] = None
    expense_date: Optional[date] = None


class DailyExpenseRead(DailyExpenseBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
