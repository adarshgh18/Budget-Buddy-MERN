import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInsights } from "../services/analyticsService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../utils/format";
import { EmptyState, ErrorState, PageLoader } from "../components/common/Feedback";
import {
  TrendingDown,
  TrendingUp,
  PieChart,
  PiggyBank,
  DollarSign,
  Tag,
  AlertTriangle,
  Repeat,
  Lightbulb,
  BarChart3,
  Flag,
  Receipt,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Minus,
} from "lucide-react";

const TONE_STYLES = {
  positive: {
    card: "border-emerald-100 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    dot: "bg-emerald-500",
    label: "Positive",
  },
  attention: {
    card: "border-rose-100 bg-rose-50/60 dark:border-rose-500/20 dark:bg-rose-500/10",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
    icon: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    dot: "bg-rose-500",
    label: "Attention",
  },
  info: {
    card: "border-blue-100 bg-blue-50/60 dark:border-blue-500/20 dark:bg-blue-500/10",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    dot: "bg-blue-500",
    label: "Informational",
  },
};

// Presentation-only mapping keyed by each card/action's existing real `href` -
// picks a friendlier link label and icon for where that link already goes.
// No new destinations, no new data - just nicer wording for existing links.
const HREF_META = {
  "/analytics": { label: "View Analysis", icon: BarChart3 },
  "/categories": { label: "View Category", icon: Tag },
  "/budgets": { label: "View Budget", icon: PieChart },
  "/transactions": { label: "View Transactions", icon: Receipt },
  "/goals": { label: "View Goals", icon: Flag },
  "/recurring": { label: "View Recurring", icon: Repeat },
};
const DEFAULT_HREF_META = { label: "Open related page", icon: ArrowRight };

function getCardIcon(card) {
  if (card.id === "spending-change") return card.tone === "positive" ? TrendingDown : TrendingUp;
  if (card.id === "largest-category") return Tag;
  if (card.id.startsWith("budget-")) return AlertTriangle;
  if (card.id === "unusual-large-transaction") return AlertTriangle;
  if (card.id === "category-increase") return TrendingUp;
  if (card.id === "savings-rate") return PiggyBank;
  if (card.id === "upcoming-recurring") return Repeat;
  return Lightbulb;
}

const METRIC_LABELS = {
  thisMonth: "This Month",
  priorCycle: "Prior Cycle",
  saved: "Saved",
  amount: "Amount",
  share: "Share of Total",
  spent: "Spent",
  limit: "Limit",
  remaining: "Remaining",
  average: "Average",
  paceDelta: "Pace Delta",
  currentCycle: "Current Cycle",
  netSavings: "Net Savings",
  rate: "Rate",
  scheduledOutflow: "Scheduled Outflow",
  payments: "Payments",
};
const MONEY_METRIC_KEYS = [
  "thisMonth",
  "priorCycle",
  "saved",
  "amount",
  "spent",
  "limit",
  "remaining",
  "paceDelta",
  "currentCycle",
  "netSavings",
  "scheduledOutflow",
  "average",
];
// Static (Tailwind-JIT-safe) column-count classes for the metrics mini-grid.
const METRIC_GRID_CLASSES = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-2" };

// Factual, data-driven summary sentence for the Month-over-Month card, built
// only from data.monthOverMonth (already loaded). Uses absolute amounts, not
// percentages, so it stays meaningful even when a previous value is 0 - and
// never labels a change "good"/"bad", only describes direction and size.
function buildComparisonSummary(monthOverMonth, currency) {
  const { income, expenses } = monthOverMonth;
  const incomeValid = income.previous > 0;
  const expenseValid = expenses.previous > 0;
  if (!incomeValid && !expenseValid) {
    return "Comparison unavailable due to insufficient previous-period data.";
  }

  const incomeDiff = income.current - income.previous;
  const expenseDiff = expenses.current - expenses.previous;
  const dir = (diff) => (diff > 0 ? "increased" : diff < 0 ? "decreased" : "stayed flat");
  const phrase = (label, diff) =>
    dir(diff) === "stayed flat" ? `${label} stayed flat` : `${label} ${dir(diff)} by ${formatMoney(Math.abs(diff), currency)}`;

  if (incomeValid && expenseValid) {
    if (dir(incomeDiff) === "stayed flat" && dir(expenseDiff) === "stayed flat") {
      return "Income and expenses were unchanged compared with last month.";
    }
    return `${phrase("Income", incomeDiff)} while ${phrase("expenses", expenseDiff).toLowerCase()} compared with last month.`;
  }
  if (incomeValid) {
    return `${phrase("Income", incomeDiff)} compared with last month; expense comparison isn't available yet.`;
  }
  return `${phrase("Expenses", expenseDiff)} compared with last month; income comparison isn't available yet.`;
}

