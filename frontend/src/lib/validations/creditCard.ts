import { z } from "zod";
import { optionalAmountField } from "./shared";

export const creditCardSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório").max(80),
  closing_day: z.coerce.number().int().min(1, "Entre 1 e 31").max(31, "Entre 1 e 31"),
  due_day: z.coerce.number().int().min(1, "Entre 1 e 31").max(31, "Entre 1 e 31"),
  credit_limit: optionalAmountField,
});

export type CreditCardFormInput = {
  name: string;
  closing_day: number;
  due_day: number;
  credit_limit: string;
};

export type CreditCardFormData = z.infer<typeof creditCardSchema>;