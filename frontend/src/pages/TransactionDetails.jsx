import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteTransaction, getTransaction, receiptViewUrl } from "../services/transactionService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, formatMoney, PAYMENT_METHOD_LABELS } from "../utils/format";
import { ErrorState, PageLoader } from "../components/common/Feedback";
import Modal from "../components/common/Modal";

export default function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const currency = user?.preferences?.currency || "USD";
  const [tx, setTx] = useState(null);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getTransaction(id);
        setTx(res.data.data.transaction);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    })();
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!tx) return <PageLoader />;

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteTransaction(id);
      toast.success("Transaction deleted successfully.");
      navigate("/transactions");
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link to="/transactions" className="text-sm text-slate-500 dark:text-slate-400">
        ← Back to Transactions
      </Link>
      <h1 className="page-title mt-2">{tx.title}</h1>
      <div className="card p-6 mt-6 space-y-3 text-sm">
        <p className="font-display text-3xl font-bold tabular text-ink">{formatMoney(tx.amount, currency)}</p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">Type:</span> <span className="capitalize">{tx.type}</span>
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">Category:</span> {tx.category}
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">Date:</span> {formatDate(tx.date, user?.preferences?.dateFormat)}
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">Payment method:</span>{" "}
          {PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod}
        </p>
        {tx.description && (
          <p>
            <span className="text-slate-500 dark:text-slate-400">Description:</span> {tx.description}
          </p>
        )}
        {tx.receiptUrl && (
          <p>
            <a className="text-primary font-medium" href={receiptViewUrl(tx._id)} target="_blank" rel="noreferrer">
              View receipt
            </a>
          </p>
        )}
        <div className="flex gap-2 pt-4">
          <Link to={`/transactions/${id}/edit`} className="btn-primary">
            Edit
          </Link>
          <button type="button" className="btn-danger" onClick={() => setConfirmOpen(true)}>
            Delete
          </button>
        </div>
      </div>

      {confirmOpen && (
        <Modal title="Delete transaction?" onClose={() => (deleting ? null : setConfirmOpen(false))}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This will permanently delete <span className="font-semibold text-ink">"{tx.title}"</span>. This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" className="btn-secondary" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Cancel
            </button>
            <button type="button" className="btn-danger" onClick={remove} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete transaction"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
