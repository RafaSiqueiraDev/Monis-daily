import { z } from "zod";
import { amountField } from "./shared";

export const recurringBillEditSchema = z.object({
  description: z.string().min(1, "A descrição é obrigatória").max(150),
  due_day: z.coerce.number().int().min(1, "Entre 1 e 31").max(31, "Entre 1 e 31"),
  default_amount: amountField,
  category_id: z.string().optional(),
  active: z.boolean().default(true),
});

export type RecurringBillEditFormInput = {
  description: string;
  due_day: number;
  default_amount: string;
  category_id?: string;
  active: boolean;
};

export type RecurringBillEditFormData = z.infer<typeof recurringBillEditSchema>;