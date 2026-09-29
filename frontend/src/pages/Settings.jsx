import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  AtSign,
  Mail,
  CheckCircle2,
  SlidersHorizontal,
  Sun,
  Moon,
  Monitor,
  Bell,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  KeyRound,
  LogOut,
  Download,
  Trash2,
  FolderCog,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { changePassword, deleteAccount, updateMe } from "../services/authService";
import { exportTransactionsCsv } from "../services/transactionService";
import { getErrorMessage } from "../services/api";
import { displayName, formatDate } from "../utils/format";

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "INR", label: "INR — Indian Rupee (₹)" },
  { value: "CAD", label: "CAD — Canadian Dollar ($)" },
  { value: "AUD", label: "AUD — Australian Dollar ($)" },
];

const DATE_FORMATS = [
  { value: "MMM d, yyyy", label: "MMM d, yyyy — Oct 24, 2026" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY — 10/24/2026" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY — 24/10/2026" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD — 2026-10-24" },
];

const THEMES = [
  { value: "light", label: "Light", hint: "Crisp & luminous", icon: Sun },
  { value: "dark", label: "Dark", hint: "Easy on the eyes", icon: Moon },
  { value: "system", label: "System", hint: "Syncs with your OS", icon: Monitor },
];

const NAV_SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "account", label: "Account Management", icon: FolderCog },
];

