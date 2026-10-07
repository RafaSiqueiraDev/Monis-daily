import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class InvestmentContributionCreate(BaseModel):
    amount: Decimal = Field(gt=0, decimal_places=2)
    contribution_date: date = Field(default_factory=date.today)
    note: Optional[str] = Field(default=None, max_length=200)


class InvestmentContributionRead(BaseModel):
    id: uuid.UUID
    asset_id: uuid.UUID
    amount: Decimal
    contribution_date: date
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
