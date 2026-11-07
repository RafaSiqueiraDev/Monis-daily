import { z } from "zod";
import { amountField, intField } from "./shared";

export const cardPurchaseSchema = z.object({
  credit_card_id: z.string().min(1, "Seleciona um cartão"),
  description: z.string().min(1, "A descrição é obrigatória").max(150),
  total_amount: amountField,
  installments_count: intField({
    min: 1,
    max: 48,
    minMessage: "Mínimo 1 parcela",
    maxMessage: "Máximo 48 parcelas",
  }),
  purchase_date: z.string().min(1, "A data é obrigatória"),
});

export type CardPurchaseFormInput = z.input<typeof cardPurchaseSchema>;
export type CardPurchaseFormData = z.output<typeof cardPurchaseSchema>;
