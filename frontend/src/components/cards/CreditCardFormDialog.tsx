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
import { creditCardSchema, type CreditCardFormInput, type CreditCardFormData } from "../../lib/validations/creditCard";
import { useCreateCreditCard } from "../../hooks/useCreditCards";

const defaultValues = (): CreditCardFormInput => ({
  name: "",
  closing_day: 1,
  due_day: 10,
  credit_limit: "",
});

export function CreditCardFormDialog() {
  const [open, setOpen] = useState(false);
  const createCard = useCreateCreditCard();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreditCardFormInput>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: defaultValues(),
  });

  const onSubmit = (data: CreditCardFormData) => {
    createCard.mutate(
      { ...data, credit_limit: data.credit_limit ?? null },
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
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          Novo Cartão
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cartão de crédito</DialogTitle>
          <DialogDescription>Regista os dados de fecho e vencimento da fatura</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome do cartão</Label>
            <Input id="name" placeholder="Ex: Visa Gold" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="closing_day">Dia de fecho</Label>
              <Input id="closing_day" type="number" min={1} max={31} {...register("closing_day")} />
              {errors.closing_day && <p className="text-xs text-red-600">{errors.closing_day.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="due_day">Dia de vencimento</Label>
              <Input id="due_day" type="number" min={1} max={31} {...register("due_day")} />
              {errors.due_day && <p className="text-xs text-red-600">{errors.due_day.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="credit_limit">Limite de crédito (€) — opcional</Label>
            <Controller
              name="credit_limit"
              control={control}
              render={({ field }) => (
                <AmountInput id="credit_limit" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
              )}
            />
            {errors.credit_limit && <p className="text-xs text-red-600">{errors.credit_limit.message as string}</p>}
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={createCard.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}