import { CheckCircle2, Loader2, WifiOff, CloudOff } from "lucide-react";
import { useApiStatusStore, selectConnectionStatus, type ConnectionStatus } from "../../store/apiStatusStore";
import { checkConnectionNow } from "../../api/connectionMonitor";
import { cn } from "../../lib/utils";

const CONTENT: Record<Exclude<ConnectionStatus, "ok">, { icon: typeof Loader2; text: string; tone: string; spin?: boolean }> = {
  slow: {
    icon: Loader2,
    spin: true,
    text: "O servidor está a demorar — pode estar a acordar. Só um momento…",
    tone: "border-slate-200 bg-white/95 text-slate-700",
  },
  reconnecting: {
    icon: CloudOff,
    text: "Sem ligação ao servidor. A tentar restabelecer…",
    tone: "border-amber-200 bg-amber-50/95 text-amber-800",
  },
  offline: {
    icon: WifiOff,
    text: "Estás offline. Os dados voltam a carregar quando a internet regressar.",
    tone: "border-slate-300 bg-slate-800/95 text-white",
  },
  recovered: {
    icon: CheckCircle2,
    text: "Ligação restabelecida",
    tone: "border-emerald-200 bg-emerald-50/95 text-emerald-800",
  },
};

/**
 * Aviso global e não-bloqueante do estado da ligação à API (cold starts do
 * Render, deploys, rede). Fica por cima do conteúdo sem impedir interações:
 * o contentor ignora cliques, só a "pílula" os recebe.
 */
export function ConnectionBanner() {
  const status = useApiStatusStore(selectConnectionStatus);
  if (status === "ok") return null;

  const { icon: Icon, text, tone, spin } = CONTENT[status];

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)]"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "pointer-events-auto flex max-w-md items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-md backdrop-blur",
          tone
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", spin && "animate-spin")} />
        <span>{text}</span>
        {status === "reconnecting" && (
          <button
            type="button"
            onClick={checkConnectionNow}
            className="ml-1 shrink-0 rounded-full px-2 py-0.5 font-semibold underline-offset-2 hover:underline"
          >
            Tentar agora
          </button>
        )}
      </div>
    </div>
  );
}
