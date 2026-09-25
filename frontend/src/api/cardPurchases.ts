import { apiClient } from "./client";
import type { CardPurchaseCreate, CardPurchaseRead } from "../types/creditCard";

export async function createCardPurchase(payload: CardPurchaseCreate): Promise<CardPurchaseRead> {
  const { data } = await apiClient.post<CardPurchaseRead>("/credit-cards/purchases", payload);
  return data;
}