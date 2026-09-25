import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Wallet, Receipt, Eye, EyeOff } from "lucide-react";
import { KpiCard } from "../components/dashboard/KpiCard";
import { RecentExpenses } from "../components/dashboard/RecentTransactions";
import { UpcomingBills } from "../components/dashboard/UpcomingBills";
import { MonthPicker } from "../components/ui/month-picker";
import { Button } from "../components/ui/button";
import { useDashboardSummary } from "../hooks/useDashboard";
import { useDailyExpensesTotal } from "../hooks/useDailyExpenses";
import { displayCurrency } from "../utils/currency";
import { useUiPreferencesStore } from "../store/uiPreferencesStore";

export default function DashboardPage() {
  const [referenceMonth, setReferenceMonth] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const monthStart = format(startOfMonth(new Date(referenceMonth)), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date(referenceMonth)), "yyyy-MM-dd");

  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary(referenceMonth);
  const { data: extrasTotal, isLoading: isExtrasLoading } = useDailyExpensesTotal(monthStart, monthEnd);

  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);
  const toggleHideAmounts = useUiPreferencesStore((state) => state.toggleHideAmounts);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Resumo financeiro</h1>
          <p className="text-sm text-slate-500">Acompanha o teu mês num relance</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker value={referenceMonth} onChange={setReferenceMonth} className="w-full sm:w-44" />
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHideAmounts}
            title={hideAmounts ? "Mostrar valores" : "Ocultar valores"}
          >
            {hideAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          label="Saldo Disponível"
          value={summary ? displayCurrency(summary.net_balance, hideAmounts) : "—"}
          icon={Wallet}
          gradient={summary && summary.net_balance < 0 ? "rose" : "brand"}
          sparkline
          isLoading={isSummaryLoading}
        />
        <KpiCard
          label="Gastos Extras"
          value={extrasTotal ? displayCurrency(extrasTotal.total, hideAmounts) : "—"}
          icon={Receipt}
          gradient="sky"
          isLoading={isExtrasLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingBills referenceMonth={referenceMonth} />
        <RecentExpenses monthStart={monthStart} monthEnd={monthEnd} />
      </div>
    </div>
  );
}