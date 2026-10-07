import { apiClient } from "./client";
import type { CreditCardRead, CreditCardCreate } from "../types/creditCard";

export async function listCreditCards(country?: string): Promise<CreditCardRead[]> {
  const { data } = await apiClient.get<CreditCardRead[]>("/credit-cards", {
    params: country ? { country } : undefined,
  });
  return data;
}

export async function createCreditCard(payload: CreditCardCreate): Promise<CreditCardRead> {
  const { data } = await apiClient.post<CreditCardRead>("/credit-cards", payload);
  return data;
}