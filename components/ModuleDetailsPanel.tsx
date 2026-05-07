"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { STATUS_META } from "@/lib/sheetData";
import { useSheetData } from "@/lib/SheetDataContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

function getProgressColor(pct: number) {
  if (pct >= 80) return "#22c55e";
  if (pct >= 60) return "#3b82f6";
  if (pct >= 40) return "#f59e0b";
  if (pct === 0) return "#334155";
  return "#ef4444";
}

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: "rgba(13,20,36,0.97)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 12,
    }}>
      <p style={{ color: d.payload?.color ?? d.color, fontWeight: 700, marginBottom: 6 }}>{d.name ?? d.payload?.name}</p>
      <p style={{ color: "#94a3b8" }}>{d.value} feature{d.value !== 1 ? "s" : ""}</p>
    </div>
  );
};

export default function ModuleDetailsPanel() {
  const params = useSearchParams();
  const moduleId = params.get("module");
  const { data } = useSheetData();
  const moduleData = data?.moduleData ?? [];

  const selectedModule = useMemo(
    () => moduleData.find((mod) => mod.id === moduleId) ?? null,
    [moduleId, moduleData],
  );

  const overall = useMemo(() => {
    return moduleData.reduce(
      (acc, mod) => {
        acc.total += mod.total;
        acc.completed += mod.completed;
        acc.ongoing += mod.ongoing + mod.testing + mod.started;
        acc.hold += mod.hold;
        acc.cancelled += mod.cancelled;
        acc.pending += mod.pending;
        acc.progress += mod.progress;
        return acc;
      },
      { total: 0, completed: 0, ongoing: 0, hold: 0, cancelled: 0, pending: 0, progress: 0 },
    );
  }, [moduleData]);

  const chartData = useMemo(
    () => moduleData.map((mod) => ({
      name: mod.name,
      completed: mod.completed,
      ongoing: mod.ongoing + mod.testing + mod.started,
      hold: mod.hold,
      cancelled: mod.cancelled,
      pending: mod.pending,
    })),
    [moduleData],
  );

  if (!selectedModule) {
    return (
      <div className="glass-card fade-in fade-in-2">
        <div className="card-header">
          <div>
            <p className="card-title">Dashboard overview</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Project-wide totals and a single big module overview chart. Use the sidebar to drill into individual module details.
            </p>
          </div>
          <span style={{ fontSize: 11, padding: "6px 12px", borderRadius: 20, background: "rgba(59,130,246,0.12)", color: "var(--accent-blue)", border: "1px solid rgba(59,130,246,0.2)", fontWeight: 700 }}>
            {Math.round(overall.progress / moduleData.length)}% average progress
          </span>
        </div>

        <div className="card-body" style={{ paddingTop: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
            <div style={{ padding: 18, borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.6px" }}>Modules</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>{moduleData.length}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>tracked right now</p>
            </div>
            <div style={{ padding: 18, borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.6px" }}>Total features</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>{overall.total}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>across all modules</p>
            </div>
            <div style={{ padding: 18, borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.6px" }}>Completed</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "var(--accent-green)" }}>{overall.completed}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>features done</p>
            </div>
            <div style={{ padding: 18, borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.6px" }}>Pending</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>{overall.pending}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>issues remaining</p>
            </div>
          </div>

          <div style={{ background: "rgba(13,20,36,0.65)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.08)", padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Module overview</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Compare progress and workloads across all modules.</p>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>stacked status</span>
            </div>
            <div style={{ width: "100%", height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 18, left: -10, bottom: 32 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 11, paddingBottom: 8 }} />
                  <Bar dataKey="completed" stackId="a" fill="#22c55e" />
                  <Bar dataKey="ongoing" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="hold" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="cancelled" stackId="a" fill="#ef4444" />
                  <Bar dataKey="pending" stackId="a" fill="#64748b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mod = selectedModule;
  const color = getProgressColor(mod.progress);
  const activeCount = mod.ongoing + mod.started + mod.testing;
  const statuses = [
    { key: "completed", value: mod.completed },
    { key: "ongoing", value: activeCount },
    { key: "hold", value: mod.hold },
    { key: "cancelled", value: mod.cancelled },
    { key: "pending", value: mod.pending },
  ] as const;

  return (
    <div className="glass-card fade-in fade-in-2">
      <div className="card-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
            {mod.name}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Module-specific progress and feature breakdown
          </p>
        </div>
        <span style={{ fontSize: 11, padding: "6px 12px", borderRadius: 20, background: `${color}15`, color, border: `1px solid ${color}30`, fontWeight: 700 }}>
          {mod.progress}% complete
        </span>
      </div>

      <div className="card-body" style={{ paddingTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginBottom: 20 }}>
          <div style={{
            padding: 24,
            borderRadius: "var(--radius-xl)",
            background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)",
            border: "1px solid rgba(34,197,94,0.2)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 60,
              height: 60,
              background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)",
              borderRadius: "50%",
              transform: "translate(20px, -20px)",
            }} />
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Completed</p>
            <p style={{ fontSize: 36, fontWeight: 900, color: STATUS_META.completed.color, lineHeight: 1, marginBottom: 4 }}>{mod.completed}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", opacity: 0.8 }}>features finished</p>
          </div>
          <div style={{
            padding: 24,
            borderRadius: "var(--radius-xl)",
            background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)",
            border: "1px solid rgba(245,158,11,0.2)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 60,
              height: 60,
              background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
              borderRadius: "50%",
              transform: "translate(20px, -20px)",
            }} />
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Pending</p>
            <p style={{ fontSize: 36, fontWeight: 900, color: STATUS_META.pending.color, lineHeight: 1, marginBottom: 4 }}>{mod.pending}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", opacity: 0.8 }}>issues remaining</p>
          </div>
          <div style={{
            padding: 24,
            borderRadius: "var(--radius-xl)",
            background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)",
            border: "1px solid rgba(59,130,246,0.2)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 60,
              height: 60,
              background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
              borderRadius: "50%",
              transform: "translate(20px, -20px)",
            }} />
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Total</p>
            <p style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1, marginBottom: 4 }}>{mod.total}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", opacity: 0.8 }}>items in module</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
          {statuses.map((item) => {
            const meta = STATUS_META[item.key];
            const percent = mod.total > 0 ? Math.round((item.value / mod.total) * 100) : 0;
            return (
              <div key={item.key} style={{
                padding: 16,
                borderRadius: "var(--radius-lg)",
                background: `linear-gradient(135deg, ${meta.color}15 0%, ${meta.color}08 100%)`,
                border: `1px solid ${meta.color}25`,
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 40,
                  height: 40,
                  background: `radial-gradient(circle, ${meta.color}12 0%, transparent 70%)`,
                  borderRadius: "50%",
                  transform: "translate(15px, -15px)",
                }} />
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8, fontWeight: 600 }}>{STATUS_META[item.key].label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: meta.color, lineHeight: 1, marginBottom: 4 }}>{item.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.8 }}>{percent}%</div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: 18, borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ position: "relative", width: 120, height: 120 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke={color}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 50 * (mod.progress / 100)} ${2 * Math.PI * 50}`}
                strokeDashoffset={2 * Math.PI * 50 * 0.25}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color }}>{mod.progress}%</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>complete</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Module progress</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Percentage for this module only.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
