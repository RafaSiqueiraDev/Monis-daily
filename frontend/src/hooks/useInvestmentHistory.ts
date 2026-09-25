import { useQueries } from "@tanstack/react-query";
import { format, startOfMonth, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { getInvestmentSummary } from "../api/investments";

export interface InvestmentHistoryPoint {
  month: string;
  label: string;
  balance: number;
}

export function useInvestmentHistory(monthsCount: number = 6, baseCurrency: string = "EUR") {
  const months = Array.from({ length: monthsCount }, (_, i) =>
    startOfMonth(subMonths(new Date(), monthsCount - 1 - i))
  );

  const results = useQueries({
    queries: months.map((month) => {
      const monthStr = format(month, "yyyy-MM-dd");
      return {
        queryKey: ["investment-summary", monthStr, baseCurrency],
        queryFn: () => getInvestmentSummary(monthStr, baseCurrency),
        retry: false as const,
      };
    }),
  });

  const isLoading = results.some((r) => r.isLoading);

  const data: InvestmentHistoryPoint[] = months.map((month, index) => {
    const summary = results[index]?.data;
    return {
      month: format(month, "yyyy-MM-dd"),
      label: format(month, "MMM", { locale: pt }),
      balance: Number(summary?.consolidated_balance ?? 0),
    };
  });

  return { data, isLoading };
}