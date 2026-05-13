"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface SliceData { name: string; value: number; color: string; }

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
      <p style={{ color: d.payload.color, fontWeight: 700 }}>{d.name}</p>
      <p style={{ color: "#94a3b8" }}>{d.value} features</p>
    </div>
  );
};

export default function SummaryDonut({
  data,
  total,
  centerValue,
  centerLabel,
}: {
  data: SliceData[];
  total: number;
  centerValue: string;
  centerLabel: string;
}) {
  const hasData = data && data.length > 0 && data.some(d => d.value > 0);
  
  return (
    <div>
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            {hasData ? (
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={78}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            ) : (
              <Pie
                data={[{ name: "No data", value: 1, color: "#475569" }]}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={78}
                strokeWidth={0}
                dataKey="value"
              >
                <Cell fill="#475569" />
              </Pie>
            )}
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none",
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: "#22c55e" }}>{centerValue}</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{centerLabel}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
        {data.filter(d => d.value > 0).map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: d.color, flexShrink: 0, display: "inline-block" }} />
            <span style={{ color: "#94a3b8", flex: 1 }}>{d.name}</span>
            <span style={{ color: "#f1f5f9", fontWeight: 700, minWidth: 28, textAlign: "right" }}>{d.value}</span>
            <span style={{ color: "#475569", fontSize: 11, minWidth: 36, textAlign: "right" }}>
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
