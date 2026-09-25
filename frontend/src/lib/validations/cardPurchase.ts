import { z } from "zod";
import { amountField } from "./shared";

export const cardPurchaseSchema = z.object({
  credit_card_id: z.string().min(1, "Seleciona um cartão"),
  description: z.string().min(1, "A descrição é obrigatória").max(150),
  total_amount: amountField,
  installments_count: z.coerce.number().int().min(1, "Mínimo 1 parcela").max(48, "Máximo 48 parcelas"),
  purchase_date: z.string().min(1, "A data é obrigatória"),
});

export type CardPurchaseFormInput = {
  credit_card_id: string;
  description: string;
  total_amount: string;
  installments_count: number;
  purchase_date: string;
};

export type CardPurchaseFormData = z.infer<typeof cardPurchaseSchema>;