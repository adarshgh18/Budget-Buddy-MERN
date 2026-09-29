import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  RefreshCw,
  Wallet,
  Clock,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  Repeat,
  ChevronLeft,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  Utensils,
  Home,
  Car,
  Ticket,
  Zap,
  ShoppingBag,
  Heart,
  Plane,
  MoreHorizontal,
  Briefcase,
  Tag,
} from "lucide-react";
import { listRecurring, createRecurring, updateRecurring, deleteRecurring } from "../services/recurringService";
import { listCategories } from "../services/categoryService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatMoney, formatSignedMoney, FREQUENCY_LABELS, PAYMENT_METHOD_LABELS, toInputDate } from "../utils/format";
import { Alert, ErrorState, PageLoader } from "../components/common/Feedback";
import Modal from "../components/common/Modal";

const emptyForm = {
  title: "",
  amount: "",
  type: "expense",
  category: "",
  paymentMethod: "other",
  frequency: "monthly",
  startDate: toInputDate(new Date()),
  description: "",
  isActive: true,
};

const PER_PAGE = 6;

// Single-select filter tabs, matching the Stitch reference exactly: three of
// these are type-based (income/expense) and two are status-based
// (active/paused), but Stitch renders them as one row of mutually exclusive
// tabs rather than two separate filter groups, so the filter logic below
// treats them the same way.
const FILTERS = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expenses" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
];

// Same icon-name -> lucide mapping and swatch treatment already used on the
// Categories page, so recurring items read as the same product.
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
      className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
      style={{ backgroundColor: `${color || "#2563EB"}1A`, color: color || "#2563EB" }}
    >
      <Icon size={18} />
    </span>
  );
}

