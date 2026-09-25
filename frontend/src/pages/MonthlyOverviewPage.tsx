import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { TrendingUp, CalendarClock, Receipt, Scale, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { MonthPicker } from "../components/ui/month-picker";
import { CountrySelector } from "../components/shared/CountrySelector";
import { CashFlowChart } from "../components/dashboard/CashFlowChart";
import { formatDateShort } from "../utils/date";
import { displayCurrency } from "../utils/currency";
import { useIncomes } from "../hooks/useIncomes";
import { useBillInstances } from "../hooks/useBillInstances";
import { useDailyExpenses, useDailyExpensesTotal } from "../hooks/useDailyExpenses";
import { useCreditCards } from "../hooks/useCreditCards";
import { useMonthlyCardInvoices } from "../hooks/useMonthlyCardInvoices";
import { useUiPreferencesStore } from "../store/uiPreferencesStore";
import { COUNTRIES } from "../types/country";

function SummaryMiniCard({
  icon: Icon,
  label,
  value,
  isLoading,
  hideAmounts,
  currency,
  tone = "default",
}: {
  icon: typeof TrendingUp;
  label: string;
  value: number;
  isLoading: boolean;
  hideAmounts: boolean;
  currency: string;
  tone?: "default" | "positive";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            tone === "positive" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-700"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          {isLoading ? (
            <div className="mt-1 h-5 w-16 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="truncate text-sm font-semibold text-slate-900">
              {displayCurrency(value, hideAmounts, currency)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlyOverviewPage() {
  const [referenceMonth, setReferenceMonth] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const monthStart = format(startOfMonth(new Date(referenceMonth)), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date(referenceMonth)), "yyyy-MM-dd");

  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);
  const selectedCountry = useUiPreferencesStore((state) => state.selectedCountry);
  const currency = COUNTRIES[selectedCountry].currency;
  const isPrimaryCountry = selectedCountry === "PT";

  const { data: incomes, isLoading: isIncomesLoading } = useIncomes(referenceMonth);
  const { data: billInstances, isLoading: isBillsLoading } = useBillInstances(referenceMonth);
  const { data: extrasTotal, isLoading: isExtrasTotalLoading } = useDailyExpensesTotal(monthStart, monthEnd);
  const { data: extras, isLoading: isExtrasListLoading } = useDailyExpenses(monthStart, monthEnd);
  const { data: cards } = useCreditCards();
  const { data: cardInvoices, isLoading: isCardsLoading } = useMonthlyCardInvoices(cards ?? [], referenceMonth);

  const rawIncome = (incomes ?? []).reduce((sum, i) => sum + Number(i.amount ?? 0), 0);
  const rawFixed = (billInstances ?? []).reduce((sum, b) => sum + Number(b.amount ?? 0), 0);
  const rawExtras = Number(extrasTotal?.total ?? 0);
  const rawCard = cardInvoices.reduce((sum, c) => sum + Number(c.invoice?.total_amount ?? 0), 0);

  const totalIncome = isPrimaryCountry ? rawIncome : 0;
  const totalFixed = isPrimaryCountry ? rawFixed : 0;
  const totalExtras = isPrimaryCountry ? rawExtras : 0;
  const totalCard = isPrimaryCountry ? rawCard : 0;
  const totalOut = totalFixed + totalExtras + totalCard;
  const resultado = totalIncome - totalOut;

  const isOverviewLoading = isIncomesLoading || isBillsLoading || isExtrasTotalLoading || isCardsLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Resumo Mensal</h1>
        <p className="text-sm text-slate-500">Receitas, contas fixas, gastos extras e cartão num único lugar</p>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <MonthPicker value={referenceMonth} onChange={setReferenceMonth} className="w-full sm:w-48" />
        <CountrySelector />
      </div>

      {!isPrimaryCountry && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200/60 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <Info className="h-4 w-4 shrink-0" />
          Ainda não há registos associados a {COUNTRIES[selectedCountry].label}. Os totais ficarão
          automáticos assim que os lançamentos guardarem o país/moeda de origem.
        </div>
      )}

      <Card>
        <CardContent className="flex items-center gap-3 p-5">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              resultado < 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Resultado líquido do mês</p>
            {isOverviewLoading ? (
              <div className="mt-1 h-7 w-32 animate-pulse rounded bg-slate-100" />
            ) : (
              <p className={`text-xl font-semibold ${resultado < 0 ? "text-red-600" : "text-slate-900"}`}>
                {displayCurrency(resultado, hideAmounts, currency)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryMiniCard
          icon={TrendingUp}
          tone="positive"
          label="Receitas"
          value={totalIncome}
          isLoading={isIncomesLoading}
          hideAmounts={hideAmounts}
          currency={currency}
        />
        <SummaryMiniCard
          icon={CalendarClock}
          label="Contas Fixas"
          value={totalFixed}
          isLoading={isBillsLoading}
          hideAmounts={hideAmounts}
          currency={currency}
        />
        <SummaryMiniCard
          icon={Receipt}
          label="Gastos Extras"
          value={totalExtras}
          isLoading={isExtrasTotalLoading}
          hideAmounts={hideAmounts}
          currency={currency}
        />
      </div>

      <CashFlowChart />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receitas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {isIncomesLoading &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            {!isIncomesLoading && (!isPrimaryCountry || (incomes?.length ?? 0) === 0) && (
              <p className="py-6 text-center text-sm text-slate-400">Sem receitas este mês.</p>
            )}
            {isPrimaryCountry &&
              incomes?.map((income) => (
                <div key={income.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{income.description}</p>
                    <Badge variant={income.received ? "paid" : "pending"} className="mt-0.5">
                      {income.received ? "Recebido" : "Previsto"}
                    </Badge>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {displayCurrency(Number(income.amount ?? 0), hideAmounts, currency)}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contas Fixas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {isBillsLoading &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            {!isBillsLoading && (!isPrimaryCountry || (billInstances?.length ?? 0) === 0) && (
              <p className="py-6 text-center text-sm text-slate-400">Sem contas geradas este mês.</p>
            )}
            {isPrimaryCountry &&
              billInstances?.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{bill.description}</p>
                    <Badge variant={bill.status === "paid" ? "paid" : "pending"} className="mt-0.5">
                      {bill.status === "paid" ? "Pago" : "Pendente"}
                    </Badge>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {displayCurrency(Number(bill.amount ?? 0), hideAmounts, currency)}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos Extras</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {isExtrasListLoading &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            {!isExtrasListLoading && (!isPrimaryCountry || (extras?.length ?? 0) === 0) && (
              <p className="py-6 text-center text-sm text-slate-400">Sem gastos extras este mês.</p>
            )}
            {isPrimaryCountry &&
              extras?.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{expense.description}</p>
                    <p className="text-xs text-slate-500">{formatDateShort(expense.expense_date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {displayCurrency(Number(expense.amount ?? 0), hideAmounts, currency)}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fatura do Cartão</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {isCardsLoading &&
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            {!isCardsLoading && (!isPrimaryCountry || cardInvoices.length === 0) && (
              <p className="py-6 text-center text-sm text-slate-400">Nenhum cartão registado.</p>
            )}
            {isPrimaryCountry &&
              cardInvoices.map(({ card, invoice }) => (
                <div key={card.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{card.name}</p>
                    {invoice ? (
                      <Badge variant={invoice.status === "paid" ? "paid" : "pending"} className="mt-0.5">
                        {invoice.status === "paid" ? "Paga" : "Pendente"}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Sem fatura este mês</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {displayCurrency(Number(invoice?.total_amount ?? 0), hideAmounts, currency)}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MonthlyOverviewPage;