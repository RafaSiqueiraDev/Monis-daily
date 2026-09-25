import { apiClient } from "./client";
import type { InvestmentAssetRead, InvestmentAssetCreate } from "../types/investment";

export async function listInvestmentAssets(): Promise<InvestmentAssetRead[]> {
  const { data } = await apiClient.get<InvestmentAssetRead[]>("/investments/assets");
  return data;
}

export async function createInvestmentAsset(payload: InvestmentAssetCreate): Promise<InvestmentAssetRead> {
  const { data } = await apiClient.post<InvestmentAssetRead>("/investments/assets", payload);
  return data;
}