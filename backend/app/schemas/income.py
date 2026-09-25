import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class IncomeBase(BaseModel):
    description: str = Field(min_length=1, max_length=150)
    amount: Decimal = Field(gt=0, decimal_places=2)
    reference_month: date
    received: bool = False

    @field_validator("reference_month")
    @classmethod
    def normalize_to_first_day(cls, v: date) -> date:
        return v.replace(day=1)


class IncomeCreate(IncomeBase):
    pass


class IncomeUpdate(BaseModel):
    description: Optional[str] = Field(
        default=None, min_length=1, max_length=150)
    amount: Optional[Decimal] = Field(default=None, gt=0, decimal_places=2)
    reference_month: Optional[date] = None
    received: Optional[bool] = None


class IncomeRead(IncomeBase):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
