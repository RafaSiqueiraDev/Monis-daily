import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCardInvoice, updateCardInvoiceStatus } from "../api/cardInvoices";
import type { InvoiceStatus } from "../types/creditCard";

export function useCardInvoice(creditCardId: string | null, referenceMonth: string) {
  return useQuery({
    queryKey: ["card-invoice", creditCardId, referenceMonth],
    queryFn: () => getCardInvoice(creditCardId as string, referenceMonth),
    enabled: !!creditCardId,
  });
}

export function useUpdateCardInvoiceStatus() {

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) =>
      updateCardInvoiceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-invoice"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
} 