// Small header used at the top of every card below, mirroring the
// icon-badge + title + description treatment already established on the
// other refined pages (e.g. the Receipt card on Add Transaction).
function SectionHeader({ id, icon: Icon, title, description }) {
  return (
    <div id={id} className="flex items-start gap-3 scroll-mt-24">
      <span className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-primary grid place-items-center shrink-0">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <h2 className="font-display font-semibold text-ink dark:text-slate-100 text-lg">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// A real on/off switch (styled the same way as the recurring toggle on Add
// Transaction) instead of a raw browser checkbox.
function Switch({ checked, onChange, label }) {
  return (
    <label className="relative inline-flex h-6 w-11 items-center rounded-full shrink-0 cursor-pointer">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span className="absolute inset-0 rounded-full bg-slate-300 dark:bg-slate-700 peer-checked:bg-primary transition-colors" />
      <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
    </label>
  );
}

export default function Settings() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    fullName: user?.fullName || "",
    username: user?.username || "",
    email: user?.email || "",
  });
  const [prefs, setPrefs] = useState({
    currency: user?.preferences?.currency || "USD",
    dateFormat: user?.preferences?.dateFormat || "MMM d, yyyy",
    theme: user?.preferences?.theme || theme || "light",
  });
  const [notifications, setNotifications] = useState({
    budgetAlerts: user?.notifications?.budgetAlerts !== false,
    largeTransactionAlerts: user?.notifications?.largeTransactionAlerts !== false,
  });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const enabledCount = [notifications.budgetAlerts, notifications.largeTransactionAlerts].filter(Boolean).length;

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateMe(profile);
      await refreshUser();
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Applies instantly for live preview (via the existing ThemeContext, which
  // already persists to localStorage) - Save Preferences below additionally
  // persists it to the user's account so it survives on other devices.
  const selectTheme = (value) => {
    setPrefs((p) => ({ ...p, theme: value }));
    setTheme(value);
  };

  const savePrefs = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      await updateMe({ preferences: prefs });
      setTheme(prefs.theme);
      await refreshUser();
      toast.success("Preferences updated.");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to update preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const saveNotifications = async (e) => {
    e.preventDefault();
    setSavingNotifications(true);
    try {
      await updateMe({ notifications });
      await refreshUser();
      toast.success("Notification preferences updated.");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to update notification preferences.");
    } finally {
      setSavingNotifications(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await changePassword(passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      toast.success("Password changed successfully.");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleExport = async () => {
    try {
      await exportTransactionsCsv();
      toast.success("Your transaction data was exported.");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to export transaction data.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your account and all of your data? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteAccount();
      await logout();
      navigate("/register");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to delete account.");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <h1 className="page-title">Settings</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your profile, preferences, and account.</p>

      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-6 mt-8 items-start">
        <nav className="hidden lg:block card p-3 sticky top-6 space-y-1">
          <p className="px-2.5 pt-1 pb-2 text-[11px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
            Settings Navigation
          </p>
          {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-ink dark:hover:text-slate-100 transition"
            >
              <span className="flex items-center gap-2.5">
                <Icon size={16} />
                {label}
              </span>
              {id === "notifications" && (
                <span className="text-[11px] font-semibold text-primary bg-blue-50 dark:bg-blue-500/10 rounded-full px-1.5 py-0.5">
                  {enabledCount} on
                </span>
              )}
            </a>
          ))}
        </nav>

        <div className="space-y-6">
          {/* Profile */}
          <form onSubmit={saveProfile} className="card p-6 sm:p-8 space-y-5">
            <SectionHeader
              id="profile"
              icon={User}
              title="Profile"
              description="Manage your personal information and public identification."
            />

            <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3">
              <div className="h-11 w-11 rounded-full bg-blue-100 dark:bg-blue-500/15 text-primary grid place-items-center font-semibold shrink-0">
                {displayName(user).slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink dark:text-slate-100 truncate">{user?.fullName || user?.username}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    className="input pl-9"
                    value={profile.fullName}
                    onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Username</label>
                <div className="relative">
                  <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    className="input pl-9"
                    value={profile.username}
                    onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  className="input pl-9"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-2">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Primary email used for Budget Buddy account access.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button className="btn-primary" disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>

          {/* Preferences */}
          <form onSubmit={savePrefs} className="card p-6 sm:p-8 space-y-5">
            <SectionHeader
              id="preferences"
              icon={SlidersHorizontal}
              title="Preferences"
              description="Configure display units, calendar format, and visual appearance."
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Currency</label>
                <select
                  className="input"
                  value={prefs.currency}
                  onChange={(e) => setPrefs((p) => ({ ...p, currency: e.target.value }))}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Sets default monetary formatting across the app.</p>
              </div>
              <div>
                <label className="label">Date Format</label>
                <select
                  className="input"
                  value={prefs.dateFormat}
                  onChange={(e) => setPrefs((p) => ({ ...p, dateFormat: e.target.value }))}
                >
                  {DATE_FORMATS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Used across transaction history and goal timelines.</p>
              </div>
            </div>

            <div>
              <label className="label">Theme</label>
              <div className="grid sm:grid-cols-3 gap-3">
                {THEMES.map((t) => {
                  const selected = prefs.theme === t.value;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => selectTheme(t.value)}
                      className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-primary bg-blue-50/70 dark:bg-blue-500/10"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon size={18} className={selected ? "text-primary" : "text-slate-400 dark:text-slate-500"} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink dark:text-slate-100">{t.label}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">{t.hint}</span>
                      </span>
                      {selected && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button className="btn-primary" disabled={savingPrefs}>
                {savingPrefs ? "Saving…" : "Save Preferences"}
              </button>
            </div>
          </form>

          {/* Notifications */}
          <form onSubmit={saveNotifications} className="card p-6 sm:p-8 space-y-5">
            <SectionHeader
              id="notifications"
              icon={Bell}
              title="Notifications"
              description="Choose which alerts show up in your Insights feed."
            />

            <div className="space-y-3">
              <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer">
                <span className="flex items-start gap-3 min-w-0">
                  <span className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-primary grid place-items-center shrink-0">
                    <AlertTriangle size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink dark:text-slate-100">Budget alerts</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Show a card in Insights when a category nears or exceeds its monthly budget.
                    </span>
                  </span>
                </span>
                <Switch
                  checked={notifications.budgetAlerts}
                  onChange={(v) => setNotifications((n) => ({ ...n, budgetAlerts: v }))}
                  label="Budget alerts"
                />
              </label>

              <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer">
                <span className="flex items-start gap-3 min-w-0">
                  <span className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-primary grid place-items-center shrink-0">
                    <Receipt size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink dark:text-slate-100">Large transaction alerts</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Show a card in Insights when a transaction is unusually large compared to your average spending.
                    </span>
                  </span>
                </span>
                <Switch
                  checked={notifications.largeTransactionAlerts}
                  onChange={(v) => setNotifications((n) => ({ ...n, largeTransactionAlerts: v }))}
                  label="Large transaction alerts"
                />
              </label>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500">
              These control what appears on your Insights page — Budget Buddy doesn't currently send email, SMS, or push
              notifications.
            </p>

            <div className="flex justify-end pt-1">
              <button className="btn-primary" disabled={savingNotifications}>
                {savingNotifications ? "Saving…" : "Save Notification Settings"}
              </button>
            </div>
          </form>

          {/* Security */}
          <form onSubmit={savePassword} className="card p-6 sm:p-8 space-y-5">
            <SectionHeader
              id="security"
              icon={ShieldCheck}
              title="Security"
              description="Keep your Budget Buddy account safe."
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    className="input pl-9"
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    className="input pl-9"
                    type="password"
                    minLength={6}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button className="btn-primary" disabled={savingPassword}>
                {savingPassword ? "Saving…" : "Change Password"}
              </button>
              <button type="button" className="btn-secondary" onClick={handleLogout}>
                <LogOut size={15} />
                Log out
              </button>
            </div>
          </form>

          {/* Account Management */}
          <div className="card p-6 sm:p-8 space-y-5">
            <SectionHeader
              id="account"
              icon={FolderCog}
              title="Account Management"
              description={`Member since ${formatDate(user?.createdAt, "MMM d, yyyy")}.`}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div>
                <p className="text-sm font-semibold text-ink dark:text-slate-100">Export your data</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Download all of your transactions as a CSV file.</p>
              </div>
              <button type="button" className="btn-secondary" onClick={handleExport}>
                <Download size={15} />
                Export CSV
              </button>
            </div>

            <div className="rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 p-4">
              <div className="flex items-start gap-3">
                <span className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 grid place-items-center shrink-0">
                  <Trash2 size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Delete Account</p>
                  <p className="text-xs text-rose-600/90 dark:text-rose-400/80 mt-0.5">
                    Permanently removes your Budget Buddy data, including all transactions, budgets, goals, and
                    categories. This cannot be undone.
                  </p>
                  <button type="button" className="btn-danger mt-3" onClick={handleDelete} disabled={deleting}>
                    {deleting ? "Deleting…" : "Delete Account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
