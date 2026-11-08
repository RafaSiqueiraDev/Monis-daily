import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.models.enums import AssetCategory, CurrencyCode
from app.services.market_data_service import normalize_ticker


def _clean_ticker(value: Optional[str]) -> Optional[str]:
    """'' -> None; ' petr4 ' -> 'PETR4.SA'. Só na escrita: valores antigos na BD não são revalidados."""
    if value is None or not value.strip():
        return None
    return normalize_ticker(value)  # ValueError -> 422 com a mensagem

# --- ATIVOS ---


class InvestmentAssetBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: AssetCategory
    currency: CurrencyCode
    institution: Optional[str] = Field(default=None, max_length=120)
    maturity_date: Optional[date] = None
    ticker: Optional[str] = Field(default=None, max_length=20)
    shares_quantity: Optional[Decimal] = Field(
        default=None, gt=0, decimal_places=6)
    average_price: Optional[Decimal] = Field(
        default=None, gt=0, decimal_places=4)


class InvestmentAssetCreate(InvestmentAssetBase):
    # Se preenchido, cria também um InvestmentSnapshot inicial com este saldo
    initial_balance: Optional[Decimal] = Field(
        default=None, ge=0, decimal_places=2)

    @field_validator("ticker")
    @classmethod
    def _normalize_ticker(cls, value: Optional[str]) -> Optional[str]:
        return _clean_ticker(value)


class InvestmentAssetUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    category: Optional[AssetCategory] = None
    currency: Optional[CurrencyCode] = None
    institution: Optional[str] = Field(default=None, max_length=120)
    maturity_date: Optional[date] = None
    ticker: Optional[str] = Field(default=None, max_length=20)
    shares_quantity: Optional[Decimal] = Field(
        default=None, gt=0, decimal_places=6)
    average_price: Optional[Decimal] = Field(
        default=None, gt=0, decimal_places=4)

    @field_validator("ticker")
    @classmethod
    def _normalize_ticker(cls, value: Optional[str]) -> Optional[str]:
        return _clean_ticker(value)


class InvestmentAssetRead(InvestmentAssetBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    # Cache L2 da cotação (moeda do provedor, que pode diferir da do ativo)
    last_price: Optional[Decimal] = None
    last_price_currency: Optional[str] = None
    last_price_at: Optional[datetime] = None

    # Campos calculados, na moeda do ativo. Ficam a None se faltar ticker,
    # quantidade ou cotação, ou se a moeda da cotação não for convertível.
    market_value: Optional[Decimal] = None
    cost_basis: Optional[Decimal] = None
    unrealized_pnl: Optional[Decimal] = None
    unrealized_pnl_pct: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def _compute_same_currency(self) -> "InvestmentAssetRead":
        # Caso comum (cotação na moeda do ativo): calcula logo, sem câmbio.
        # Moedas diferentes: o router chama apply_price() com o preço convertido.
        if self.last_price is not None and self.last_price_currency == self.currency.value:
            self.apply_price(self.last_price)
        return self

    def apply_price(self, price_in_asset_currency: Decimal) -> None:
        if not self.shares_quantity:
            return
        cents = Decimal("0.01")
        self.market_value = (self.shares_quantity * price_in_asset_currency).quantize(cents)
        if self.average_price:
            self.cost_basis = (self.shares_quantity * self.average_price).quantize(cents)
            self.unrealized_pnl = self.market_value - self.cost_basis
            if self.cost_basis > 0:
                self.unrealized_pnl_pct = (self.unrealized_pnl / self.cost_basis * 100).quantize(cents)


class InvestmentAssetBulkCreate(BaseModel):
    items: list[InvestmentAssetCreate] = Field(min_length=1, max_length=20)


class ContributionsTotal(BaseModel):
    total: Decimal
    reference_month: date


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


# --- COTAÇÕES DE MERCADO ---


class QuoteRead(BaseModel):
    symbol: str
    price: Decimal
    currency: str
    name: Optional[str] = None
    provider: str
    fetched_at: datetime
    previous_close: Optional[Decimal] = None
    day_change_pct: Optional[Decimal] = None


class QuoteSyncItem(BaseModel):
    asset_id: uuid.UUID
    ticker: str
    status: Literal["updated", "failed"]
    price: Optional[Decimal] = None
    currency: Optional[str] = None
    snapshot_updated: bool = False
    reason: Optional[str] = None


class QuoteSyncResult(BaseModel):
    synced_at: datetime
    reference_month: date
    updated_count: int
    failed_count: int
    items: list[QuoteSyncItem]
