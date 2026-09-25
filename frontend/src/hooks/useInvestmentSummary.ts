import { useQuery } from "@tanstack/react-query";
import { getInvestmentSummary } from "../api/investments";

export function useInvestmentSummary(referenceMonth: string, baseCurrency: string = "EUR") {
  return useQuery({
    queryKey: ["investment-summary", referenceMonth, baseCurrency],
    queryFn: () => getInvestmentSummary(referenceMonth, baseCurrency),
    retry: false,
  });
}