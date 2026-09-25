import enum


class CategoryKind(str, enum.Enum):
    INCOME = "income"
    FIXED = "fixed"
    VARIABLE = "variable"
    DAILY = "daily"
    INVESTMENT = "investment"


class BillType(str, enum.Enum):
    FIXED = "fixed"
    VARIABLE = "variable"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"


class AssetCategory(str, enum.Enum):
    FIXED_INCOME = "fixed_income"
    FUND = "fund"
    STOCK = "stock"
    TREASURY = "treasury"
    SAVINGS = "savings"
    OTHER = "other"


class CurrencyCode(str, enum.Enum):
    EUR = "EUR"
    BRL = "BRL"
    USD = "USD"
    GBP = "GBP"
    CHF = "CHF"
