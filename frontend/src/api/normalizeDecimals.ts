/**
 * O Pydantic v2 serializa `Decimal` como string em JSON ("123.45").
 * Os tipos TS do frontend declaram estes campos como `number`, por isso
 * convertemos aqui, num único ponto, todas as chaves que o backend define
 * como Decimal (ver backend/app/schemas/*). Strings não numéricas e chaves
 * fora desta lista ficam intactas.
 *
 * Ao adicionar um novo campo Decimal num schema do backend, acrescenta-o aqui.
 */
const DECIMAL_KEYS = new Set<string>([
  // genéricos
  "amount",
  "total",
  "total_amount",
  "default_amount",
  "credit_limit",
  // dashboard
  "total_income",
  "total_bills",
  "total_bills_paid",
  "total_bills_pending",
  "total_card_invoices",
  "total_expenses",
  "total_daily_expenses",
  "net_balance",
  // investimentos
  "balance",
  "contribution",
  "initial_balance",
  "shares_quantity",
  "average_price",
  "consolidated_balance",
  "consolidated_contributions",
  "total_balance",
  "total_contributions",
  "balance_native",
  "contribution_native",
  "balance_converted",
  "portfolio_share_pct",
  // cotações (Fase A)
  "last_price",
  "market_value",
  "cost_basis",
  "unrealized_pnl",
  "unrealized_pnl_pct",
  "price",
  "previous_close",
  "day_change_pct",
]);

/** Chaves cujo valor é um dicionário { código: Decimal } */
const DECIMAL_MAP_KEYS = new Set<string>(["exchange_rates"]);

const NUMERIC_RE = /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/;

function toNumberIfNumeric(value: unknown): unknown {
  if (typeof value === "string" && NUMERIC_RE.test(value)) {
    return Number(value);
  }
  return value;
}

export function normalizeDecimals<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => normalizeDecimals(item)) as T;
  }
  if (input === null || typeof input !== "object") {
    return input;
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (DECIMAL_KEYS.has(key)) {
      out[key] = toNumberIfNumeric(value);
    } else if (DECIMAL_MAP_KEYS.has(key) && value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, toNumberIfNumeric(v)])
      );
    } else {
      out[key] = normalizeDecimals(value);
    }
  }
  return out as T;
}
