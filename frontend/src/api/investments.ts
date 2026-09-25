import { apiClient } from "./client";
import type { InvestmentSummary } from "../types/investment";

export async function getInvestmentSummary(
  referenceMonth: string,
  baseCurrency: string = "EUR"
): Promise<InvestmentSummary> {
  const { data } = await apiClient.get<InvestmentSummary>("/investments/summary", {
    params: { reference_month: referenceMonth, base_currency: baseCurrency },
  });
  return data;
}