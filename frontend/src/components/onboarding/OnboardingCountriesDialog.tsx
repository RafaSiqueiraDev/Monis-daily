import { useState } from "react";
import { Globe2, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useUpdateActiveCountries } from "../../hooks/useAuth";
import { COUNTRIES, ALL_COUNTRY_CODES, type CountryCode } from "../../types/country";

export function OnboardingCountriesDialog({ open }: { open: boolean }) {
  const [step, setStep] = useState<"ask" | "select">("ask");
  const [selected, setSelected] = useState<CountryCode[]>(["PT"]);
  const updateCountries = useUpdateActiveCountries();

  const finish = (countries: CountryCode[]) => {
    updateCountries.mutate(countries);
  };

  const toggle = (code: CountryCode) => {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  return (
    // Sem onOpenChange: este dialog só fecha através de uma ação explícita
    // (botão), nunca por clicar fora — evita fechos acidentais que deixariam
    // onboarding_completed por marcar.
    <Dialog open={open}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        {step === "ask" ? (
          <>
            <DialogHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100/80 text-teal-700">
                <Globe2 className="h-5 w-5" />
              </div>
              <DialogTitle>Geres finanças em mais do que um país?</DialogTitle>
              <DialogDescription>
                Se tiveres contas, despesas ou cartões em Portugal e no Brasil, podes ativar ambos e
                alternar entre eles na app.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => finish(["PT"])} isLoading={updateCountries.isPending}>
                Só um país
              </Button>
              <Button onClick={() => setStep("select")}>Sim, mais do que um</Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Seleciona os países</DialogTitle>
              <DialogDescription>Podes alterar isto depois nas preferências.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {ALL_COUNTRY_CODES.map((code) => {
                const country = COUNTRIES[code];
                const isChecked = selected.includes(code);
                return (
                  <button key={code} type="button" onClick={() => toggle(code)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      isChecked ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700"
                    }`}>
                    <span>{country.flag} {country.label} ({country.currency})</span>
                    {isChecked && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("ask")}>Voltar</Button>
              <Button onClick={() => finish(selected.length > 0 ? selected : ["PT"])} isLoading={updateCountries.isPending}>
                Confirmar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}