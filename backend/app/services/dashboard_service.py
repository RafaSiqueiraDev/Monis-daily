import calendar
import uuid
from datetime import date
from decimal import Decimal
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bill import Income, RecurringBill, BillInstance, DailyExpense
from app.models.credit_card import CreditCard, CardInvoice, CardInstallment
from app.models.enums import PaymentStatus
from app.schemas.dashboard import DashboardSummaryRead


async def get_month_summary(
    db: AsyncSession,
    user_id: uuid.UUID,
    reference_month: date,
) -> DashboardSummaryRead:
    ref_first = reference_month.replace(day=1)

    # Descobre o último dia do mês para o intervalo de despesas diárias
    _, last_day = calendar.monthrange(ref_first.year, ref_first.month)
    month_start = ref_first
    month_end = date(ref_first.year, ref_first.month, last_day)

    # 1. Total de Receitas (Incomes)
    income_stmt = select(
        func.coalesce(func.sum(Income.amount), Decimal("0.00"))
    ).where(
        Income.user_id == user_id,
        Income.reference_month == ref_first,
    )
    total_income: Decimal = (await db.execute(income_stmt)).scalar_one()

    # 2. Contas Fixas/Variáveis (Bill Instances) - Total, Pagas e Pendentes
    bills_base = (
        select(
            func.coalesce(func.sum(BillInstance.amount), Decimal("0.00"))
        )
        .join(RecurringBill)
        .where(
            RecurringBill.user_id == user_id,
            BillInstance.reference_month == ref_first,
        )
    )
    total_bills: Decimal = (await db.execute(bills_base)).scalar_one()

    paid_bills_stmt = bills_base.where(
        BillInstance.status == PaymentStatus.PAID)
    total_bills_paid: Decimal = (await db.execute(paid_bills_stmt)).scalar_one()

    pending_bills_stmt = bills_base.where(
        BillInstance.status == PaymentStatus.PENDING)
    total_bills_pending: Decimal = (await db.execute(pending_bills_stmt)).scalar_one()

    # 3. Faturas de Cartão de Crédito (Soma das parcelas que caem nas faturas deste mês)
    card_stmt = (
        select(
            func.coalesce(func.sum(CardInstallment.amount), Decimal("0.00"))
        )
        .join(CardInvoice, CardInstallment.card_invoice_id == CardInvoice.id)
        .join(CreditCard, CardInvoice.credit_card_id == CreditCard.id)
        .where(
            CreditCard.user_id == user_id,
            CardInvoice.reference_month == ref_first,
        )
    )
    total_card_invoices: Decimal = (await db.execute(card_stmt)).scalar_one()

    # 4. Despesas Diárias (Extras)
    daily_stmt = select(
        func.coalesce(func.sum(DailyExpense.amount), Decimal("0.00"))
    ).where(
        DailyExpense.user_id == user_id,
        DailyExpense.expense_date >= month_start,
        DailyExpense.expense_date <= month_end,
    )
    total_daily_expenses: Decimal = (await db.execute(daily_stmt)).scalar_one()

    # 5. Totais e Balanço
    total_expenses = total_bills + total_card_invoices + total_daily_expenses
    net_balance = total_income - total_expenses

    return DashboardSummaryRead(
        reference_month=ref_first,
        total_income=total_income,
        total_bills=total_bills,
        total_bills_paid=total_bills_paid,
        total_bills_pending=total_bills_pending,
        total_card_invoices=total_card_invoices,
        total_daily_expenses=total_daily_expenses,
        total_expenses=total_expenses,
        net_balance=net_balance,
    )
