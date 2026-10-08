import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrencyCode } from "../types/investment";
import type { CountryCode } from "../types/country";

interface UiPreferencesState {
  hideAmounts: boolean;
  toggleHideAmounts: () => void;
  investmentBaseCurrency: CurrencyCode;
  setInvestmentBaseCurrency: (currency: CurrencyCode) => void;
  activeCountries: CountryCode[];
  selectedCountry: CountryCode;
  setSelectedCountry: (country: CountryCode) => void;
  /** true = já sabemos com certeza (vindo do backend) que o onboarding foi concluído. */
  onboardingCompleted: boolean;
  /** Sincroniza o estado local com a resposta mais recente do servidor. */
  syncFromServer: (countries: CountryCode[], onboardingCompleted: boolean) => void;
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set, get) => ({
      hideAmounts: false,
      toggleHideAmounts: () => set((state) => ({ hideAmounts: !state.hideAmounts })),
      investmentBaseCurrency: "EUR",
      setInvestmentBaseCurrency: (currency) => set({ investmentBaseCurrency: currency }),
      activeCountries: ["PT"],
      selectedCountry: "PT",
      setSelectedCountry: (country) => set({ selectedCountry: country }),
      onboardingCompleted: false,
      syncFromServer: (countries, onboardingCompleted) => {
        const current = get().selectedCountry;
        set({
          activeCountries: countries,
          selectedCountry: countries.includes(current) ? current : countries[0],
          onboardingCompleted,
        });
      },
    }),
    { name: "financas-ui-preferences" }
  )
);