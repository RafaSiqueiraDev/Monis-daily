import { z } from "zod";

function parseAmount(val: unknown): number | undefined {
  if (typeof val !== "string") return val as number | undefined;
  const trimmed = val.trim();
  if (trimmed === "") return undefined;
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** Valor monetário obrigatório, > 0. Aceita "5", "5.5" ou "5,5" como string de entrada. */
export const amountField = z.preprocess(
  parseAmount,
  z.number({ invalid_type_error: "Indica um valor válido" }).positive("O valor deve ser maior que zero")
);

/** Valor monetário opcional, > 0 quando preenchido (ex: limite de cartão). */
export const optionalAmountField = z.preprocess(
  parseAmount,
  z
    .number({ invalid_type_error: "Indica um valor válido" })
    .positive("O valor deve ser maior que zero")
    .optional()
);

/** Valor monetário obrigatório, >= 0 (ex: saldo de investimento pode começar em zero). */
export const nonNegativeAmountField = z.preprocess(
  parseAmount,
  z.number({ invalid_type_error: "Indica um valor válido" }).nonnegative("O valor não pode ser negativo")
);

/** Valor monetário opcional, >= 0 quando preenchido (ex: aporte do mês). */
export const optionalNonNegativeAmountField = z.preprocess(
  parseAmount,
  z
    .number({ invalid_type_error: "Indica um valor válido" })
    .nonnegative("O valor não pode ser negativo")
    .optional()
);