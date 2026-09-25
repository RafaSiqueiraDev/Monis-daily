import { useState } from "react";
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AmountInput } from "../ui/amount-input";
import { Checkbox } from "../ui/checkbox";
import { MonthPicker } from "../ui/month-picker";
import { incomeSchema, type IncomeFormInput, type IncomeFormData } from "../../lib/validations/income";
import { useCreateIncome } from "../../hooks/useIncomes";

export function IncomeFormDialog({ defaultReferenceMonth }: { defaultReferenceMonth: string }) {
  const [open, setOpen] = useState(false);
  const createIncome = useCreateIncome();

  const defaultValues = (): IncomeFormInput => ({
    description: "",
    amount: "",
    reference_month: defaultReferenceMonth,
    received: false,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IncomeFormInput>({
    resolver: zodResolver(incomeSchema),
    defaultValues: defaultValues(),
  });

  const onSubmit = (data: IncomeFormData) => {
    createIncome.mutate(data, {
      onSuccess: () => {
        reset(defaultValues());
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nova Receita
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova receita</DialogTitle>
          <DialogDescription>Regista uma fonte de rendimento</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" placeholder="Ex: Salário, Freelance..." {...register("description")} />
            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Valor (€)</Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <AmountInput id="amount" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
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
            <Button type="submit" isLoading={createIncome.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}