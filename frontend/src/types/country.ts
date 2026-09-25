export type CountryCode = "PT" | "BR";

export interface CountryInfo {
  code: CountryCode;
  flag: string;
  label: string;
  currency: string;
}

export const COUNTRIES: Record<CountryCode, CountryInfo> = {
  PT: { code: "PT", flag: "🇵🇹", label: "Portugal", currency: "EUR" },
  BR: { code: "BR", flag: "🇧🇷", label: "Brasil", currency: "BRL" },
};

export const ALL_COUNTRY_CODES: CountryCode[] = ["PT", "BR"];