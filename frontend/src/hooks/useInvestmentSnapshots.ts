import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAssetSnapshots, upsertInvestmentSnapshot } from "../api/investmentSnapshots";
import type { InvestmentAssetRead, InvestmentSnapshotCreate } from "../types/investment";

export interface SnapshotWithAsset {
  id: string;
  asset_id: string;
  reference_month: string;
  balance: number;
  contribution: number;
  asset_name: string;
  asset_category: InvestmentAssetRead["category"];
  currency: InvestmentAssetRead["currency"];
}

/**
 * O backend só expõe snapshots por ativo (/investments/assets/{id}/snapshots).
 * Para mostrar "todas as posições deste mês" no dashboard de investimentos,
 * fazemos uma query por ativo (useQueries) e filtramos+juntamos no cliente.
 * Para um utilizador individual com dezenas de ativos, isto é perfeitamente
 * aceitável; não vale a pena pedir um endpoint agregado novo só para isto.
 */
export function useInvestmentSnapshotsForMonth(assets: InvestmentAssetRead[], referenceMonth: string) {
  const results = useQueries({
    queries: assets.map((asset) => ({
      queryKey: ["asset-snapshots", asset.id],
      queryFn: () => listAssetSnapshots(asset.id),
    })),
  });

  const isLoading = assets.length > 0 && results.some((r) => r.isLoading);

  const data: SnapshotWithAsset[] = assets.flatMap((asset, index) => {
    const assetSnapshots = results[index]?.data ?? [];
    return assetSnapshots
      .filter((s) => s.reference_month === referenceMonth)
      .map((s) => ({
        ...s,
        asset_name: asset.name,
        asset_category: asset.category,
        currency: asset.currency,
      }));
  });

  return { data, isLoading };
}

export function useUpsertInvestmentSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvestmentSnapshotCreate) => upsertInvestmentSnapshot(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["asset-snapshots", variables.asset_id] });
      queryClient.invalidateQueries({ queryKey: ["investment-summary"] });
    },
  });
}