import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Flag,
  PiggyBank,
  Wallet,
  TrendingUp,
  Shield,
  Plane,
  Laptop,
  Smartphone,
  Headphones,
  Home,
  Car,
  GraduationCap,
  Heart,
  Gift,
  Coins,
  ShoppingCart,
  Bike,
  Building2,
  Gem,
  Stethoscope,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Lightbulb,
  Target,
} from "lucide-react";
import { listGoals, createGoal, updateGoal, deleteGoal } from "../services/goalService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatMoney } from "../utils/format";
import { Alert, ErrorState, PageLoader } from "../components/common/Feedback";
import Modal from "../components/common/Modal";

const emptyForm = { name: "", targetAmount: "", currentAmount: "", targetDate: "", notes: "", icon: "flag" };

// Maps the Goal model's free-form `icon` string (see backend/models/Goal.js) to a
// lucide component. "flag" is the schema default, matching the sidebar's Goals icon.
const GOAL_ICONS = {
  flag: Flag,
  "piggy-bank": PiggyBank,
  shield: Shield,
  plane: Plane,
  laptop: Laptop,
  smartphone: Smartphone,
  headphones: Headphones,
  home: Home,
  car: Car,
  "graduation-cap": GraduationCap,
  heart: Heart,
  gift: Gift,

  coins: Coins,
  "shopping-cart": ShoppingCart,
  bike: Bike,
  "building-2": Building2,
  gem: Gem,
  stethoscope: Stethoscope,
};
const ICON_OPTIONS = Object.keys(GOAL_ICONS);

