import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCreditCards, createCreditCard } from "../api/creditCards";
import type { CreditCardCreate } from "../types/creditCard";
import type { CountryCode } from "../types/country";

/** Sem `country`, devolve os cartões de todos os países. */
export function useCreditCards(country?: CountryCode) {
  return useQuery({
    // o prefixo ["credit-cards"] mantém-se, por isso a invalidação abaixo apanha todas as variantes
    queryKey: ["credit-cards", country ?? "all"],
    queryFn: () => listCreditCards(country),
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