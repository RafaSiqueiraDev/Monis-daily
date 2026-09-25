export type CategoryKind = "income" | "fixed" | "variable" | "daily" | "investment";

export interface CategoryRead {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string | null;
  color: string | null;
}