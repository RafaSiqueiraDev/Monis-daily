import { useState } from "react";
import { Trash2, Check, X } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { formatCurrency } from "../../utils/currency";
import { formatDateShort } from "../../utils/date";
import { useDeleteDailyExpense } from "../../hooks/useDailyExpenses";
import type { DailyExpenseRead } from "../../types/dailyExpense";
import type { CategoryRead } from "../../types/category";

interface ExpenseListProps {
  expenses: DailyExpenseRead[];
  categories: CategoryRead[];
  isLoading: boolean;
}

function categoryName(categories: CategoryRead[], id: string | null): string | null {
  if (!id) return null;
  return categories.find((c) => c.id === id)?.name ?? null;
}

function ExpenseRow({ expense, categoryLabel }: { expense: DailyExpenseRead; categoryLabel: string | null }) {
  const [confirming, setConfirming] = useState(false);
  const deleteExpense = useDeleteDailyExpense();

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{expense.description}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500">{formatDateShort(expense.expense_date)}</p>
          {categoryLabel && (
            <Badge variant="default" className="px-1.5 py-0 text-[10px]">
              {categoryLabel}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-semibold text-slate-900">{formatCurrency(expense.amount)}</span>

        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => deleteExpense.mutate(expense.id, { onSettled: () => setConfirming(false) })}
              disabled={deleteExpense.isPending}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              title="Confirmar eliminação"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
              title="Cancelar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function ExpenseList({ expenses, categories, isLoading }: ExpenseListProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}

        {!isLoading && expenses.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            Nenhuma despesa registada neste período.
          </p>
        )}

        {expenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            categoryLabel={categoryName(categories, expense.category_id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}