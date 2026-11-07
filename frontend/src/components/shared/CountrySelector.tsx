import { useState } from "react";
import { Settings2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { COUNTRIES, ALL_COUNTRY_CODES } from "../../types/country";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";
import { useUpdateActiveCountries } from "../../hooks/useAuth";
import type { CountryCode } from "../../types/country";

export function CountrySelector() {
  const [managing, setManaging] = useState(false);
  const activeCountries = useUiPreferencesStore((state) => state.activeCountries);
  const selectedCountry = useUiPreferencesStore((state) => state.selectedCountry);
  const setSelectedCountry = useUiPreferencesStore((state) => state.setSelectedCountry);
  const updateCountries = useUpdateActiveCountries();

  // O servidor é a fonte de verdade: o PATCH devolve o utilizador e o
  // useUpdateActiveCountries sincroniza a store (tal como no onboarding).
  const toggleActiveCountry = (code: CountryCode) => {
    const next = activeCountries.includes(code)
      ? activeCountries.filter((c) => c !== code)
      : [...activeCountries, code];
    if (next.length === 0) return; // o backend exige pelo menos um país
    updateCountries.mutate(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-1">
        {activeCountries.map((code) => {
          const country = COUNTRIES[code];
          const isActive = code === selectedCountry;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setSelectedCountry(code)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <span>{country.flag}</span>
              {country.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setManaging((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Gerir países ativos"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {managing && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-medium text-slate-500">Países ativos</p>
          {ALL_COUNTRY_CODES.map((code) => {
            const country = COUNTRIES[code];
            const isChecked = activeCountries.includes(code);
            return (
              <label key={code} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={updateCountries.isPending || (isChecked && activeCountries.length === 1)}
                  onChange={() => toggleActiveCountry(code)}
                  className="h-4 w-4 accent-slate-900"
                />
                {country.flag} {country.label} ({country.currency})
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}