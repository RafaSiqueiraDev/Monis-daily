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
  setActiveCountries: (countries: CountryCode[]) => void;
  hasSeenOnboarding: boolean;
  markOnboardingSeen: () => void;
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set, get) => ({
      hideAmounts: false,
      toggleHideAmounts: () => set((state) => ({ hideAmounts: !state.hideAmounts })),
      investmentBaseCurrency: "EUR",
      setInvestmentBaseCurrency: (currency) => set({ investmentBaseCurrency: currency }),
      // default: só Portugal ativo — o onboarding é que oferece adicionar o Brasil
      activeCountries: ["PT"],
      selectedCountry: "PT",
      setSelectedCountry: (country) => set({ selectedCountry: country }),
      setActiveCountries: (countries) => {
        const current = get().selectedCountry;
        set({
          activeCountries: countries,
          // se o país selecionado deixou de estar ativo, cai para o primeiro disponível
          selectedCountry: countries.includes(current) ? current : countries[0],
        });
      },
      hasSeenOnboarding: false,
      markOnboardingSeen: () => set({ hasSeenOnboarding: true }),
    }),
    { name: "financas-ui-preferences" }
  )
);