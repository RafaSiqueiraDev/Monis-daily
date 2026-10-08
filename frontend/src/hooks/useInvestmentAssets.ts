import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listInvestmentAssets, createInvestmentAsset, bulkCreateInvestmentAssets } from "../api/investmentAssets";
import type { InvestmentAssetCreate } from "../types/investment";

export function useInvestmentAssets() {
  return useQuery({
    queryKey: ["investment-assets"],
    queryFn: listInvestmentAssets,
    staleTime: 5 * 60_000,
  });
}

export function useCreateInvestmentAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvestmentAssetCreate) => createInvestmentAsset(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-assets"] });
      queryClient.invalidateQueries({ queryKey: ["investment-summary"] });
    },
  });
}

export function useBulkCreateInvestmentAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: InvestmentAssetCreate[]) => bulkCreateInvestmentAssets(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-assets"] });
      queryClient.invalidateQueries({ queryKey: ["investment-summary"] });
    },
  });
}