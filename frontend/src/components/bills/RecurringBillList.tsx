import { Repeat } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { formatCurrency } from "../../utils/currency";
import type { RecurringBillRead } from "../../types/bill";

export function RecurringBillList({
  bills,
  isLoading,
}: {
  bills: RecurringBillRead[];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}

        {!isLoading && bills.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            Ainda não tens nenhuma conta fixa configurada.
          </p>
        )}

        {bills.map((bill) => (
          <div
            key={bill.id}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Repeat className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{bill.description}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">Vence todo dia {bill.due_day}</p>
                  <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                    {bill.type === "fixed" ? "Fixa" : "Variável"}
                  </Badge>
                </div>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {formatCurrency(bill.default_amount)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}