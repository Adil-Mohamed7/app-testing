"use client";

import { useRef, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import KpiGrid from "@/components/KpiGrid";
import ModuleProgressList from "@/components/ModuleProgressList";
import SummaryDonut from "@/components/SummaryDonut";
import ModuleDetailsPanel from "@/components/ModuleDetailsPanel";
import { useSearchParams } from "next/navigation";
import { STATUS_META, ModuleData } from "@/lib/sheetData";
import { SheetDataProvider, useSheetData } from "@/lib/SheetDataContext";
import { useCountUp } from "@/lib/useCountUp";

const PULL_THRESHOLD = 80;

function usePullToRefresh(onRefresh: () => void, enabled: boolean) {
  const ref = useRef<HTMLElement | null>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pullY, setPullY] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        e.preventDefault();
        setPullY(Math.min(dy, PULL_THRESHOLD * 1.5));
      }
    };
    const onTouchEnd = () => {
      if (pulling.current) {
        setPullY((y) => {
          if (y >= PULL_THRESHOLD) onRefresh();
          return 0;
        });
        pulling.current = false;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, onRefresh]);

  return { ref, pullY };
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const animated = useCountUp(value);
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{animated}</span>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <SheetDataProvider>
      <DashboardContent />
    </SheetDataProvider>
  );
}

function TopPerformers({ moduleData }: { moduleData: ModuleData[] }) {
  const top = [...moduleData]
    .filter((m) => m.total > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {top.map((m) => (
        <div key={m.id}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{m.name}</span>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>{m.progress}%</span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${m.progress}%`, background: "var(--accent-green)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function NeedsAttention({ moduleData }: { moduleData: ModuleData[] }) {
  const needsAttention = [...moduleData]
    .filter((m) => m.total > 0)
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {needsAttention.map((m) => (
        <div key={m.id}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{m.name}</span>
            <span style={{ color: "#f59e0b", fontWeight: 700 }}>{m.progress}%</span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${m.progress}%`, background: "var(--accent-orange)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function OverallSummaryBar({ moduleData }: { moduleData: ModuleData[] }) {
  const totalModules = moduleData.length;
  const activeModules = moduleData.filter((m) => m.total > 0).length;
  const avgProgress = totalModules > 0
    ? Math.round(moduleData.reduce((sum, m) => sum + m.progress, 0) / totalModules)
    : 0;
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 50%, rgba(6,182,212,0.04) 100%)",
      border: "1px solid rgba(59,130,246,0.12)",
      borderRadius: "var(--radius-lg)",
      padding: "16px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#3b82f6", lineHeight: 1 }}>{totalModules}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Modules</div>
        </div>
        <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.15)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e", lineHeight: 1 }}>{activeModules}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active</div>
        </div>
        <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.15)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#f59e0b", lineHeight: 1 }}>{avgProgress}%</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg Progress</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Project overview across all modules</div>
    </div>
  );
}

