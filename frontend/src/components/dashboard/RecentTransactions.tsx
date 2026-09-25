import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { displayCurrency } from "../../utils/currency";
import { formatDateShort } from "../../utils/date";
import { getCategoryVisual } from "../../utils/categoryIcons";
import { useDailyExpenses } from "../../hooks/useDailyExpenses";
import { useCategories } from "../../hooks/useCategories";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";
import { ExpenseFormDialog } from "../expenses/ExpenseFormDialog";

export function RecentExpenses({ monthStart, monthEnd }: { monthStart: string; monthEnd: string }) {
  const { data, isLoading } = useDailyExpenses(monthStart, monthEnd);
  const { data: categories } = useCategories();
  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);
  const recent = (data ?? []).slice(0, 6);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Últimos Gastos</CardTitle>
        <ExpenseFormDialog
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
              Adicionar Gasto
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}

        {!isLoading && recent.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">Sem gastos extras este mês.</p>
        )}

        {recent.map((expense) => {
          const categoryName = categories?.find((c) => c.id === expense.category_id)?.name;
          const visual = getCategoryVisual(categoryName ?? expense.description);
          const Icon = visual.icon;

          return (
            <div
              key={expense.id}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${visual.iconBg} ${visual.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{expense.description}</p>
                  <p className="text-xs text-slate-500">{formatDateShort(expense.expense_date)}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {displayCurrency(expense.amount, hideAmounts)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}