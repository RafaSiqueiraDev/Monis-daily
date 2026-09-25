import { z } from "zod";
import { amountField } from "./shared";

export const incomeSchema = z.object({
  description: z.string().min(1, "A descrição é obrigatória").max(150),
  amount: amountField,
  reference_month: z.string().min(1, "O mês é obrigatório"),
  received: z.boolean().default(false),
});

export type IncomeFormInput = {
  description: string;
  amount: string;
  reference_month: string;
  received: boolean;
};

export type IncomeFormData = z.infer<typeof incomeSchema>;