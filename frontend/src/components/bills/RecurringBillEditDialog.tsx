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
import {
  recurringBillEditSchema,
  type RecurringBillEditFormInput,
  type RecurringBillEditFormData,
} from "../../lib/validations/recurringBillEdit";
import { useUpdateRecurringBill } from "../../hooks/useRecurringBills";
import type { RecurringBillRead } from "../../types/bill";

export function RecurringBillEditDialog({ bill }: { bill: RecurringBillRead }) {
  const [open, setOpen] = useState(false);
  const updateBill = useUpdateRecurringBill();

  const defaultValues = (): RecurringBillEditFormInput => ({
    description: bill.description ?? "",
    due_day: Number(bill.due_day ?? 1),
    default_amount: Number(bill.default_amount ?? 0).toFixed(2),
    active: bill.active ?? true,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RecurringBillEditFormInput>({
    resolver: zodResolver(recurringBillEditSchema),
    defaultValues: defaultValues(),
  });

  const onSubmit = (data: RecurringBillEditFormData) => {
    updateBill.mutate(
      {
        id: bill.id,
        payload: {
          description: data.description,
          due_day: data.due_day,
          default_amount: data.default_amount,
          active: data.active,
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
          title="Editar conta"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar conta fixa</DialogTitle>
          <DialogDescription>As alterações aplicam-se a partir dos próximos meses gerados</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-description">Descrição</Label>
            <Input id="edit-description" {...register("description")} />
            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-due_day">Dia de vencimento</Label>
              <Input id="edit-due_day" type="number" min={1} max={31} {...register("due_day")} />
              {errors.due_day && <p className="text-xs text-red-600">{errors.due_day.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-default_amount">Valor base</Label>
              <Controller
                name="default_amount"
                control={control}
                render={({ field }) => (
                  <AmountInput
                    id="edit-default_amount"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.default_amount && (
                <p className="text-xs text-red-600">{errors.default_amount.message as string}</p>
              )}
            </div>
          </div>

          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2.5">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                <span className="text-sm text-slate-700">Conta ativa (desmarca para desativar)</span>
              </label>
            )}
          />

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={updateBill.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}