import { useEffect, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { MonthPicker } from "../components/ui/month-picker";
import { Skeleton } from "../components/ui/skeleton";
import { CountrySelector } from "../components/shared/CountrySelector";
import { CreditCardFormDialog } from "../components/cards/CreditCardFormDialog";
import { CreditCardSelector } from "../components/cards/CreditCardSelector";
import { PurchaseFormDialog } from "../components/cards/PurchaseFormDialog";
import { InvoiceDetail } from "../components/cards/InvoiceDetail";
import { useCreditCards } from "../hooks/useCreditCards";
import { useCardInvoice } from "../hooks/useCardInvoices";
import { useUiPreferencesStore } from "../store/uiPreferencesStore";
import { COUNTRIES } from "../types/country";

export default function CardsPage() {
  const [referenceMonth, setReferenceMonth] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const selectedCountry = useUiPreferencesStore((state) => state.selectedCountry);
  const isPrimaryCountry = selectedCountry === "PT";

  const { data: allCards, isLoading: isCardsLoading } = useCreditCards();
  const cards = isPrimaryCountry ? allCards ?? [] : [];

  useEffect(() => {
    if (cards.length === 0) {
      if (selectedCardId !== null) setSelectedCardId(null);
      return;
    }
    const stillExists = cards.some((c) => c.id === selectedCardId);
    if (!stillExists) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  const { data: currentInvoice, isLoading: isInvoicesLoading } = useCardInvoice(selectedCardId, referenceMonth);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Cartões de Crédito</h1>
            <p className="text-sm text-slate-500">Fatura, parcelas e compras a crédito</p>
          </div>
          <CreditCardFormDialog />
        </div>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <MonthPicker value={referenceMonth} onChange={setReferenceMonth} className="w-full sm:w-48" />
          <CountrySelector />
        </div>

        {!isPrimaryCountry && (
          <p className="rounded-lg border border-amber-200/60 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Ainda não há cartões associados a {COUNTRIES[selectedCountry].label}. Muda para 🇵🇹 Portugal
            para veres e geres os teus cartões.
          </p>
        )}

        {isCardsLoading && isPrimaryCountry && (
          <div className="flex gap-2">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-32" />
          </div>
        )}

        {!isCardsLoading && isPrimaryCountry && cards.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            Ainda não tens nenhum cartão registado. Cria o primeiro para começares a lançar compras.
          </div>
        )}

        {isPrimaryCountry && cards.length > 0 && (
          <>
            <CreditCardSelector cards={cards} selectedId={selectedCardId} onSelect={setSelectedCardId} />

            {selectedCardId && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                  Compra vinculada a:{" "}
                  <span className="font-medium text-slate-700">
                    {cards.find((c) => c.id === selectedCardId)?.name}
                  </span>
                </p>
                <PurchaseFormDialog key={selectedCardId} creditCardId={selectedCardId} />
              </div>
            )}

            <InvoiceDetail invoice={currentInvoice ?? null} isLoading={isInvoicesLoading} />
          </>
        )}
      </div>
    </div>
  );
}