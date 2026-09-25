import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { BillInstanceList } from "./BillInstanceList";
import { RecurringBillFormDialog } from "./RecurringBillFormDialog";
import { useBillInstances } from "../../hooks/useBillInstances";
import { useRecurringBills, useGenerateMonthInstances } from "../../hooks/useRecurringBills";

export function BillsSection({ referenceMonth }: { referenceMonth: string }) {
  const { data: instances, isLoading: isInstancesLoading } = useBillInstances(referenceMonth);
  const { data: templates, isLoading: isTemplatesLoading } = useRecurringBills();
  const generateMonth = useGenerateMonthInstances();

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

      <BillInstanceList
        instances={instances ?? []}
        templates={templates ?? []}
        isLoading={isInstancesLoading || isTemplatesLoading}
      />
    </div>
  );
}