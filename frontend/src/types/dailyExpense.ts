import type { CountryCode } from "./country";
import type { CurrencyCode } from "./investment";

export interface DailyExpenseRead {
  id: string;
  description: string;
  amount: number;
  category_id: string | null;
  expense_date: string;
  country: CountryCode;
  currency: CurrencyCode;
  created_at: string;
}

export interface DailyExpenseCreate {
  description: string;
  amount: number;
  category_id?: string | null;
  expense_date?: string;
  country?: CountryCode;
  currency?: CurrencyCode;
}
export interface DailyExpenseTotal {
  total: number;
  date_from: string | null;
  date_to: string | null;
}