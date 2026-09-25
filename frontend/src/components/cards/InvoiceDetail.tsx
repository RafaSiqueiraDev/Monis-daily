import { Receipt } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { formatCurrency } from "../../utils/currency";
import { formatDateShort } from "../../utils/date";
import { useUpdateCardInvoiceStatus } from "../../hooks/useCardInvoices";
import type { CardInvoiceRead } from "../../types/creditCard";

export function InvoiceDetail({ invoice, isLoading }: { invoice: CardInvoiceRead | null; isLoading: boolean }) {
  const updateStatus = useUpdateCardInvoiceStatus();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-2 p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-slate-400">
          Sem fatura gerada para este cartão neste mês. Regista uma compra para criares uma.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Fatura do mês</CardTitle>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(invoice.total_amount)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={invoice.status === "paid" ? "paid" : "pending"}>
            {invoice.status === "paid" ? "Paga" : "Pendente"}
          </Badge>
          {invoice.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              isLoading={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: invoice.id, status: "paid" })}
            >
              Marcar fatura como paga
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1 border-t border-slate-100 pt-4">
        {invoice.installments.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">Sem lançamentos nesta fatura.</p>
        )}

        {invoice.installments.map((installment) => (
          <div
            key={installment.id}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{installment.description}</p>
                <p className="text-xs text-slate-500">
                  {formatDateShort(installment.purchase_date)} · Parcela {installment.installment_number}/
                  {installment.installments_count}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-900">{formatCurrency(installment.amount)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}