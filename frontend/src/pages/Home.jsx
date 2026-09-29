import { Link } from "react-router-dom";
import {
  BarChart3,
  Flag,
  PieChart,
  Repeat,
  Shield,
  Wallet,
  ArrowRight,
  Tags,
  Lock,
  Ban,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Expense & Transaction Tracking",
    body: "Log daily income and expenses with custom notes, dates, and payment methods.",
  },
  {
    icon: PieChart,
    title: "Flexible Budgets",
    body: "Set monthly category limits, watch your pacing, and stay ahead of overspending.",
  },
  {
    icon: Flag,
    title: "Financial Goals",
    body: "Track progress toward savings milestones, emergency funds, or upcoming purchases.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    body: "Rule-based visual breakdowns and month-over-month cash flow comparisons.",
  },
  {
    icon: Repeat,
    title: "Recurring Transactions",
    body: "Schedule regular subscriptions, bills, and paychecks so nothing catches you by surprise.",
  },
  {
    icon: Tags,
    title: "Custom Categories",
    body: "Organize spending your way with custom tags, default essentials, and custom groupings.",
  },
];

const steps = [
  {
    number: "1",
    title: "Log your transactions",
    body: "Add your daily income and expenses manually with intuitive, fast entry forms.",
  },
  {
    number: "2",
    title: "Set budgets & goals",
    body: "Define monthly spending caps for each category and set your savings targets.",
  },
  {
    number: "3",
    title: "Review your spending",
    body: "Get clear visual breakdowns, stay accountable, and watch your progress grow.",
  },
];

const trustPoints = [
  {
    icon: Lock,
    title: "You Own Your Data",
    body: "Your ledger stays yours — nothing is sold or shared.",
  },
  {
    icon: Ban,
    title: "No Third-Party Feeds",
    body: "Zero bank or third-party account connections, ever.",
  },
  {
    icon: Zap,
    title: "Simple & Fast Logging",
    body: "Effortless manual entry takes seconds, not minutes.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-blue-50/40 to-white">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-primary text-xs font-semibold px-3 py-1.5">
              <Wallet size={12} /> Intentional Money Management
            </span>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-ink leading-[1.08]">
              Track spending, stay on budget, and watch your savings grow.
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
              Budget Buddy gives you the tools to track daily spending, build intentional monthly
              budgets, and reach your financial goals — all in one place, with zero automated
              noise.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary !px-5 !py-3 text-base">
                Get started free <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn-secondary !px-5 !py-3 text-base">
                Login
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              <span>100% free to use</span>
              <span>·</span>
              <span>Manual & private control</span>
              <span>·</span>
              <span>No bank connections required</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-cardHover overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <span className="ml-3 text-[11px] font-medium text-slate-400">
                app.budgetbuddy.io/dashboard
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Product preview
                </p>
                <span className="text-[11px] font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                  Layout only
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["Balance", "Spending", "Savings rate"].map((label) => (
                  <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
                    <div className="mt-3 h-4 w-3/4 rounded bg-slate-200/80" />
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-3">
                  Category pacing
                </p>
                <div className="space-y-2.5">
                  {[70, 45, 85, 30].map((w, i) => (
                    <div key={i} className="h-2 rounded-full bg-slate-200/70 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Live totals appear after you add your own transactions — this preview is layout
                only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Core capabilities
            </p>
            <h2 className="mt-2 font-display text-3xl lg:text-4xl font-bold text-ink">
              Built for intentional financial clarity
            </h2>
            <p className="mt-3 text-slate-600">
              Everything you need to track, plan, and optimize your money — without automated
              noise.
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card p-6">
                <span className="h-10 w-10 rounded-xl bg-blue-50 text-primary grid place-items-center">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 font-display font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Simple workflow
          </p>
          <h2 className="mt-2 font-display text-3xl lg:text-4xl font-bold text-ink">
            How Budget Buddy works
          </h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Take command of your personal finances in three intentional steps.
          </p>
          <div className="mt-12 grid sm:grid-cols-3 gap-6 text-left">
            {steps.map((s) => (
              <div key={s.number} className="card p-6">
                <span className="h-9 w-9 rounded-full bg-primary text-white grid place-items-center font-display font-bold">
                  {s.number}
                </span>
                <h3 className="mt-4 font-display font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / privacy */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5">
            <Shield size={12} /> Conscious & private finance
          </span>
          <h2 className="mt-4 font-display text-3xl lg:text-4xl font-bold text-ink">
            Know where your money goes. Plan where it should go.
          </h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Budget Buddy is built around conscious money management — giving you full ownership
            over your financial records, with clean, distraction-free software.
          </p>
          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            {trustPoints.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-slate-100 p-6">
                <span className="mx-auto h-10 w-10 rounded-xl bg-blue-50 text-primary grid place-items-center">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 font-display font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-800 text-white shadow-cardHover p-10 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-white">
                Ready to take control of your financial future?
              </h2>
              <p className="mt-3 text-blue-100 max-w-md">
                Join Budget Buddy today and start organizing your money intentionally — free, no
                credit card required.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                to="/register"
                className="btn bg-white text-primary hover:bg-blue-50 !px-6 !py-3 text-base font-semibold"
              >
                Get started now <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="btn border border-white/50 text-white hover:bg-white/10 !px-6 !py-3 text-base"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
