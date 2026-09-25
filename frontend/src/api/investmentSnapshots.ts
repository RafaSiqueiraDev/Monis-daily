import { apiClient } from "./client";
import type { InvestmentSnapshotRead, InvestmentSnapshotCreate } from "../types/investment";

export async function listAssetSnapshots(assetId: string): Promise<InvestmentSnapshotRead[]> {
  const { data } = await apiClient.get<InvestmentSnapshotRead[]>(`/investments/assets/${assetId}/snapshots`);
  return data;
}

// o backend faz upsert internamente (asset_id + reference_month) — não
// precisamos de um endpoint de update separado, como já confirmaste
export async function upsertInvestmentSnapshot(
  payload: InvestmentSnapshotCreate
): Promise<InvestmentSnapshotRead> {
  const { data } = await apiClient.post<InvestmentSnapshotRead>("/investments/snapshots", payload);
  return data;
}