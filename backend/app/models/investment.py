import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import String, Numeric, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import AssetCategory, CurrencyCode


class InvestmentAsset(Base):
    __tablename__ = "investment_assets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[AssetCategory] = mapped_column(
        SqlEnum(AssetCategory, name="asset_category"), nullable=False)
    currency: Mapped[CurrencyCode] = mapped_column(
        SqlEnum(CurrencyCode, name="currency_code"), nullable=False)
    institution: Mapped[Optional[str]] = mapped_column(
        String(120), nullable=True)
    maturity_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    ticker: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    shares_quantity: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(18, 6), nullable=True)
    average_price: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(14, 4), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="investment_assets")
    snapshots: Mapped[list["InvestmentSnapshot"]] = relationship(
        back_populates="asset", cascade="all, delete-orphan")
    contributions: Mapped[list["InvestmentContribution"]] = relationship(
        back_populates="asset", cascade="all, delete-orphan")


class InvestmentSnapshot(Base):
    __tablename__ = "investment_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(
        "investment_assets.id", ondelete="CASCADE"), nullable=False)
    reference_month: Mapped[date] = mapped_column(Date, nullable=False)
    balance: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    contribution: Mapped[float] = mapped_column(Numeric(14, 2), default=0)

    __table_args__ = (
        UniqueConstraint("asset_id", "reference_month",
                         name="uq_investment_snapshot_month"),
    )

    asset: Mapped["InvestmentAsset"] = relationship(back_populates="snapshots")


class InvestmentContribution(Base):
    __tablename__ = "investment_contributions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(
        "investment_assets.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    contribution_date: Mapped[date] = mapped_column(
        Date, nullable=False, server_default=func.current_date())
    note: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    asset: Mapped["InvestmentAsset"] = relationship(
        back_populates="contributions")
