import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Store,
  CreditCard,
  FileText,
  UploadCloud,
  CheckCircle2,
  Repeat,
  Utensils,
  Home,
  Car,
  Ticket,
  Zap,
  ShoppingBag,
  Heart,
  Plane,
  MoreHorizontal,
  Wallet,
  Briefcase,
  Plus,
  Tag,
} from "lucide-react";
import { listCategories } from "../services/categoryService";
import { createTransaction } from "../services/transactionService";
import { listBudgets } from "../services/budgetService";
import { createRecurring } from "../services/recurringService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  formatMoney,
  formatDate,
  progressColor,
  PAYMENT_METHOD_LABELS,
  FREQUENCY_LABELS,
  toInputDate,
} from "../utils/format";
import { Alert } from "../components/common/Feedback";

// Mirrors the icon set already used on the Categories page so a selected
// category's real icon/color shows up in the live preview below. Kept local
// to this page (rather than imported) so Categories.jsx stays untouched.
const CATEGORY_ICONS = {
  utensils: Utensils,
  home: Home,
  car: Car,
  ticket: Ticket,
  zap: Zap,
  bag: ShoppingBag,
  heart: Heart,
  plane: Plane,
  more: MoreHorizontal,
  wallet: Wallet,
  briefcase: Briefcase,
  plus: Plus,
  tag: Tag,
};

function CategoryIcon({ icon, color }) {
  const Icon = CATEGORY_ICONS[icon] || Tag;
  return (
    <span
      className="h-11 w-11 rounded-xl grid place-items-center shrink-0"
      style={{ backgroundColor: `${color || "#2563EB"}1A`, color: color || "#2563EB" }}
    >
      <Icon size={18} />
    </span>
  );
}

// Derives the correct symbol ($, €, £, ₹...) for the account's actual
// currency preference instead of ever hardcoding one, so the Amount field
// always agrees with the currency used everywhere else on this page.
function currencySymbolFor(currency) {
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value || currency;
  } catch {
    return currency;
  }
}

const empty = {
  type: "expense",
  title: "",
  amount: "",
  category: "",
  date: toInputDate(new Date()),
  paymentMethod: "debit_card",
  description: "",
};

