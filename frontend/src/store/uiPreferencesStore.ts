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
  toggleActiveCountry: (country: CountryCode) => void;
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set) => ({
      hideAmounts: false,
      toggleHideAmounts: () => set((state) => ({ hideAmounts: !state.hideAmounts })),
      investmentBaseCurrency: "EUR",
      setInvestmentBaseCurrency: (currency) => set({ investmentBaseCurrency: currency }),
      activeCountries: ["PT", "BR"],
      selectedCountry: "PT",
      setSelectedCountry: (country) => set({ selectedCountry: country }),
      toggleActiveCountry: (country) =>
        set((state) => {
          const isActive = state.activeCountries.includes(country);
          if (isActive) {
            if (state.activeCountries.length === 1) return state;
            const nextActive = state.activeCountries.filter((c) => c !== country);
            const nextSelected = state.selectedCountry === country ? nextActive[0] : state.selectedCountry;
            return { activeCountries: nextActive, selectedCountry: nextSelected };
          }
          return { activeCountries: [...state.activeCountries, country] };
        }),
    }),
    { name: "financas-ui-preferences" }
  )
);