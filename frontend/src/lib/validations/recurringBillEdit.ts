import { z } from "zod";
import { amountField, dayOfMonthField } from "./shared";

export const recurringBillEditSchema = z.object({
  description: z.string().min(1, "A descrição é obrigatória").max(150),
  due_day: dayOfMonthField(),
  default_amount: amountField,
  category_id: z.string().optional(),
  active: z.boolean().default(true),
});

export type RecurringBillEditFormInput = z.input<typeof recurringBillEditSchema>;
export type RecurringBillEditFormData = z.output<typeof recurringBillEditSchema>;
