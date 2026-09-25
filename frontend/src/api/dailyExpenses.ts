import { apiClient } from "./client";
import type { DailyExpenseRead, DailyExpenseCreate, DailyExpenseTotal } from "../types/dailyExpense";

export async function listDailyExpenses(params?: {
  date_from?: string;
  date_to?: string;
}): Promise<DailyExpenseRead[]> {
  const { data } = await apiClient.get<DailyExpenseRead[]>("/daily-expenses", { params });
  return data;
}

export async function createDailyExpense(payload: DailyExpenseCreate): Promise<DailyExpenseRead> {
  const { data } = await apiClient.post<DailyExpenseRead>("/daily-expenses", payload);
  return data;
}

export async function deleteDailyExpense(id: string): Promise<void> {
  await apiClient.delete(`/daily-expenses/${id}`);
}

export async function getDailyExpensesTotal(params: {
  date_from?: string;
  date_to?: string;
}): Promise<DailyExpenseTotal> {
  const { data } = await apiClient.get<DailyExpenseTotal>("/daily-expenses/total", { params });
  return data;
}