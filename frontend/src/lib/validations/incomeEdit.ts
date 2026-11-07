import { z } from "zod";
import { amountField } from "./shared";

export const incomeEditSchema = z.object({
  description: z.string().min(1, "A descrição é obrigatória").max(150),
  amount: amountField,
  reference_month: z.string().min(1, "O mês é obrigatório"),
  received: z.boolean().default(false),
});

export type IncomeEditFormInput = z.input<typeof incomeEditSchema>;
export type IncomeEditFormData = z.output<typeof incomeEditSchema>;
