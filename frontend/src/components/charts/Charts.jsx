import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

// Same hues in both themes (color semantics are preserved per spec) - only
// the chrome around them (axis lines, grid, tooltip, tick text) changes.
const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#0EA5E9", "#EC4899"];

// Recharts renders axis ticks, grid lines, legend and tooltips via inline
// SVG props / style objects, not Tailwind classes, so they can't pick up a
// `dark:` variant automatically the way the rest of the app does. Instead we
// read the app's already-resolved dark state (see ThemeContext) and select
// a light- or dark-appropriate palette for that chrome here.
function chartTheme(isDark) {
  return {
    grid: isDark ? "#1E293B" : "#F1F5F9",
    tick: isDark ? "#94A3B8" : "#64748B",
    tooltipBg: isDark ? "#0F172A" : "#FFFFFF",
    tooltipBorder: isDark ? "#334155" : "#E2E8F0",
    tooltipLabel: isDark ? "#F1F5F9" : "#0F172A",
    tooltipItem: isDark ? "#CBD5E1" : "#334155",
    legendText: isDark ? "#CBD5E1" : "#334155",
    centerLabel: isDark ? "#94A3B8" : "#94A3B8",
    centerValue: isDark ? "#F1F5F9" : "#0F172A",
    barCursor: isDark ? "#60A5FA" : "#2563EB",
    inactiveBar: isDark ? "#334155" : "#C7D2FE",
  };
}

export function IncomeExpenseChart({ data }) {
  const { isDark } = useTheme();
  const t = chartTheme(isDark);

  if (!data?.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-16 text-center">No chart data yet.</p>;
  }
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={6} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis dataKey="month" tick={{ fill: t.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: t.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: t.barCursor, fillOpacity: 0.08, radius: 6 }}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${t.tooltipBorder}`,
              background: t.tooltipBg,
              boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
              fontSize: 12,
              padding: "8px 12px",
            }}
            labelStyle={{ color: t.tooltipLabel, fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: t.tooltipItem }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: t.legendText }} iconType="circle" iconSize={8} />
          <Bar dataKey="income" name="Income" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Expenses" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonut({ data, totalLabel, totalValue }) {
  const { isDark } = useTheme();
  const t = chartTheme(isDark);

  if (!data?.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-16 text-center">No spending this period.</p>;
  }
  return (
    <div className="h-64 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="category" innerRadius={62} outerRadius={88} paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${t.tooltipBorder}`,
              background: t.tooltipBg,
              boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
              fontSize: 12,
              padding: "8px 12px",
            }}
            labelStyle={{ color: t.tooltipLabel, fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: t.tooltipItem }}
          />
        </PieChart>
      </ResponsiveContainer>
      {totalValue !== undefined && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center -translate-y-1">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{totalLabel}</p>
            <p className="font-display font-bold text-ink tabular">{totalValue}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function MonthlySpendChart({ data }) {
  const { isDark } = useTheme();
  const t = chartTheme(isDark);

  if (!data?.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-16 text-center">No spending history yet.</p>;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis dataKey="month" tick={{ fill: t.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: t.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: t.barCursor, fillOpacity: 0.08, radius: 6 }}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${t.tooltipBorder}`,
              background: t.tooltipBg,
              boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
              fontSize: 12,
              padding: "8px 12px",
            }}
            labelStyle={{ color: t.tooltipLabel, fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: t.tooltipItem }}
          />
          <Bar dataKey="expense" name="Spending" radius={[6, 6, 0, 0]} maxBarSize={36}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.isCurrent ? "#2563EB" : t.inactiveBar} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
