/** Garante um código ISO 4217 de 3 letras válido; caso contrário usa EUR. */
function safeCurrencyCode(currencyCode?: string): string {
  const isValidCode = typeof currencyCode === "string" && /^[A-Za-z]{3}$/.test(currencyCode);
  return isValidCode ? currencyCode.toUpperCase() : "EUR";
}

function currencySymbol(currencyCode?: string): string {
  const code = safeCurrencyCode(currencyCode);
  try {
    const parts = new Intl.NumberFormat("pt-PT", { style: "currency", currency: code }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

export function formatCurrency(
  value: number | string | null | undefined,
  currencyCode?: string
): string {
  const numericValue = typeof value === "number" ? value : Number(value) || 0;
  const safeCurrency = safeCurrencyCode(currencyCode);

  try {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: safeCurrency,
    }).format(numericValue);
  } catch {
    return `${numericValue.toFixed(2)} ${safeCurrency}`;
  }
}

export function displayCurrency(
  value: number | string | null | undefined,
  isMasked: boolean = false,
  currencyCode?: string
): string {
  if (isMasked) return `•••• ${currencySymbol(currencyCode)}`;
  return formatCurrency(value, currencyCode);
}