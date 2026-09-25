import { cn } from "../../lib/utils";
import { REGION_BY_CURRENCY, SELECTABLE_BASE_CURRENCIES, type CurrencyCode } from "../../types/investment";

interface CurrencySelectorProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-1">
      {SELECTABLE_BASE_CURRENCIES.map((code) => {
        const isActive = code === value;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <span>{REGION_BY_CURRENCY[code].flag}</span>
            {code}
          </button>
        );
      })}
    </div>
  );
}