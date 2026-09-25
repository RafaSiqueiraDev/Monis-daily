import { useState } from "react";
import { format, startOfMonth } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { MonthPicker } from "../components/ui/month-picker";
import { CountrySelector } from "../components/shared/CountrySelector";
import { BillsSection } from "../components/bills/BillsSection";
import { ExpensesSection } from "../components/expenses/ExpensesSection";
import { useUiPreferencesStore } from "../store/uiPreferencesStore";
import { COUNTRIES } from "../types/country";

export default function ExpensesPage() {
  const [referenceMonth, setReferenceMonth] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const selectedCountry = useUiPreferencesStore((state) => state.selectedCountry);
  const isPrimaryCountry = selectedCountry === "PT";
  const currency = COUNTRIES[selectedCountry].currency;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Despesas Gerais</h1>
          <p className="text-sm text-slate-500">Contas fixas e gastos extras do mês, num único lugar</p>
        </div>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <MonthPicker value={referenceMonth} onChange={setReferenceMonth} className="w-full sm:w-48" />
          <CountrySelector />
        </div>

        {!isPrimaryCountry && (
          <p className="rounded-lg border border-amber-200/60 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Ainda não há registos associados a {COUNTRIES[selectedCountry].label}. As listas ficarão
            automáticas assim que os lançamentos guardarem o país/moeda de origem.
          </p>
        )}

        {/* Mobile: abas */}
        <div className="lg:hidden">
          <Tabs defaultValue="fixed">
            <TabsList>
              <TabsTrigger value="fixed">Contas Fixas</TabsTrigger>
              <TabsTrigger value="extras">Gastos Extras</TabsTrigger>
            </TabsList>
            <TabsContent value="fixed">
              {isPrimaryCountry ? (
                <BillsSection referenceMonth={referenceMonth} />
              ) : (
                <p className="py-10 text-center text-sm text-slate-400">Sem contas fixas neste país.</p>
              )}
            </TabsContent>
            <TabsContent value="extras">
              <ExpensesSection
                referenceMonth={referenceMonth}
                isPrimaryCountry={isPrimaryCountry}
                currency={currency}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: duas colunas alinhadas */}
        <div className="hidden gap-6 lg:grid lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-4">
            {isPrimaryCountry ? (
              <BillsSection referenceMonth={referenceMonth} />
            ) : (
              <>
                <div className="flex h-10 items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">Contas Fixas</h2>
                </div>
                <p className="py-10 text-center text-sm text-slate-400">Sem contas fixas neste país.</p>
              </>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <ExpensesSection
              referenceMonth={referenceMonth}
              isPrimaryCountry={isPrimaryCountry}
              currency={currency}
            />
          </div>
        </div>
      </div>
    </div>
  );
}