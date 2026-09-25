import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, Scale, CreditCard, Menu } from "lucide-react";
import { cn } from "../../lib/utils";

interface BottomNavProps {
  onMoreClick: () => void;
}

const primaryItems = [
  { to: "/", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/despesas", label: "Despesas", icon: Receipt },
  { to: "/resumo-mensal", label: "Resumo", icon: Scale },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
];

export function BottomNav({ onMoreClick }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {primaryItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              isActive ? "text-slate-900" : "text-slate-400"
            )
          }
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
      <button
        onClick={onMoreClick}
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-slate-400"
      >
        <Menu className="h-5 w-5" />
        Mais
      </button>
    </nav>
  );
}