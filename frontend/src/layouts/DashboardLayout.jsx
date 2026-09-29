import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "../components/sidebar/Sidebar";
import Footer from "../components/footer/Footer";
import { formatDate } from "../utils/format";

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  // The Settings page's approved design starts directly with its own
  // heading, without this ambient date badge - so it's suppressed only on
  // that route. Every other page keeps it exactly as before.
  const showDatePill = !location.pathname.startsWith("/settings");

  return (
    <div className="h-screen bg-canvas dark:bg-slate-950 flex overflow-hidden">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-y-auto">
        <header className="h-16 px-4 lg:px-8 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            className="lg:hidden rounded-lg border border-slate-200 bg-white p-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
            onClick={() => setOpen(true)}
          >
            <Menu size={18} />
          </button>
          {showDatePill && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
              {formatDate(new Date())}
            </div>
          )}
        </header>
        <main className="flex-1 px-4 lg:px-8 pb-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
        <Footer compact />
      </div>
    </div>
  );
}
