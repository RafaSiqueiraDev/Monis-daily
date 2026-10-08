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
  recurringBillSchema, type RecurringBillFormInput, type RecurringBillFormData,
} from "../../lib/validations/recurringBill";
import { useCreateRecurringBill } from "../../hooks/useRecurringBills";
import { useCategories } from "../../hooks/useCategories";

const defaultValues = (): RecurringBillFormInput => ({
  description: "",
  type: "fixed",
  due_day: 1,
  default_amount: "",
  category_id: undefined,
});

export function RecurringBillFormDialog() {
  const [open, setOpen] = useState(false);
  const createBill = useCreateRecurringBill();
  const { data: categories } = useCategories();

  const {
    register, handleSubmit, control, reset, formState: { errors },
  } = useForm<RecurringBillFormInput>({
    resolver: zodResolver(recurringBillSchema),
    defaultValues: defaultValues(),
  });

  const onSubmit = (data: RecurringBillFormData) => {
    createBill.mutate(
      { ...data, category_id: data.category_id || null },
      { onSuccess: () => { reset(defaultValues()); setOpen(false); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) reset(defaultValues()); }}>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixa (valor não muda)</SelectItem>
                    <SelectItem value="variable">Variável (valor muda mês a mês)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categoria (opcional)</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
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
              <Label htmlFor="default_amount">Valor base</Label>
              <Controller
                name="default_amount"
                control={control}
                render={({ field }) => (
                  <AmountInput id="default_amount" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
              {errors.default_amount && <p className="text-xs text-red-600">{errors.default_amount.message as string}</p>}
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit" isLoading={createBill.isPending}>Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}