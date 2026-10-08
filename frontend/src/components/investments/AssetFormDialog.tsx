import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AmountInput } from "../ui/amount-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import {
  investmentAssetSchema, type InvestmentAssetFormInput, type InvestmentAssetFormData,
} from "../../lib/validations/investmentAsset";
import { useCreateInvestmentAsset } from "../../hooks/useInvestmentAssets";
import { ASSET_CATEGORY_LABELS, SUPPORTED_CURRENCIES, REGION_BY_CURRENCY } from "../../types/investment";

const defaultValues = (): InvestmentAssetFormInput => ({
  name: "", category: "stock", currency: "EUR",
  institution: "", maturity_date: "", ticker: "", shares_quantity: "", average_price: "", initial_balance: "",
});

export function AssetFormDialog() {
  const [open, setOpen] = useState(false);
  const createAsset = useCreateInvestmentAsset();

  const {
    register, handleSubmit, control, watch, reset, formState: { errors },
  } = useForm<InvestmentAssetFormInput>({
    resolver: zodResolver(investmentAssetSchema),
    defaultValues: defaultValues(),
  });

  const category = watch("category");
  const isStock = category === "stock";

  const onSubmit = (data: InvestmentAssetFormData) => {
    createAsset.mutate(
      {
        name: data.name,
        category: data.category as any,
        currency: data.currency as any,
        institution: data.institution || null,
        maturity_date: data.maturity_date || null,
        ticker: isStock ? (data.ticker || null) : null,
        shares_quantity: isStock ? (data.shares_quantity || null) : null,
        average_price: isStock ? (data.average_price || null) : null,
        initial_balance: data.initial_balance || null,
      },
      { onSuccess: () => { reset(defaultValues()); setOpen(false); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) reset(defaultValues()); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          Novo Ativo
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo ativo de investimento</DialogTitle>
          <DialogDescription>Regista uma posição para acompanhares mês a mês</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Ex: PPR Fidelidade, Tesouro Direto..." {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Categoria</Label>
              <Controller name="category" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ASSET_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Moeda</Label>
              <Controller name="currency" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((code) => (
                      <SelectItem key={code} value={code}>{REGION_BY_CURRENCY[code].flag} {code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="institution">Instituição (opcional)</Label>
              <Input id="institution" placeholder="Ex: XTB, Banco X" {...register("institution")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maturity_date">Vencimento (opcional)</Label>
              <Input id="maturity_date" type="date" {...register("maturity_date")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="initial_balance">Saldo inicial (opcional)</Label>
            <Controller name="initial_balance" control={control} render={({ field }) => (
              <AmountInput id="initial_balance" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} />
            )} />
          </div>

          {isStock && (
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">Dados de ações (opcional)</p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ticker">Ticker</Label>
                <Input id="ticker" placeholder="Ex: AAPL, MSFT" {...register("ticker")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="shares_quantity">Nº de ações</Label>
                  <Input id="shares_quantity" type="number" step="0.000001" {...register("shares_quantity")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="average_price">Preço médio</Label>
                  <Input id="average_price" type="number" step="0.0001" {...register("average_price")} />
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit" isLoading={createAsset.isPending}>Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}