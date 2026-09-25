export interface DailyExpenseRead {
  id: string;
  description: string;
  amount: number;
  category_id: string | null;
  expense_date: string;
  created_at: string;
}

export interface DailyExpenseCreate {
  description: string;
  amount: number;
  category_id?: string | null;
  expense_date?: string;
}
export interface DailyExpenseTotal {
  total: number;
  date_from: string | null;
  date_to: string | null;
}