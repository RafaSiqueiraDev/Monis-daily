import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "../api/dashboard";

export function useDashboardSummary(referenceMonth: string) {
  return useQuery({
    queryKey: ["dashboard-summary", referenceMonth],
    queryFn: () => getDashboardSummary(referenceMonth),
  });
}