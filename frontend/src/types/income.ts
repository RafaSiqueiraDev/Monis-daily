export interface IncomeRead {
  id: string;
  description: string;
  amount: number;
  reference_month: string;
  received: boolean;
  created_at: string;
}

export interface IncomeCreate {
  description: string;
  amount: number;
  reference_month: string;
  received?: boolean;
}

export interface IncomeUpdate {
  received?: boolean;
}