export default function Insights() {
  const { user } = useAuth();
  const currency = user?.preferences?.currency || "USD";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getInsights();
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

  const s = data.summary;
  const empty = !data.cards.length && !data.recommendedActions.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Financial Insights</h1>
        <p className="text-slate-500 dark:text-slate-400">Understand your spending patterns and make smarter decisions with your financial data.</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Spending Change</p>
            <span
              className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
                s.spendingChange === null
                  ? "bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  : s.spendingChange <= 0
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
              }`}
            >
              {s.spendingChange === null ? (
                <Minus size={16} />
              ) : s.spendingChange <= 0 ? (
                <TrendingDown size={16} />
              ) : (
                <TrendingUp size={16} />
              )}
            </span>
          </div>
          <p className="mt-3 font-display text-[28px] leading-9 font-bold tabular text-ink">
            {s.spendingChange === null ? "—" : `${Math.abs(s.spendingChange)}%`}
          </p>
          {s.spendingChange !== null && (
            <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                s.spendingChange <= 0 
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
              }`}
            >
              {s.spendingChange <= 0 ? "Reduced Spending" : "Increased Spending"} 
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              vs last month
            </span>
            </div>
          )}
          {/* <p className="mt-2 text-xs text-slate-500">vs last month</p> */}
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Budget Health</p>
            <span className="h-8 w-8 rounded-lg bg-blue-50 text-primary grid place-items-center shrink-0 dark:bg-blue-500/10">
              <PieChart size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-[28px] leading-9 font-bold tabular text-ink">
            {s.budgetHealth === null ? "—" : `${s.budgetHealth}%`}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {s.budgetHealth === null ? "No active budgets this month" : `${s.daysRemaining} days left this month`}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Savings Rate</p>
            <span
              className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
                s.savingsRate >= 20
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
              }`}
            >
              <PiggyBank size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-[28px] leading-9 font-bold tabular text-ink">{s.savingsRate}%</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">of income this month</p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Largest Expense</p>
            <span className="h-8 w-8 rounded-lg bg-blue-50 text-primary grid place-items-center shrink-0 dark:bg-blue-500/10">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-[28px] leading-9 font-bold tabular text-ink">
            {s.largestExpense ? formatMoney(s.largestExpense.amount, currency) : "—"}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {s.largestExpense ? `${s.largestExpense.title} · ${s.largestExpense.category}` : "No expenses yet"}
          </p>
        </div>
      </div>

      {empty ? (
        <EmptyState title="No insights yet" body="Add transactions and budgets to generate rule-based insights." />
      ) : (
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Key Insights</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Important patterns detected from your recent transactions.</p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.cards.map((card) => {
              const tone = TONE_STYLES[card.tone] || TONE_STYLES.info;
              const Icon = getCardIcon(card);
              const metricEntries = card.metrics ? Object.entries(card.metrics) : [];
              const linkMeta = HREF_META[card.href] || DEFAULT_HREF_META;
              return (
                <div key={card.id} className={`card p-5 flex flex-col ${tone.card}`}>
                  <div className="flex items-center justify-between">
                    <span className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${tone.icon}`}>
                      <Icon size={17} />
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${tone.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                      {tone.label}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-ink mt-3">{card.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">{card.body}</p>
                  {metricEntries.length > 0 && (
                    <div
                      className={`mt-3 grid gap-x-3 gap-y-1 bg-white/70 dark:bg-slate-800/60 rounded-lg p-3 text-xs ${
                        METRIC_GRID_CLASSES[metricEntries.length] || "grid-cols-2"
                      }`}
                    >
                      {metricEntries.map(([k, v]) => {
                        const display = MONEY_METRIC_KEYS.includes(k) && typeof v === "number" ? formatMoney(v, currency) : v;
                        return (
                          <div key={k}>
                            <p className="text-slate-400 dark:text-slate-500">{METRIC_LABELS[k] || k.replace(/([A-Z])/g, " $1")}</p>
                            <p className="font-semibold text-ink tabular">{display}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {card.href && (
                    <Link
                      to={card.href}
                      className="text-sm text-primary font-medium mt-3 inline-flex items-center gap-1"
                    >
                      {linkMeta.label} <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(data.spendingPatterns?.length > 0 || data.monthOverMonth) && (
        <div className="grid lg:grid-cols-2 gap-4">
          {data.spendingPatterns?.length > 0 && (
            <div className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display font-semibold text-ink">Spending Patterns</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Top outflow categories by percentage of total spend.</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full shrink-0">
                  {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
              <ul className="space-y-3">
                {data.spendingPatterns.slice(0, 6).map((c) => (
                  <li key={c.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-ink">
                        {c.category} <span className="text-slate-400 dark:text-slate-500 font-normal">{c.percent}%</span>
                      </span>
                      <span className="tabular text-slate-600 dark:text-slate-300">{formatMoney(c.amount, currency)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(100, c.percent)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.monthOverMonth && (
            <div className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display font-semibold text-ink">Month-over-Month Comparison</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Comparative breakdown against last month.</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full shrink-0 whitespace-nowrap">
                  vs {new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { key: "income", label: "Total Income", icon: ArrowDownCircle, iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
                  { key: "expenses", label: "Total Expenses", icon: ArrowUpCircle, iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" },
                  { key: "net", label: "Net Cash Flow", icon: BarChart3, iconBg: "bg-blue-50 text-primary dark:bg-blue-500/10" },
                ].map(({ key, label, icon: RowIcon, iconBg }) => {
                  const point = data.monthOverMonth[key];
                  const delta =
                    point.previous !== 0
                      ? Math.round(((point.current - point.previous) / Math.abs(point.previous)) * 1000) / 10
                      : null;
                  const goodDirection = key === "expenses" ? delta <= 0 : delta >= 0;
                  return (
                    <div key={key} className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-3 first:border-0 first:pt-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${iconBg}`}>
                          <RowIcon size={15} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">{label}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Prior: {formatMoney(point.previous, currency)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="tabular font-semibold text-ink">{formatMoney(point.current, currency)}</p>
                        {delta !== null && (
                          <p className={`text-xs ${goodDirection ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {delta >= 0 ? "+" : ""}
                            {delta}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                {buildComparisonSummary(data.monthOverMonth, currency)}
              </p>
            </div>
          )}
        </div>
      )}

      {data.recommendedActions?.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Recommended Actions</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Deterministic rule-based recommendations based on your current activity.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recommendedActions.map((a) => {
              const linkMeta = HREF_META[a.href] || DEFAULT_HREF_META;
              const ActionIcon = linkMeta.icon;
              return (
                <div key={a.title} className="card p-5 flex flex-col">
                  <span className="h-9 w-9 rounded-lg bg-blue-50 text-primary grid place-items-center shrink-0 dark:bg-blue-500/10">
                    <ActionIcon size={17} />
                  </span>
                  <h3 className="font-display font-semibold text-ink mt-3">{a.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex-1">{a.body}</p>
                  {a.href && (
                    <Link
                      to={a.href}
                      className="btn-secondary mt-4 justify-center text-sm"
                    >
                      {linkMeta.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
