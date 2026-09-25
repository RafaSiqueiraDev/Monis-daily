import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    categories: Mapped[list["Category"]] = relationship(
        back_populates="user", cascade="all, delete-orphan")
    incomes: Mapped[list["Income"]] = relationship(
        back_populates="user", cascade="all, delete-orphan")
    recurring_bills: Mapped[list["RecurringBill"]] = relationship(
        back_populates="user", cascade="all, delete-orphan")
    daily_expenses: Mapped[list["DailyExpense"]] = relationship(
        back_populates="user", cascade="all, delete-orphan")
    credit_cards: Mapped[list["CreditCard"]] = relationship(
        back_populates="user", cascade="all, delete-orphan")
    investment_assets: Mapped[list["InvestmentAsset"]] = relationship(
        back_populates="user", cascade="all, delete-orphan")
