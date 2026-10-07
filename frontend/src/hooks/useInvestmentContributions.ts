import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listContributions, createContribution } from "../api/investmentContributions";
import type { InvestmentContributionCreate } from "../types/investment";

export function useContributions(assetId: string | null) {
  return useQuery({
    queryKey: ["investment-contributions", assetId],
    queryFn: () => listContributions(assetId as string),
    enabled: !!assetId,
  });
}

export function useCreateContribution(assetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvestmentContributionCreate) =>
      createContribution(assetId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-contributions", assetId] });
      queryClient.invalidateQueries({ queryKey: ["asset-snapshots", assetId] });
      queryClient.invalidateQueries({ queryKey: ["investment-summary"] });
    },
  });
}