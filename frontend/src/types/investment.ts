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

export interface InvestmentSummary {
  reference_month: string;
  base_currency: string;
  consolidated_balance: number;
  totals_by_currency: Record<string, number>;
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