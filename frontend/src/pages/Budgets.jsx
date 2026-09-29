import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  CreditCard,
  PiggyBank,
  Utensils,
  Home,
  Car,
  Ticket,
  Zap,
  ShoppingBag,
  Heart,
  Plane,
  Briefcase,
  Tag,
  Lightbulb,
  ArrowRight,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { listBudgets, createBudget, updateBudget, deleteBudget } from "../services/budgetService";
import { listCategories } from "../services/categoryService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatMoney, progressColor } from "../utils/format";
import { Alert, EmptyState, ErrorState, PageLoader } from "../components/common/Feedback";
import Modal from "../components/common/Modal";

// Same icon vocabulary as the existing Category model's `icon` field
// (see pages/Categories.jsx). Duplicated locally rather than imported so
// this refinement stays scoped to Budgets.jsx only.
const CATEGORY_ICONS = {
  utensils: Utensils,
  home: Home,
  car: Car,
  ticket: Ticket,
  zap: Zap,
  bag: ShoppingBag,
  heart: Heart,
  plane: Plane,
  briefcase: Briefcase,
  tag: Tag,
};

function CategoryBadge({ icon, color }) {
  const Icon = CATEGORY_ICONS[icon] || Tag;
  return (
    <span
      className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
      style={{ backgroundColor: `${color || "#2563EB"}1A`, color: color || "#2563EB" }}
    >
      <Icon size={18} />
    </span>
  );
}