// Presentation for the goal's display status (derived below via deriveGoalStatus).
const PACE_STYLES = {
  on_track: { label: "On Track", pill: "bg-blue-50 text-primary dark:bg-blue-500/10", dot: "bg-primary", bar: "bg-primary" },
  almost: { label: "Almost There", pill: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400", dot: "bg-violet-500", bar: "bg-violet-500" },
  behind: { label: "Behind", pill: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400", dot: "bg-rose-500", bar: "bg-rose-500" },
  completed: { label: "Completed", pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", dot: "bg-emerald-500", bar: "bg-emerald-500" },
};

// Determines the goal's display status using only data already present on the goal:
// 1. completed -> Completed, 2. progress >= 90% -> Almost There,
// 3. 2 or fewer days remaining until the target date -> Behind, 4. otherwise -> On Track.
function deriveGoalStatus(g) {
  if (g.status === "completed") return "completed";
  if (g.percent >= 90) return "almost";
  if (g.targetDate) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.ceil((new Date(g.targetDate) - new Date()) / msPerDay);
    if (daysRemaining <= 2) return "behind";
  }
  return "on_track";
}

// Purely a friendlier label for the real overallProgress %, in the same spirit as the
// derived "Healthy / Fair / Needs attention" labels already used on the Analytics page.
function pacingBadge(percent) {
  if (percent >= 100) return { label: "Goals Met", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" };
  if (percent >= 50) return { label: "Pacing Well", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" };
  if (percent > 0) return { label: "Building Up", className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" };
  return { label: "Just Started", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" };
}

function GoalIcon({ icon }) {
  const Icon = GOAL_ICONS[icon] || Flag;
  return (
    <span className="h-11 w-11 rounded-xl bg-blue-50 text-primary grid place-items-center shrink-0 dark:bg-blue-500/10">
      <Icon size={20} />
    </span>
  );
}

function SummaryCard({ label, value, hint, hintClass = "text-slate-500 dark:text-slate-400", icon: Icon, iconBg, iconColor, badge }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">{label}</p>
        {badge ? (
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${badge.className}`}>
            {badge.label}
          </span>
        ) : (
          Icon && (
            <span className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${iconBg}`}>
              <Icon size={16} className={iconColor} />
            </span>
          )
        )}
      </div>
      <p className="mt-3 font-display text-[28px] leading-9 font-bold tabular text-ink">{value}</p>
      {hint && <p className={`mt-1.5 text-xs ${hintClass}`}>{hint}</p>}
    </div>
  );
}

function GoalMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="h-8 w-8 grid place-items-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-ink hover:bg-slate-50 dark:hover:bg-slate-800"
        onClick={() => setOpen((o) => !o)}
        aria-label="Goal options"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-10 w-36 card p-1.5 shadow-cardHover">
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
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal: g, currency, dateFormat, onEdit, onDelete, onContribute }) {
  const pace = PACE_STYLES[deriveGoalStatus(g)] || PACE_STYLES.on_track;
  const percent = Math.min(100, g.percent);
  const isCompleted = g.status === "completed";

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <GoalIcon icon={g.icon} />
        <div className="flex items-center gap-1">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${pace.pill}`}>
            {isCompleted ? <CheckCircle2 size={12} /> : <span className={`h-1.5 w-1.5 rounded-full ${pace.dot}`} />}
            {pace.label}
          </span>
          <GoalMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      <h3 className="mt-3 font-display font-semibold text-ink text-lg">{g.name}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {isCompleted ? "Target was " : "Target: "}
        {g.targetDate ? formatDate(g.targetDate, dateFormat) : "No target date"}
      </p>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="text-ink font-bold text-base">{formatMoney(g.currentAmount, currency)}</span> of{" "}
          {formatMoney(g.targetAmount, currency)}
        </p>
        <p className="font-display font-bold text-primary tabular">{g.percent}%</p>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2">
        <div className={`h-full rounded-full ${pace.bar}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
        <span>{g.percent}% complete</span>
        <span>{formatMoney(g.remaining, currency)} remaining</span>
      </div>

      <div className="mt-4">
        {isCompleted ? (
          <div className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold py-2.5 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 size={16} /> Goal Achieved
          </div>
        ) : (
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-50 text-primary text-sm font-semibold py-2.5 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 transition"
            onClick={onContribute}
          >
            <Plus size={16} /> Add Contribution
          </button>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { key: "all", label: "All Goals" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export default function Goals() {
  const { user } = useAuth();
  const currency = user?.preferences?.currency || "USD";
  const dateFormat = user?.preferences?.dateFormat;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [contribution, setContribution] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listGoals();
      setData(res.data.data);
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
    setContribution("");
    setModal("create");
  };

  const openEdit = (g) => {
    setForm({
      id: g._id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDate ? String(g.targetDate).slice(0, 10) : "",
      notes: g.notes || "",
      icon: g.icon || "flag",
    });
    setContribution("");
    setModal("edit");
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (modal === "create") {
        await createGoal({
          name: form.name,
          targetAmount: Number(form.targetAmount),
          currentAmount: Number(form.currentAmount || 0),
          targetDate: form.targetDate || null,
          notes: form.notes,
          icon: form.icon || "flag",
        });
      } else {
        const payload = {
          name: form.name,
          targetAmount: Number(form.targetAmount),
          targetDate: form.targetDate || null,
          notes: form.notes,
          icon: form.icon || "flag",
        };
        if (contribution) payload.contribution = Number(contribution);
        else payload.currentAmount = Number(form.currentAmount || 0);
        await updateGoal(form.id, payload);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this goal?")) return;
    try {
      await deleteGoal(id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const items = data?.items || [];
  const filteredItems = useMemo(() => {
    if (filter === "active") return items.filter((g) => g.status !== "completed");
    if (filter === "completed") return items.filter((g) => g.status === "completed");
    return items;
  }, [items, filter]);

  // The goal nearest completion among the active ones - purely derived from real
  // per-goal percent/remaining values already returned by the API, nothing fabricated.
  const nearestGoal = useMemo(() => {
    const active = items.filter((g) => g.status !== "completed");
    if (!active.length) return null;
    return active.slice().sort((a, b) => b.percent - a.percent)[0];
  }, [items]);

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const s = data.summary;
  const badge = pacingBadge(s.overallProgress);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Financial Goals</h1>
          <p className="text-slate-500 dark:text-slate-400">Set goals, track your progress, and turn your plans into reality.</p>
        </div>
        <button className="btn-primary" type="button" onClick={openCreate}>
          <Plus size={16} /> Create Goal
        </button>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          label="Active Goals"
          value={s.activeGoals}
          hint="In progress"
          icon={Flag}
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          iconColor="text-primary"
        />
        <SummaryCard
          label="Total Target"
          value={formatMoney(s.totalTarget, currency)}
          hint="Combined objective"
          icon={PiggyBank}
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          iconColor="text-primary"
        />
        <SummaryCard
          label="Saved So Far"
          value={formatMoney(s.savedSoFar, currency)}
          hint={`${s.overallProgress}% funded`}
          hintClass="text-emerald-600 dark:text-emerald-400 font-medium"
          icon={Wallet}
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <div className="card p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Overall Progress</p>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-[28px] leading-9 font-bold tabular text-ink">{s.overallProgress}%</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular">
              {formatMoney(s.savedSoFar, currency)} / {formatMoney(s.totalTarget, currency)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, s.overallProgress)}%` }} />
          </div>
        </div>
      </div>

      {!items.length ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <span className="h-14 w-14 rounded-2xl bg-blue-50 text-primary grid place-items-center dark:bg-blue-500/10">
            <Target size={26} />
          </span>
          <h3 className="font-display font-semibold text-ink text-lg mt-4">No financial goals yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-sm">
            Create your first goal to start tracking progress toward the things that matter to you.
          </p>
          <button className="btn-primary mt-5" type="button" onClick={openCreate}>
            <Plus size={16} /> Create Your First Goal
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Your Goals</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Track your progress toward the things that matter to you.</p>
            </div>
            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 self-start">
              {TABS.map((t) => {
                const count = t.key === "active" ? s.activeGoals : t.key === "completed" ? s.completedGoals : items.length;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFilter(t.key)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition whitespace-nowrap ${
                      filter === t.key ? "bg-white text-primary shadow-card dark:bg-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-ink"
                    }`}
                  >
                    {t.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {filteredItems.length ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((g) => (
                <GoalCard
                  key={g._id}
                  goal={g}
                  currency={currency}
                  dateFormat={dateFormat}
                  onEdit={() => openEdit(g)}
                  onDelete={() => remove(g._id)}
                  onContribute={() => openEdit(g)}
                />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No {filter} goals to show right now.
            </div>
          )}

          {nearestGoal && (
            <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="h-11 w-11 rounded-xl bg-blue-50 text-primary grid place-items-center shrink-0 dark:bg-blue-500/10">
                <Lightbulb size={20} />
              </span>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-ink">Goal Progress</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  You&apos;re {s.overallProgress}% of the way toward your active financial goals.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You&apos;re closest to completing <span className="font-semibold text-ink">{nearestGoal.name}</span> —
                  just {formatMoney(nearestGoal.remaining, currency)} left to save.
                </p>
              </div>
              <Link
                to="/insights"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover whitespace-nowrap"
              >
                <TrendingUp size={16} /> View Insights
              </Link>
            </div>
          )}
        </>
      )}

      {modal && (
        <Modal title={modal === "create" ? "Create Goal" : "Edit Goal"} onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((key) => {
                  const Ic = GOAL_ICONS[key];
                  const active = form.icon === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, icon: key }))}
                      className={`h-10 w-10 rounded-lg grid place-items-center border transition ${
                        active
                          ? "bg-blue-50 border-primary text-primary dark:bg-blue-500/10"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                      }`}
                      aria-label={key}
                      aria-pressed={active}
                    >
                      <Ic size={18} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Target amount</label>
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Saved so far</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.currentAmount}
                  onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Target date</label>
              <input
                className="input"
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
              />
            </div>
            {modal === "edit" && (
              <div>
                <label className="label">Add contribution</label>
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="label">Notes</label>
              <textarea className="input !h-20 py-2" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
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
