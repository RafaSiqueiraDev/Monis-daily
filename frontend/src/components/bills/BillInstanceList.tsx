import { CalendarClock } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { displayCurrency } from "../../utils/currency";
import { useMarkBillInstancePaid } from "../../hooks/useBillInstances";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";
import { RecurringBillEditDialog } from "./RecurringBillEditDialog";
import type { BillInstanceRead, RecurringBillRead } from "../../types/bill";

export function BillInstanceList({
  instances,
  templates,
  isLoading,
}: {
  instances: BillInstanceRead[];
  templates: RecurringBillRead[];
  isLoading: boolean;
}) {
  const markPaid = useMarkBillInstancePaid();
  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);
  const today = new Date().getDate();
  const sorted = [...instances].sort((a, b) => a.due_day - b.due_day);

  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}

        {!isLoading && sorted.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            Ainda não geraste as contas deste mês. Usa o botão "Atualizar / Gerar Mês".
          </p>
        )}

        {sorted.map((instance) => {
          const isOverdue = instance.status === "pending" && instance.due_day < today;
          const template = templates.find((t) => t.id === instance.recurring_bill_id);

          return (
            <div
              key={instance.id}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{instance.description}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500">Vence dia {instance.due_day}</p>
                    <Badge variant={isOverdue ? "destructive" : instance.status === "paid" ? "paid" : "pending"}>
                      {isOverdue ? "Atrasado" : instance.status === "paid" ? "Pago" : "Pendente"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {displayCurrency(instance.amount, hideAmounts)}
                </span>
                {instance.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={markPaid.isPending && markPaid.variables?.id === instance.id}
                    onClick={() => markPaid.mutate({ id: instance.id, status: "paid" })}
                  >
                    Pago
                  </Button>
                )}
                {template && <RecurringBillEditDialog bill={template} />}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}