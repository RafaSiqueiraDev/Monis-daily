import { z } from "zod";
import { amountField } from "./shared";

export const incomeSchema = z.object({
  category: z.string().min(1, "Seleciona uma categoria"),
  detail: z.string().max(150, "Máximo 150 caracteres").optional(),
  amount: amountField,
  reference_month: z.string().min(1, "O mês é obrigatório"),
  received: z.boolean().default(false),
});

export type IncomeFormInput = {
  category: string;
  detail: string;
  amount: string;
  reference_month: string;
  received: boolean;
};

export type IncomeFormData = z.infer<typeof incomeSchema>;