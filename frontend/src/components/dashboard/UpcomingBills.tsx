import { CalendarClock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { displayCurrency } from "../../utils/currency";
import { useBillInstances, useMarkBillInstancePaid } from "../../hooks/useBillInstances";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";
import { getCategoryVisual } from "../../utils/categoryIcons";

type Urgency = "overdue" | "urgent" | "normal";

function getUrgency(dueDay: number, today: number): Urgency {
  if (dueDay < today) return "overdue";
  if (dueDay - today <= 1) return "urgent"; // vence hoje ou amanhã
  return "normal";
}

const urgencyStyles: Record<Urgency, { badge: "destructive" | "pending" | "default"; label: string }> = {
  overdue: { badge: "destructive", label: "Atrasado" },
  urgent: { badge: "pending", label: "Vence já" },
  normal: { badge: "default", label: "Pendente" },
};

export function UpcomingBills({ referenceMonth }: { referenceMonth: string }) {
  const { data, isLoading } = useBillInstances(referenceMonth, "pending");
  const markPaid = useMarkBillInstancePaid();
  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);

  const today = new Date().getDate();
  const sorted = [...(data ?? [])].sort((a, b) => a.due_day - b.due_day);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos Pagamentos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}

        {!isLoading && sorted.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">
            Todas as contas deste mês estão pagas 🎉
          </p>
        )}

        {sorted.map((instance) => {
          const urgency = getUrgency(instance.due_day, today);
          const style = urgencyStyles[urgency];
          const visual = getCategoryVisual(instance.description);
          const Icon = visual.icon;

          return (
            <div
              key={instance.id}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${visual.iconBg} ${visual.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{instance.description}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500">Vence dia {instance.due_day}</p>
                    <Badge variant={style.badge}>{style.label}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-900">
                  {displayCurrency(instance.amount, hideAmounts)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={markPaid.isPending && markPaid.variables?.id === instance.id}
                  onClick={() => markPaid.mutate({ id: instance.id, status: "paid" })}
                >
                  Pago
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}