function HeroBanner({ projectMeta }: { projectMeta: { projectName: string; lastUpdated: string; overallProgress: number; totalTasks: number; completed: number; pending: number } }) {
  const animatedProgress = useCountUp(projectMeta.overallProgress);
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.08) 50%, rgba(6,182,212,0.06) 100%)",
      border: "1px solid rgba(59,130,246,0.15)",
      borderRadius: "var(--radius-xl)",
      padding: "28px 32px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 24, animation: "fadeInUp 0.4s ease both",
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>{projectMeta.projectName}</h1>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", background: "rgba(34,197,94,0.12)", color: "#22c55e", borderRadius: 20, border: "1px solid rgba(34,197,94,0.2)" }}>ACTIVE</span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Project progress overview across all modules · Last updated {projectMeta.lastUpdated}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0, background: "rgba(0,0,0,0.2)", padding: "16px 24px", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, color: "#22c55e", letterSpacing: "-2px" }}>{animatedProgress}%</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Overall Complete</div>
        </div>
        <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Stat label="Total" value={projectMeta.totalTasks} color="var(--text-primary)" />
          <Stat label="Done"  value={projectMeta.completed} color="#22c55e" />
          <Stat label="Left"  value={projectMeta.pending} color="#f59e0b" />
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const params = useSearchParams();
  const moduleSelected = Boolean(params.get("module"));
  const { data, loading, error, refresh } = useSheetData();
  const { ref: mainRef, pullY } = usePullToRefresh(refresh, !loading);
  const pullProgress = Math.min(pullY / PULL_THRESHOLD, 1);
  const pullReady = pullY >= PULL_THRESHOLD;

  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <main className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
              {/* Layered rings */}
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(59,130,246,0.08)" }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#3b82f6", animation: "spin 0.9s linear infinite" }} />
                <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#8b5cf6", animation: "spin 1.3s linear infinite reverse" }} />
                <div style={{ position: "absolute", inset: 20, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#06b6d4", animation: "spin 1.7s linear infinite" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚡</div>
              </div>
              {/* Text */}
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.3px" }}>Loading live data</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Fetching from Google Sheets…</p>
              </div>
              {/* Skeleton bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 260 }}>
                {["80%", "60%", "90%", "45%"].map((w, i) => (
                  <div key={i} style={{ height: 10, borderRadius: 6, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: w, borderRadius: 6, background: "linear-gradient(90deg, rgba(59,130,246,0.15), rgba(139,92,246,0.2), rgba(59,130,246,0.15))", backgroundSize: "200% 100%", animation: `shimmer 1.6s ease-in-out ${i * 0.15}s infinite` }} />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <main className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 40 }}>⚠️</div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Failed to load sheet data</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 340 }}>{error ?? "Unable to connect to Google Sheets."}</p>
              </div>
              <button
                onClick={refresh}
                style={{
                  marginTop: 8, padding: "9px 22px", borderRadius: 20,
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  color: "#60a5fa", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                ↻ Try again
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { moduleData, projectMeta, summaryDonut, topKPIs } = data;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main
          ref={mainRef as React.RefObject<HTMLElement>}
          className="page-content"
          style={{ position: "relative", overflowY: "auto" }}
        >
          {/* Pull-to-refresh indicator */}
          {pullY > 0 && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
              display: "flex", justifyContent: "center", alignItems: "center",
              height: pullY, overflow: "hidden",
            }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                opacity: pullProgress,
                transform: `scale(${0.6 + pullProgress * 0.4})`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: "2px solid rgba(59,130,246,0.2)",
                  borderTop: "2px solid #3b82f6",
                  animation: pullReady ? "spin 0.6s linear infinite" : "none",
                  transform: pullReady ? undefined : `rotate(${pullProgress * 270}deg)`,
                }} />
                <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>
                  {pullReady ? "Release to refresh" : "Pull to refresh"}
                </span>
              </div>
            </div>
          )}

          {/* Content shifts down while pulling */}
          <div style={{
            transform: pullY > 0 ? `translateY(${pullY}px)` : undefined,
            transition: pullY === 0 ? "transform 0.3s ease" : undefined,
          }}>

            {!moduleSelected && (
              <HeroBanner projectMeta={projectMeta} />
            )}

            {/* KPI Cards or Overall Summary */}
            {moduleSelected ? (
              <OverallSummaryBar moduleData={moduleData} />
            ) : (
              <KpiGrid kpis={topKPIs} />
            )}

            {/* Selected Module Details */}
            <ModuleDetailsPanel />

            {/* Main Content Row */}
            <div className="chart-grid">
              <div className="glass-card fade-in fade-in-2">
                <div className="card-header">
                  <div>
                    <p className="section-title">Module Progress</p>
                    <p className="section-subtitle">Feature completion status per module</p>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {(["completed","ongoing","hold","cancelled","pending"] as const).map((k) => (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_META[k].color, display: "inline-block" }} />
                        {STATUS_META[k].label}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card-body" style={{ paddingTop: 12 }}>
                  <ModuleProgressList moduleData={moduleData} STATUS_META={STATUS_META} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="glass-card fade-in fade-in-3">
                  <div className="card-header">
                    <p className="card-title">Status Breakdown</p>
                  </div>
                  <div className="card-body">
                    <SummaryDonut
                      data={summaryDonut}
                      total={projectMeta.totalTasks}
                      centerValue={`${projectMeta.overallProgress}%`}
                      centerLabel="complete"
                    />
                  </div>
                </div>

                <div className="glass-card fade-in fade-in-4">
                  <div className="card-header">
                    <p className="card-title">Top Performers</p>
                  </div>
                  <div className="card-body" style={{ paddingTop: 12 }}>
                    <TopPerformers moduleData={moduleData} />
                  </div>
                </div>

                <div className="glass-card fade-in fade-in-4">
                  <div className="card-header">
                    <p className="card-title">Needs Attention</p>
                  </div>
                  <div className="card-body" style={{ paddingTop: 12 }}>
                    <NeedsAttention moduleData={moduleData} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
