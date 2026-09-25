export type AssetCategory = "fixed_income" | "fund" | "stock" | "treasury" | "savings" | "other";
export type CurrencyCode = "EUR" | "BRL" | "USD" | "GBP" | "CHF";

export interface InvestmentAssetRead {
  id: string;
  name: string;
  category: AssetCategory;
  currency: CurrencyCode;
  created_at: string;
}

export interface InvestmentAssetCreate {
  name: string;
  category: AssetCategory;
  currency: CurrencyCode;
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

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  fixed_income: "Renda Fixa",
  fund: "Fundo",
  stock: "Ações",
  treasury: "Tesouro",
  savings: "Poupança",
  other: "Outro",
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  EUR: "Euro",
  BRL: "Real Brasileiro",
  USD: "Dólar Americano",
  GBP: "Libra Esterlina",
  CHF: "Franco Suíço",
};

export interface RegionInfo {
  flag: string;
  label: string;
}

export const REGION_BY_CURRENCY: Record<CurrencyCode, RegionInfo> = {
  EUR: { flag: "🇪🇺", label: "Europa" },
  BRL: { flag: "🇧🇷", label: "Brasil" },
  USD: { flag: "🇺🇸", label: "Estados Unidos" },
  GBP: { flag: "🇬🇧", label: "Reino Unido" },
  CHF: { flag: "🇨🇭", label: "Suíça" },
};

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ["EUR", "BRL", "USD", "GBP", "CHF"];

/** Moedas oferecidas como base de visualização consolidada — GBP e CHF
 * ficam de fora por defeito até confirmares que a API de câmbio do
 * backend as suporta; ajusta esta lista se já estiver confirmado. */
export const SELECTABLE_BASE_CURRENCIES: CurrencyCode[] = ["EUR", "BRL", "USD"];