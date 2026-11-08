import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { lookupQuote, syncQuotes } from "../api/quotes";

/**
 * Sincroniza cotações. O sync também reescreve o snapshot do mês corrente
 * dos ativos cotados, por isso invalidamos tudo o que depende de saldos.
 */
export function useSyncQuotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncQuotes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-assets"] });
      queryClient.invalidateQueries({ queryKey: ["investment-summary"] });
      queryClient.invalidateQueries({ queryKey: ["asset-snapshots"] });
    },
  });
}

/** Valida um ticker no servidor. Só corre com `ticker` não vazio. */
export function useQuoteLookup(ticker: string) {
  const normalized = ticker.trim().toUpperCase();
  return useQuery({
    queryKey: ["quote-lookup", normalized],
    queryFn: () => lookupQuote(normalized),
    enabled: normalized.length > 0,
    staleTime: 5 * 60_000,
    // 404/422 são respostas definitivas ("não existe", "formato inválido"): não vale a pena repetir
    retry: (failureCount, error) =>
      !(isAxiosError(error) && [404, 422].includes(error.response?.status ?? 0)) && failureCount < 1,
  });
}

/** Mensagem legível para erros da API (usa o `detail` do FastAPI quando é texto). */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    // 422 de validação do FastAPI: [{ msg: "Value error, Ticker inválido: ..." }, ...]
    if (Array.isArray(detail) && typeof detail[0]?.msg === "string") {
      return detail[0].msg.replace(/^Value error, /, "");
    }
    if (!error.response) return "Sem ligação ao servidor. Tenta novamente dentro de instantes.";
  }
  return fallback;
}
