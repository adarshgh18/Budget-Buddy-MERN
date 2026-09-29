import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listCategories } from "../services/categoryService";
import { getTransaction, updateTransaction, receiptViewUrl } from "../services/transactionService";
import { getErrorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import { PAYMENT_METHOD_LABELS, toInputDate } from "../utils/format";
import { Alert, PageLoader, ErrorState } from "../components/common/Feedback";

export default function EditTransaction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [tx, cats] = await Promise.all([getTransaction(id), listCategories()]);
        const t = tx.data.data.transaction;
        setForm({
          type: t.type,
          title: t.title,
          amount: t.amount,
          category: t.category,
          date: toInputDate(t.date),
          paymentMethod: t.paymentMethod || "other",
          description: t.description || "",
          receiptUrl: t.receiptUrl,
        });
        setCategories(cats.data.data.items);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    })();
  }, [id]);

  if (error && !form) return <ErrorState message={error} />;
  if (!form) return <PageLoader />;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const filteredCats = categories.filter((c) => c.type === form.type);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      ["type", "title", "amount", "category", "date", "paymentMethod", "description"].forEach((k) =>
        fd.append(k, form[k])
      );
      if (file) fd.append("receipt", file);
      await updateTransaction(id, fd);
      toast.success("Transaction updated successfully.");
      navigate(`/transactions/${id}`);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link to={`/transactions/${id}`} className="text-sm text-slate-500 dark:text-slate-400">
        ← Back
      </Link>
      <h1 className="page-title mt-2">Edit Transaction</h1>
      <form onSubmit={onSubmit} className="card p-6 mt-6 space-y-4">
        {error && <Alert>{error}</Alert>}
        <div className="grid grid-cols-2 gap-2">
          {["expense", "income"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: t }))}
              className={`rounded-xl py-3 font-semibold capitalize ${
                form.type === t ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div>
          <label className="label">Title</label>
          <input className="input" name="title" value={form.title} onChange={onChange} required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Amount</label>
            <input className="input" type="number" step="0.01" name="amount" value={form.amount} onChange={onChange} required />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" name="category" value={form.category} onChange={onChange} required>
              {filteredCats.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" name="date" value={form.date} onChange={onChange} required />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" name="paymentMethod" value={form.paymentMethod} onChange={onChange}>
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
          <textarea className="input !h-24 py-2" name="description" value={form.description} onChange={onChange} />
        </div>
        <div>
          <label className="label">Attach Receipt / Invoice</label>
          {form.receiptUrl && (
            <a className="text-sm text-primary block mb-2" href={receiptViewUrl(id)} target="_blank" rel="noreferrer">
              Current file
            </a>
          )}
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Link to={`/transactions/${id}`} className="btn-secondary">
            Cancel
          </Link>
          <button className="btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
