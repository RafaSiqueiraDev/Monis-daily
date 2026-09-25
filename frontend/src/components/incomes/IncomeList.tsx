import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { formatCurrency } from "../../utils/currency";
import { useToggleIncomeReceived } from "../../hooks/useIncomes";
import type { IncomeRead } from "../../types/income";

interface IncomeListProps {
  incomes: IncomeRead[];
  isLoading: boolean;
}

export function IncomeList({ incomes, isLoading }: IncomeListProps) {
  const toggleReceived = useToggleIncomeReceived();

  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}

        {!isLoading && incomes.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            Nenhuma receita registada para este mês.
          </p>
        )}

        {incomes.map((income) => (
          <div
            key={income.id}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{income.description}</p>
              <Badge variant={income.received ? "paid" : "pending"} className="mt-1">
                {income.received ? "Recebido" : "Previsto"}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-emerald-600">
                {formatCurrency(income.amount)}
              </span>
              <Button
                size="sm"
                variant="outline"
                isLoading={toggleReceived.isPending && toggleReceived.variables?.id === income.id}
                onClick={() => toggleReceived.mutate({ id: income.id, received: !income.received })}
              >
                {income.received ? "Marcar previsto" : "Marcar recebido"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}