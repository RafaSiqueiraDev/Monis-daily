import { z } from "zod";
import { nonNegativeAmountField, optionalNonNegativeAmountField } from "./shared";

export const investmentSnapshotSchema = z.object({
  asset_id: z.string().min(1, "Seleciona um ativo"),
  balance: nonNegativeAmountField,
  contribution: optionalNonNegativeAmountField,
});

export type InvestmentSnapshotFormInput = {
  asset_id: string;
  balance: string;
  contribution: string;
};

export type InvestmentSnapshotFormData = z.infer<typeof investmentSnapshotSchema>;