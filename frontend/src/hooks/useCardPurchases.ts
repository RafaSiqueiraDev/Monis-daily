import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCardPurchase } from "../api/cardPurchases";
import type { CardPurchaseCreate } from "../types/creditCard";

export function useCreateCardPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CardPurchaseCreate) => createCardPurchase(payload),
    onSuccess: () => {
      // uma compra parcelada gera parcelas em VÁRIOS meses (atual + futuros),
      // por isso invalidamos todas as card-invoices, não só a do mês selecionado
      queryClient.invalidateQueries({ queryKey: ["card-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}