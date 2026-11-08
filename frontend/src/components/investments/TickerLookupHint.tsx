import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useQuoteLookup, apiErrorMessage } from "../../hooks/useQuotes";
import { formatCurrency } from "../../utils/currency";

/**
 * Valida o ticker no servidor e mostra o nome e a cotação atual.
 * Recebe o ticker "confirmado" (ex: no blur), não cada tecla, para não
 * disparar um pedido por carácter.
 */
export function TickerLookupHint({ ticker }: { ticker: string }) {
  const { data, isFetching, error } = useQuoteLookup(ticker);

  if (!ticker.trim()) {
    return (
      <p className="text-xs text-slate-400">
        Usa o sufixo da bolsa: VWCE.DE (Xetra), IWDA.AS (Amesterdão), EDP.LS (Lisboa), VUSA.L (Londres),
        PETR4.SA (B3). Ações dos EUA sem sufixo (AAPL).
      </p>
    );
  }

  if (isFetching) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> A validar ticker...
      </p>
    );
  }

  if (error) {
    return (
      <p className="flex items-start gap-1.5 text-xs text-amber-700">
        <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
        {apiErrorMessage(error, "Não foi possível validar o ticker agora. Podes guardar na mesma.")}
      </p>
    );
  }

  if (!data) return null;

  return (
    <p className="flex items-start gap-1.5 text-xs text-emerald-700">
      <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>
        <span className="font-medium">{data.symbol}</span>
        {data.name ? ` · ${data.name}` : ""} · {formatCurrency(data.price, data.currency)}
      </span>
    </p>
  );
}
