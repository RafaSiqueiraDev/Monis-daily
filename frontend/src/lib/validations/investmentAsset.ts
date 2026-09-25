import { z } from "zod";

export const investmentAssetSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório").max(120),
  category: z.enum(["fixed_income", "fund", "stock", "treasury", "savings", "other"], {
    required_error: "Seleciona a categoria",
  }),
  currency: z.enum(["EUR", "BRL", "USD", "GBP", "CHF"], { required_error: "Seleciona a moeda" }),
});

export type InvestmentAssetFormData = z.infer<typeof investmentAssetSchema>;