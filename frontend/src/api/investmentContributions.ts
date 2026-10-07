import { apiClient } from "./client";
import type { InvestmentContributionRead, InvestmentContributionCreate } from "../types/investment";

export async function listContributions(assetId: string): Promise<InvestmentContributionRead[]> {
  const { data } = await apiClient.get<InvestmentContributionRead[]>(
    `/investments/assets/${assetId}/contributions`
  );
  return data;
}

export async function createContribution(
  assetId: string,
  payload: InvestmentContributionCreate
): Promise<InvestmentContributionRead> {
  const { data } = await apiClient.post<InvestmentContributionRead>(
    `/investments/assets/${assetId}/contributions`,
    payload
  );
  return data;
}