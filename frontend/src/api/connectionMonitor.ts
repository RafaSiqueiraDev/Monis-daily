import { apiClient } from "./client";
import { queryClient } from "../lib/queryClient";
import { useApiStatusStore } from "../store/apiStatusStore";

/**
 * Recuperação automática da ligação:
 *  - quando a store passa a "reconnecting", sonda /health com backoff
 *    (2s, 4s, 8s, ... até 15s) até a API responder;
 *  - quando recupera, volta a pedir as queries que falharam entretanto;
 *  - segue os eventos online/offline do browser.
 * A sonda usa o apiClient, por isso o sucesso é detetado pelos mesmos
 * interceptors que alimentam a store.
 */

const MAX_PROBE_DELAY_MS = 15_000;
let probeTimer: ReturnType<typeof setTimeout> | undefined;
let probeAttempt = 0;
let started = false;

async function probe() {
  probeTimer = undefined;
  try {
    await apiClient.get("/health", { timeout: 10_000 });
  } catch {
    // o interceptor já mantém o estado "reconnecting"; agenda a próxima sonda
  }
  scheduleProbe();
}

function scheduleProbe() {
  const { reconnecting, offline } = useApiStatusStore.getState();
  if (!reconnecting || offline || probeTimer) return;
  const delay = Math.min(2_000 * 2 ** probeAttempt, MAX_PROBE_DELAY_MS);
  probeAttempt += 1;
  probeTimer = setTimeout(probe, delay);
}

/** "Tentar agora": sonda imediata, sem esperar pelo backoff. */
export function checkConnectionNow() {
  clearTimeout(probeTimer);
  probeTimer = undefined;
  probeAttempt = 0;
  void probe();
}

export function startConnectionMonitor() {
  if (started || typeof window === "undefined") return;
  started = true;

  useApiStatusStore.subscribe((state, prev) => {
    if (state.reconnecting && !prev.reconnecting) {
      probeAttempt = 0;
      scheduleProbe();
    }
    if (!state.reconnecting && prev.reconnecting) {
      clearTimeout(probeTimer);
      probeTimer = undefined;
      // Repete o que falhou durante a quebra (só queries montadas no ecrã)
      void queryClient.refetchQueries({ type: "active", predicate: (q) => q.state.status === "error" });
    }
  });

  window.addEventListener("offline", () => useApiStatusStore.getState().setOffline(true));
  window.addEventListener("online", () => {
    useApiStatusStore.getState().setOffline(false);
    checkConnectionNow();
  });

  // Pré-aquecimento: acorda o Render e o Neon enquanto o utilizador ainda
  // está a ler o ecrã/escrever a password. Erros são tratados pelos interceptors.
  apiClient.get("/health").catch(() => undefined);
}
