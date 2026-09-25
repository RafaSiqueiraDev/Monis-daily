export type PaymentStatus = "pending" | "paid";
export type BillType = "fixed" | "variable";

export interface RecurringBillRead {
  id: string;
  description: string;
  type: BillType;
  due_day: number;
  default_amount: number;
  category_id: string | null;
  active: boolean;
  active_until?: string | null;
  created_at: string;
}

export interface RecurringBillCreate {
  description: string;
  type: BillType;
  due_day: number;
  default_amount: number;
  category_id?: string | null;
  active_until?: string | null;
}

export interface RecurringBillUpdate {
  description?: string;
  due_day?: number;
  default_amount?: number;
  active?: boolean;
  active_until?: string | null;
}

export interface BillInstanceRead {
  id: string;
  recurring_bill_id: string;
  reference_month: string;
  amount: number;
  status: PaymentStatus;
  paid_at: string | null;
  description: string;
  due_day: number;
}

export interface GenerateMonthResult {
  reference_month: string;
  created_count: number;
  skipped_count: number;
  instances: BillInstanceRead[];
}