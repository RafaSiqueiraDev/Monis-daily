export function formatCurrency(
  value: number | string | null | undefined,
  currencyCode?: string
): string {
  const numericValue = typeof value === "number" ? value : Number(value) || 0;

  // Garante que o código é uma string de 3 letras válida (ISO 4217), caso contrário usa EUR
  const isValidCode = typeof currencyCode === "string" && /^[A-Za-z]{3}$/.test(currencyCode);
  const safeCurrency = isValidCode ? currencyCode.toUpperCase() : "EUR";

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
  if (isMasked) return "•••• €";
  return formatCurrency(value, currencyCode);
}