import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Wallet,
  Flag,
  Repeat,
  Lightbulb,
  Tags,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { displayName } from "../../utils/format";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/analytics", label: "Analytics", icon: PieChart },
  { to: "/budgets", label: "Budgets", icon: Wallet },
  { to: "/goals", label: "Goals", icon: Flag },
  { to: "/recurring", label: "Recurring", icon: Repeat },
  { to: "/insights", label: "Insights", icon: Lightbulb },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
          onClick={onClose}
          aria-label="Close menu"
        />
      )}
      <aside
        className={`fixed lg:static lg:shrink-0 h-screen z-50 inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform dark:bg-slate-900 dark:border-slate-800 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <NavLink to="/dashboard" className="flex items-center gap-2 font-display font-bold text-ink dark:text-slate-50">
            <span className="h-8 w-8 rounded-lg bg-primary text-white grid place-items-center">
              <Wallet size={16} />
            </span>
            Budget Buddy
          </NavLink>
          <button type="button" className="lg:hidden text-slate-500 dark:text-slate-400" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? "bg-blue-50 text-primary dark:bg-blue-500/10"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-blue-100 text-primary grid place-items-center font-semibold dark:bg-blue-500/15">
              {displayName(user).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate dark:text-slate-100">{user?.fullName || user?.username}</p>
              <p className="text-xs text-slate-500 truncate dark:text-slate-500">{user?.email}</p>
            </div>
            <button type="button" onClick={handleLogout} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400" title="Log out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
