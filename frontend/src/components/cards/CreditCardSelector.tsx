import { CreditCard as CreditCardIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CreditCardRead } from "../../types/creditCard";

interface CreditCardSelectorProps {
  cards: CreditCardRead[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CreditCardSelector({ cards, selectedId, onSelect }: CreditCardSelectorProps) {
  if (cards.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {cards.map((card) => {
        const isActive = card.id === selectedId;
        return (
          <button
            key={card.id}
            onClick={() => onSelect(card.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            <CreditCardIcon className="h-4 w-4" />
            <span>{card.name}</span>
            <span className={cn("text-xs", isActive ? "text-slate-300" : "text-slate-400")}>
              vence dia {card.due_day}
            </span>
          </button>
        );
      })}
    </div>
  );
}