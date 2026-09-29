export function Spinner({ className = "h-5 w-5" }) {
  return (
    <svg className={`animate-spin text-primary ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24 text-slate-500 dark:text-slate-400 gap-3">
      <Spinner />
      <span>Loading…</span>
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="card p-10 text-center">
      <h3 className="font-display font-semibold text-ink dark:text-slate-100 text-lg">{title}</h3>
      {body && <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card p-8 border-rose-100 dark:border-rose-900/50">
      <p className="text-rose-700 dark:text-rose-400 text-sm">{message || "Something went wrong."}</p>
      {onRetry && (
        <button type="button" className="btn-secondary mt-4" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Alert({ children, tone = "error" }) {
  const styles = {
    error: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50",
    success:
      "bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50",
    info: "bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50",
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${styles[tone]}`}>{children}</div>;
}
