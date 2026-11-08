import { z } from "zod";
import { optionalAmountField } from "./shared";

/** Dados de mercado de um ativo: ticker, quantidade e preço médio de compra. */
export const assetMarketDataSchema = z.object({
  ticker: z.string().max(20, "Máximo 20 caracteres"),
  shares_quantity: optionalAmountField,
  average_price: optionalAmountField,
});

export type AssetMarketDataFormInput = z.input<typeof assetMarketDataSchema>;
export type AssetMarketDataFormData = z.output<typeof assetMarketDataSchema>;

/**
 * O backend aceita até 6 casas decimais na quantidade e 4 no preço médio;
 * enviamos strings já arredondadas para não perder precisão no JSON.
 */
export function toSharesPayload(value: number | undefined): string | null {
  return value === undefined ? null : value.toFixed(6);
}

export function toAveragePricePayload(value: number | undefined): string | null {
  return value === undefined ? null : value.toFixed(4);
}
