import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { useMonthlyTrends } from "../../hooks/useMonthlyTrends";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";
import { displayCurrency, formatCurrency } from "../../utils/currency";

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  color: string;
  name: string;
}

function CashFlowTooltip({
  active,
  payload,
  label,
  hideAmounts,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  hideAmounts: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-100 bg-white/95 p-2 text-xs shadow-sm backdrop-blur-sm">
      <p className="mb-1 font-medium capitalize text-slate-900">{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
          <span className="font-semibold text-slate-900">{displayCurrency(item.value, hideAmounts)}</span>
        </div>
      ))}
    </div>
  );
}

export function CashFlowChart() {
  const { data, isLoading } = useMonthlyTrends(6);
  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);

  const hasData = data.some((point) => point.income > 0 || point.expenses > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo Mensal</CardTitle>
        <p className="text-xs text-slate-500">Receitas vs. Despesas dos últimos 6 meses</p>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-[260px] w-full" />}

        {!isLoading && !hasData && (
          <div className="flex h-[260px] items-center justify-center text-center text-sm text-slate-400">
            Ainda não há dados suficientes para mostrar o fluxo mensal.
          </div>
        )}

        {!isLoading && hasData && (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} barGap={6} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(value) =>
                  hideAmounts ? "••••" : formatCurrency(value).replace(/\u00A0/g, " ")
                }
                width={hideAmounts ? 50 : 72}
              />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                content={(props) => (
                  <CashFlowTooltip
                    active={props.active}
                    label={props.label as string}
                    hideAmounts={hideAmounts}
                    payload={(props.payload ?? []).map((p: any) => ({
                      dataKey: p.dataKey,
                      value: p.value,
                      color: p.color,
                      name: p.name,
                    }))}
                  />
                )}
              />
              <Bar dataKey="income" name="Receitas" fill="#6ee7b7" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="expenses" name="Despesas" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}