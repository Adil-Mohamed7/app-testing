"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface DataPoint {
  date: string;
  pass: number;
  fail: number;
  skip: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(13,20,36,0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10,
      padding: "12px 16px",
      fontSize: 12,
    }}>
      <p style={{ color: "#94a3b8", marginBottom: 8, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function TrendChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradPass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradFail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradSkip" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Area type="monotone" dataKey="pass" name="Pass" stroke="#22c55e" strokeWidth={2} fill="url(#gradPass)" dot={false} />
        <Area type="monotone" dataKey="fail" name="Fail" stroke="#ef4444" strokeWidth={2} fill="url(#gradFail)" dot={false} />
        <Area type="monotone" dataKey="skip" name="Skip" stroke="#f59e0b" strokeWidth={1.5} fill="url(#gradSkip)" dot={false} strokeDasharray="4 2" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
