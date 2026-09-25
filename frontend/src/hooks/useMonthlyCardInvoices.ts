import { useQueries } from "@tanstack/react-query";
import { getCardInvoice } from "../api/cardInvoices";
import type { CreditCardRead, CardInvoiceRead } from "../types/creditCard";

export interface CardInvoiceWithCard {
  card: CreditCardRead;
  invoice: CardInvoiceRead | null;
}

export function useMonthlyCardInvoices(cards: CreditCardRead[], referenceMonth: string) {
  const results = useQueries({
    queries: cards.map((card) => ({
      // mesma queryKey usada em useCardInvoice — partilha cache com o CardsPage
      queryKey: ["card-invoice", card.id, referenceMonth],
      queryFn: () => getCardInvoice(card.id, referenceMonth),
    })),
  });

  const isLoading = cards.length > 0 && results.some((r) => r.isLoading);

  const data: CardInvoiceWithCard[] = cards.map((card, index) => ({
    card,
    invoice: results[index]?.data ?? null,
  }));

  return { data, isLoading };
}