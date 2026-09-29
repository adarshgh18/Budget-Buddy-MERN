export default function StatCard({ label, value, icon, hint, valueClass = "text-ink" }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">{label}</p>
        {icon && (
          <span className="h-8 w-8 rounded-lg bg-slate-50 text-slate-500 grid place-items-center dark:bg-slate-800 dark:text-slate-300">
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-3 font-display text-[28px] leading-9 font-bold tabular ${valueClass}`}>{value}</p>
      {hint && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
