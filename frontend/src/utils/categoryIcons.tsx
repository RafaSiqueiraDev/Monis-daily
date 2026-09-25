import { Car, ShoppingCart, Home, Wifi, Utensils, Film, HeartPulse, GraduationCap, Plane, Receipt, type LucideIcon } from "lucide-react";

export interface CategoryVisual {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const rules: { keywords: string[]; visual: CategoryVisual }[] = [
  {
    keywords: ["uber", "transporte", "taxi", "combustível", "gasolina", "carro", "bolt"],
    visual: { icon: Car, iconBg: "bg-sky-100", iconColor: "text-sky-600" },
  },
  {
    keywords: ["mercado", "supermercado", "compras", "alimentação", "feira"],
    visual: { icon: ShoppingCart, iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  },
  {
    keywords: ["restaurante", "almoço", "jantar", "café", "lanche"],
    visual: { icon: Utensils, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  },
  {
    keywords: ["renda", "casa", "condomínio", "água", "luz", "eletricidade", "habitação"],
    visual: { icon: Home, iconBg: "bg-violet-100", iconColor: "text-violet-600" },
  },
  {
    keywords: ["internet", "wifi", "telefone", "telemóvel", "nos", "meo", "vodafone"],
    visual: { icon: Wifi, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
  },
  {
    keywords: ["cinema", "streaming", "lazer", "netflix", "jogo", "spotify"],
    visual: { icon: Film, iconBg: "bg-pink-100", iconColor: "text-pink-600" },
  },
  {
    keywords: ["saúde", "farmácia", "médico", "ginásio", "clínica"],
    visual: { icon: HeartPulse, iconBg: "bg-rose-100", iconColor: "text-rose-600" },
  },
  {
    keywords: ["educação", "curso", "livro", "escola", "faculdade"],
    visual: { icon: GraduationCap, iconBg: "bg-cyan-100", iconColor: "text-cyan-600" },
  },
  {
    keywords: ["viagem", "voo", "hotel", "férias"],
    visual: { icon: Plane, iconBg: "bg-teal-100", iconColor: "text-teal-600" },
  },
];

const fallback: CategoryVisual = { icon: Receipt, iconBg: "bg-slate-100", iconColor: "text-slate-600" };

/** Faz correspondência por palavra-chave sobre um texto livre (nome de
 * categoria ou descrição de despesa/conta) e devolve o ícone+cores
 * temáticos mais próximos. Sem correspondência, cai no ícone neutro. */
export function getCategoryVisual(label: string | null | undefined): CategoryVisual {
  if (!label) return fallback;
  const normalized = label.toLowerCase();
  const match = rules.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)));
  return match?.visual ?? fallback;
}