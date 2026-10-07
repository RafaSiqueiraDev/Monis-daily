import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
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
import { Checkbox } from "../ui/checkbox";
import { MonthPicker } from "../ui/month-picker";
import {
  incomeEditSchema,
  type IncomeEditFormInput,
  type IncomeEditFormData,
} from "../../lib/validations/incomeEdit";
import { useUpdateIncome } from "../../hooks/useIncomes";
import type { IncomeRead } from "../../types/income";

export function IncomeEditDialog({ income }: { income: IncomeRead }) {
  const [open, setOpen] = useState(false);
  const updateIncome = useUpdateIncome();

  const defaultValues = (): IncomeEditFormInput => ({
    description: income.description,
    amount: Number(income.amount ?? 0).toFixed(2),
    reference_month: income.reference_month,
    received: income.received,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IncomeEditFormInput>({
    resolver: zodResolver(incomeEditSchema),
    defaultValues: defaultValues(),
  });

  const onSubmit = (data: IncomeEditFormData) => {
    updateIncome.mutate(
      {
        id: income.id,
        payload: {
          description: data.description,
          amount: data.amount,
          reference_month: data.reference_month,
          received: data.received,
        },
      },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset(defaultValues());
      }}
    >
      <DialogTrigger asChild>
        <button
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          title="Editar receita"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar receita</DialogTitle>
          <DialogDescription>Atualiza os dados desta receita</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-income-description">Descrição</Label>
            <Input id="edit-income-description" {...register("description")} />
            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-income-amount">Valor</Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <AmountInput
                    id="edit-income-amount"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.amount && <p className="text-xs text-red-600">{errors.amount.message as string}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Mês de referência</Label>
              <Controller
                name="reference_month"
                control={control}
                render={({ field }) => <MonthPicker value={field.value} onChange={field.onChange} />}
              />
            </div>
          </div>

          <Controller
            name="received"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2.5">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                <span className="text-sm text-slate-700">Já recebido</span>
              </label>
            )}
          />

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={updateIncome.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}