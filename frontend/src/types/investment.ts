export type AssetCategory = "fixed_income" | "fund" | "stock" | "treasury" | "savings" | "other";
export type CurrencyCode = "EUR" | "BRL" | "USD" | "GBP" | "CHF";

export interface InvestmentAssetRead {
  id: string;
  name: string;
  category: AssetCategory;
  currency: CurrencyCode;
  institution: string | null;
  maturity_date: string | null;
  ticker: string | null;
  shares_quantity: number | null;
  average_price: number | null;
  created_at: string;
}

export interface InvestmentAssetCreate {
  name: string;
  category: AssetCategory;
  currency: CurrencyCode;
  institution?: string | null;
  maturity_date?: string | null;
  ticker?: string | null;
  shares_quantity?: number | string | null;
  average_price?: number | string | null;
  initial_balance?: number | string | null;
}

export interface InvestmentSnapshotRead {
  id: string;
  asset_id: string;
  reference_month: string;
  balance: number;
  contribution: number;
}

export interface InvestmentSnapshotCreate {
  asset_id: string;
  reference_month: string;
  balance: number;
  contribution?: number;
}

/** Espelha backend/app/schemas/investment.py → CurrencyGroupTotal */
export interface CurrencyGroupTotal {
  currency: CurrencyCode;
  total_balance: number;
  total_contributions: number;
}

/** Espelha backend/app/schemas/investment.py → AssetPositionRead */
export interface AssetPosition {
  asset_id: string;
  name: string;
  category: AssetCategory;
  currency: CurrencyCode;
  balance_native: number;
  contribution_native: number;
  balance_converted: number;
  portfolio_share_pct: number;
}

/** Espelha backend/app/schemas/investment.py → PortfolioSummaryRead */
export interface InvestmentSummary {
  reference_month: string;
  base_display_currency: CurrencyCode;
  totals_by_currency: CurrencyGroupTotal[];
  consolidated_balance: number;
  consolidated_contributions: number;
  exchange_rates: Record<string, number>;
  positions: AssetPosition[];
}

export interface InvestmentContributionRead {
  id: string;
  asset_id: string;
  amount: number;
  contribution_date: string;
  note: string | null;
  created_at: string;
}

export interface InvestmentContributionCreate {
  amount: number | string;
  contribution_date: string;
  note?: string | null;
}

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  fixed_income: "Renda Fixa",
  fund: "Fundo",
  stock: "Ações",
  treasury: "Tesouro",
  savings: "Poupança",
  other: "Outro",
};

export interface RegionInfo { flag: string; label: string; }

export const REGION_BY_CURRENCY: Record<CurrencyCode, RegionInfo> = {
  EUR: { flag: "🇪🇺", label: "Europa" },
  BRL: { flag: "🇧🇷", label: "Brasil" },
  USD: { flag: "🇺🇸", label: "Estados Unidos" },
  GBP: { flag: "🇬🇧", label: "Reino Unido" },
  CHF: { flag: "🇨🇭", label: "Suíça" },
};

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ["EUR", "BRL", "USD", "GBP", "CHF"];
export const SELECTABLE_BASE_CURRENCIES: CurrencyCode[] = ["EUR", "BRL", "USD"];