function SummaryCard({ label, value, hint, hintClass = "text-slate-500 dark:text-slate-400", icon: Icon, iconBg, iconColor }) {
  return (
    <div className="card p-5 h-full flex flex-col hover:shadow-cardHover transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">{label}</p>
        {Icon && (
          <span className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${iconBg}`}>
            <Icon size={18} className={iconColor} />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-[30px] leading-9 font-bold tabular text-ink">{value}</p>
      {hint && <p className={`mt-auto pt-1.5 text-xs ${hintClass}`}>{hint}</p>}
    </div>
  );
}

function ItemMenu({ isActive, onToggle, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updateMenuPosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 144;
    const menuHeight = 132;
    const gap = 8;
    const viewportPadding = 8;

    // Open outside the table/card, directly below the three-dot button.
    let top = rect.bottom + gap;
    let right = window.innerWidth - rect.right;

    // Keep the menu inside the viewport horizontally and vertically.
    right = Math.max(
      viewportPadding,
      Math.min(right, window.innerWidth - menuWidth - viewportPadding)
    );

    top = Math.max(
      viewportPadding,
      Math.min(top, window.innerHeight - menuHeight - viewportPadding)
    );

    setMenuPosition({ top, right });
  };

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const onDocClick = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onViewportChange = () => {
      updateMenuPosition();
    };

    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open]);

  const menu = open && menuPosition
    ? createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] w-36 card p-1.5 shadow-cardHover text-left"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
          }}
        >
          <button
            type="button"
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-ink hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => {
              setOpen(false);
              onToggle();
            }}
          >
            <RefreshCw size={14} /> {isActive ? "Pause" : "Resume"}
          </button>

          <button
            type="button"
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-ink hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil size={14} /> Edit
          </button>

          <button
            type="button"
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="inline-block" ref={triggerRef}>
        <button
          type="button"
          className="h-8 w-8 grid place-items-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={() => {
            setOpen((o) => !o);
            requestAnimationFrame(updateMenuPosition);
          }}
          aria-label="Recurring transaction options"
          aria-expanded={open}
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {menu}
    </>
  );
}

// Shared "Due in N days" presentation for an active item's real next-run date,
// used on both the table's Next Date column and the Coming Up cards. Uses the
// same day-count formula the backend already uses for data.upcoming.
function dueBadge(nextRunAt, isActive) {
  if (!isActive) return { label: "Paused", className: "text-slate-400 dark:text-slate-500" };
  const daysUntil = Math.ceil((new Date(nextRunAt) - new Date()) / (1000 * 60 * 60 * 24));
  const label = daysUntil <= 0 ? "Due today" : daysUntil === 1 ? "Due tomorrow" : `Due in ${daysUntil} days`;
  if (daysUntil > 14) return { label, className: "text-slate-400 dark:text-slate-500" };
  if (daysUntil <= 3) return { label, className: "text-rose-600 dark:text-rose-400 font-medium" };
  return { label, className: "text-primary font-medium" };
}

// Compact "1 2 3 ... 10" page list instead of rendering every page number,
// keeping pagination usable even with many pages.
function pageList(current, total) {
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) pages.push(i);
  }
  const withDots = [];
  let prev = 0;
  pages.forEach((p) => {
    if (prev && p - prev > 1) withDots.push("…");
    withDots.push(p);
    prev = p;
  });
  return withDots;
}

export default function Recurring() {
  const { user } = useAuth();
  const currency = user?.preferences?.currency || "USD";
  const dateFormat = user?.preferences?.dateFormat;
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [res, cats] = await Promise.all([listRecurring(), listCategories()]);
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
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setModal("create");
  };

  const openEdit = (item) => {
    setForm({
      id: item._id,
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: item.category,
      paymentMethod: item.paymentMethod || "other",
      frequency: item.frequency,
      startDate: toInputDate(item.startDate),
      description: item.description || "",
      isActive: item.isActive,
    });
    setModal("edit");
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        isActive: Boolean(form.isActive),
      };
      delete payload.id;
      if (modal === "create") await createRecurring(payload);
      else await updateRecurring(form.id, payload);
      setModal(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggle = async (item) => {
    try {
      await updateRecurring(item._id, { isActive: !item.isActive });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this recurring transaction?")) return;
    try {
      await deleteRecurring(id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const items = data?.items || [];

  // Real category icon/color lookup, keyed the same way categories are matched
  // server-side (name + type), falling back to the schema's own defaults.
  const categoryLookup = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[`${c.type}:${c.name}`] = { icon: c.icon, color: c.color };
    });
    return map;
  }, [categories]);

  const counts = useMemo(
    () => ({
      all: items.length,
      income: items.filter((i) => i.type === "income").length,
      expense: items.filter((i) => i.type === "expense").length,
      active: items.filter((i) => i.isActive).length,
      paused: items.filter((i) => !i.isActive).length,
    }),
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (filter === "income") return i.type === "income";
      if (filter === "expense") return i.type === "expense";
      if (filter === "active") return i.isActive;
      if (filter === "paused") return !i.isActive;
      return true;
    });
  }, [items, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedItems = filteredItems.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // "This Month" supporting count, computed the same way the backend derives
  // summary.thisMonthAmount (active items whose next run falls in the current
  // calendar month) - purely derived from already-loaded data and the real
  // current date, nothing hardcoded.
  const thisMonthCount = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return items.filter((i) => i.isActive && new Date(i.nextRunAt) >= monthStart && new Date(i.nextRunAt) < monthEnd).length;
  }, [items]);

  // The nearest upcoming active item, for the "next scheduled payment" line in
  // Recurring Overview - purely the earliest real nextRunAt among active items.
  const nextPayment = useMemo(() => {
    const active = items.filter((i) => i.isActive);
    if (!active.length) return null;
    return active.slice().sort((a, b) => new Date(a.nextRunAt) - new Date(b.nextRunAt))[0];
  }, [items]);

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const s = data.summary;
  const filteredCats = categories.filter((c) => c.type === form.type);
  const netOutflow = s.monthlyAmount >= 0;
  const upcomingPreview = (data.upcoming || []).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <p className="text-[11px] font-semibold tracking-widest uppercase text-primary">Scheduled Outflows &amp; Inflows</p>
          </div>
          <h1 className="page-title">Recurring Transactions</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 max-w-xl">
            Manage your scheduled income and expenses so you never miss a recurring transaction.
          </p>
        </div>
        <button className="btn-primary shrink-0" type="button" onClick={openCreate}>
          <Plus size={16} /> Add Recurring
        </button>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          label="Active Recurring"
          value={s.activeCount}
          hint="Active schedules"
          icon={RefreshCw}
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          iconColor="text-primary"
        />
        <SummaryCard
          label="Monthly Amount"
          value={formatMoney(Math.abs(s.monthlyAmount), currency)}
          hint={netOutflow ? "Net scheduled outflow" : "Net scheduled inflow"}
          icon={Wallet}
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          iconColor="text-primary"
        />
        <SummaryCard
          label="Upcoming"
          value={s.upcomingCount}
          hint="Due within 14 days"
          hintClass="text-amber-600 dark:text-amber-400 font-medium"
          icon={Clock}
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <SummaryCard
          label="This Month"
          value={formatMoney(s.thisMonthAmount, currency)}
          hint={`${thisMonthCount} due this month`}
          hintClass="text-emerald-600 dark:text-emerald-400 font-medium"
          icon={CheckCircle2}
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {!items.length ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <span className="h-14 w-14 rounded-2xl bg-blue-50 text-primary grid place-items-center dark:bg-blue-500/10">
            <Repeat size={26} />
          </span>
          <h3 className="font-display font-semibold text-ink text-lg mt-4">No recurring transactions yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-sm">
            Create a repeating income or expense rule and Budget Buddy will generate its occurrences automatically.
          </p>
          <button className="btn-primary mt-5" type="button" onClick={openCreate}>
            <Plus size={16} /> Add Recurring
          </button>
        </div>
      ) : (
        <>
          {/* Section heading + filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Your Recurring Transactions</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your scheduled income and expenses.</p>
            </div>
            <div className="inline-flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition whitespace-nowrap ${
                    filter === f.key ? "bg-white text-primary shadow-card dark:bg-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-ink"
                  }`}
                >
                  {f.label} ({counts[f.key]})
                </button>
              ))}
            </div>
          </div>

          {/* Main table - one container, Stitch column order: Transaction, Category,
              Type, Frequency, Next Date, Amount, with only a small kebab menu added */}
          {pagedItems.length ? (
            <div className="card p-0 overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60">
                    <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <th className="text-left px-4 py-3">Transaction</th>
                      <th className="text-left px-4 py-3">Category</th>
                      <th className="text-left px-4 py-3">Type</th>
                      <th className="text-left px-4 py-3">Frequency</th>
                      <th className="text-left px-4 py-3">Next Date</th>
                      <th className="text-right px-4 py-3">Amount</th>
                      <th className="px-3 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pagedItems.map((item) => {
                      const meta = categoryLookup[`${item.type}:${item.category}`] || { icon: "tag", color: "#2563EB" };
                      const signed = item.type === "expense" ? -item.amount : item.amount;
                      const amountClass = !item.isActive
                        ? "text-slate-500 dark:text-slate-400"
                        : item.type === "expense"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400";
                      const due = dueBadge(item.nextRunAt, item.isActive);
                      return (
                        <tr key={item._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <CategoryIcon icon={meta.icon} color={meta.color} />
                              <div className="min-w-0">
                                <p className="font-medium text-ink truncate">{item.title}</p>
                                {item.description && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{item.description}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                item.type === "expense"
                                  ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              }`}
                            >
                              {item.type === "expense" ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
                              {item.type === "expense" ? "Expense" : "Income"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{FREQUENCY_LABELS[item.frequency] || item.frequency}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-ink">{formatDate(item.nextRunAt, dateFormat)}</p>
                            <p className={`text-[11px] mt-0.5 ${due.className}`}>{due.label}</p>
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold tabular whitespace-nowrap ${amountClass}`}>
                            {formatSignedMoney(signed, currency)}
                          </td>
                          <td className="px-2 py-3 text-right">
                            <ItemMenu
                              isActive={item.isActive}
                              onToggle={() => toggle(item)}
                              onEdit={() => openEdit(item)}
                              onDelete={() => remove(item._id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Compact mobile fallback - same single container, stacked rows instead
                  of columns, since a literal table doesn't reflow on narrow screens */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {pagedItems.map((item) => {
                  const meta = categoryLookup[`${item.type}:${item.category}`] || { icon: "tag", color: "#2563EB" };
                  const signed = item.type === "expense" ? -item.amount : item.amount;
                  const amountClass = !item.isActive
                    ? "text-slate-500 dark:text-slate-400"
                    : item.type === "expense"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400";
                  const due = dueBadge(item.nextRunAt, item.isActive);
                  return (
                    <div key={item._id} className="p-4">
                      <div className="flex items-start gap-3">
                        <CategoryIcon icon={meta.icon} color={meta.color} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ink truncate">{item.title}</p>
                          <span className="inline-block mt-1 text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-500 dark:text-slate-400 truncate max-w-full">
                            {item.category}
                          </span>
                        </div>
                        <ItemMenu
                          isActive={item.isActive}
                          onToggle={() => toggle(item)}
                          onEdit={() => openEdit(item)}
                          onDelete={() => remove(item._id)}
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{FREQUENCY_LABELS[item.frequency] || item.frequency}</span>
                        <span>{formatDate(item.nextRunAt, dateFormat)}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className={`text-[11px] ${due.className}`}>{due.label}</span>
                        <p className={`font-semibold tabular ${amountClass}`}>{formatSignedMoney(signed, currency)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-sm text-slate-500 dark:text-slate-400">No recurring transactions match this filter.</div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                className="h-8 w-8 grid place-items-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              {pageList(page, totalPages).map((n, idx) =>
                n === "…" ? (
                  <span key={`dots-${idx}`} className="h-8 w-8 grid place-items-center text-sm text-slate-400 dark:text-slate-500">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`h-8 w-8 grid place-items-center rounded-lg text-sm font-medium ${
                      n === page ? "bg-primary text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                type="button"
                className="h-8 w-8 grid place-items-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Coming Up - independent cards, not one big container with empty space */}
          <div>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Coming Up</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Chronological preview of your next scheduled occurrences.</p>
              </div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">Next 14 Days</span>
            </div>

            {upcomingPreview.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingPreview.map((u) => {
                  const due = dueBadge(u.nextRunAt, true);
                  const meta = categoryLookup[`${u.type}:${u.category}`] || { icon: "tag", color: "#2563EB" };
                  const signed = u.type === "expense" ? -u.amount : u.amount;
                  return (
                    <div key={u._id} className="card p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {formatDate(u.nextRunAt, dateFormat)}
                        </span>
                        <span className={`text-xs whitespace-nowrap ${due.className}`}>{due.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <CategoryIcon icon={meta.icon} color={meta.color} />
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate">{u.title}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{u.category}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-400 dark:text-slate-500">Planned Charge</span>
                        <p className={`font-semibold tabular ${u.type === "expense" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {formatSignedMoney(signed, currency)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card p-8 flex flex-col items-center text-center">
                <span className="h-9 w-9 rounded-lg bg-slate-50 text-slate-400 grid place-items-center mb-2 dark:bg-slate-800 dark:text-slate-500">
                  <Clock size={16} />
                </span>
                <p className="text-sm text-slate-500 dark:text-slate-400">No recurring transactions are due in the next 14 days.</p>
              </div>
            )}
          </div>

          {/* Recurring Overview - wide highlighted insight card, not a stat grid */}
          {items.length > 0 && (
            <div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4 dark:bg-blue-500/10 dark:border-blue-500/20">
              <span className="h-10 w-10 rounded-xl bg-primary text-white grid place-items-center shrink-0">
                <RefreshCw size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-ink">Recurring Overview</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  You have {s.activeCount} active recurring transaction{s.activeCount === 1 ? "" : "s"} totaling about{" "}
                  {formatMoney(Math.abs(s.monthlyAmount), currency)} per month
                  {s.pausedCount > 0 ? `, and ${s.pausedCount} paused` : ""}.
                </p>
                {nextPayment && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    Your next scheduled {nextPayment.type === "income" ? "income" : "payment"} is{" "}
                    <span className="font-medium text-ink">{nextPayment.title}</span> on{" "}
                    {formatDate(nextPayment.nextRunAt, dateFormat)}.
                  </p>
                )}
              </div>
              <Link
                to="/categories"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover whitespace-nowrap shrink-0"
              >
                Manage Categories →
              </Link>
            </div>
          )}
        </>
      )}

      {modal && (
        <Modal title={modal === "create" ? "Add Recurring" : "Edit Recurring"} onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {["expense", "income"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`rounded-xl py-2 font-semibold capitalize ${form.type === t ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-ink"}`}
                  onClick={() => setForm((f) => ({ ...f, type: t, category: "" }))}
                >
                  {t}
                </button>
              ))}
            </div>
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  required
                >
                  <option value="">Select</option>
                  {filteredCats.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Frequency</label>
                <select
                  className="input"
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                >
                  {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Start date</label>
                <input
                  className="input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Payment method</label>
                <select
                  className="input"
                  value={form.paymentMethod}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input !h-20 py-2"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
