import { apiClient } from "./client";
import type { CardInvoiceRead, InvoiceStatus } from "../types/creditCard";

export async function getCardInvoice(
  creditCardId: string,
  referenceMonth: string
): Promise<CardInvoiceRead | null> {
  const { data } = await apiClient.get<CardInvoiceRead | CardInvoiceRead[] | null>(
    `/credit-cards/${creditCardId}/invoices`,
    { params: { reference_month: referenceMonth } }
  );
  // normaliza: se o backend devolver uma lista (ex: array vazio quando
  // não há fatura), usamos o primeiro elemento ou null
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

export async function updateCardInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
): Promise<CardInvoiceRead> {
  const { data } = await apiClient.patch<CardInvoiceRead>(`/credit-cards/invoices/${invoiceId}`, { status });
  return data;
}