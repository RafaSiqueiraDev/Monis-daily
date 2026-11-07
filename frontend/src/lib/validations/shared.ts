import { z } from "zod";

/**
 * Campos de formulário cujo tipo de ENTRADA é o que o input produz (string)
 * e o tipo de SAÍDA é o que a API espera (number). Assim
 * `useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>`
 * fica corretamente tipado, sem casts.
 *
 * Nota Zod 4: as mensagens de tipo usam `{ error }` (o antigo
 * `invalid_type_error` do Zod 3 é ignorado e mostrava a mensagem por defeito
 * em inglês).
 */

function parseAmount(val: string): number | undefined {
  const trimmed = val.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isNaN(parsed) ? undefined : parsed;
}

const INVALID_AMOUNT = "Indica um valor válido";

/** Valor monetário obrigatório, > 0. Aceita "5", "5.5" ou "5,5". */
export const amountField = z
  .string()
  .transform(parseAmount)
  .pipe(z.number({ error: INVALID_AMOUNT }).positive("O valor deve ser maior que zero"));

/** Valor monetário opcional, > 0 quando preenchido (ex: limite de cartão). */
export const optionalAmountField = z
  .string()
  .transform(parseAmount)
  .pipe(z.number({ error: INVALID_AMOUNT }).positive("O valor deve ser maior que zero").optional());

/** Valor monetário obrigatório, >= 0 (ex: saldo de investimento pode começar em zero). */
export const nonNegativeAmountField = z
  .string()
  .transform(parseAmount)
  .pipe(z.number({ error: INVALID_AMOUNT }).nonnegative("O valor não pode ser negativo"));

/** Valor monetário opcional, >= 0 quando preenchido (ex: aporte do mês). */
export const optionalNonNegativeAmountField = z
  .string()
  .transform(parseAmount)
  .pipe(z.number({ error: INVALID_AMOUNT }).nonnegative("O valor não pode ser negativo").optional());

interface IntFieldOptions {
  min: number;
  max: number;
  minMessage: string;
  maxMessage: string;
  typeMessage?: string;
}

/**
 * Inteiro vindo de `<input type="number" {...register()}>`: o valor por
 * defeito é number, mas depois de editado o RHF devolve string.
 */
export function intField({ min, max, minMessage, maxMessage, typeMessage = "Indica um número válido" }: IntFieldOptions) {
  return z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "number" ? val : val.trim() === "" ? Number.NaN : Number(val)))
    .pipe(z.number({ error: typeMessage }).int(typeMessage).min(min, minMessage).max(max, maxMessage));
}

/** Dia do mês (1–31), usado em vencimentos e fecho de fatura. */
export const dayOfMonthField = () =>
  intField({ min: 1, max: 31, minMessage: "Entre 1 e 31", maxMessage: "Entre 1 e 31" });
