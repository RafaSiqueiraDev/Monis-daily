import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listRecurringBills,
  createRecurringBill,
  updateRecurringBill,
  generateMonthInstances,
} from "../api/recurringBills";
import type { RecurringBillCreate, RecurringBillUpdate } from "../types/bill";

export function useRecurringBills() {
  return useQuery({
    queryKey: ["recurring-bills"],
    queryFn: () => listRecurringBills(true),
  });
}

export function useCreateRecurringBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecurringBillCreate) => createRecurringBill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-bills"] });
    },
  });
}

export function useUpdateRecurringBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RecurringBillUpdate }) =>
      updateRecurringBill(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-bills"] });
      queryClient.invalidateQueries({ queryKey: ["bill-instances"] });
    },
  });
}

export function useGenerateMonthInstances() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (referenceMonth: string) => generateMonthInstances(referenceMonth),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill-instances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}