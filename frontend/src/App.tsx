import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import IncomesPage from "./pages/IncomesPage";
import MonthlyOverviewPage from "./pages/MonthlyOverviewPage";
import CardsPage from "./pages/CardsPage";
import InvestmentsPage from "./pages/InvestmentsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/resumo-mensal" element={<MonthlyOverviewPage />} />
          <Route path="/despesas" element={<ExpensesPage />} />
          <Route path="/receitas" element={<IncomesPage />} />
          <Route path="/cartoes" element={<CardsPage />} />
          <Route path="/investimentos" element={<InvestmentsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}