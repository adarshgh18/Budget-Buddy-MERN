import { NavLink } from "react-router-dom";
import { Wallet } from "lucide-react";

export default function PublicNavbar() {
  const link = ({ isActive }) =>
    `text-sm font-medium ${isActive ? "text-primary" : "text-slate-600 hover:text-ink"}`;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 font-display font-bold text-ink">
          <span className="h-8 w-8 rounded-lg bg-primary text-white grid place-items-center">
            <Wallet size={16} />
          </span>
          Budget Buddy
        </NavLink>
        <nav className="flex items-center gap-6">
          <NavLink to="/" className={link} end>
            Home
          </NavLink>
          <NavLink to="/login" className={link}>
            Login
          </NavLink>
          <NavLink to="/register" className="btn-primary !py-2 !px-3.5">
            Register
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
