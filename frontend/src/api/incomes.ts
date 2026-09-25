import { apiClient } from "./client";
import type { IncomeRead, IncomeCreate, IncomeUpdate } from "../types/income";

export async function listIncomes(referenceMonth?: string): Promise<IncomeRead[]> {
  const { data } = await apiClient.get<IncomeRead[]>("/incomes", {
    params: referenceMonth ? { reference_month: referenceMonth } : undefined,
  });
  return data;
}

export async function createIncome(payload: IncomeCreate): Promise<IncomeRead> {
  const { data } = await apiClient.post<IncomeRead>("/incomes", payload);
  return data;
}

export async function updateIncome(id: string, payload: IncomeUpdate): Promise<IncomeRead> {
  const { data } = await apiClient.patch<IncomeRead>(`/incomes/${id}`, payload);
  return data;
}