import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listBillInstances, updateBillInstanceStatus } from "../api/billInstances";
import type { PaymentStatus } from "../types/bill";

export function useBillInstances(referenceMonth: string, status?: PaymentStatus) {
  return useQuery({
    queryKey: ["bill-instances", referenceMonth, status],
    queryFn: () => listBillInstances({ reference_month: referenceMonth, status }),
  });
}

export function useMarkBillInstancePaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
      updateBillInstanceStatus(id, status),
    onSuccess: () => {
      // invalida ambos: a lista de contas E o resumo do dashboard,
      // porque marcar uma conta como paga não muda o total_bills
      // (já estava contabilizado), mas pode mudar outras vistas futuras
      queryClient.invalidateQueries({ queryKey: ["bill-instances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}