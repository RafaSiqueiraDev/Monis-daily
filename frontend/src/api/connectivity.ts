import { isAxiosError } from "axios";

/**
 * true quando o erro significa "não conseguimos falar com a API" — e não
 * "a API respondeu que algo está errado":
 *   - sem resposta: rede em baixo, timeout, ou CORS falhado (o proxy do Render
 *     devolve 502 sem cabeçalhos CORS durante um arranque a frio/deploy);
 *   - 502/503/504 SEM `detail` no corpo: vêm do proxy do Render, não do FastAPI.
 * Um 503 com `detail` (ex: "Provedores de cotações indisponíveis") é uma
 * resposta legítima da app e NÃO conta como perda de ligação.
 */
export function isConnectivityError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  if (error.code === "ERR_CANCELED") return false; // cancelado pelo React Query, não é falha
  const response = error.response;
  if (!response) return true;
  if ([502, 503, 504].includes(response.status)) {
    const data = response.data as { detail?: unknown } | undefined;
    return !(data && typeof data === "object" && "detail" in data);
  }
  return false;
}

/** 4xx são respostas definitivas (validação, auth, não encontrado): repetir não ajuda. */
export function isClientError(error: unknown): boolean {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return status !== undefined && status >= 400 && status < 500;
}
