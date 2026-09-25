import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "../ui/card";
import { cn } from "../../lib/utils";

type GradientVariant = "brand" | "emerald" | "rose" | "sky" | "slate";

interface KpiCardProps {
  title?: string;
  label?: string;
  value: string;
  subtitle?: string;
  trend?: string;
  icon: LucideIcon;
  gradient?: GradientVariant;
  action?: ReactNode;
  showSparkline?: boolean;
}

const cardBorders: Record<GradientVariant, string> = {
  brand: "bg-emerald-50/30 border-emerald-100/70",
  emerald: "bg-emerald-50/20 border-emerald-100/60",
  rose: "bg-rose-50/20 border-rose-100/60",
  sky: "bg-sky-50/20 border-sky-100/60",
  slate: "bg-white border-slate-200/60",
};

const iconStyles: Record<GradientVariant, { bg: string; color: string }> = {
  brand: { bg: "bg-emerald-100/80", color: "text-emerald-700" },
  emerald: { bg: "bg-emerald-100/80", color: "text-emerald-700" },
  rose: { bg: "bg-rose-100/80", color: "text-rose-700" },
  sky: { bg: "bg-sky-100/80", color: "text-sky-700" },
  slate: { bg: "bg-slate-100", color: "text-slate-600" },
};

export function KpiCard({
  title,
  label,
  value,
  subtitle,
  trend,
  icon: Icon,
  gradient = "slate",
  action,
  showSparkline,
}: KpiCardProps) {
  const displayTitle = title ?? label ?? "";
  const cardBorderClass = cardBorders[gradient] ?? cardBorders.slate;
  const currentIcon = iconStyles[gradient] ?? iconStyles.slate;

  // Mostra a onda decorativa se for o card brand/saldo ou se showSparkline for true
  const hasSparkline = showSparkline ?? (gradient === "brand" || gradient === "emerald");

  return (
    <Card className={cn("relative overflow-hidden rounded-2xl p-5 shadow-sm transition-all hover:shadow-md", cardBorderClass)}>
      <div className="flex items-center justify-between gap-4">
        {/* Lado Esquerdo: Ícone + Textos alinhados */}
        <div className="flex items-center gap-4">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", currentIcon.bg, currentIcon.color)}>
            <Icon className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">{displayTitle}</p>
            <p className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
            {(subtitle || trend) && (
              <p className="mt-0.5 text-xs text-slate-400">{subtitle ?? trend}</p>
            )}
          </div>
        </div>

        {/* Lado Direito: Sparkline decorativa suave ou ação */}
        {action ? (
          <div>{action}</div>
        ) : hasSparkline ? (
          <div className="hidden sm:block">
            <svg
              className="h-8 w-20 text-emerald-400/80"
              viewBox="0 0 100 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M 5,25 Q 25,35 45,20 T 85,15 T 95,10" />
            </svg>
          </div>
        ) : null}
      </div>
    </Card>
  );
}