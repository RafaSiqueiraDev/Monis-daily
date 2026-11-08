import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { TickerLookupHint } from "./TickerLookupHint";
import { useUpdateInvestmentAsset } from "../../hooks/useInvestmentAssets";
import { useSyncQuotes, apiErrorMessage } from "../../hooks/useQuotes";
import {
  assetMarketDataSchema,
  toAveragePricePayload,
  toSharesPayload,
  type AssetMarketDataFormData,
  type AssetMarketDataFormInput,
} from "../../lib/validations/assetMarketData";
import type { InvestmentAssetRead } from "../../types/investment";

const toInput = (asset?: InvestmentAssetRead): AssetMarketDataFormInput => ({
  ticker: asset?.ticker ?? "",
  shares_quantity: asset?.shares_quantity != null ? String(asset.shares_quantity) : "",
  average_price: asset?.average_price != null ? String(asset.average_price) : "",
});

interface AssetMarketDataDialogProps {
  /** Ativos que podem ser escolhidos no seletor */
  assets: InvestmentAssetRead[];
  /** Se definido, o diálogo abre já neste ativo (e esconde o seletor) */
  asset?: InvestmentAssetRead;
  trigger: ReactNode;
}

/**
 * Associa/edita ticker, quantidade e preço médio de um ativo existente.
 * Ao guardar com ticker, sincroniza logo a cotação para o valor de mercado
 * aparecer de imediato.
 */
export function AssetMarketDataDialog({ assets, asset, trigger }: AssetMarketDataDialogProps) {
  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState(asset?.id ?? "");
  const [lookupTicker, setLookupTicker] = useState(asset?.ticker ?? "");
  const updateAsset = useUpdateInvestmentAsset();
  const syncQuotes = useSyncQuotes();

  const selected = asset ?? assets.find((a) => a.id === assetId);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<
    AssetMarketDataFormInput, unknown, AssetMarketDataFormData
  >({
    resolver: zodResolver(assetMarketDataSchema),
    defaultValues: toInput(selected),
  });

  const loadAsset = (target?: InvestmentAssetRead) => {
    reset(toInput(target));
    setLookupTicker(target?.ticker ?? "");
    updateAsset.reset();
  };

  const onSubmit = (data: AssetMarketDataFormData) => {
    if (!selected) return;
    const ticker = data.ticker.trim();
    updateAsset.mutate(
      {
        id: selected.id,
        payload: {
          ticker: ticker || null,
          shares_quantity: toSharesPayload(data.shares_quantity),
          average_price: toAveragePricePayload(data.average_price),
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          if (ticker) syncQuotes.mutate();
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) loadAsset(selected);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{asset ? `Cotação · ${asset.name}` : "Associar ticker a um ativo"}</DialogTitle>
          <DialogDescription>
            Com ticker e quantidade, o saldo do mês passa a ser calculado pela cotação de mercado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {!asset && (
            <div className="flex flex-col gap-1.5">
              <Label>Ativo</Label>
              <Select
                value={assetId}
                onValueChange={(id) => {
                  setAssetId(id);
                  loadAsset(assets.find((a) => a.id === id));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Escolhe um ativo..." /></SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="md-ticker">Ticker</Label>
            <Input
              id="md-ticker"
              placeholder="Ex: VWCE.DE, AAPL, PETR4.SA"
              autoCapitalize="characters"
              autoComplete="off"
              {...register("ticker", { onBlur: (e) => setLookupTicker(e.target.value) })}
            />
            <TickerLookupHint ticker={lookupTicker} />
            {errors.ticker && <p className="text-xs text-red-600">{errors.ticker.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="md-shares">Quantidade</Label>
              <Input id="md-shares" inputMode="decimal" placeholder="Ex: 12,5" {...register("shares_quantity")} />
              {errors.shares_quantity && <p className="text-xs text-red-600">{errors.shares_quantity.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="md-avg">Preço médio {selected ? `(${selected.currency})` : ""}</Label>
              <Input id="md-avg" inputMode="decimal" placeholder="Ex: 98,40" {...register("average_price")} />
              {errors.average_price && <p className="text-xs text-red-600">{errors.average_price.message}</p>}
            </div>
          </div>

          {updateAsset.isError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              {apiErrorMessage(updateAsset.error, "Não foi possível guardar. Tenta novamente.")}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit" isLoading={updateAsset.isPending} disabled={!selected}>Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
