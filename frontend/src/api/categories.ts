import { apiClient } from "./client";
import type { CategoryRead } from "../types/category";

export async function listCategories(): Promise<CategoryRead[]> {
  const { data } = await apiClient.get<CategoryRead[]>("/categories");
  return data;
}