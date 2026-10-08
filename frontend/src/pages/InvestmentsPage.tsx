import { useMemo, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { CurrencyBreakdown } from "../components/investments/CurrencyBreakdown";
import { CurrencySelector } from "../components/investments/CurrencySelector";
import { RegionFilterTabs } from "../components/investments/RegionFilterTabs";
import { PortfolioEvolutionChart } from "../components/investments/PortfolioEvolutionChart";
import { AssetFormDialog } from "../components/investments/AssetFormDialog";
import { BulkAddAssetsDialog } from "../components/investments/BulkAddAssetsDialog";
import { SnapshotFormDialog } from "../components/investments/SnapshotFormDialog";
import { SnapshotList } from "../components/investments/SnapshotList";
import { ContributionFormDialog } from "../components/investments/ContributionFormDialog";
import { ContributionHistoryList } from "../components/investments/ContributionHistoryList";
import { MonthPicker } from "../components/ui/month-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { useInvestmentSummary } from "../hooks/useInvestmentSummary";
import { useInvestmentAssets } from "../hooks/useInvestmentAssets";
import { useInvestmentSnapshotsForMonth } from "../hooks/useInvestmentSnapshots";
import { useUiPreferencesStore } from "../store/uiPreferencesStore";
import type { CurrencyCode } from "../types/investment";

export default function InvestmentsPage() {
  const [referenceMonth, setReferenceMonth] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [regionFilter, setRegionFilter] = useState<CurrencyCode | "all">("all");
  const [historyAssetId, setHistoryAssetId] = useState<string>("");

  const investmentBaseCurrency = useUiPreferencesStore((state) => state.investmentBaseCurrency);
  const setInvestmentBaseCurrency = useUiPreferencesStore((state) => state.setInvestmentBaseCurrency);

  const { data: summary, isLoading: isSummaryLoading } = useInvestmentSummary(referenceMonth, investmentBaseCurrency);
  const { data: assets } = useInvestmentAssets();
  const { data: snapshots, isLoading: isSnapshotsLoading } = useInvestmentSnapshotsForMonth(assets ?? [], referenceMonth);

  const availableCurrencies = useMemo(() => {
    const unique = new Set<CurrencyCode>();
    snapshots.forEach((s) => unique.add(s.currency));
    return Array.from(unique);
  }, [snapshots]);

  const filteredSnapshots = useMemo(() => {
    if (regionFilter === "all") return snapshots;
    return snapshots.filter((s) => s.currency === regionFilter);
  }, [snapshots, regionFilter]);

  const historyAsset = assets?.find((a) => a.id === historyAssetId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Investimentos</h1>
          <p className="text-sm text-slate-500">Património multi-moeda e evolução mensal</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AssetFormDialog />
          <BulkAddAssetsDialog />
          <ContributionFormDialog assets={assets ?? []} />
          <SnapshotFormDialog referenceMonth={referenceMonth} assets={assets ?? []} existingSnapshots={snapshots} />
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <MonthPicker value={referenceMonth} onChange={setReferenceMonth} className="w-full sm:w-48" />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Moeda de visualização</span>
          <CurrencySelector value={investmentBaseCurrency} onChange={setInvestmentBaseCurrency} />
        </div>
      </div>

      <CurrencyBreakdown summary={summary ?? null} baseCurrency={investmentBaseCurrency} isLoading={isSummaryLoading} />

      <PortfolioEvolutionChart baseCurrency={investmentBaseCurrency} />

      <div className="flex flex-col gap-3">
        <RegionFilterTabs availableCurrencies={availableCurrencies} value={regionFilter} onChange={setRegionFilter} />
        <SnapshotList snapshots={filteredSnapshots} isLoading={isSnapshotsLoading} />
      </div>

      <div className="flex flex-col gap-3">
        <Select value={historyAssetId} onValueChange={setHistoryAssetId}>
          <SelectTrigger className="h-9 sm:w-64">
            <SelectValue placeholder="Ver histórico de um ativo..." />
          </SelectTrigger>
          <SelectContent>
            {assets?.map((asset) => (
              <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ContributionHistoryList asset={historyAsset} />
      </div>
    </div>
  );
}