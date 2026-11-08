import { useEffect, useMemo, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { AlertTriangle, CandlestickChart, Link2, Pencil, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { AssetMarketDataDialog } from "./AssetMarketDataDialog";
import { useSyncQuotes, apiErrorMessage } from "../../hooks/useQuotes";
import { useUiPreferencesStore } from "../../store/uiPreferencesStore";
import { displayCurrency, formatCurrency } from "../../utils/currency";
import { cn } from "../../lib/utils";
import type { InvestmentAssetRead } from "../../types/investment";

/** Igual ao TTL da cache de cotações no servidor: abaixo disto um sync não traria nada novo. */
const AUTO_SYNC_AFTER_MS = 15 * 60_000;
/** A partir daqui o preço é assinalado como desatualizado (ex: provedor em baixo há um dia). */
const STALE_AFTER_MS = 24 * 60 * 60_000;

const ageMs = (iso: string | null) => (iso ? Date.now() - new Date(iso).getTime() : Infinity);

function formatPct(value: number) {
  return `${value > 0 ? "+" : ""}${value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function PnlLine({ pnl, pct, currency, hide }: { pnl: number | null; pct: number | null; currency: string; hide: boolean }) {
  if (pnl === null) return <span className="text-xs text-slate-400">Sem preço médio</span>;
  const positive = pnl >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={cn("flex items-center justify-end gap-1 text-xs font-medium", positive ? "text-emerald-600" : "text-rose-600")}>
      <Icon className="h-3.5 w-3.5" />
      {hide ? "••••" : `${positive ? "+" : ""}${formatCurrency(pnl, currency)}`}
      {pct !== null && <span className="text-[11px] opacity-80">({formatPct(pct)})</span>}
    </span>
  );
}

export function MarketPositionsCard({ assets, isLoading }: { assets: InvestmentAssetRead[]; isLoading: boolean }) {
  const hideAmounts = useUiPreferencesStore((state) => state.hideAmounts);
  const sync = useSyncQuotes();

  const quoted = useMemo(() => assets.filter((a) => a.ticker), [assets]);
  const withoutTicker = useMemo(() => assets.filter((a) => !a.ticker), [assets]);

  const lastSyncedAt = useMemo(() => {
    const times = quoted.map((a) => a.last_price_at).filter((t): t is string => Boolean(t));
    return times.length ? times.reduce((a, b) => (a > b ? a : b)) : null;
  }, [quoted]);

  // Sync automático uma vez por visita, se alguma cotação tiver mais de 15 min.
  // O ref evita repetir (StrictMode/re-renders); o servidor tem cache, por isso é barato.
  const autoSynced = useRef(false);
  const { mutate: runSync } = sync;
  useEffect(() => {
    if (autoSynced.current || isLoading || quoted.length === 0) return;
    if (quoted.some((a) => ageMs(a.last_price_at) > AUTO_SYNC_AFTER_MS)) {
      autoSynced.current = true;
      runSync();
    }
  }, [isLoading, quoted, runSync]);

  // Totais por moeda do ativo (não somamos EUR com USD)
  const totals = useMemo(() => {
    const byCurrency = new Map<string, { value: number; pnl: number; cost: number }>();
    for (const a of quoted) {
      if (a.market_value === null) continue;
      const t = byCurrency.get(a.currency) ?? { value: 0, pnl: 0, cost: 0 };
      t.value += a.market_value;
      if (a.unrealized_pnl !== null && a.cost_basis !== null) {
        t.pnl += a.unrealized_pnl;
        t.cost += a.cost_basis;
      }
      byCurrency.set(a.currency, t);
    }
    return Array.from(byCurrency.entries());
  }, [quoted]);

  const failures = sync.data?.items.filter((i) => i.status === "failed") ?? [];

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100/80 text-sky-700">
            <CandlestickChart className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Posições cotadas</CardTitle>
            <p className="text-xs text-slate-500">
              {sync.isPending
                ? "A atualizar cotações..."
                : lastSyncedAt
                  ? `Atualizado ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true, locale: pt })}`
                  : "Cotações ainda não sincronizadas"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {withoutTicker.length > 0 && (
            <AssetMarketDataDialog
              assets={withoutTicker}
              trigger={
                <Button variant="outline" size="sm">
                  <Link2 className="h-4 w-4" /> Associar ticker
                </Button>
              }
            />
          )}
          {quoted.length > 0 && (
            <Button variant="outline" size="sm" isLoading={sync.isPending} onClick={() => sync.mutate()}>
              {!sync.isPending && <RefreshCw className="h-4 w-4" />} Atualizar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        {sync.isError && (
          <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {apiErrorMessage(sync.error, "Não foi possível atualizar as cotações.")} Os valores abaixo são os últimos conhecidos.
          </p>
        )}
        {failures.length > 0 && (
          <div className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {failures.map((f) => (
              <p key={f.asset_id}><span className="font-medium">{f.ticker}</span>: {f.reason}</p>
            ))}
          </div>
        )}

        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}

        {!isLoading && quoted.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            Nenhum ativo com ticker. Associa um ticker (ex: VWCE.DE, AAPL, PETR4.SA) para acompanhares a cotação e o
            lucro/prejuízo face ao preço médio.
          </p>
        )}

        {quoted.map((a) => {
          const stale = ageMs(a.last_price_at) > STALE_AFTER_MS && a.last_price_at !== null;
          return (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-slate-900">{a.name}</p>
                  <Badge className="px-1.5 py-0 text-[10px]">{a.ticker}</Badge>
                  {stale && (
                    <Badge variant="pending" className="gap-1 px-1.5 py-0 text-[10px]">
                      <AlertTriangle className="h-3 w-3" /> desatualizado
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {a.last_price !== null ? (
                    <>
                      {a.shares_quantity !== null && <>{hideAmounts ? "••" : a.shares_quantity.toLocaleString("pt-PT")} × </>}
                      {formatCurrency(a.last_price, a.last_price_currency ?? a.currency)}
                      {a.average_price !== null && <> · médio {formatCurrency(a.average_price, a.currency)}</>}
                    </>
                  ) : (
                    "Sem cotação ainda"
                  )}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <div className="text-right">
                  {a.market_value !== null ? (
                    <>
                      <p className="text-sm font-semibold text-slate-900">
                        {displayCurrency(a.market_value, hideAmounts, a.currency)}
                      </p>
                      <PnlLine pnl={a.unrealized_pnl} pct={a.unrealized_pnl_pct} currency={a.currency} hide={hideAmounts} />
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">{a.shares_quantity === null ? "Sem quantidade" : "—"}</p>
                  )}
                </div>
                <AssetMarketDataDialog
                  assets={assets}
                  asset={a}
                  trigger={
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Editar ticker, quantidade e preço médio"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  }
                />
              </div>
            </div>
          );
        })}

        {totals.length > 0 && (
          <div className="mt-2 flex flex-col gap-1 border-t border-slate-100 pt-3">
            {totals.map(([currency, t]) => (
              <div key={currency} className="flex items-center justify-between px-2 text-sm">
                <span className="text-slate-500">Total {currency}</span>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{displayCurrency(t.value, hideAmounts, currency)}</p>
                  {t.cost > 0 && (
                    <PnlLine pnl={t.pnl} pct={(t.pnl / t.cost) * 100} currency={currency} hide={hideAmounts} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
