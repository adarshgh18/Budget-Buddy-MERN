import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Landmark,
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  Plus,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getDashboard } from "../services/analyticsService";
import { getErrorMessage } from "../services/api";
import { displayName, formatDate, formatMoney, formatSignedMoney, greetingFor, progressColor } from "../utils/format";
import StatCard from "../components/cards/StatCard";
import { CategoryDonut, IncomeExpenseChart } from "../components/charts/Charts";
import { EmptyState, ErrorState, PageLoader } from "../components/common/Feedback";

// Same palette/order Charts.jsx uses for the Spending by Category donut
// slices (Cell index i -> COLORS[i % COLORS.length]) - duplicated here rather
// than imported so this legend's dots line up with the chart's own slice
// colors without touching the shared chart component.
const CATEGORY_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#0EA5E9", "#EC4899"];

// Real, derived income-trend insight for the Income vs Expenses card footer,
// computed from the same six-month incomeVsExpenses series already used by
// the chart above it - first vs. last data point, nothing invented.
function incomeTrend(series) {
  if (!series || series.length < 2) return null;
  const first = series[0].income;
  const last = series[series.length - 1].income;
  const months = series.length;
  const diff = last - first;
  if (diff === 0) return { direction: "flat", months };
  const direction = diff > 0 ? "grew" : "fell";
  if (first > 0) {
    return { direction, months, pct: Math.abs((diff / first) * 100) };
  }
  // Can't express a meaningful percentage growth from a zero starting point,
  // so fall back to the real absolute change instead of a fake/infinite %.
  return { direction, months, absDiff: Math.abs(diff) };
}

