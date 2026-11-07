import { z } from "zod";
import { amountField, dayOfMonthField } from "./shared";

export const recurringBillSchema = z.object({
  description: z.string().min(1, "A descrição é obrigatória").max(150),
  type: z.enum(["fixed", "variable"], { error: "Seleciona o tipo" }),
  due_day: dayOfMonthField(),
  default_amount: amountField,
  category_id: z.string().optional(),
});

export type RecurringBillFormInput = z.input<typeof recurringBillSchema>;
export type RecurringBillFormData = z.output<typeof recurringBillSchema>;
