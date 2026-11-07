import { z } from "zod";
import { optionalNonNegativeAmountField } from "./shared";

export const investmentAssetSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório").max(120),
  category: z.enum(["fixed_income", "fund", "stock", "treasury", "savings", "other"], {
    error: "Seleciona a categoria",
  }),
  currency: z.enum(["EUR", "BRL", "USD", "GBP", "CHF"], { error: "Seleciona a moeda" }),
  institution: z.string().max(120).optional(),
  maturity_date: z.string().optional(),
  ticker: z.string().max(20).optional(),
  shares_quantity: z.string().optional(),
  average_price: z.string().optional(),
  initial_balance: optionalNonNegativeAmountField,
});

export type InvestmentAssetFormInput = z.input<typeof investmentAssetSchema>;
export type InvestmentAssetFormData = z.output<typeof investmentAssetSchema>;
