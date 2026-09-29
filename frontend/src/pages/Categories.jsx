import { useEffect, useMemo, useRef, useState } from "react";
import {
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
  Search,
  LayoutGrid,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldCheck,
  Sparkles,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../services/categoryService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatMoney } from "../utils/format";
import { Alert, EmptyState, ErrorState, PageLoader } from "../components/common/Feedback";
import Modal from "../components/common/Modal";

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
      <Icon size={19} />
    </span>
  );
}

// Local, self-contained action menu (same pattern already used on the
// Goals/Budgets pages). Calls the exact same edit/delete handlers the
// visible buttons used to call - only the trigger UI changes.
function CategoryMenu({ onEdit, onDelete }) {
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
        aria-label="Category actions"
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

export default function Categories() {
  const { user } = useAuth();
  const toast = useToast();
  const currency = user?.preferences?.currency || "USD";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", type: "", origin: "" });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", type: "expense" });
  const [reassignTo, setReassignTo] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.type) params.type = filters.type;
      if (filters.origin === "default") params.isDefault = "true";
      if (filters.origin === "custom") params.isDefault = "false";
      const res = await listCategories(params);
      setData(res.data.data);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      if (data) toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.origin]);

  const onSearch = (e) => {
    e.preventDefault();
    load();
  };

  const openCreate = () => {
    setForm({ name: "", type: "expense" });
    setModal("create");
  };

  const openEdit = (c) => {
    setForm({ id: c._id, name: c.name, type: c.type });
    setModal("edit");
  };

  const openDelete = (c) => {
    setForm({ id: c._id, name: c.name, type: c.type });
    setReassignTo("");
    setModal("delete");
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (modal === "create") {
        await createCategory({ name: form.name, type: form.type });
        toast.success("Category created successfully.");
      } else {
        await updateCategory(form.id, { name: form.name, type: form.type });
        toast.success("Category updated successfully.");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    try {
      await deleteCategory(form.id, reassignTo ? { reassignTo } : undefined);
      toast.success("Category deleted successfully.");
      setModal(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const sameType = useMemo(
    () => (data ? data.items.filter((c) => c.type === form.type && c._id !== form.id) : []),
    [data, form.type, form.id]
  );

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const s = data.summary;
  const hasFilters = filters.search || filters.type || filters.origin;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="text-slate-500 dark:text-slate-400">Organize income and expenses. Defaults can be customized.</p>
        </div>
        <button className="btn-primary" type="button" onClick={openCreate}>
          <Plus size={16} /> Create Category
        </button>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Total</p>
            <span className="h-9 w-9 rounded-xl bg-blue-50 text-primary grid place-items-center shrink-0 dark:bg-blue-500/10">
              <LayoutGrid size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-[26px] leading-8 font-bold tabular text-ink">{s.total}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {s.defaults} default · {s.custom} custom
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Expense</p>
            <span className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 grid place-items-center shrink-0 dark:bg-rose-500/10 dark:text-rose-400">
              <ArrowDownCircle size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-[26px] leading-8 font-bold tabular text-ink">{s.expense}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Used for spending</p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Income</p>
            <span className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ArrowUpCircle size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-[26px] leading-8 font-bold tabular text-ink">{s.income}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Used for income</p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Default</p>
            <span className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center shrink-0 dark:bg-indigo-500/10 dark:text-indigo-400">
              <ShieldCheck size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-[26px] leading-8 font-bold tabular text-ink">{s.defaults}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Built-in categories</p>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Custom</p>
            <span className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Sparkles size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-[26px] leading-8 font-bold tabular text-ink">{s.custom}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Created by you</p>
        </div>
      </div>

      <form onSubmit={onSearch} className="card p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Search categories…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <select
          className="input w-auto"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">All types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select
          className="input w-auto"
          value={filters.origin}
          onChange={(e) => setFilters((f) => ({ ...f, origin: e.target.value }))}
        >
          <option value="">Default & custom</option>
          <option value="default">Default</option>
          <option value="custom">Custom</option>
        </select>
        <button className="btn-secondary">Search</button>
      </form>

      {!data.items.length ? (
        <EmptyState
          title={hasFilters ? "No categories found" : "No categories yet"}
          body={
            hasFilters
              ? "Try changing your search or filters."
              : "Create a category to start organizing your income and expenses."
          }
          action={
            <button className="btn-primary" type="button" onClick={openCreate}>
              <Plus size={16} /> Create Category
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.items.map((c) => {
            const isIncome = c.type === "income";
            return (
              <div key={c._id} className="card p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon icon={c.icon} color={c.color} />
                    <h3 className="font-display font-semibold text-ink truncate">{c.name}</h3>
                  </div>
                  <CategoryMenu onEdit={() => openEdit(c)} onDelete={() => openDelete(c)} />
                </div>

                <div className="flex items-center gap-1.5 mt-3">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      c.isDefault
                        ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                    }`}
                  >
                    {c.isDefault ? "Default" : "Custom"}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      isIncome
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                    }`}
                  >
                    {c.type}
                  </span>
                </div>

                <div className="flex items-end justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Transactions</p>
                    <p className="font-semibold text-ink tabular">{c.monthCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">This month</p>
                    <p className={`font-semibold tabular ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-ink"}`}>
                      {isIncome ? "+" : ""}
                      {formatMoney(c.monthAmount, currency)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data.items.length > 0 && (
        <div className="card p-5 bg-blue-50/60 border-blue-100 flex flex-col sm:flex-row sm:items-start gap-3 dark:bg-blue-500/10 dark:border-blue-500/20">
          <span className="h-10 w-10 rounded-xl bg-white text-primary grid place-items-center shrink-0 shadow-sm dark:bg-slate-900">
            <ShieldCheck size={18} />
          </span>
          <div className="min-w-0">
            <p className="font-display font-semibold text-ink">Category Safety Notice</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              When deleting a custom category with active transactions, Budget Buddy prompts you to reassign
              those transactions to an existing category to keep your budgets accurate and uninterrupted.
            </p>
          </div>
        </div>
      )}

      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "Create Category" : "Edit Category"} onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
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

      {modal === "delete" && (
        <Modal title="Delete category" onClose={() => setModal(null)}>
          <form onSubmit={confirmDelete} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              If <strong>{form.name}</strong> has transactions, choose another {form.type} category to reassign them to.
            </p>
            <div>
              <label className="label">Reassign to</label>
              <select className="input" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
                <option value="">None (only if unused)</option>
                {sameType.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn-danger">Delete</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
