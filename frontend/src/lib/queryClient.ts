import { QueryClient } from "@tanstack/react-query";
import { isClientError, isConnectivityError } from "../api/connectivity";

/**
 * Política de retry:
 *  - perda de ligação (cold start, deploy, rede): até 4 tentativas com
 *    backoff exponencial (1s, 2s, 4s, 8s) — cobre um arranque a frio;
 *  - 4xx: nunca (é uma resposta definitiva);
 *  - outros erros (ex: 500): 1 tentativa, como antes.
 * Mutations não repetem por defeito: não são idempotentes.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (isClientError(error)) return false;
        if (isConnectivityError(error)) return failureCount < 4;
        return failureCount < 1;
      },
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
    },
  },
});
