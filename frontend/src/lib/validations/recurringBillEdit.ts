import { z } from "zod";
import { amountField } from "./shared";

export const recurringBillEditSchema = z.object({
  description: z.string().min(1, "A descrição é obrigatória").max(150),
  due_day: z.coerce
    .number({ invalid_type_error: "Indica um dia válido" })
    .int()
    .min(1, "O dia tem de estar entre 1 e 31")
    .max(31, "O dia tem de estar entre 1 e 31"),
  default_amount: amountField,
  active: z.boolean().default(true),
});

export type RecurringBillEditFormInput = {
  description: string;
  due_day: number;
  default_amount: string;
  active: boolean;
};

export type RecurringBillEditFormData = z.infer<typeof recurringBillEditSchema>;