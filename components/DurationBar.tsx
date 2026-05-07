"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface DataPoint { suite: string; avg: number; }

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(13,20,36,0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 12,
    }}>
      <p style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</p>
      <p style={{ color: "#f1f5f9", fontWeight: 600 }}>{payload[0].value}s avg</p>
    </div>
  );
};

export default function DurationBar({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="suite"
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          unit="s"
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="avg" name="Avg Duration" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
