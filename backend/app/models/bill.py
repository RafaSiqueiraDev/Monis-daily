import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy import (
    String, Numeric, Date, DateTime, Boolean, SmallInteger,
    ForeignKey, UniqueConstraint, CheckConstraint, func,
)
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.enums import BillType, PaymentStatus


class Income(Base):
    __tablename__ = "incomes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description: Mapped[str] = mapped_column(String(150), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    reference_month: Mapped[date] = mapped_column(Date, nullable=False)
    received: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="incomes")


class RecurringBill(Base):
    __tablename__ = "recurring_bills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"))
    description: Mapped[str] = mapped_column(String(150), nullable=False)
    type: Mapped[BillType] = mapped_column(
        SqlEnum(BillType, name="bill_type"), nullable=False)
    due_day: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    default_amount: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # NULL = recorrente contínua (sem fim). Preenchido = deixa de gerar
    # instances para meses posteriores a este (inclusive o próprio mês).
    active_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("due_day BETWEEN 1 AND 31",
                        name="ck_recurring_bills_due_day"),
    )

    user: Mapped["User"] = relationship(back_populates="recurring_bills")
    category: Mapped[Optional["Category"]] = relationship()
    instances: Mapped[list["BillInstance"]] = relationship(
        back_populates="recurring_bill", cascade="all, delete-orphan")


class BillInstance(Base):
    __tablename__ = "bill_instances"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recurring_bill_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(
        "recurring_bills.id", ondelete="CASCADE"), nullable=False)
    reference_month: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        SqlEnum(PaymentStatus, name="payment_status"), default=PaymentStatus.PENDING, nullable=False
    )
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("recurring_bill_id", "reference_month",
                         name="uq_bill_instance_month"),
    )

    recurring_bill: Mapped["RecurringBill"] = relationship(
        back_populates="instances")


class DailyExpense(Base):
    __tablename__ = "daily_expenses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"))
    description: Mapped[str] = mapped_column(String(150), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    expense_date: Mapped[date] = mapped_column(
        Date, server_default=func.current_date())
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="daily_expenses")
    category: Mapped[Optional["Category"]] = relationship()
