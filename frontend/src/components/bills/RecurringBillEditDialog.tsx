import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, Check, X } from "lucide-react";
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
import { useUpdateRecurringBill, useDeleteRecurringBill } from "../../hooks/useRecurringBills";
import { useUpdateBillInstance } from "../../hooks/useBillInstances";
import type { RecurringBillRead, BillInstanceRead } from "../../types/bill";

interface RecurringBillEditDialogProps {
  bill: RecurringBillRead;
  /** Instance do mês atualmente visível, se já tiver sido gerada. */
  currentInstance?: BillInstanceRead;
}

export function RecurringBillEditDialog({ bill, currentInstance }: RecurringBillEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [applyToCurrentMonth, setApplyToCurrentMonth] = useState(false);

  const updateBill = useUpdateRecurringBill();
  const deleteBill = useDeleteRecurringBill();
  const updateInstance = useUpdateBillInstance();

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

  const isSaving = updateBill.isPending || updateInstance.isPending;

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
      {
        onSuccess: () => {
          if (applyToCurrentMonth && currentInstance) {
            updateInstance.mutate(
              { id: currentInstance.id, payload: { amount: data.default_amount } },
              { onSuccess: () => setOpen(false) }
            );
          } else {
            setOpen(false);
          }
        },
      }
    );
  };

  const handleDelete = () => {
    deleteBill.mutate(bill.id, { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          reset(defaultValues());
          setConfirmingDelete(false);
          setApplyToCurrentMonth(false);
        }
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
          <DialogDescription>
            As alterações aplicam-se por padrão só aos próximos meses gerados.
          </DialogDescription>
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

          {currentInstance && (
            <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Checkbox
                checked={applyToCurrentMonth}
                onCheckedChange={(checked) => setApplyToCurrentMonth(checked === true)}
              />
              <span className="text-sm text-slate-700">
                Aplicar também à conta deste mês
                <span className="block text-xs text-slate-500">
                  Atualiza o valor da instância já gerada para este mês com o novo valor base.
                </span>
              </span>
            </label>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            {confirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Eliminar esta conta?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteBill.isPending}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar conta
              </button>
            )}

            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" isLoading={isSaving}>
                Guardar
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}