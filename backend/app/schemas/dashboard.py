from datetime import date
from decimal import Decimal
from pydantic import BaseModel


class DashboardSummaryRead(BaseModel):
    reference_month: date
    total_income: Decimal
    total_bills: Decimal
    total_bills_paid: Decimal
    total_bills_pending: Decimal
    total_card_invoices: Decimal
    total_daily_expenses: Decimal
    total_expenses: Decimal
    net_balance: Decimal
