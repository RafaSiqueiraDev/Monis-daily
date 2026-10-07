import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listBillInstances, updateBillInstanceStatus, updateBillInstance } from "../api/billInstances";
import type { PaymentStatus } from "../types/bill";
import type { BillInstanceUpdatePayload } from "../api/billInstances";

export function useBillInstances(referenceMonth: string, status?: PaymentStatus) {
  return useQuery({
    queryKey: ["bill-instances", referenceMonth, status],
    queryFn: () => listBillInstances({ reference_month: referenceMonth, status }),
  });
}

/**
 * Alterna o status entre "paid" e "pending" — reversível. Usado tanto para
 * marcar como pago como para desfazer ("Desfazer" na lista).
 */
export function useMarkBillInstancePaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
      updateBillInstanceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill-instances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useUpdateBillInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BillInstanceUpdatePayload }) =>
      updateBillInstance(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill-instances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}