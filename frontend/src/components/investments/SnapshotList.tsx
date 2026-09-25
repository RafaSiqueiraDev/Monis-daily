import { Landmark } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { displayCurrency } from "../../utils/currency";
import { ASSET_CATEGORY_LABELS, REGION_BY_CURRENCY } from "../../types/investment";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";
import type { SnapshotWithAsset } from "../../hooks/useInvestmentSnapshots";

export function SnapshotList({
  snapshots,
  isLoading,
}: {
  snapshots: SnapshotWithAsset[];
  isLoading: boolean;
}) {
  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posições do mês</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}

        {!isLoading && snapshots.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            Nenhuma posição para este filtro neste mês.
          </p>
        )}

        {snapshots.map((snapshot) => {
          const region = REGION_BY_CURRENCY[snapshot.currency] ?? { flag: "🏳️", label: snapshot.currency };
          return (
            <div
              key={snapshot.id}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Landmark className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{snapshot.asset_name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                      {ASSET_CATEGORY_LABELS[snapshot.asset_category]}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {region.flag} {snapshot.currency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {displayCurrency(snapshot.balance, hideAmounts, snapshot.currency)}
                </p>
                {snapshot.contribution > 0 && (
                  <p className="text-xs text-emerald-600">
                    +{displayCurrency(snapshot.contribution, hideAmounts, snapshot.currency)} aportado
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}