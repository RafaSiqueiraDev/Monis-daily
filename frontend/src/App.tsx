import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import IncomesPage from "./pages/IncomesPage";
import MonthlyOverviewPage from "./pages/MonthlyOverviewPage";
import CardsPage from "./pages/CardsPage";
import InvestmentsPage from "./pages/InvestmentsPage";
import { useAuthStore } from "./store/authStore";

function CatchAllRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return <Navigate to={isAuthenticated ? "/" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/resumo-mensal" element={<MonthlyOverviewPage />} />
          <Route path="/despesas" element={<ExpensesPage />} />
          <Route path="/receitas" element={<IncomesPage />} />
          <Route path="/cartoes" element={<CardsPage />} />
          <Route path="/investimentos" element={<InvestmentsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
}