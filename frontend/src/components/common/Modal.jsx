export default function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-label="Close" />
      <div className="relative card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="font-display text-lg font-semibold text-ink dark:text-slate-100">{title}</h2>
          <button type="button" className="text-slate-400 hover:text-ink dark:hover:text-slate-100" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
