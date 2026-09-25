import { z } from "zod";
import { amountField } from "./shared";

export const recurringBillSchema = z
  .object({
    description: z.string().min(1, "A descrição é obrigatória").max(150),
    type: z.enum(["fixed", "variable"], { required_error: "Seleciona o tipo" }),
    due_day: z.coerce
      .number({ invalid_type_error: "Indica um dia válido" })
      .int()
      .min(1, "O dia tem de estar entre 1 e 31")
      .max(31, "O dia tem de estar entre 1 e 31"),
    default_amount: amountField,
    recurrence_type: z.enum(["continuous", "limited"]).default("continuous"),
    active_until: z.string().optional(),
  })
  .refine((data) => data.recurrence_type !== "limited" || !!data.active_until, {
    message: "Indica até quando a conta é válida",
    path: ["active_until"],
  });

export type RecurringBillFormInput = {
  description: string;
  type: "fixed" | "variable";
  due_day: number;
  default_amount: string;
  recurrence_type: "continuous" | "limited";
  active_until?: string;
};

export type RecurringBillFormData = z.infer<typeof recurringBillSchema>;