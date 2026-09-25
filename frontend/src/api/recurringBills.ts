import { apiClient } from "./client";
import type {
  RecurringBillRead,
  RecurringBillCreate,
  RecurringBillUpdate,
  GenerateMonthResult,
} from "../types/bill";

export async function listRecurringBills(activeOnly: boolean = true): Promise<RecurringBillRead[]> {
  const { data } = await apiClient.get<RecurringBillRead[]>("/recurring-bills", {
    params: { active_only: activeOnly },
  });
  return data;
}

export async function createRecurringBill(payload: RecurringBillCreate): Promise<RecurringBillRead> {
  const { data } = await apiClient.post<RecurringBillRead>("/recurring-bills", payload);
  return data;
}

export async function updateRecurringBill(
  id: string,
  payload: RecurringBillUpdate
): Promise<RecurringBillRead> {
  const { data } = await apiClient.patch<RecurringBillRead>(`/recurring-bills/${id}`, payload);
  return data;
}

export async function generateMonthInstances(referenceMonth: string): Promise<GenerateMonthResult> {
  const { data } = await apiClient.post<GenerateMonthResult>(
    `/recurring-bills/generate-month/${referenceMonth}`
  );
  return data;
}