import { useMemo, useState } from "react";
import { RefreshCw, CalendarClock } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { BillInstanceList } from "./BillInstanceList";
import { RecurringBillFormDialog } from "./RecurringBillFormDialog";
import { useBillInstances } from "../../hooks/useBillInstances";
import { useRecurringBills, useGenerateMonthInstances } from "../../hooks/useRecurringBills";
import { displayCurrency } from "../../utils/currency";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";

const ALL_STATUS = "all";

export function BillsSection({ referenceMonth, currency }: { referenceMonth: string; currency: string }) {
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS);
  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);

  const { data: instances, isLoading: isInstancesLoading } = useBillInstances(referenceMonth);
  const { data: templates, isLoading: isTemplatesLoading } = useRecurringBills();
  const generateMonth = useGenerateMonthInstances();

  const allInstances = instances ?? [];

  const filteredInstances = useMemo(() => {
    if (statusFilter === ALL_STATUS) return allInstances;
    return allInstances.filter((instance) => instance.status === statusFilter);
  }, [allInstances, statusFilter]);

  const totalFixed = allInstances.reduce((sum, instance) => sum + Number(instance.amount ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-10 items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Contas Fixas</h2>
        <div className="flex gap-2">
          <RecurringBillFormDialog />
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            isLoading={generateMonth.isPending}
            onClick={() => generateMonth.mutate(referenceMonth)}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar / Gerar Mês
          </Button>
        </div>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-9 sm:w-56">
          <SelectValue placeholder="Todas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUS}>Todas</SelectItem>
          <SelectItem value="paid">Pagas</SelectItem>
          <SelectItem value="pending">Pendentes</SelectItem>
        </SelectContent>
      </Select>

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total contas fixas</p>
            <p className="text-lg font-semibold text-slate-900">
              {displayCurrency(totalFixed, hideAmounts, currency)}
            </p>
          </div>
        </CardContent>
      </Card>

      <BillInstanceList
        instances={filteredInstances}
        templates={templates ?? []}
        isLoading={isInstancesLoading || isTemplatesLoading}
      />
    </div>
  );
}