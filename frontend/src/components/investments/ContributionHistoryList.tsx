import { ArrowDownCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { displayCurrency } from "../../utils/currency";
import { formatDateShort } from "../../utils/date";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";
import { useContributions } from "../../hooks/useInvestmentContributions";
import type { InvestmentAssetRead } from "../../types/investment";

export function ContributionHistoryList({ asset }: { asset: InvestmentAssetRead | null }) {
  const { data: contributions, isLoading } = useContributions(asset?.id ?? null);
  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de aportes {asset ? `— ${asset.name}` : ""}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {!asset && <p className="py-6 text-center text-sm text-slate-400">Seleciona um ativo acima.</p>}

        {asset && isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}

        {asset && !isLoading && (contributions?.length ?? 0) === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">Ainda não há aportes registados.</p>
        )}

        {contributions?.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <ArrowDownCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{formatDateShort(c.contribution_date)}</p>
                {c.note && <p className="text-xs text-slate-500">{c.note}</p>}
              </div>
            </div>
            <span className="text-sm font-semibold text-emerald-600">
              +{displayCurrency(Number(c.amount ?? 0), hideAmounts, asset?.currency)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}