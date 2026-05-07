"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSheetData } from "@/lib/SheetDataContext";

function getProgressColor(pct: number) {
  if (pct >= 80) return "#22c55e";
  if (pct >= 60) return "#3b82f6";
  if (pct >= 40) return "#f59e0b";
  if (pct === 0) return "#334155";
  return "#ef4444";
}

export default function SidebarModuleList() {
  const router = useRouter();
  const params = useSearchParams();
  const activeId = params.get("module");
  const { data, loading } = useSheetData();
  const moduleData = data?.moduleData ?? [];

  if (loading) return <div style={{ padding: "8px 0", color: "var(--text-muted)", fontSize: 12 }}>Loading…</div>;

  const handleClick = (id: string) => {
    const next = activeId === id ? null : id;
    const url = next ? `/?module=${next}` : "/";
    router.push(url, { scroll: false });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {moduleData.map((mod) => {
        const color = getProgressColor(mod.progress);
        const isActive = activeId === mod.id;
        const isEmpty = mod.total === 0;

        return (
          <button
            key={mod.id}
            id={`sidebar-module-${mod.id}`}
            onClick={() => !isEmpty && handleClick(mod.id)}
            style={{
              all: "unset",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 12,
              cursor: isEmpty ? "default" : "pointer",
              background: isActive ? "rgba(59,130,246,0.18)" : "rgba(59,130,246,0.06)",
              border: `1px solid ${isActive ? "rgba(59,130,246,0.25)" : "transparent"}`,
              transition: "all 0.15s ease",
              opacity: isEmpty ? 0.35 : 1,
              color: "var(--text-primary)",
            }}
            onMouseEnter={(e) => {
              if (!isActive && !isEmpty)
                (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.12)";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.06)";
            }}
          >
            {/* Color dot */}
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: color, flexShrink: 0, display: "inline-block",
              boxShadow: isActive ? `0 0 6px ${color}` : "none",
            }} />

            {/* Name */}
            <span style={{
              flex: 1,
              fontSize: 12.5,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {mod.name}
            </span>

            {/* % */}
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color,
              flexShrink: 0,
            }}>
              {mod.progress}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
