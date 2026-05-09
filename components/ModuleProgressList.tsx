"use client";

import { ModuleData } from "@/lib/sheetData";
import { useCountUp } from "@/lib/useCountUp";

type Props = {
  moduleData: ModuleData[];
  STATUS_META: Record<string, { color: string; label: string }>;
};

const GRID = "180px 1fr 60px 60px 60px 60px 60px 60px 60px 80px";

function getProgressColor(pct: number) {
  if (pct >= 80) return "#22c55e";
  if (pct >= 60) return "#3b82f6";
  if (pct >= 40) return "#f59e0b";
  return "#ef4444";
}

function StatCell({ value, color, bold }: { value: number; color: string; bold?: boolean }) {
  const animated = useCountUp(value);
  if (value === 0) return <span style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.12)", display: "block" }}>—</span>;
  return <span style={{ textAlign: "center", fontSize: 13, fontWeight: bold ? 800 : 600, color, display: "block" }}>{animated}</span>;
}

function ModuleRow({ mod, STATUS_META, index }: { mod: ModuleData; STATUS_META: Props["STATUS_META"]; index: number }) {
  const color = getProgressColor(mod.progress);
  const active = mod.ongoing + mod.testing + mod.started;
  const isEmpty = mod.total === 0;
  const animatedTotal = useCountUp(mod.total);
  const animatedProgress = useCountUp(mod.progress);

  return (
    <div
      id={`module-row-${mod.id}`}
      className="module-progress-grid"
      style={{
        display: "grid", gridTemplateColumns: GRID, gap: 8,
        padding: "12px 16px", borderRadius: 10, alignItems: "center",
        transition: "background 0.15s",
        animation: "fadeInUp 0.35s ease both",
        animationDelay: `${index * 0.04}s`,
        opacity: isEmpty ? 0.4 : 1,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {mod.name}
      </div>

      <div style={{ position: "relative", height: 10, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.06)", display: "flex" }}>
        {!isEmpty && (<>
          <div style={{ width: `${(mod.completed / mod.total) * 100}%`, background: STATUS_META.completed.color, transition: "width 0.8s ease" }} title={`Completed: ${mod.completed}`} />
          <div style={{ width: `${(active / mod.total) * 100}%`, background: STATUS_META.ongoing.color }} title={`Active: ${active}`} />
          <div style={{ width: `${(mod.hold / mod.total) * 100}%`, background: STATUS_META.hold.color }} title={`Hold: ${mod.hold}`} />
          <div style={{ width: `${(mod.cancelled / mod.total) * 100}%`, background: STATUS_META.cancelled.color }} title={`Cancelled: ${mod.cancelled}`} />
        </>)}
      </div>

      <StatCell value={mod.completed} color={STATUS_META.completed.color} />
      <StatCell value={active}        color={STATUS_META.ongoing.color} />
      <StatCell value={mod.hold}      color={STATUS_META.hold.color} />
      <StatCell value={mod.cancelled} color={STATUS_META.cancelled.color} />
      <StatCell value={mod.pending}   color={STATUS_META.pending.color} />
      <span style={{ textAlign: "center", fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>{animatedTotal}</span>

      <div style={{ textAlign: "right" }}>
        <span style={{
          fontSize: 13, fontWeight: 800, color,
          background: `${color}18`, padding: "3px 9px",
          borderRadius: 20, border: `1px solid ${color}30`,
        }}>
          {animatedProgress}%
        </span>
      </div>
      <div />
    </div>
  );
}

function TotalsRow({ moduleData, STATUS_META }: Props) {
  const totalCompleted = moduleData.reduce((s, m) => s + m.completed, 0);
  const totalPending   = moduleData.reduce((s, m) => s + m.pending, 0);
  const totalAll       = moduleData.reduce((s, m) => s + m.total, 0);
  const overallPct     = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0;
  const animatedAll    = useCountUp(totalAll);
  const animatedPct    = useCountUp(overallPct);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: GRID, gap: 8,
      padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)",
      marginTop: 4, alignItems: "center",
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</span>
      <span />
      <StatCell value={totalCompleted} color={STATUS_META.completed.color} bold />
      <span /><span /><span />
      <StatCell value={totalPending} color={STATUS_META.pending.color} bold />
      <span style={{ textAlign: "center", fontSize: 14, color: "var(--text-primary)", fontWeight: 800 }}>{animatedAll}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#22c55e" }}>{animatedPct}%</span>
      </div>
      <div />
    </div>
  );
}

export default function ModuleProgressList({ moduleData, STATUS_META }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div className="module-progress-grid" style={{
        display: "grid", gridTemplateColumns: GRID, gap: 8,
        padding: "0 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        fontSize: 10, fontWeight: 600, letterSpacing: "0.6px",
        textTransform: "uppercase", color: "var(--text-muted)", alignItems: "center",
      }}>
        <span>Module</span>
        <span>Progress</span>
        <span style={{ textAlign: "center" }}>Done</span>
        <span style={{ textAlign: "center" }}>Active</span>
        <span style={{ textAlign: "center" }}>Hold</span>
        <span style={{ textAlign: "center" }}>Cancel</span>
        <span style={{ textAlign: "center" }}>Pending</span>
        <span style={{ textAlign: "center" }}>Total</span>
        <span style={{ textAlign: "right" }}>%</span>
        <span />
      </div>

      {moduleData.map((mod, i) => (
        <ModuleRow key={mod.id} mod={mod} STATUS_META={STATUS_META} index={i} />
      ))}

      <TotalsRow moduleData={moduleData} STATUS_META={STATUS_META} />
    </div>
  );
}
