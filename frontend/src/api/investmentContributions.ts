import { apiClient } from "./client";
import type { InvestmentContributionRead, InvestmentContributionCreate } from "../types/investment";

export interface ContributionsTotal {
  total: number;
  reference_month: string;
}

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

export async function getContributionsTotal(referenceMonth: string): Promise<ContributionsTotal> {
  const { data } = await apiClient.get<ContributionsTotal>("/investments/contributions/total", {
    params: { reference_month: referenceMonth },
  });
  return data;
}