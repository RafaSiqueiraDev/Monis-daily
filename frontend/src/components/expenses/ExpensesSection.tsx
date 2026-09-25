import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Wallet2, CalendarDays } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { ExpenseFormDialog } from "./ExpenseFormDialog";
import { ExpenseList } from "./ExpenseList";
import { useDailyExpenses } from "../../hooks/useDailyExpenses";
import { useCategories } from "../../hooks/useCategories";
import { displayCurrency } from "../../utils/currency";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";

const ALL_CATEGORIES = "all";

export function ExpensesSection({
  referenceMonth,
  isPrimaryCountry,
  currency,
}: {
  referenceMonth: string;
  isPrimaryCountry: boolean;
  currency: string;
}) {
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);

  const monthStart = format(startOfMonth(new Date(referenceMonth)), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date(referenceMonth)), "yyyy-MM-dd");

  const { data: expenses, isLoading } = useDailyExpenses(monthStart, monthEnd);
  const { data: categories } = useCategories();

  const filteredExpenses = useMemo(() => {
    if (!isPrimaryCountry || !expenses) return [];
    if (categoryFilter === ALL_CATEGORIES) return expenses;
    return expenses.filter((e) => e.category_id === categoryFilter);
  }, [expenses, categoryFilter, isPrimaryCountry]);

  const totalMonth = filteredExpenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  const daysInMonth = endOfMonth(new Date(referenceMonth)).getDate();
  const dailyAverage = daysInMonth > 0 ? totalMonth / daysInMonth : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-10 items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Gastos Extras</h2>
        <ExpenseFormDialog />
      </div>

      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="h-9 sm:w-56">
          <SelectValue placeholder="Todas as categorias" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CATEGORIES}>Todas as categorias</SelectItem>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Wallet2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total gasto no mês</p>
              <p className="text-lg font-semibold text-slate-900">
                {displayCurrency(totalMonth, hideAmounts, currency)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Média diária</p>
              <p className="text-lg font-semibold text-slate-900">
                {displayCurrency(dailyAverage, hideAmounts, currency)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ExpenseList
        expenses={filteredExpenses}
        categories={categories ?? []}
        isLoading={isLoading && isPrimaryCountry}
      />
    </div>
  );
}