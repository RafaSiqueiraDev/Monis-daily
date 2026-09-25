import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCreditCards, createCreditCard } from "../api/creditCards";
import type { CreditCardCreate } from "../types/creditCard";

export function useCreditCards() {
  return useQuery({
    queryKey: ["credit-cards"],
    queryFn: listCreditCards,
  });
}

export function useCreateCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreditCardCreate) => createCreditCard(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
    },
  });
}