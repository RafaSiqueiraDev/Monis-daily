import { z } from "zod";
import { amountField } from "./shared";

export const expenseSchema = z.object({
  description: z.string().min(1, "A descrição é obrigatória").max(150),
  amount: amountField,
  expense_date: z.string().min(1, "A data é obrigatória"),
  category_id: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
});

export type ExpenseFormInput = {
  description: string;
  amount: string;
  expense_date: string;
  category_id?: string;
};

export type ExpenseFormData = z.infer<typeof expenseSchema>;