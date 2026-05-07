"use client";

interface KPI {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaDir: string;
  icon: string;
  color: string;
}

export default function KpiGrid({ kpis }: { kpis: KPI[] }) {
  return (
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
          <div className="kpi-value">{k.value}</div>
          <div className="kpi-label">{k.label}</div>
        </div>
      ))}
    </div>
  );
}
