import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  CreditCard,
  LineChart,
  Scale,
  LogOut,
  X,
  Wallet,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import { BottomNav } from "./BottomNav";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/resumo-mensal", label: "Resumo Mensal", icon: Scale },
  { to: "/despesas", label: "Despesas Gerais", icon: Receipt },
  { to: "/receitas", label: "Receitas", icon: TrendingUp },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
  { to: "/investimentos", label: "Investimentos", icon: LineChart },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )
          }
        >
          <item.icon className="h-[18px] w-[18px]" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const navigate = useNavigate();
  const userName = useAuthStore((state) => state.userName);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-zinc-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            Monis Daily
          </span>
        </div>

        <NavList />

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center justify-between rounded-lg px-3 py-2">
            <p className="truncate text-sm font-medium text-slate-900">{userName ?? "Utilizador"}</p>
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600"
              title="Terminar sessão"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {moreSheetOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMoreSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[80vh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-base font-bold tracking-tight text-slate-900">Mais opções</span>
              <button
                onClick={() => setMoreSheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <NavList onNavigate={() => setMoreSheetOpen(false)} />

            <div className="border-t border-slate-200 p-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Terminar sessão
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-lg font-bold tracking-tight text-transparent">
              Monis Daily
            </span>
          </div>
        </header>

        <main className="w-full max-w-full overflow-x-hidden px-4 py-4 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:py-8 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <BottomNav onMoreClick={() => setMoreSheetOpen(true)} />
    </div>
  );
}