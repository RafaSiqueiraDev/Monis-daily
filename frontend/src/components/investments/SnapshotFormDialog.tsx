import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
import { Label } from "../ui/label";
import { AmountInput } from "../ui/amount-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import {
  investmentSnapshotSchema,
  type InvestmentSnapshotFormInput,
  type InvestmentSnapshotFormData,
} from "../../lib/validations/investmentSnapshot";
import { useUpsertInvestmentSnapshot } from "../../hooks/useInvestmentSnapshots";
import type { InvestmentAssetRead } from "../../types/investment";
import type { SnapshotWithAsset } from "../../hooks/useInvestmentSnapshots";

interface SnapshotFormDialogProps {
  referenceMonth: string;
  assets: InvestmentAssetRead[];
  existingSnapshots: SnapshotWithAsset[];
}

export function SnapshotFormDialog({ referenceMonth, assets, existingSnapshots }: SnapshotFormDialogProps) {
  const [open, setOpen] = useState(false);
  const upsertSnapshot = useUpsertInvestmentSnapshot();

  const defaultValues = (): InvestmentSnapshotFormInput => ({
    asset_id: assets[0]?.id ?? "",
    balance: "",
    contribution: "",
  });

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<InvestmentSnapshotFormInput>({
    resolver: zodResolver(investmentSnapshotSchema),
    defaultValues: defaultValues(),
  });

  const selectedAssetId = watch("asset_id");

  useEffect(() => {
    const existing = existingSnapshots.find((s) => s.asset_id === selectedAssetId);
    if (existing) {
      const balanceNum = Number(existing.balance ?? 0);
      const contributionNum = Number(existing.contribution ?? 0);
      reset({
        asset_id: selectedAssetId,
        balance: Number.isFinite(balanceNum) ? balanceNum.toFixed(2) : "",
        contribution: Number.isFinite(contributionNum) && contributionNum > 0 ? contributionNum.toFixed(2) : "",
      });
    } else {
      reset({ asset_id: selectedAssetId, balance: "", contribution: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssetId]);

  const onSubmit = (data: InvestmentSnapshotFormData) => {
    upsertSnapshot.mutate(
      {
        asset_id: data.asset_id,
        reference_month: referenceMonth,
        balance: data.balance,
        contribution: data.contribution,
      },
      {
        onSuccess: () => {
          reset(defaultValues());
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={assets.length === 0}>
          <Plus className="h-4 w-4" />
          Atualizar Saldo
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar saldo do mês</DialogTitle>
          <DialogDescription>
            Se já existir um registo deste ativo neste mês, o valor é atualizado automaticamente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Ativo</Label>
            <Controller
              name="asset_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />
            {errors.asset_id && <p className="text-xs text-red-600">{errors.asset_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="balance">Saldo atual</Label>
              <Controller
                name="balance"
                control={control}
                render={({ field }) => (
                  <AmountInput id="balance" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
              {errors.balance && <p className="text-xs text-red-600">{errors.balance.message as string}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contribution">Aporte no mês — opcional</Label>
              <Controller
                name="contribution"
                control={control}
                render={({ field }) => (
                  <AmountInput
                    id="contribution"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={upsertSnapshot.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}