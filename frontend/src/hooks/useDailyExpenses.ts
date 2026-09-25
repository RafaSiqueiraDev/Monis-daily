import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDailyExpenses, createDailyExpense, deleteDailyExpense, getDailyExpensesTotal } from "../api/dailyExpenses";
import type { DailyExpenseCreate } from "../types/dailyExpense";

export function useDailyExpenses(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["daily-expenses", dateFrom, dateTo],
    queryFn: () => listDailyExpenses({ date_from: dateFrom, date_to: dateTo }),
  });
}

export function useDailyExpensesTotal(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["daily-expenses-total", dateFrom, dateTo],
    queryFn: () => getDailyExpensesTotal({ date_from: dateFrom, date_to: dateTo }),
  });
}

export function useCreateDailyExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DailyExpenseCreate) => createDailyExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["daily-expenses-total"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useDeleteDailyExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDailyExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["daily-expenses-total"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}