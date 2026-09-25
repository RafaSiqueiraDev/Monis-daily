import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { useInvestmentHistory } from "../../hooks/useInvestmentHistory";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";
import { displayCurrency, formatCurrency } from "../../utils/currency";

function PortfolioTooltip({
  active,
  payload,
  label,
  hideAmounts,
  baseCurrency,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  hideAmounts: boolean;
  baseCurrency: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-100 bg-white/95 p-2 text-xs shadow-sm backdrop-blur-sm">
      <p className="mb-1 font-medium capitalize text-slate-900">{label}</p>
      <p className="font-semibold text-teal-700">
        {displayCurrency(payload[0].value, hideAmounts, baseCurrency)}
      </p>
    </div>
  );
}

export function PortfolioEvolutionChart({ baseCurrency }: { baseCurrency: string }) {
  const { data, isLoading } = useInvestmentHistory(6, baseCurrency);
  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);

  const hasData = data.some((point) => point.balance > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução Patrimonial</CardTitle>
        <p className="text-xs text-slate-500">Património consolidado dos últimos 6 meses, em {baseCurrency}</p>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-[260px] w-full" />}

        {!isLoading && !hasData && (
          <div className="flex h-[260px] items-center justify-center text-center text-sm text-slate-400">
            Ainda não há snapshots suficientes para traçar a evolução.
          </div>
        )}

        {!isLoading && hasData && (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                  hideAmounts ? "••••" : formatCurrency(value, baseCurrency).replace(/\u00A0/g, " ")
                }
                width={hideAmounts ? 50 : 78}
              />
              <Tooltip
                cursor={{ stroke: "#5eead4", strokeWidth: 1 }}
                content={(props) => (
                  <PortfolioTooltip
                    active={props.active}
                    label={props.label as string}
                    hideAmounts={hideAmounts}
                    baseCurrency={baseCurrency}
                    payload={(props.payload ?? []).map((p: any) => ({ value: p.value }))}
                  />
                )}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#0d9488"
                strokeWidth={2}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}