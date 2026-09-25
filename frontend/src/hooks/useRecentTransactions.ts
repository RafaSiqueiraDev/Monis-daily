import { useQuery } from "@tanstack/react-query";
import { listDailyExpenses } from "../api/dailyExpenses";
import { listIncomes } from "../api/incomes";

export interface RecentTransaction {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  date: string;
}

export function useRecentTransactions(referenceMonth: string, limit: number = 6) {
  return useQuery({
    queryKey: ["recent-transactions", referenceMonth],
    queryFn: async (): Promise<RecentTransaction[]> => {
      const [expenses, incomes] = await Promise.all([
        listDailyExpenses(),
        listIncomes(referenceMonth),
      ]);

      const expenseTx: RecentTransaction[] = expenses.map((e) => ({
        id: e.id,
        type: "expense",
        description: e.description,
        amount: e.amount,
        date: e.expense_date,
      }));

      const incomeTx: RecentTransaction[] = incomes.map((i) => ({
        id: i.id,
        type: "income",
        description: i.description,
        amount: i.amount,
        date: i.reference_month,
      }));

      return [...expenseTx, ...incomeTx]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    },
  });
}