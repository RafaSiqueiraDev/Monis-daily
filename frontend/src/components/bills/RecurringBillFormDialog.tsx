import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { format, addMonths } from "date-fns";
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
import { MonthPicker } from "../ui/month-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import {
  recurringBillSchema,
  type RecurringBillFormInput,
  type RecurringBillFormData,
} from "../../lib/validations/recurringBill";
import { useCreateRecurringBill } from "../../hooks/useRecurringBills";

const defaultValues = (): RecurringBillFormInput => ({
  description: "",
  type: "fixed",
  due_day: 1,
  default_amount: "",
  recurrence_type: "continuous",
  active_until: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
});

export function RecurringBillFormDialog() {
  const [open, setOpen] = useState(false);
  const createBill = useCreateRecurringBill();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<RecurringBillFormInput>({
    resolver: zodResolver(recurringBillSchema),
    defaultValues: defaultValues(),
  });

  const recurrenceType = watch("recurrence_type");

  const onSubmit = (data: RecurringBillFormData) => {
    createBill.mutate(
      {
        description: data.description,
        type: data.type,
        due_day: data.due_day,
        default_amount: data.default_amount,
        active_until: data.recurrence_type === "limited" ? data.active_until ?? null : null,
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
        <Button>
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conta recorrente</DialogTitle>
          <DialogDescription>Cria um modelo que se repete todos os meses</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" placeholder="Ex: Renda, Internet, Luz..." {...register("description")} />
            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixa (valor não muda)</SelectItem>
                    <SelectItem value="variable">Variável (valor muda mês a mês)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="due_day">Dia de vencimento</Label>
              <Input id="due_day" type="number" min={1} max={31} {...register("due_day")} />
              {errors.due_day && <p className="text-xs text-red-600">{errors.due_day.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="default_amount">Valor base (€)</Label>
              <Controller
                name="default_amount"
                control={control}
                render={({ field }) => (
                  <AmountInput
                    id="default_amount"
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

          <div className="flex flex-col gap-1.5 rounded-lg border border-slate-200 p-3">
            <Label>Recorrência</Label>
            <Controller
              name="recurrence_type"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      checked={field.value === "continuous"}
                      onChange={() => field.onChange("continuous")}
                      className="h-4 w-4 accent-slate-900"
                    />
                    Recorrente contínua (sem data final)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      checked={field.value === "limited"}
                      onChange={() => field.onChange("limited")}
                      className="h-4 w-4 accent-slate-900"
                    />
                    Válida até um mês específico
                  </label>
                </div>
              )}
            />

            {recurrenceType === "limited" && (
              <div className="mt-1 flex flex-col gap-1.5">
                <Label htmlFor="active_until">Válida até</Label>
                <Controller
                  name="active_until"
                  control={control}
                  render={({ field }) => (
                    <MonthPicker value={field.value ?? ""} onChange={field.onChange} />
                  )}
                />
                {errors.active_until && (
                  <p className="text-xs text-red-600">{errors.active_until.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={createBill.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}