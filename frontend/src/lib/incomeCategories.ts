export interface IncomeCategoryOption {
  value: string;
  emoji: string;
  label: string;
}

export const INCOME_CATEGORIES: IncomeCategoryOption[] = [
  { value: "salary", emoji: "💼", label: "Salário / Ordenado" },
  { value: "thirteenth", emoji: "🎄", label: "13º Salário / Subsídio de Natal" },
  { value: "vacation", emoji: "🏖️", label: "Férias / Subsídio de Férias" },
  { value: "bonus", emoji: "🏆", label: "Prémios / Bónus" },
  { value: "rent", emoji: "🏠", label: "Renda / Aluguer Recebido" },
  { value: "freelance", emoji: "💻", label: "Freelance / Serviços" },
  { value: "investments", emoji: "📈", label: "Investimentos / Dividendos" },
  { value: "refunds", emoji: "🔄", label: "Reembolsos / Devoluções" },
  { value: "other", emoji: "➕", label: "Outros Rendimentos" },
];

export function buildIncomeDescription(categoryValue: string, detail: string): string {
  const category = INCOME_CATEGORIES.find((c) => c.value === categoryValue);
  const prefix = category ? `${category.emoji} ${category.label}` : "➕ Outros Rendimentos";
  const trimmedDetail = detail.trim();
  return trimmedDetail ? `${prefix} — ${trimmedDetail}` : prefix;
}