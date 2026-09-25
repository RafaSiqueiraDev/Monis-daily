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
import {
  cardPurchaseSchema,
  type CardPurchaseFormInput,
  type CardPurchaseFormData,
} from "../../lib/validations/cardPurchase";
import { useCreateCardPurchase } from "../../hooks/useCardPurchases";

export function PurchaseFormDialog({ creditCardId }: { creditCardId: string }) {
  const [open, setOpen] = useState(false);
  const createPurchase = useCreateCardPurchase();

  const defaultValues = (): CardPurchaseFormInput => ({
    credit_card_id: creditCardId,
    description: "",
    total_amount: "",
    installments_count: 1,
    purchase_date: format(new Date(), "yyyy-MM-dd"),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CardPurchaseFormInput>({
    resolver: zodResolver(cardPurchaseSchema),
    defaultValues: defaultValues(),
  });

  const onSubmit = (data: CardPurchaseFormData) => {
    if (!creditCardId) return;

    createPurchase.mutate(
      {
        credit_card_id: creditCardId,
        description: data.description,
        total_amount: Number(data.total_amount ?? 0),
        installments_count: Number(data.installments_count ?? 1),
        purchase_date: data.purchase_date,
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset(defaultValues());
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" disabled={!creditCardId}>
          <Plus className="h-4 w-4" />
          Nova Compra
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova compra no cartão</DialogTitle>
          <DialogDescription>
            Se parcelares, as parcelas seguintes são geradas automaticamente nas faturas futuras
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" placeholder="Ex: Portátil, Viagem..." {...register("description")} />
            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="total_amount">Valor total (€)</Label>
              <Controller
                name="total_amount"
                control={control}
                render={({ field }) => (
                  <AmountInput
                    id="total_amount"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.total_amount && (
                <p className="text-xs text-red-600">{errors.total_amount.message as string}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="installments_count">Nº de parcelas</Label>
              <Input id="installments_count" type="number" min={1} max={48} {...register("installments_count")} />
              {errors.installments_count && (
                <p className="text-xs text-red-600">{errors.installments_count.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="purchase_date">Data da compra</Label>
            <Input id="purchase_date" type="date" {...register("purchase_date")} />
            {errors.purchase_date && <p className="text-xs text-red-600">{errors.purchase_date.message}</p>}
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={createPurchase.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}