import { z } from "zod";
import { optionalAmountField, dayOfMonthField } from "./shared";

export const creditCardSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório").max(80),
  closing_day: dayOfMonthField(),
  due_day: dayOfMonthField(),
  credit_limit: optionalAmountField,
});

export type CreditCardFormInput = z.input<typeof creditCardSchema>;
export type CreditCardFormData = z.output<typeof creditCardSchema>;
