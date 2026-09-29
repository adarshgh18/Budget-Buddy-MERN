import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const ICON_CLASSES = {
  success: "text-emerald-500",
  error: "text-rose-500",
  info: "text-primary",
};

const BORDER_CLASSES = {
  success: "border-emerald-100 dark:border-emerald-900/50",
  error: "border-rose-100 dark:border-rose-900/50",
  info: "border-blue-100 dark:border-blue-900/50",
};

/**
 * App-wide toast notifications. Mount <ToastProvider> once near the root
 * (see main.jsx) and call useToast() anywhere below it - no per-page setup.
 *
 *   const toast = useToast();
 *   toast.success("Transaction added.");
 *   toast.error("Something went wrong.");
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, { type = "info", duration = 4000 } = {}) => {
      const id = ++idRef.current;
      setToasts((list) => [...list, { id, message, type }]);
      if (duration) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (message, opts) => push(message, { ...opts, type: "success" }),
    error: (message, opts) => push(message, { ...opts, type: "error" }),
    info: (message, opts) => push(message, { ...opts, type: "info" }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[100] flex flex-col gap-2 sm:w-full sm:max-w-sm"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              role="status"
              className={`flex items-start gap-2 rounded-xl border bg-white shadow-cardHover px-4 py-3 text-sm dark:bg-slate-900 dark:shadow-none ${BORDER_CLASSES[t.type]}`}
            >
              <Icon size={18} className={`shrink-0 mt-0.5 ${ICON_CLASSES[t.type]}`} />
              <p className="flex-1 text-ink dark:text-slate-100">{t.message}</p>
              <button
                type="button"
                className="text-slate-400 hover:text-ink dark:hover:text-slate-100 shrink-0"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
