"use client";

interface Activity {
  type: string;
  msg: string;
  time: string;
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
  fail:   { icon: "✕", color: "#ef4444" },
  pass:   { icon: "✓", color: "#22c55e" },
  deploy: { icon: "🚀", color: "#3b82f6" },
  flaky:  { icon: "⚠", color: "#f59e0b" },
};

export default function ActivityFeed({ items }: { items: Activity[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {items.map((item, i) => {
        const meta = TYPE_META[item.type] ?? { icon: "•", color: "#94a3b8" };
        return (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 0",
              borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              alignItems: "flex-start",
            }}
          >
            {/* Icon dot */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: `${meta.color}18`,
              border: `1px solid ${meta.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: meta.color,
            }}>
              {meta.icon}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.4 }}>{item.msg}</p>
              <p style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{item.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
