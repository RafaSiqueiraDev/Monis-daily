import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy import (
    String, Numeric, Date, DateTime, SmallInteger,
    ForeignKey, UniqueConstraint, CheckConstraint, func,
)
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.enums import PaymentStatus


class CreditCard(Base):
    __tablename__ = "credit_cards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    closing_day: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    due_day: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    credit_limit: Mapped[Optional[float]] = mapped_column(Numeric(12, 2))

    __table_args__ = (
        CheckConstraint("closing_day BETWEEN 1 AND 31",
                        name="ck_credit_cards_closing_day"),
        CheckConstraint("due_day BETWEEN 1 AND 31",
                        name="ck_credit_cards_due_day"),
    )

    user: Mapped["User"] = relationship(back_populates="credit_cards")
    invoices: Mapped[list["CardInvoice"]] = relationship(
        back_populates="credit_card", cascade="all, delete-orphan")
    purchases: Mapped[list["CardPurchase"]] = relationship(
        back_populates="credit_card", cascade="all, delete-orphan")


class CardInvoice(Base):
    __tablename__ = "card_invoices"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    credit_card_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(
        "credit_cards.id", ondelete="CASCADE"), nullable=False)
    reference_month: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        SqlEnum(PaymentStatus, name="payment_status"), default=PaymentStatus.PENDING, nullable=False
    )

    __table_args__ = (
        UniqueConstraint("credit_card_id", "reference_month",
                         name="uq_card_invoice_month"),
    )

    credit_card: Mapped["CreditCard"] = relationship(back_populates="invoices")
    installments: Mapped[list["CardInstallment"]] = relationship(
        back_populates="invoice", cascade="all, delete-orphan")


class CardPurchase(Base):
    __tablename__ = "card_purchases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    credit_card_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(
        "credit_cards.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"))
    description: Mapped[str] = mapped_column(String(150), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    installments_count: Mapped[int] = mapped_column(
        SmallInteger, default=1, nullable=False)
    purchase_date: Mapped[date] = mapped_column(
        Date, server_default=func.current_date())
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    credit_card: Mapped["CreditCard"] = relationship(
        back_populates="purchases")
    category: Mapped[Optional["Category"]] = relationship()
    installments: Mapped[list["CardInstallment"]] = relationship(
        back_populates="purchase", cascade="all, delete-orphan")


class CardInstallment(Base):
    __tablename__ = "card_installments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_purchase_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(
        "card_purchases.id", ondelete="CASCADE"), nullable=False)
    card_invoice_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(
        "card_invoices.id", ondelete="CASCADE"), nullable=False)
    installment_number: Mapped[int] = mapped_column(
        SmallInteger, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    purchase: Mapped["CardPurchase"] = relationship(
        back_populates="installments")
    invoice: Mapped["CardInvoice"] = relationship(
        back_populates="installments")