export default function AddTransaction() {
  const { user } = useAuth();
  const toast = useToast();
  const currency = user?.preferences?.currency || "USD";
  const currencySymbol = useMemo(() => currencySymbolFor(currency), [currency]);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Recurring is handled as separate state (not part of `form`) because on
  // submit it changes which existing service gets called, not what fields
  // get sent to the transaction endpoint.
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState("monthly");

  useEffect(() => {
    (async () => {
      try {
        const [cats, b] = await Promise.all([listCategories(), listBudgets()]);
        setCategories(cats.data.data.items);
        setBudgets(b.data.data.items || []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const filteredCats = categories.filter((c) => c.type === form.type);
  const matchingBudget = useMemo(
    () => budgets.find((b) => b.category === form.category),
    [budgets, form.category]
  );
  const selectedCategory = useMemo(
    () => filteredCats.find((c) => c.name === form.category),
    [filteredCats, form.category]
  );

  // Drives the "Category Budget Impact" card. Built entirely from the
  // budgets already fetched via the existing listBudgets() API (same data/
  // math the Budgets page uses: amount, spent, remaining, percentUsed) — no
  // new backend logic and no invented numbers.
  const budgetImpact = useMemo(() => {
    if (!form.category) return { state: "no-category" };
    if (!matchingBudget) return { state: "no-budget" };
    if (form.type === "income") return { state: "income", budget: matchingBudget };

    const entered = Number(form.amount) || 0;
    const projectedSpent = matchingBudget.spent + entered;
    const projectedPercent =
      matchingBudget.amount > 0 ? Math.round(((projectedSpent / matchingBudget.amount) * 100) * 10) / 10 : 0;
    let status = "on_track";
    if (projectedPercent >= 100) status = "over";
    else if (projectedPercent >= 80) status = "near";

    return {
      state: "expense",
      budget: matchingBudget,
      projectedSpent,
      projectedRemaining: matchingBudget.amount - projectedSpent,
      projectedPercent,
      status,
    };
  }, [form.category, form.type, form.amount, matchingBudget]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (recurring) {
        // Reuses the existing Recurring Transactions API/model — the same
        // createRecurring() call the Recurring page itself uses — so this
        // rule shows up there too and generates real Transaction rows via
        // the existing generateDueRecurring backend logic. Receipt uploads
        // aren't part of the recurring schema, so no file is sent here.
        await createRecurring({
          title: form.title,
          amount: Number(form.amount),
          type: form.type,
          category: form.category,
          paymentMethod: form.paymentMethod,
          description: form.description,
          frequency,
          startDate: form.date,
          isActive: true,
        });
        toast.success("Recurring transaction created.");
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (file) fd.append("receipt", file);
        await createTransaction(fd);
        toast.success("Transaction added successfully.");
      }
      navigate("/transactions");
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isIncome = form.type === "income";

  return (
    <div className="max-w-6xl">
      <Link
        to="/transactions"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-ink transition"
      >
        <ArrowLeft size={15} />
        Back to Transactions
      </Link>
      <h1 className="page-title mt-3">Add Transaction</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-1">Record a new income or expense.</p>

      <div className="grid lg:grid-cols-3 gap-6 mt-8 items-start">
        <form onSubmit={onSubmit} className="card p-6 sm:p-8 lg:col-span-2 space-y-6">
          {error && <Alert>{error}</Alert>}

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="label mb-0">Transaction Type</p>
              <span className="text-xs text-slate-400 dark:text-slate-500">Select financial direction</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["expense", "income"].map((t) => {
                const selected = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t, category: "" }))}
                    className={`flex items-center justify-center gap-2 h-14 rounded-xl border font-semibold capitalize transition ${
                      selected
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                  >
                    {t === "expense" ? <ArrowDown size={17} /> : <ArrowUp size={17} />}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Transaction Title *</label>
            <div className="relative">
              <input
                className="input h-12 pr-10"
                name="title"
                value={form.title}
                onChange={onChange}
                required
              />
              <Store size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Amount *</label>
                <span className="text-xs text-slate-400 dark:text-slate-500">{currency}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">
                  {currencySymbol}
                </span>
                <input
                  className="input h-12 pl-7"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={onChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Category *</label>
              <select className="input h-12" name="category" value={form.category} onChange={onChange} required>
                <option value="">Select category</option>
                {filteredCats.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input className="input h-12" type="date" name="date" value={form.date} onChange={onChange} required />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <div className="relative">
                <select
                  className="input h-12 pr-10 appearance-none cursor-pointer"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={onChange}
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <CreditCard size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">
                Description <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
              </label>
              <span className="text-xs text-slate-400 dark:text-slate-500">{form.description.length} / 250 characters</span>
            </div>
            <textarea
              className="input !h-28 py-3 leading-relaxed"
              name="description"
              maxLength={250}
              value={form.description}
              onChange={onChange}
            />
          </div>

          <div
            className={`rounded-xl border p-4 transition ${
              recurring
                ? "border-primary/30 bg-blue-50/40 dark:bg-blue-500/10"
                : "border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40"
            }`}
          >
            <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
              <span className="flex items-center gap-3 min-w-0">
                <span className="h-9 w-9 rounded-lg bg-white border border-slate-200 grid place-items-center text-primary shrink-0 dark:bg-slate-900 dark:border-slate-700">
                  <Repeat size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">Make this recurring</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Automatically create this transaction on schedule</span>
                </span>
              </span>
              <span className="relative inline-flex h-6 w-11 items-center rounded-full shrink-0">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                />
                <span className="absolute inset-0 rounded-full bg-slate-300 dark:bg-slate-700 peer-checked:bg-primary transition-colors" />
                <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
              </span>
            </label>

            {recurring && (
              <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-700/70 grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Frequency</label>
                  <select
                    className="input h-12"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Starts {formatDate(form.date, user?.preferences?.dateFormat)}, repeats{" "}
                    {FREQUENCY_LABELS[frequency].toLowerCase()}. Manage or pause it later from Recurring.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Link to="/transactions" className="btn-secondary h-12 px-6 text-[15px]">
              Cancel
            </Link>
            <button className="btn-primary h-12 px-6 text-[15px]" disabled={loading}>
              {loading ? (
                "Saving…"
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  {recurring ? "Save Recurring Transaction" : "Save Transaction"}
                </>
              )}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-ink">Transaction Preview</h2>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-blue-50 rounded-full px-2.5 py-1 dark:bg-blue-500/10">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Live
              </span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
                  Feed Item View
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isIncome
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                  }`}
                >
                  {isIncome ? "Income" : "Expense"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CategoryIcon icon={selectedCategory?.icon} color={selectedCategory?.color} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{form.title || "Untitled"}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {form.description || "No description yet"}
                  </p>
                </div>
                <p
                  className={`font-display font-bold tabular text-lg shrink-0 ${
                    isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {form.amount ? `${isIncome ? "+" : "-"}${formatMoney(form.amount, currency)}` : "—"}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {form.category ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-2.5 py-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                    {form.category}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">No category</span>
                )}
                {recurring && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-blue-50 rounded-full px-2.5 py-1 dark:bg-blue-500/10">
                    <Repeat size={11} />
                    Repeats {FREQUENCY_LABELS[frequency].toLowerCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-ink">Category Budget Impact</h2>
              {budgetImpact.state === "expense" && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    budgetImpact.status === "over"
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                      : budgetImpact.status === "near"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                  }`}
                >
                  {budgetImpact.status === "over" ? "Over budget" : budgetImpact.status === "near" ? "Near limit" : "On track"}
                </span>
              )}
            </div>

            {budgetImpact.state === "no-category" && (
              <p className="text-sm text-slate-400 dark:text-slate-500">Select a category to see its budget impact.</p>
            )}

            {budgetImpact.state === "no-budget" && (
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No budget set for <span className="font-medium text-ink">{form.category}</span> yet.
                </p>
                <Link
                  to="/budgets"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-2 hover:underline"
                >
                  Set a budget <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {budgetImpact.state === "income" && (
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-ink">{form.category}</span> budget:{" "}
                  {formatMoney(budgetImpact.budget.amount, currency)} ·{" "}
                  {formatMoney(budgetImpact.budget.spent, currency)} spent so far.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Budget not affected — category budgets track expenses only.</p>
              </div>
            )}

            {budgetImpact.state === "expense" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Budget</span>
                  <span className="font-medium text-ink tabular">{formatMoney(budgetImpact.budget.amount, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Spent so far</span>
                  <span className="font-medium text-ink tabular">{formatMoney(budgetImpact.budget.spent, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">After this</span>
                  <span
                    className={`font-semibold tabular ${
                      budgetImpact.status === "over"
                        ? "text-rose-600 dark:text-rose-400"
                        : budgetImpact.status === "near"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-ink"
                    }`}
                  >
                    {formatMoney(budgetImpact.projectedSpent, currency)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1">
                  <div
                    className={`h-full ${progressColor(budgetImpact.projectedPercent)}`}
                    style={{ width: `${Math.min(100, budgetImpact.projectedPercent)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                  {formatMoney(budgetImpact.projectedRemaining, currency)} remaining · {budgetImpact.projectedPercent}% used
                </p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-3">
              <span className="h-10 w-10 rounded-xl bg-blue-50 text-primary grid place-items-center shrink-0 dark:bg-blue-500/10">
                <FileText size={18} />
              </span>
              <div className="min-w-0">
                <h2 className="font-display font-semibold text-ink text-[15px]">Attach Receipt / Invoice</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">PDF, PNG, or JPG up to 10MB</p>
              </div>
            </div>

            {recurring ? (
              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 dark:bg-slate-800/40 dark:border-slate-700">
                Receipts aren't part of recurring rules yet — attach one to the individual transaction once it's
                created.
              </p>
            ) : (
              <>
                <label className="mt-4 flex items-center justify-center gap-2 h-11 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-sm font-medium text-primary hover:border-primary hover:bg-blue-50/40 dark:hover:bg-blue-500/10 cursor-pointer transition">
                  <UploadCloud size={16} />
                  {file ? "Change file" : "Choose file"}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                {file && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">{file.name}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
