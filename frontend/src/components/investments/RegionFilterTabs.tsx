import { cn } from "../../lib/utils";
import { REGION_BY_CURRENCY, type CurrencyCode } from "../../types/investment";

interface RegionFilterTabsProps {
  availableCurrencies: CurrencyCode[];
  value: CurrencyCode | "all";
  onChange: (value: CurrencyCode | "all") => void;
}

export function RegionFilterTabs({ availableCurrencies, value, onChange }: RegionFilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          value === "all"
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        )}
      >
        Todos
      </button>
      {availableCurrencies.map((code) => {
        const region = REGION_BY_CURRENCY[code];
        const isActive = value === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <span>{region.flag}</span>
            {region.label}
          </button>
        );
      })}
    </div>
  );
}