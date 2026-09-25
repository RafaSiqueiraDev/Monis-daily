import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import AssetCategory, CurrencyCode

# --- ATIVOS ---


class InvestmentAssetBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: AssetCategory
    currency: CurrencyCode


class InvestmentAssetCreate(InvestmentAssetBase):
    pass


class InvestmentAssetUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    category: Optional[AssetCategory] = None
    currency: Optional[CurrencyCode] = None


class InvestmentAssetRead(InvestmentAssetBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- SNAPSHOTS MENSAIS ---


class InvestmentSnapshotBase(BaseModel):
    reference_month: date
    balance: Decimal = Field(ge=0, decimal_places=2)
    contribution: Decimal = Field(default=Decimal("0.00"), decimal_places=2)


class InvestmentSnapshotCreate(InvestmentSnapshotBase):
    asset_id: uuid.UUID


class InvestmentSnapshotRead(InvestmentSnapshotBase):
    id: uuid.UUID
    asset_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- ESTRUTURA MULTI-MOEDA E CONSOLIDAÇÃO ---


class CurrencyGroupTotal(BaseModel):
    currency: CurrencyCode
    total_balance: Decimal
    total_contributions: Decimal


class AssetPositionRead(BaseModel):
    asset_id: uuid.UUID
    name: str
    category: AssetCategory
    currency: CurrencyCode
    balance_native: Decimal
    contribution_native: Decimal
    balance_converted: Decimal
    portfolio_share_pct: Decimal  # Peso percentual do ativo no património global


class PortfolioSummaryRead(BaseModel):
    reference_month: date
    base_display_currency: CurrencyCode

    # 1. Totais separados e puros por cada moeda
    totals_by_currency: list[CurrencyGroupTotal]

    # 2. Património consolidado na moeda de escolha
    consolidated_balance: Decimal
    consolidated_contributions: Decimal

    # 3. Taxas de câmbio utilizadas na conversão
    exchange_rates: dict[str, Decimal]

    # 4. Detalhe individual dos ativos
    positions: list[AssetPositionRead]
