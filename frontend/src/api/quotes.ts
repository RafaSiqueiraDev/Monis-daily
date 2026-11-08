import { apiClient } from "./client";
import type { QuoteRead, QuoteSyncResult } from "../types/investment";

/** Atualiza as cotações de todos os ativos com ticker (e o snapshot do mês). */
export async function syncQuotes(): Promise<QuoteSyncResult> {
  const { data } = await apiClient.post<QuoteSyncResult>("/investments/quotes/sync");
  return data;
}

/** Valida um ticker e devolve a cotação atual. 404 = ticker não encontrado. */
export async function lookupQuote(ticker: string): Promise<QuoteRead> {
  const { data } = await apiClient.get<QuoteRead>("/investments/quotes/lookup", { params: { ticker } });
  return data;
}
