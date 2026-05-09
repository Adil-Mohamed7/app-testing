"use client";

import { useSheetData } from "@/lib/SheetDataContext";
import { useCountUp } from "@/lib/useCountUp";

interface KPI {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaDir: string;
  icon: string;
  color: string;
}

function AnimatedKpiValue({ raw }: { raw: string }) {
  const isPercent = raw.endsWith("%");
  const num = parseInt(raw.replace("%", ""), 10);
  const animated = useCountUp(isNaN(num) ? 0 : num);
  if (isNaN(num)) return <>{raw}</>;
  return <>{animated}{isPercent ? "%" : ""}</>;
}

export default function KpiGrid({ kpis }: { kpis: KPI[] }) {
  const { refresh, loading } = useSheetData();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 16px", borderRadius: 20,
            background: "rgba(59,130,246,0.12)",
            border: "1px solid rgba(59,130,246,0.25)",
            color: "#60a5fa", fontSize: 12, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "all 0.2s",
          }}
        >
          <span style={{
            display: "inline-block",
            animation: loading ? "spin 0.8s linear infinite" : "none",
            fontSize: 14,
          }}>↻</span>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <div
            key={k.id}
            id={`kpi-${k.id}`}
            className={`kpi-card ${k.color} fade-in fade-in-${Math.min(i + 1, 4)}`}
          >
            <div className="kpi-top">
              <div className="kpi-icon">{k.icon}</div>
              <span className={`kpi-delta ${k.deltaDir}`}>{k.delta}</span>
            </div>
            <div className="kpi-value">
              <AnimatedKpiValue raw={k.value} />
            </div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
