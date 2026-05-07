"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Suite { name: string; value: number; color: string; }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: "rgba(13,20,36,0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 12,
    }}>
      <p style={{ color: d.payload.color, fontWeight: 600 }}>{d.name}</p>
      <p style={{ color: "#94a3b8" }}>{d.value} tests</p>
    </div>
  );
};

export default function SuiteDonut({ data }: { data: Suite[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={58} outerRadius={82}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        pointerEvents: "none",
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{total}</div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>total</div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 0 0" }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0, display: "inline-block" }} />
            <span style={{ color: "#94a3b8", flex: 1 }}>{d.name}</span>
            <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{d.value}</span>
            <span style={{ color: "#475569" }}>({Math.round(d.value / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
