import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AmountInput } from "../ui/amount-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { amountField } from "../../lib/validations/shared";
import { useCreateContribution } from "../../hooks/useInvestmentContributions";
import type { InvestmentAssetRead } from "../../types/investment";

const contributionSchema = z.object({
  amount: amountField,
  contribution_date: z.string().min(1, "A data é obrigatória"),
  note: z.string().max(200).optional(),
});
type ContributionFormInput = { amount: string; contribution_date: string; note?: string };
type ContributionFormData = z.infer<typeof contributionSchema>;

export function ContributionFormDialog({ assets }: { assets: InvestmentAssetRead[] }) {
  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState<string>(assets[0]?.id ?? "");
  const createContribution = useCreateContribution(assetId || null);

  const defaultValues = (): ContributionFormInput => ({
    amount: "",
    contribution_date: format(new Date(), "yyyy-MM-dd"),
    note: "",
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ContributionFormInput>({
    resolver: zodResolver(contributionSchema),
    defaultValues: defaultValues(),
  });

  const onSubmit = (data: ContributionFormData) => {
    if (!assetId) return;
    createContribution.mutate(data, {
      onSuccess: () => {
        reset(defaultValues());
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) reset(defaultValues()); }}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={assets.length === 0}>
          <PlusCircle className="h-4 w-4" />
          Registar Aporte
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar aporte</DialogTitle>
          <DialogDescription>
            O valor soma-se automaticamente ao saldo do ativo no mês correspondente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Ativo</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleciona um ativo" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name} ({asset.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contrib-amount">Valor</Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <AmountInput id="contrib-amount" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
              {errors.amount && <p className="text-xs text-red-600">{errors.amount.message as string}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contrib-date">Data</Label>
              <Input id="contrib-date" type="date" {...register("contribution_date")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contrib-note">Observação (opcional)</Label>
            <Input id="contrib-note" placeholder="Ex: depósito mensal" {...register("note")} />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" isLoading={createContribution.isPending} disabled={!assetId}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}