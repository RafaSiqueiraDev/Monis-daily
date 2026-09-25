import { useQueries } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { getDashboardSummary } from "../api/dashboard";
import { getDailyExpensesTotal } from "../api/dailyExpenses";

export interface MonthlyTrendPoint {
  month: string;
  label: string;
  income: number;
  expenses: number;
}

/**
 * Agrega, para os últimos `monthsCount` meses, Receitas (total_income) e
 * Despesas Totais. "Despesas Totais" aqui = total_bills + total_card_invoices
 * (já vêm do /dashboard/summary) + o total de gastos extras/diários (que o
 * summary NÃO inclui, como já confirmámos anteriormente) — por isso corremos
 * um segundo conjunto de queries a /daily-expenses/total e somamos no cliente.
 *
 * As queryKeys usadas são exatamente as mesmas de useDashboardSummary e
 * useDailyExpensesTotal, por isso este hook partilha cache com o resto da
 * app em vez de duplicar pedidos à API.
 */
export function useMonthlyTrends(monthsCount: number = 6) {
  const months = Array.from({ length: monthsCount }, (_, i) =>
    startOfMonth(subMonths(new Date(), monthsCount - 1 - i))
  );

  const summaryResults = useQueries({
    queries: months.map((month) => {
      const monthStr = format(month, "yyyy-MM-dd");
      return {
        queryKey: ["dashboard-summary", monthStr],
        queryFn: () => getDashboardSummary(monthStr),
      };
    }),
  });

  const extrasResults = useQueries({
    queries: months.map((month) => {
      const dateFrom = format(startOfMonth(month), "yyyy-MM-dd");
      const dateTo = format(endOfMonth(month), "yyyy-MM-dd");
      return {
        queryKey: ["daily-expenses-total", dateFrom, dateTo],
        queryFn: () => getDailyExpensesTotal({ date_from: dateFrom, date_to: dateTo }),
      };
    }),
  });

  const isLoading = summaryResults.some((r) => r.isLoading) || extrasResults.some((r) => r.isLoading);

  const data: MonthlyTrendPoint[] = months.map((month, index) => {
    const summary = summaryResults[index]?.data;
    const extras = extrasResults[index]?.data;

    const totalBills = Number(summary?.total_bills ?? 0);
    const totalCardInvoices = Number(summary?.total_card_invoices ?? 0);
    const totalExtras = Number(extras?.total ?? 0);

    return {
      month: format(month, "yyyy-MM-dd"),
      label: format(month, "MMM", { locale: pt }),
      income: Number(summary?.total_income ?? 0),
      expenses: totalBills + totalCardInvoices + totalExtras,
    };
  });

  return { data, isLoading };
}