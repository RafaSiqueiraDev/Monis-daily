export type InvoiceStatus = "pending" | "paid";

export interface CreditCardRead {
  id: string;
  name: string;
  closing_day: number;
  due_day: number;
  credit_limit: number | null;
}

export interface CreditCardCreate {
  name: string;
  closing_day: number;
  due_day: number;
  credit_limit?: number | null;
}

export interface CardInstallmentRead {
  id: string;
  card_purchase_id: string;
  card_invoice_id: string;
  installment_number: number;
  amount: number;
  // campos "achatados" da compra original — mesmo padrão do BillInstanceRead
  description: string;
  installments_count: number;
  purchase_date: string;
}

export interface CardInvoiceRead {
  id: string;
  credit_card_id: string;
  reference_month: string;
  status: InvoiceStatus;
  total_amount: number;
  installments: CardInstallmentRead[];
}

export interface CardPurchaseCreate {
  credit_card_id: string;
  category_id?: string | null;
  description: string;
  total_amount: number;
  installments_count: number;
  purchase_date: string;
}

export interface CardPurchaseRead {
  id: string;
  credit_card_id: string;
  category_id: string | null;
  description: string;
  total_amount: number;
  installments_count: number;
  purchase_date: string;
}