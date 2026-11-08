import { apiClient } from "./client";
import type { InvestmentAssetRead, InvestmentAssetCreate, InvestmentAssetUpdate } from "../types/investment";

export async function listInvestmentAssets(): Promise<InvestmentAssetRead[]> {
  const { data } = await apiClient.get<InvestmentAssetRead[]>("/investments/assets");
  return data;
}

export async function createInvestmentAsset(payload: InvestmentAssetCreate): Promise<InvestmentAssetRead> {
  const { data } = await apiClient.post<InvestmentAssetRead>("/investments/assets", payload);
  return data;
}

export async function bulkCreateInvestmentAssets(
  items: InvestmentAssetCreate[]
): Promise<InvestmentAssetRead[]> {
  const { data } = await apiClient.post<InvestmentAssetRead[]>("/investments/assets/bulk", { items });
  return data;
}
export async function updateInvestmentAsset(
  id: string,
  payload: InvestmentAssetUpdate
): Promise<InvestmentAssetRead> {
  const { data } = await apiClient.patch<InvestmentAssetRead>(`/investments/assets/${id}`, payload);
  return data;
}
