import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listIncomes, createIncome, updateIncome } from "../api/incomes";
import type { IncomeCreate, IncomeUpdate } from "../types/income";

export function useIncomes(referenceMonth: string) {
  return useQuery({
    queryKey: ["incomes", referenceMonth],
    queryFn: () => listIncomes(referenceMonth),
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IncomeCreate) => createIncome(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useToggleIncomeReceived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, received }: { id: string; received: boolean }) =>
      updateIncome(id, { received }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: IncomeUpdate }) => updateIncome(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}