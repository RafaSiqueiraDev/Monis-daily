import { create } from "zustand";

/** Por ordem de prioridade na UI: offline > reconnecting > slow > recovered > ok */
export type ConnectionStatus = "ok" | "slow" | "reconnecting" | "offline" | "recovered";

interface ApiStatusState {
  /** Pedidos em curso há mais de SLOW_REQUEST_MS */
  slowRequests: number;
  reconnecting: boolean;
  offline: boolean;
  /** true durante uns segundos depois de recuperar, para confirmar ao utilizador */
  justRecovered: boolean;
  slowStarted: () => void;
  slowFinished: () => void;
  connectionLost: () => void;
  connectionRestored: () => void;
  setOffline: (offline: boolean) => void;
}

const RECOVERED_VISIBLE_MS = 2_500;
let recoveredTimer: ReturnType<typeof setTimeout> | undefined;

/** Estado de ligação à API. Não é persistido: vale só para esta sessão do browser. */
export const useApiStatusStore = create<ApiStatusState>()((set, get) => ({
  slowRequests: 0,
  reconnecting: false,
  offline: typeof navigator !== "undefined" && navigator.onLine === false,
  justRecovered: false,
  slowStarted: () => set((s) => ({ slowRequests: s.slowRequests + 1 })),
  slowFinished: () => set((s) => ({ slowRequests: Math.max(0, s.slowRequests - 1) })),
  connectionLost: () => {
    clearTimeout(recoveredTimer);
    set({ reconnecting: true, justRecovered: false });
  },
  connectionRestored: () => {
    if (!get().reconnecting) return;
    set({ reconnecting: false, justRecovered: true });
    clearTimeout(recoveredTimer);
    recoveredTimer = setTimeout(() => set({ justRecovered: false }), RECOVERED_VISIBLE_MS);
  },
  setOffline: (offline) => set({ offline }),
}));

export function selectConnectionStatus(s: ApiStatusState): ConnectionStatus {
  if (s.offline) return "offline";
  if (s.reconnecting) return "reconnecting";
  if (s.slowRequests > 0) return "slow";
  if (s.justRecovered) return "recovered";
  return "ok";
}
