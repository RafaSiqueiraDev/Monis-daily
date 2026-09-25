import { apiClient } from "./client";
import type { BillInstanceRead, PaymentStatus } from "../types/bill";

export async function listBillInstances(params: {
  reference_month?: string;
  status?: PaymentStatus;
}): Promise<BillInstanceRead[]> {
  const { data } = await apiClient.get<BillInstanceRead[]>("/bill-instances", { params });
  return data;
}

export async function updateBillInstanceStatus(
  id: string,
  status: PaymentStatus
): Promise<BillInstanceRead> {
  const { data } = await apiClient.patch<BillInstanceRead>(`/bill-instances/${id}`, { status });
  return data;
}