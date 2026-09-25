import { apiClient } from "./client";
import type { DashboardSummary } from "../types/dashboard";

export async function getDashboardSummary(referenceMonth: string): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>("/dashboard/summary", {
    params: { reference_month: referenceMonth },
  });
  return data;
}