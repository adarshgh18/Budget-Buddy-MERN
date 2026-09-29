import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Plus, Trash2, Download, Search, X, Receipt, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { listTransactions, deleteTransaction, exportTransactionsCsv } from "../services/transactionService";
import { listCategories } from "../services/categoryService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, formatMoney, formatSignedMoney } from "../utils/format";
import StatCard from "../components/cards/StatCard";
import Modal from "../components/common/Modal";
import { EmptyState, ErrorState, PageLoader } from "../components/common/Feedback";

export default function Transactions() {
  const { user } = useAuth();
  const toast = useToast();
  const currency = user?.preferences?.currency || "USD";
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    category: "",
    year: "",
    sort: "newest",
    page: 1,
  });

  const load = async (overrides = {}) => {
    const activeFilters = { ...filters, ...overrides };
    setLoading(true);
    setError("");
    try {
      const params = { ...activeFilters };
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });
      const [tx, cats] = await Promise.all([listTransactions(params), listCategories()]);
      setData(tx.data.data);
      setCategories(cats.data.data.items);
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
  }, [filters.type, filters.category, filters.year, filters.sort, filters.page]);

  const onSearch = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, page: 1 }));
    load();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteTransaction(pendingDelete._id);
      setPendingDelete(null);
      toast.success("Transaction deleted successfully.");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const onExport = async () => {
    setExporting(true);
    try {
      await exportTransactionsCsv();
      toast.success("CSV export started — check your downloads.");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Could not export your transactions. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  const hasActiveFilters = Boolean(filters.search || filters.type || filters.category || filters.year);
  const clearFilters = () => {
    const reset = { search: "", type: "", category: "", year: "", sort: "newest", page: 1 };
    setFilters(reset);
    load(reset);
  };

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="text-slate-500 dark:text-slate-400">Track and manage your income and expenses.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={onExport} disabled={exporting}>
            <Download size={16} /> {exporting ? "Exporting…" : "Export CSV"}
          </button>
          <Link to="/transactions/new" className="btn-primary">
            <Plus size={16} /> Add Transaction
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Transactions"
          value={summary?.totalTransactions ?? 0}
          icon={<Receipt size={16} className="text-primary" />}
          iconBg="bg-blue-50"
          hint="Matches current filters"
        />
        <StatCard
          label="Total Income"
          value={formatMoney(summary?.totalIncome, currency)}
          valueClass="text-emerald-600 dark:text-emerald-400"
          icon={<ArrowDownCircle size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
          hint="From matching transactions"
        />
        <StatCard
          label="Total Expenses"
          value={formatMoney(summary?.totalExpense, currency)}
          valueClass="text-rose-600 dark:text-rose-400"
          icon={<ArrowUpCircle size={16} className="text-rose-500" />}
          iconBg="bg-rose-50"
          hint="From matching transactions"
        />
      </div>

      <form onSubmit={onSearch} className="card p-4 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            className="input !pl-9"
            placeholder="Search title…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <select
          className="input w-auto"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          className="input w-auto"
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={filters.year}
          onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value, page: 1 }))}
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest</option>
          <option value="lowest">Lowest</option>
        </select>
        <button className="btn-secondary shrink-0">
          <Search size={15} /> Search
        </button>
        <button
          type="button"
          className="btn-secondary shrink-0"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          title={hasActiveFilters ? "Clear all filters" : "No filters applied"}
        >
          <X size={15} /> Clear
        </button>
      </form>

      {!data?.items?.length ? (
        hasActiveFilters ? (
          <EmptyState
            title="No matching transactions"
            body="Try adjusting your search or filters."
            action={
              <button type="button" className="btn-secondary" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        ) : (
          <EmptyState
            title="No transactions yet"
            body="When you add income or expenses, they will appear here."
            action={
              <Link to="/transactions/new" className="btn-primary">
                Add Transaction
              </Link>
            }
          />
        )
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <tr className="text-left">
                <th className="px-4 py-3">Transaction</th>
                <th>Category</th>
                <th>Date</th>
                <th>Type</th>
                <th className="text-right">Amount</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((t) => (
                <tr key={t._id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{t.title}</p>
                    {t.description && <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">{t.description}</p>}
                  </td>
                  <td>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">{t.category}</span>
                  </td>
                  <td className="text-slate-500 dark:text-slate-400">{formatDate(t.date, user?.preferences?.dateFormat)}</td>
                  <td>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
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
                  <td className="text-right pr-4">
                    <div className="inline-flex gap-1 text-slate-400 dark:text-slate-500">
                      <Link to={`/transactions/${t._id}`} className="p-1.5 hover:text-primary">
                        <Eye size={16} />
                      </Link>
                      <Link to={`/transactions/${t._id}/edit`} className="p-1.5 hover:text-primary">
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        className="p-1.5 hover:text-rose-600 dark:hover:text-rose-400"
                        onClick={() => setPendingDelete(t)}
                        aria-label={`Delete ${t.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span>
              Showing page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                className="btn-secondary !py-1.5"
                disabled={data.pagination.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >
                Prev
              </button>
              <button
                className="btn-secondary !py-1.5"
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <Modal title="Delete transaction?" onClose={() => (deleting ? null : setPendingDelete(null))}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This will permanently delete <span className="font-semibold text-ink">"{pendingDelete.title}"</span> (
            {formatSignedMoney(
              pendingDelete.type === "income" ? pendingDelete.amount : -pendingDelete.amount,
              currency
            )}
            ). This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" className="btn-secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </button>
            <button type="button" className="btn-danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete transaction"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
