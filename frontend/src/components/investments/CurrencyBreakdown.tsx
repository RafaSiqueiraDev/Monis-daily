import { PiggyBank } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { displayCurrency } from "../../utils/currency";
import { REGION_BY_CURRENCY, SUPPORTED_CURRENCIES, type CurrencyCode, type InvestmentSummary } from "../../types/investment";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";

export function CurrencyBreakdown({
  summary,
  baseCurrency,
  isLoading,
}: {
  summary: InvestmentSummary | null;
  baseCurrency: CurrencyCode;
  isLoading: boolean;
}) {
  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-slate-400">
          Sem dados consolidados para este mês ainda.
        </CardContent>
      </Card>
    );
  }

  const currencies = Object.entries(summary.totals_by_currency ?? {}).filter(
    (entry): entry is [CurrencyCode, number] =>
      SUPPORTED_CURRENCIES.includes(entry[0] as CurrencyCode) &&
      typeof entry[1] === "number" &&
      !Number.isNaN(entry[1])
  );

  return (
    <Card className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-sky-50 border-teal-100/60">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100/80 text-teal-700">
          <PiggyBank className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Património consolidado</p>
          <CardTitle className="text-2xl">
            {displayCurrency(summary.consolidated_balance, hideAmounts, baseCurrency)}
          </CardTitle>
        </div>
      </CardHeader>

      {currencies.length > 0 && (
        <CardContent className="flex flex-col gap-2 border-t border-teal-100/60 pt-4">
          <p className="text-xs font-medium text-slate-500">Alocação por região</p>
          <div className="flex flex-wrap gap-2">
            {currencies.map(([currency, value]) => {
              const region = REGION_BY_CURRENCY[currency];
              return (
                <div
                  key={currency}
                  className="flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5"
                >
                  <span className="text-base leading-none">{region.flag}</span>
                  <div className="leading-tight">
                    <p className="text-[10px] font-medium text-slate-500">{region.label}</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {displayCurrency(value, hideAmounts, currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}