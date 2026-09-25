import { useState } from "react";
import { format, startOfMonth } from "date-fns";
import { RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { MonthPicker } from "../components/ui/month-picker";
import { BillInstanceList } from "../components/bills/BillInstanceList";
import { RecurringBillFormDialog } from "../components/bills/RecurringBillFormDialog";
import { useBillInstances } from "../hooks/useBillInstances";
import { useGenerateMonthInstances } from "../hooks/useRecurringBills";

export default function BillsPage() {
  const [referenceMonth, setReferenceMonth] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: instances, isLoading } = useBillInstances(referenceMonth);
  const generateMonth = useGenerateMonthInstances();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Contas Fixas</h1>
          <p className="text-sm text-slate-500">As tuas contas recorrentes do mês</p>
        </div>
        <div className="flex gap-2">
          <RecurringBillFormDialog />
          <Button
            variant="outline"
            isLoading={generateMonth.isPending}
            onClick={() => generateMonth.mutate(referenceMonth)}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar / Gerar Mês
          </Button>
        </div>
      </div>

      <MonthPicker value={referenceMonth} onChange={setReferenceMonth} className="w-full sm:w-48" />

      <BillInstanceList instances={instances ?? []} isLoading={isLoading} />
    </div>
  );
}