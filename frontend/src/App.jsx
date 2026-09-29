import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import { ProtectedRoute, PublicOnlyRoute } from "./components/common/RouteGuards";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import EditTransaction from "./pages/EditTransaction";
import TransactionDetails from "./pages/TransactionDetails";
import Analytics from "./pages/Analytics";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Recurring from "./pages/Recurring";
import Insights from "./pages/Insights";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";

function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <h1 className="page-title">Page not found</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-2">That route does not exist.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Route>

      <Route element={<PublicOnlyRoute />}>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/new" element={<AddTransaction />} />
          <Route path="/transactions/:id" element={<TransactionDetails />} />
          <Route path="/transactions/:id/edit" element={<EditTransaction />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
