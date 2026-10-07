import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { format } from "date-fns";
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
import { expenseSchema, type ExpenseFormInput, type ExpenseFormData } from "../../lib/validations/expense";
import { useCreateDailyExpense } from "../../hooks/useDailyExpenses";
import { useCategories } from "../../hooks/useCategories";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";
import { COUNTRIES } from "../../types/country";

const defaultFormValues = (): ExpenseFormInput => ({
  description: "",
  amount: "",
  expense_date: format(new Date(), "yyyy-MM-dd"),
  category_id: undefined,
});

export function ExpenseFormDialog({ trigger }: { trigger?: React.ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const { data: categories } = useCategories();
  const createExpense = useCreateDailyExpense();
  const selectedCountry = useUiPreferencesStore((state) => state.selectedCountry);
  const countryInfo = COUNTRIES[selectedCountry];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaultFormValues(),
  });

  const onSubmit = (data: ExpenseFormData) => {
    createExpense.mutate(
      {
        description: data.description,
        amount: data.amount,
        expense_date: data.expense_date,
        category_id: data.category_id ?? null,
        country: selectedCountry,
        currency: countryInfo.currency as any,
      },
      {
        onSuccess: () => {
          reset(defaultFormValues());
          setOpen(false);
        },
      }
    );
  };

  const expenseCategories = categories?.filter((c) => c.kind === "daily" || c.kind === "variable");

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) reset(defaultFormValues()); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova despesa</DialogTitle>
          <DialogDescription>
            Regista um gasto do dia a dia — vai ser associado a {countryInfo.flag} {countryInfo.label} (
            {countryInfo.currency})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" placeholder="Ex: Café, Supermercado..." {...register("description")} />
            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Valor ({countryInfo.currency})</Label>
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
              <Label htmlFor="expense_date">Data</Label>
              <Input id="expense_date" type="date" {...register("expense_date")} />
              {errors.expense_date && <p className="text-xs text-red-600">{errors.expense_date.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categoria</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" isLoading={createExpense.isPending}>Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}