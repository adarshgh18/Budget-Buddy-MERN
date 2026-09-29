import { Link } from "react-router-dom";

export default function Footer({ compact = false }) {
  if (compact) {
    return (
      <footer className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
        <span>© 2026 Budget Buddy</span>
        <Link to="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300">
          Privacy
        </Link>
        <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-300">
          Terms
        </Link>
        <Link to="/" className="hover:text-slate-600 dark:hover:text-slate-300">
          Help
        </Link>
      </footer>
    );
  }

  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display font-bold text-white text-lg">Budget Buddy</p>
          <p className="mt-3 text-sm text-slate-400">
            A simple way to track income, expenses, budgets, and goals in one place.
          </p>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">Product</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/#features" className="hover:text-white">
                Features
              </a>
            </li>
            <li>
              <Link to="/" className="hover:text-white">
                Home
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">Account</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/login" className="hover:text-white">
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-white">
                Register
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-white font-semibold mb-3">Legal</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/privacy" className="hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-white">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 text-center text-xs py-4 text-slate-500">
        © 2026 Budget Buddy
      </div>
    </footer>
  );
}
