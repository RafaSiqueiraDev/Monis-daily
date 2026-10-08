import { z } from "zod";
import { amountField } from "./shared";

export const recurringBillSchema = z.object({
  description: z.string().min(1, "A descrição é obrigatória").max(150),
  type: z.enum(["fixed", "variable"], { required_error: "Seleciona o tipo" }),
  due_day: z.coerce.number().int().min(1, "Entre 1 e 31").max(31, "Entre 1 e 31"),
  default_amount: amountField,
  category_id: z.string().optional(),
});

export type RecurringBillFormInput = {
  description: string;
  type: "fixed" | "variable";
  due_day: number;
  default_amount: string;
  category_id?: string;
};

export type RecurringBillFormData = z.infer<typeof recurringBillSchema>;