export default function Dashboard() {
  const { user } = useAuth();
  const currency = user?.preferences?.currency || "USD";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDashboard();
      setData(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const totals = data.totals;
  const categoryTotal = data.spendingByCategory.reduce((s, c) => s + c.amount, 0);
  const trend = incomeTrend(data.incomeVsExpenses);
  const recentIncome = data.recentTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const recentExpense = data.recentTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const recentNet = recentIncome - recentExpense;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="page-title">
            {greetingFor()}, {displayName(user)} <span aria-hidden="true">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {formatDate(data.greetingDate || new Date(), user?.preferences?.dateFormat)} · here is your financial
            overview for this month.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/budgets" className="btn-secondary">
            Create Budget
          </Link>
          <Link to="/goals" className="btn-secondary">
            Create Goal
          </Link>
          <Link to="/transactions/new" className="btn-primary">
            <Plus size={16} /> Add Transaction
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance"
          value={formatMoney(totals.balance, currency)}
          icon={<Landmark size={16} className="text-primary" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Total Income"
          value={formatMoney(totals.monthIncome, currency)}
          icon={<ArrowDownCircle size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
          hint={totals.incomeDelta !== null ? `${totals.incomeDelta}% vs last month` : "This month"}
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Expenses"
          value={formatMoney(totals.monthExpense, currency)}
          icon={<ArrowUpCircle size={16} className="text-rose-500" />}
          iconBg="bg-rose-50"
          hint={totals.expenseDelta !== null ? `${totals.expenseDelta}% vs last month` : "This month"}
        />
        <StatCard
          label="Savings Rate"
          value={`${totals.savingsRate}%`}
          icon={<PiggyBank size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
          hint={`${totals.daysRemaining} days left in the month`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-ink">Income vs Expenses</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last six months</p>
            </div>
            <Link to="/analytics" className="text-sm text-primary font-medium">
              Detailed report
            </Link>
          </div>
          <IncomeExpenseChart data={data.incomeVsExpenses} />
          {trend && (
            <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span
                  className={`h-6 w-6 rounded-full grid place-items-center shrink-0 ${
                    trend.direction === "grew"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : trend.direction === "fell"
                      ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                      : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {trend.direction === "grew" ? (
                    <TrendingUp size={13} />
                  ) : trend.direction === "fell" ? (
                    <TrendingDown size={13} />
                  ) : (
                    <Minus size={13} />
                  )}
                </span>
                <span>
                  {trend.direction === "flat" ? (
                    <>Income held steady over the past {trend.months} months.</>
                  ) : trend.pct !== undefined ? (
                    <>
                      Income {trend.direction} {trend.pct.toFixed(1)}% over the past {trend.months} months.
                    </>
                  ) : (
                    <>
                      Income {trend.direction} by {formatMoney(trend.absDiff, currency)} over the past {trend.months} months.
                    </>
                  )}
                </span>
              </div>
              <Link
                to="/analytics"
                className="text-sm font-medium text-primary inline-flex items-center gap-0.5 shrink-0 hover:text-primary-hover"
              >
                Detailed Report <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
        <div className="card p-5">
          <h2 className="font-display font-semibold text-ink">Spending by Category</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">This month</p>
          <CategoryDonut
            data={data.spendingByCategory}
            totalLabel="TOTAL"
            totalValue={formatMoney(categoryTotal, currency)}
          />
          <ul className="mt-2 space-y-1.5 text-sm">
            {data.spendingByCategory.slice(0, 5).map((c, i) => (
              <li key={c.category} className="flex justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="truncate">
                    {c.category} ({c.percent}%)
                  </span>
                </span>
                <span className="tabular shrink-0">{formatMoney(c.amount, currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-primary font-medium">
              View all
            </Link>
          </div>
          {data.recentTransactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              body="Add your first income or expense to populate this list."
              action={
                <Link to="/transactions/new" className="btn-primary">
                  Add Transaction
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  <tr className="text-left">
                    <th className="py-2.5">Transaction</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((t) => (
                    <tr key={t._id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-3.5 font-medium text-ink">{t.title}</td>
                      <td>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-300">
                          {t.category}
                        </span>
                      </td>
                      <td className="text-slate-500 dark:text-slate-400">{formatDate(t.date, user?.preferences?.dateFormat)}</td>
                      <td>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            t.type === "income"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td
                        className={`text-right tabular font-semibold ${
                          t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-ink"
                        }`}
                      >
                        {t.type === "income"
                          ? formatSignedMoney(t.amount, currency)
                          : formatSignedMoney(-t.amount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data.recentTransactions.length > 0 && (
            <div className="mt-auto pt-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3.5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm font-medium text-ink">Latest activity</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {data.recentTransactions.length} transaction{data.recentTransactions.length === 1 ? "" : "s"} shown · Last
                    transaction {formatDate(data.recentTransactions[0].date, user?.preferences?.dateFormat)}
                  </p>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center gap-x-4 gap-y-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ArrowDownCircle size={13} className="text-emerald-500 shrink-0" />
                    Income
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular">
                      {formatSignedMoney(recentIncome, currency)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ArrowUpCircle size={13} className="text-rose-500 shrink-0" />
                    Expenses
                    <span className="font-semibold text-rose-600 dark:text-rose-400 tabular">
                      {formatSignedMoney(-recentExpense, currency)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    Net
                    <span
                      className={`font-semibold tabular ${
                        recentNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {formatSignedMoney(recentNet, currency)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex justify-between mb-3">
              <h2 className="font-display font-semibold text-ink">Budget Overview</h2>
              <Link to="/budgets" className="text-sm text-primary">
                Manage
              </Link>
            </div>
            {data.budgetOverview.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <p>No budgets created yet.</p>
                <Link to="/budgets" className="text-primary font-medium mt-2 inline-block">
                  Create your first budget
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.budgetOverview.slice(0, 4).map((b) => (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-ink">{b.category}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {formatMoney(b.spent, currency)} / {formatMoney(b.amount, currency)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${progressColor(b.percentUsed)}`}
                        style={{ width: `${Math.min(100, b.percentUsed)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatMoney(b.remaining, currency)} left · {b.percentUsed}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {data.insights?.length > 0 && (
            <div className="card p-5 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-primary text-white grid place-items-center shrink-0">
                  <Lightbulb size={14} />
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Advisory</p>
              </div>
              <h3 className="font-display font-semibold text-ink mt-3">{data.insights[0].title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{data.insights[0].body}</p>
              <Link to="/insights" className="text-sm text-primary font-medium mt-3 inline-block">
                View insights
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