const STATUS_META = {
  over: { label: "Over Budget", chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400", dot: "bg-rose-500" },
  near: { label: "Near Limit", chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", dot: "bg-amber-500" },
  on_track: { label: "On Track", chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", dot: "bg-emerald-500" },
};

const FILTERS = [
  { key: "all", label: "All Budgets" },
  { key: "on_track", label: "On Track" },
  { key: "near", label: "Near Limit" },
  { key: "over", label: "Over Budget" },
];

// A simple, deterministic bucket for the Overall Usage badge - the same
// rule-based approach used elsewhere in the app (e.g. Goals' pace labels).
// No prediction, no AI - just thresholds over the real overallUsage number.
function usageMeta(pct) {
  if (pct >= 100) return { label: "Over Budget", chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" };
  if (pct >= 80) return { label: "Near Limit", chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" };
  return { label: "Pacing Well", chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" };
}

// For an over-budget item, "136.4% used" is confusing - the meaningful
// number is how far past the limit it is. Both derived purely from the
// budget's own real amount/spent fields, no new data or estimate involved:
//   percentage exceeded = ((spent - amount) / amount) * 100
function usageLabel(b) {
  if (b.status === "over" && b.amount > 0) {
    const exceededPct = ((b.spent - b.amount) / b.amount) * 100;
    return `${exceededPct.toFixed(1)}% exceeded`;
  }
  return `${b.percentUsed}% used`;
}

// Local, self-contained action menu (mirrors the existing pattern already
// used on the Goals page). Calls the exact same edit/delete handlers the
// visible buttons used to call - only the trigger UI changes.
function BudgetMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        className="h-8 w-8 grid place-items-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-ink hover:bg-slate-50 dark:hover:bg-slate-800"
        onClick={() => setOpen((o) => !o)}
        aria-label="Budget actions"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-10 w-36 card p-1.5 shadow-lg">
          <button
            type="button"
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-ink hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Budgets() {
  const { user } = useAuth();
  const currency = user?.preferences?.currency || "USD";
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ category: "", amount: "" });
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [res, cats] = await Promise.all([listBudgets(period), listCategories({ type: "expense" })]);
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
    setFilter("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.year, period.month]);

  const openCreate = () => {
    setForm({ category: "", amount: "" });
    setModal("create");
  };

  const openEdit = (b) => {
    setForm({ id: b._id, category: b.category, amount: b.amount });
    setModal("edit");
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, amount: Number(form.amount), year: period.year, month: period.month };
      if (modal === "create") await createBudget(payload);
      else await updateBudget(form.id, { category: form.category, amount: Number(form.amount) });
      setModal(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try {
      await deleteBudget(id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // Real category -> icon/color lookup, cross-referenced from the categories
  // already fetched for the create/edit dropdown. No new data is fetched.
  const categoryMeta = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.name, c));
    return map;
  }, [categories]);

  const isCurrentPeriod = period.year === now.getFullYear() && period.month === now.getMonth() + 1;
  const monthLabel = new Date(2000, period.month - 1, 1).toLocaleString("en-US", { month: "long" });

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const summary = data.summary;
  const items = data.items;
  const visibleItems = filter === "all" ? items : items.filter((b) => b.status === filter);
  const usage = usageMeta(summary.overallUsage);

  // Rule-based, single most-relevant observation - never fabricated, always
  // derived directly from the real per-category statuses already computed
  // by the backend (services/budgetService.js).
  let insight = null;
  let insightTone = "neutral";
  if (items.length > 0) {
    const overBudget = [...items].filter((b) => b.status === "over").sort((a, b) => b.percentUsed - a.percentUsed)[0];
    const nearLimit = [...items].filter((b) => b.status === "near").sort((a, b) => b.percentUsed - a.percentUsed)[0];
    if (overBudget) {
      insight = `${overBudget.category} is over budget by ${formatMoney(Math.abs(overBudget.remaining), currency)}.`;
      insightTone = "over";
    } else if (nearLimit) {
      insight = `${nearLimit.category} is closest to its limit at ${nearLimit.percentUsed}% used.`;
      insightTone = "near";
    } else {
      insight = "All your category budgets are on track this month.";
      insightTone = "good";
    }
  }
  const insightToneClass = {
    over: "text-rose-600 dark:text-rose-400",
    near: "text-amber-600 dark:text-amber-400",
    good: "text-emerald-600 dark:text-emerald-400",
    neutral: "text-slate-500 dark:text-slate-400",
  }[insightTone];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="text-slate-500 dark:text-slate-400">Set monthly category limits and track remaining amounts.</p>
        </div>
        <div className="flex gap-2">
          <select
            className="input w-auto"
            value={period.month}
            onChange={(e) => setPeriod((p) => ({ ...p, month: Number(e.target.value) }))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString("en-US", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            className="input w-auto"
            value={period.year}
            onChange={(e) => setPeriod((p) => ({ ...p, year: Number(e.target.value) }))}
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button className="btn-primary" type="button" onClick={openCreate}>
            <Plus size={16} /> Create Budget
          </button>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Total Budget</p>
            <span className="h-9 w-9 rounded-xl bg-blue-50 text-primary grid place-items-center shrink-0 dark:bg-blue-500/10">
              <Wallet size={17} />
            </span>
          </div>
          <p className="mt-3 font-display text-[28px] leading-9 font-bold tabular text-ink">
            {formatMoney(summary.totalBudget, currency)}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {summary.count} active category budget{summary.count === 1 ? "" : "s"}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Total Spent</p>
            <span className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 grid place-items-center shrink-0 dark:bg-rose-500/10 dark:text-rose-400">
              <CreditCard size={17} />
            </span>
          </div>
          <p className="mt-3 font-display text-[28px] leading-9 font-bold tabular text-ink">
            {formatMoney(summary.totalSpent, currency)}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{summary.overallUsage}% of total allowance</p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Remaining</p>
            <span className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0 dark:bg-emerald-500/10 dark:text-emerald-400">
              <PiggyBank size={17} />
            </span>
          </div>
          <p className="mt-3 font-display text-[28px] leading-9 font-bold tabular text-ink">
            {formatMoney(summary.remaining, currency)}
          </p>
          {isCurrentPeriod && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{data.period.daysRemaining} days left in {monthLabel}</p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Overall Usage</p>
            <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${usage.chip}`}>{usage.label}</span>
          </div>
          <p className="mt-3 font-display text-[28px] leading-9 font-bold tabular text-ink">
            {summary.overallUsage}%
          </p>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
            <div
              className={`h-full rounded-full ${progressColor(summary.overallUsage)}`}
              style={{ width: `${Math.min(100, summary.overallUsage)}%` }}
            />
          </div>
          {isCurrentPeriod && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{data.period.daysRemaining} days left</p>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-ink text-lg">Your Budgets</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Category spending against monthly allocations.</p>
            </div>
            <div className="inline-flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              {FILTERS.map((f) => {
                const count = f.key === "all" ? summary.count : summary[f.key === "on_track" ? "onTrack" : f.key === "near" ? "near" : "over"];
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filter === f.key ? "bg-white text-ink shadow-sm dark:bg-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-ink"
                    }`}
                  >
                    {f.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!items.length ? (
        <EmptyState
          title="No budgets created yet"
          body="Create a category budget to see usage and remaining amounts."
          action={
            <button className="btn-primary" type="button" onClick={openCreate}>
              <Plus size={16} /> Create Budget
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {visibleItems.map((b) => {
            const meta = STATUS_META[b.status] || STATUS_META.on_track;
            const cat = categoryMeta.get(b.category);
            return (
              <div key={b._id} className="card p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryBadge icon={cat?.icon} color={cat?.color} />
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-ink truncate">{b.category}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{usageLabel(b)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.chip}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <BudgetMenu onEdit={() => openEdit(b)} onDelete={() => remove(b._id)} />
                  </div>
                </div>

                <p className="mt-4 text-ink">
                  <span className="font-display text-xl font-bold tabular">{formatMoney(b.spent, currency)}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400"> of {formatMoney(b.amount, currency)}</span>
                </p>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${progressColor(b.percentUsed)}`}
                    style={{ width: `${Math.min(100, b.percentUsed)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className={b.remaining < 0 ? "text-rose-600 dark:text-rose-400 font-medium" : ""}>
                    {b.remaining < 0
                      ? `${formatMoney(Math.abs(b.remaining), currency)} over budget`
                      : `${formatMoney(b.remaining, currency)} remaining`}
                  </span>
                  <span className={b.status === "over" ? "text-rose-600 dark:text-rose-400 font-medium" : ""}>{usageLabel(b)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && insight && (
        <div className="card p-5 sm:p-6 bg-blue-50/60 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <span className="h-11 w-11 rounded-xl bg-white text-primary grid place-items-center shrink-0 shadow-sm dark:bg-slate-900">
                <Lightbulb size={20} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-semibold text-ink">Budget Insight</p>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-primary shrink-0 dark:bg-slate-900">
                    {monthLabel} Overview
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  You're using {summary.overallUsage}% of your total monthly budget
                  {isCurrentPeriod ? ` with ${data.period.daysRemaining} days remaining` : ""}.
                </p>
                <p className={`text-sm font-medium mt-0.5 ${insightToneClass}`}>{insight}</p>
              </div>
            </div>
            <Link
              to="/insights"
              className="btn-secondary !bg-white dark:!bg-slate-900 shrink-0 w-full sm:w-auto justify-center"
            >
              View Insights <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal === "create" ? "Create Budget" : "Edit Budget"} onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount</label>
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
