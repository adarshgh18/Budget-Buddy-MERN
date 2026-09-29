import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAnalytics } from "../services/analyticsService";
import { listCategories } from "../services/categoryService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { formatMoney } from "../utils/format";
import StatCard from "../components/cards/StatCard";
import { CategoryDonut, IncomeExpenseChart, MonthlySpendChart } from "../components/charts/Charts";
import { EmptyState, ErrorState, PageLoader } from "../components/common/Feedback";
import {
  ArrowLeftRight,
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  DollarSign,
  Tag,
  CalendarDays,
  ListChecks,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Wallet,
} from "lucide-react";

const HEALTH_STYLES = {
  Healthy: { pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", hex: "#10B981" },
  Fair: { pill: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", hex: "#F59E0B" },
  "Needs attention": { pill: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400", hex: "#F43F5E" },
};

const TONE_CLASSES = {
  blue: "bg-blue-50 text-primary dark:bg-blue-500/10",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
};

// Full class strings (not interpolated) so Tailwind's build-time scanner picks
// them up. The desktop column count matches how many insights actually exist,
// so 3 real insights fill the row instead of leaving a blank 4th slot.
const INSIGHT_GRID_CLASSES = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

// Real "Income Consistency" derived from the existing 6-month income series
// already returned as data.incomeVsExpenses (the same data powering the
// Income vs Expenses chart) - NOT a month-over-month delta, which can only
// ever compare two adjacent months and says nothing about actual consistency.
//
// Method: take every month in that series with recorded income (> 0), skip
// zero-income months entirely (they aren't "consistent $0", they're just
// unused periods), and require at least 2 such months. Then compute the
// coefficient of variation (population standard deviation / mean) across
// those real income values - a standard, deterministic spread measure where
// 0 means identical income every month and larger values mean bigger swings
// relative to the average. Classified as:
//   CV <= 10%  -> Stable
//   CV <= 25%  -> Some Variation
//   CV  > 25%  -> Variable
// The progress bar is derived directly from that same CV, not a separate number.
function computeIncomeConsistency(monthlySeries) {
  const monthsWithIncome = (monthlySeries || []).filter((m) => m.income > 0);
  if (monthsWithIncome.length < 2) return null;

  const incomes = monthsWithIncome.map((m) => m.income);
  const mean = incomes.reduce((sum, v) => sum + v, 0) / incomes.length;
  const variance = incomes.reduce((sum, v) => sum + (v - mean) ** 2, 0) / incomes.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;
  const cvPct = cv * 100;

  const pct = Math.max(8, 100 - Math.min(100, cvPct * 2));
  if (cvPct <= 10) return { label: "Stable", pct, colorClass: "bg-emerald-500" };
  if (cvPct <= 25) return { label: "Some Variation", pct, colorClass: "bg-amber-500" };
  return { label: "Variable", pct, colorClass: "bg-rose-500" };
}

function HealthMetricRow({ label, value, note, pct, colorClass }) {
  return (
    <div>
      <div className="flex justify-between items-baseline gap-2 text-xs mb-1.5">
        <span className="font-medium text-ink">{label}</span>
        <span className="text-slate-500 dark:text-slate-400 truncate">
          <span className="font-semibold text-ink tabular">{value}</span>
          {note && <span className="ml-1">{note}</span>}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  );
}

// Rule-based, frontend-only derivation from data already returned by getAnalytics.
// No new backend calls, no fabricated figures - every item here either renders a
// real existing value or is skipped entirely.
function buildKeyInsights(s, h, currency) {
  const insights = [];

  if (h.largestExpense) {
    insights.push({
      icon: DollarSign,
      tone: "blue",
      title: "Largest Expense",
      body: `"${h.largestExpense.title}" in ${h.largestExpense.category} was your biggest single expense this period.`,
      value: formatMoney(h.largestExpense.amount, currency),
    });
  }

  if (h.highestCategory) {
    insights.push({
      icon: Tag,
      tone: "violet",
      title: "Top Spending Category",
      body: `${h.highestCategory.category} accounted for the largest share of your spending this period.`,
      value: `${h.highestCategory.percent}%`,
    });
  }

  if (s.expenseDelta !== null && s.expenseDelta !== undefined) {
    const up = s.expenseDelta > 0;
    insights.push({
      icon: up ? TrendingUp : TrendingDown,
      tone: up ? "rose" : "emerald",
      title: "Month-over-Month Spending",
      body: `Your spending is ${Math.abs(s.expenseDelta)}% ${up ? "higher" : "lower"} than last month.`,
      value: `${s.expenseDelta > 0 ? "+" : ""}${s.expenseDelta}%`,
    });
  }

  if (s.totalIncome > 0) {
    const positive = s.netCashFlow >= 0;
    insights.push({
      icon: positive ? PiggyBank : AlertTriangle,
      tone: positive ? "emerald" : "rose",
      title: positive ? "Savings Progress" : "Spending Alert",
      body: positive
        ? `You kept ${s.savingsRate}% of your income this period.`
        : `You spent more than you earned this period.`,
      value: `${s.savingsRate}%`,
    });
  }

  return insights.slice(0, 4);
}

export default function Analytics() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const currency = user?.preferences?.currency || "USD";
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: String(new Date().getFullYear()),
    month: "",
    category: "",
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { ...filters };
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });
      const [res, cats] = await Promise.all([getAnalytics(params), listCategories()]);
      setData(res.data.data);
      setCategories(cats.data.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.year, filters.month, filters.category]);

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const s = data.summary;
  const h = data.highlights;
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  const empty = !s.totalIncome && !s.totalExpenses;
  const keyInsights = buildKeyInsights(s, h, currency);
  const healthHex = HEALTH_STYLES[data.financialHealth.label]?.hex || "#94A3B8";
  const incomeConsistency = computeIncomeConsistency(data.incomeVsExpenses);
  const savingsRatePct = Math.max(0, Math.min(100, data.financialHealth.savingsRate));
  const savingsColorClass =
    data.financialHealth.savingsRate >= 20
      ? "bg-emerald-500"
      : data.financialHealth.savingsRate >= 0
      ? "bg-primary"
      : "bg-rose-500";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Income, spending, and savings based on your records.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <select
            className="input w-auto"
            value={filters.year}
            onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
          >
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            className="input w-auto"
            value={filters.month}
            onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
          >
            <option value="">All months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString("en-US", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            className="input w-auto"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {empty ? (
        <EmptyState title="No analytics yet" body="Add transactions to see cash flow, categories, and monthly spending." />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Net Cash Flow"
              value={formatMoney(s.netCashFlow, currency)}
              icon={<ArrowLeftRight size={16} className="text-primary" />}
              iconBg="bg-blue-50"
              hint="Income minus expenses"
            />
            <StatCard
              label="Total Income"
              value={formatMoney(s.totalIncome, currency)}
              valueClass="text-emerald-600 dark:text-emerald-400"
              icon={<ArrowDownCircle size={16} className="text-emerald-500" />}
              iconBg="bg-emerald-50"
              hint="For the selected period"
            />
            <StatCard
              label="Total Expenses"
              value={formatMoney(s.totalExpenses, currency)}
              valueClass="text-rose-600 dark:text-rose-400"
              icon={<ArrowUpCircle size={16} className="text-rose-500" />}
              iconBg="bg-rose-50"
              hint="For the selected period"
            />
            <StatCard
              label="Savings Rate"
              value={`${s.savingsRate}%`}
              icon={<PiggyBank size={16} className="text-violet-500" />}
              iconBg="bg-violet-50"
              hint="Of total income"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="card p-5 lg:col-span-2">
              <h2 className="font-display font-semibold text-ink">Income vs Expenses</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Monthly cash flow for the selected period.</p>
              <IncomeExpenseChart data={data.incomeVsExpenses} />
            </div>
            <div className="card p-5">
              <h2 className="font-display font-semibold text-ink">Spending by Category</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Breakdown of logged expenses.</p>
              <CategoryDonut
                data={data.spendingByCategory}
                totalLabel="TOTAL"
                totalValue={formatMoney(
                  data.spendingByCategory.reduce((sum, c) => sum + c.amount, 0),
                  currency
                )}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="card p-5 lg:col-span-2">
              <h2 className="font-display font-semibold text-ink">Monthly Spending</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Outflow trend across recent months.</p>
              <MonthlySpendChart data={data.monthlySpending} />
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-ink">Financial Health</h2>
                <span className="h-8 w-8 rounded-lg bg-blue-50 text-primary grid place-items-center shrink-0 dark:bg-blue-500/10">
                  <Activity size={16} />
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">A quick read on this period's savings and budget pace.</p>

              <div className="flex items-center gap-4">
                <div
                  className="relative h-24 w-24 rounded-full grid place-items-center shrink-0"
                  style={{
                    background: `conic-gradient(${healthHex} ${data.financialHealth.score * 3.6}deg, ${isDark ? "#1E293B" : "#E2E8F0"} 0deg)`,
                  }}
                >
                  <div className="h-[76px] w-[76px] rounded-full bg-white dark:bg-slate-900 grid place-items-center">
                    <div className="text-center">
                      <p className="font-display text-2xl font-bold text-ink tabular leading-none">
                        {data.financialHealth.score}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5">/ 100</p>
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                      HEALTH_STYLES[data.financialHealth.label]?.pill || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {data.financialHealth.label}
                  </span>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{data.financialHealth.daysRemaining} days left this month</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <HealthMetricRow
                  label="Savings Rate"
                  value={`${data.financialHealth.savingsRate}%`}
                  pct={savingsRatePct}
                  colorClass={savingsColorClass}
                />

                {data.financialHealth.budgetUsage !== null ? (
                  <HealthMetricRow
                    label="Budget Usage"
                    value={`${data.financialHealth.budgetUsage}%`}
                    pct={data.financialHealth.budgetUsage}
                    colorClass={data.financialHealth.budgetUsage >= 100 ? "bg-rose-500" : "bg-primary"}
                  />
                ) : (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3.5 dark:bg-slate-800/40 dark:border-slate-800">
                    <span className="h-8 w-8 rounded-lg bg-white border border-slate-200 text-slate-400 grid place-items-center shrink-0 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-500">
                      <Wallet size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink">No budget set for this period</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Create a budget to track spending against a limit.</p>
                      <Link to="/budgets" className="inline-block text-xs font-semibold text-primary mt-1.5">
                        Create budget →
                      </Link>
                    </div>
                  </div>
                )}

                {incomeConsistency ? (
                  <HealthMetricRow
                    label="Income Consistency"
                    value={incomeConsistency.label}
                    pct={incomeConsistency.pct}
                    colorClass={incomeConsistency.colorClass}
                  />
                ) : (
                  <div>
                    <div className="flex justify-between items-baseline text-xs mb-1.5">
                      <span className="font-medium text-ink">Income Consistency</span>
                      <span className="text-slate-400 dark:text-slate-500">Not enough data yet</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Largest Expense"
              value={h.largestExpense ? formatMoney(h.largestExpense.amount, currency) : "—"}
              hint={h.largestExpense ? `${h.largestExpense.title} · ${h.largestExpense.category}` : undefined}
              icon={<DollarSign size={16} className="text-primary" />}
              iconBg="bg-blue-50"
            />
            <StatCard
              label="Highest Category"
              value={h.highestCategory?.category || "—"}
              hint={
                h.highestCategory
                  ? `${formatMoney(h.highestCategory.amount, currency)} · ${h.highestCategory.percent}% of spend`
                  : undefined
              }
              icon={<Tag size={16} className="text-violet-500" />}
              iconBg="bg-violet-50"
            />
            <StatCard
              label="Average Daily Spending"
              value={formatMoney(h.averageDailySpending, currency)}
              hint="Based on the selected period"
              icon={<CalendarDays size={16} className="text-primary" />}
              iconBg="bg-blue-50"
            />
            <StatCard
              label="Transactions Logged"
              value={h.transactionsLogged}
              hint={`${h.incomeCount} income · ${h.expenseCount} expense`}
              icon={<ListChecks size={16} className="text-primary" />}
              iconBg="bg-blue-50"
            />
          </div>

          {keyInsights.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-lg bg-blue-50 text-primary grid place-items-center shrink-0 dark:bg-blue-500/10">
                  <Lightbulb size={16} />
                </span>
                <div>
                  <h2 className="font-display font-semibold text-ink">Key Spending Insights</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Rule-based observations from this period's data.</p>
                </div>
              </div>
              <div className={`mt-4 grid gap-3 ${INSIGHT_GRID_CLASSES[keyInsights.length] || INSIGHT_GRID_CLASSES[4]}`}>
                {keyInsights.map(({ icon: Icon, tone, title, body, value }) => (
                  <div key={title} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 ${TONE_CLASSES[tone]}`}>
                        <Icon size={14} />
                      </span>
                      {value && <span className="text-sm font-bold text-ink tabular">{value}</span>}
                    </div>
                    <p className="text-xs font-semibold text-ink">{title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
