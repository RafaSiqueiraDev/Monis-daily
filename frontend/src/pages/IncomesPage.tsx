import { useState } from "react";
import { format, startOfMonth } from "date-fns";
import { TrendingUp, Clock } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { MonthPicker } from "../components/ui/month-picker";
import { IncomeFormDialog } from "../components/incomes/IncomeFormDialog";
import { IncomeList } from "../components/incomes/IncomeList";
import { useIncomes } from "../hooks/useIncomes";
import { formatCurrency } from "../utils/currency";

export default function IncomesPage() {
  const [referenceMonth, setReferenceMonth] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const { data: incomes, isLoading } = useIncomes(referenceMonth);

  const totalReceived = (incomes ?? []).filter((i) => i.received).reduce((sum, i) => sum + i.amount, 0);
  const totalExpected = (incomes ?? []).reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Receitas</h1>
          <p className="text-sm text-slate-500">Fontes de rendimento do mês</p>
        </div>
        <IncomeFormDialog defaultReferenceMonth={referenceMonth} />
      </div>

      <MonthPicker value={referenceMonth} onChange={setReferenceMonth} className="w-full sm:w-48" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total recebido</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalReceived)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total previsto no mês</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalExpected)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <IncomeList incomes={incomes ?? []} isLoading={isLoading} />
    </div>
  );
}