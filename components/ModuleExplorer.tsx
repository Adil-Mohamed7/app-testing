"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ModuleData, STATUS_META } from "@/lib/sheetData";
type Props = {
  moduleData: ModuleData[];
  STATUS_META: Record<string, { color: string; label: string }>;
};
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

import { useSheetData } from "@/lib/SheetDataContext";

function getProgressColor(pct: number) {
  if (pct >= 80) return "#22c55e";
  if (pct >= 60) return "#3b82f6";
  if (pct >= 40) return "#f59e0b";
  if (pct === 0) return "#334155";
  return "#ef4444";
}

/* ── Tooltip ─────────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: "rgba(13,20,36,0.97)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: "10px 14px", fontSize: 12,
    }}>
      <p style={{ color: d.payload?.color ?? d.color, fontWeight: 700 }}>{d.name ?? d.payload?.name}</p>
      <p style={{ color: "#94a3b8" }}>{d.value} feature{d.value !== 1 ? "s" : ""}</p>
    </div>
  );
};

  type Module = ModuleData;
function ModuleCard({ mod, isSelected, onClick }: { mod: Module; isSelected: boolean; onClick: () => void }) {
  const color = getProgressColor(mod.progress);
  const isEmpty = mod.total === 0;
  const active = mod.ongoing + mod.started + mod.testing;

  return (
    <button
      id={`module-card-${mod.id}`}
      onClick={onClick}
      style={{
        all: "unset", cursor: isEmpty ? "default" : "pointer",
        display: "flex", flexDirection: "column", gap: 10, padding: "16px",
        borderRadius: "var(--radius-md)",
        background: isSelected ? `${color}12` : "rgba(13,20,36,0.6)",
        border: `1px solid ${isSelected ? color + "40" : "rgba(255,255,255,0.07)"}`,
        backdropFilter: "blur(12px)",
        transition: "all 0.2s ease",
        boxShadow: isSelected ? `0 0 20px ${color}15` : "none",
        opacity: isEmpty ? 0.4 : 1,
        position: "relative", overflow: "hidden",
      }}
      onMouseEnter={(e) => { if (!isSelected && !isEmpty) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"; }}
      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = isSelected ? color + "40" : "rgba(255,255,255,0.07)"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: isSelected ? color : "transparent", borderRadius: "var(--radius-md) var(--radius-md) 0 0", transition: "background 0.2s" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{mod.name}</span>
        <span style={{ fontSize: 15, fontWeight: 800, color, flexShrink: 0, marginLeft: 6 }}>{mod.progress}%</span>
      </div>

      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: 5, overflow: "hidden" }}>
        <div style={{ width: `${mod.progress}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.6s ease" }} />
      </div>

      <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
        <span style={{ color: STATUS_META.completed.color }}>✓ {mod.completed}</span>
        {active > 0 && <span style={{ color: STATUS_META.ongoing.color }}>● {active}</span>}
        {mod.pending > 0 && <span style={{ color: "var(--text-muted)" }}>○ {mod.pending}</span>}
        <span style={{ color: "var(--text-muted)", marginLeft: "auto" }}>{mod.total} total</span>
      </div>
    </button>
  );
}

/* ── Detail panel ────────────────────────────────────────────────── */
function ModuleDetail({ mod }: { mod: Module }) {
  const color = getProgressColor(mod.progress);
  const active = mod.ongoing + mod.started + mod.testing;

  const statuses: { key: keyof typeof STATUS_META; value: number }[] = [
    { key: "completed", value: mod.completed },
    { key: "ongoing",   value: active },
    { key: "hold",      value: mod.hold },
    { key: "cancelled", value: mod.cancelled },
    { key: "pending",   value: mod.pending },
  ];

  const pieData = statuses.filter((s) => s.value > 0).map((s) => ({
    name: STATUS_META[s.key].label, value: s.value, color: STATUS_META[s.key].color,
  }));

  const barData = statuses.map((s) => ({
    name: STATUS_META[s.key].label, value: s.value, color: STATUS_META[s.key].color,
  }));

  const isEmpty = mod.total === 0;

  return (
    <div style={{
      animation: "fadeInUp 0.3s ease both",
      background: "rgba(10,16,28,0.7)", backdropFilter: "blur(20px)",
      border: `1px solid ${color}25`, borderRadius: "var(--radius-lg)",
      padding: "24px", boxShadow: `0 8px 40px rgba(0,0,0,0.4), 0 0 30px ${color}08`,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 4 }}>{mod.name}</h2>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {isEmpty ? "No features tracked yet" : `${mod.total} features · ${mod.completed} completed · ${mod.pending} pending`}
          </p>
        </div>
        <div style={{
          fontSize: 36, fontWeight: 900, color, lineHeight: 1,
          background: `${color}12`, border: `1px solid ${color}25`,
          padding: "10px 18px", borderRadius: "var(--radius-md)",
        }}>
          {mod.progress}%
        </div>
      </div>

      {isEmpty ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px 0", fontSize: 13 }}>
          📋 No data available for this module yet.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {/* Breakdown column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)", marginBottom: 4 }}>Breakdown</p>
            {statuses.map(({ key, value }) => (
              <div key={key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 12px", borderRadius: "var(--radius-sm)",
                background: `${STATUS_META[key].color}0E`, border: `1px solid ${STATUS_META[key].color}20`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_META[key].color, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{STATUS_META[key].label}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: STATUS_META[key].color }}>{value}</span>
                  {mod.total > 0 && (
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{Math.round((value / mod.total) * 100)}%</span>
                  )}
                </div>
              </div>
            ))}
            {/* Progress bar */}
            <div style={{ marginTop: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 6 }}>
                <span style={{ color: "var(--text-muted)" }}>Progress</span>
                <span style={{ color, fontWeight: 700 }}>{mod.progress}%</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, height: 8, overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${(mod.completed / mod.total) * 100}%`, background: STATUS_META.completed.color, height: "100%", transition: "width 0.8s ease" }} />
                <div style={{ width: `${(active / mod.total) * 100}%`, background: STATUS_META.ongoing.color, height: "100%" }} />
                <div style={{ width: `${(mod.hold / mod.total) * 100}%`, background: STATUS_META.hold.color, height: "100%" }} />
                <div style={{ width: `${(mod.cancelled / mod.total) * 100}%`, background: STATUS_META.cancelled.color, height: "100%" }} />
              </div>
            </div>
          </div>

          {/* Donut */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)", marginBottom: 12 }}>Distribution</p>
            <div style={{ position: "relative" }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                    {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1 }}>{mod.progress}%</div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>done</div>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)", marginBottom: 12 }}>By Status</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{ top: 0, right: 4, left: -28, bottom: 0 }} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {barData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.9} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Inner component that reads searchParams ─────────────────────── */
function ModuleExplorerInner() {
  const params = useSearchParams();
  const urlModule = params.get("module");
  const [selected, setSelected] = useState<string | null>(urlModule);
  const { data } = useSheetData();
  const moduleData = data?.moduleData ?? [];

  useEffect(() => {
    setSelected(urlModule);
  }, [urlModule]);

  const selectedMod = moduleData.find((m) => m.id === selected) ?? null;

  const handleClick = (id: string) => {
    setSelected((prev) => (prev === id ? null : id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 10 }}>
        {moduleData.map((mod) => (
          <ModuleCard
            key={mod.id}
            mod={mod}
            isSelected={selected === mod.id}
            onClick={() => handleClick(mod.id)}
          />
        ))}
      </div>

      {/* Detail panel */}
      {selectedMod && <ModuleDetail mod={selectedMod} />}
    </div>
  );
}

/* ── Exported wrapper with Suspense ──────────────────────────────── */
export default function ModuleExplorer() {
  return (
    <Suspense fallback={
      <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "16px 0" }}>Loading modules…</div>
    }>
      <ModuleExplorerInner />
    </Suspense>
  );
}
