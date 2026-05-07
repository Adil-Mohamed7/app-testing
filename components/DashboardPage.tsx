"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import KpiGrid from "@/components/KpiGrid";
import ModuleProgressList from "@/components/ModuleProgressList";
import SummaryDonut from "@/components/SummaryDonut";
import ModuleDetailsPanel from "@/components/ModuleDetailsPanel";
import { useSearchParams } from "next/navigation";
import { STATUS_META, ModuleData } from "@/lib/sheetData";
import { SheetDataProvider, useSheetData } from "@/lib/SheetDataContext";

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
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
  const avgProgress = totalModules > 0 ? Math.round(moduleData.reduce((sum, m) => sum + m.progress, 0) / totalModules) : 0;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 50%, rgba(6,182,212,0.04) 100%)",
      border: "1px solid rgba(59,130,246,0.12)",
      borderRadius: "var(--radius-lg)",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      marginBottom: 16,
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
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Project overview across all modules
      </div>
    </div>
  );
}

function DashboardContent() {
  const params = useSearchParams();
  const moduleSelected = Boolean(params.get("module"));
  const { data, loading, error } = useSheetData();

  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <main className="page-content">
            <div style={{ color: "var(--text-muted)", padding: 24 }}>Loading live sheet data…</div>
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
          <main className="page-content">
            <div style={{ color: "var(--text-muted)", padding: 24 }}>
              {error ? `Error: ${error}` : "Unable to load sheet data."}
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

        <main className="page-content">

          {/* ── Hero Banner ───────────────────────────────── */}
          {!moduleSelected && (
            <div style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.08) 50%, rgba(6,182,212,0.06) 100%)",
              border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: "var(--radius-xl)",
              padding: "28px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              animation: "fadeInUp 0.4s ease both",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 24 }}>⚡</span>
                  <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>
                    {projectMeta.projectName}
                  </h1>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px",
                    background: "rgba(34,197,94,0.12)", color: "#22c55e",
                    borderRadius: 20, border: "1px solid rgba(34,197,94,0.2)",
                  }}>ACTIVE</span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  Project progress overview across all modules · Last updated {projectMeta.lastUpdated}
                </p>
              </div>

              {/* Big progress ring-style summary */}
              <div style={{
                display: "flex", alignItems: "center", gap: 20, flexShrink: 0,
                background: "rgba(0,0,0,0.2)", padding: "16px 24px",
                borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, color: "#22c55e", letterSpacing: "-2px" }}>
                    {projectMeta.overallProgress}%
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Overall Complete</div>
                </div>
                <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.08)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Stat label="Total" value={String(projectMeta.totalTasks)} color="var(--text-primary)" />
                  <Stat label="Done"  value={String(projectMeta.completed)} color="#22c55e" />
                  <Stat label="Left"  value={String(projectMeta.pending)} color="#f59e0b" />
                </div>
              </div>
            </div>
          )}

          {/* ── KPI Cards or Overall Summary ─────────────────────────────────── */}
          {moduleSelected ? (
            <OverallSummaryBar moduleData={moduleData} />
          ) : (
            <KpiGrid kpis={topKPIs} />
          )}

          {/* ── Selected Module Details ────────────────────── */}
          <ModuleDetailsPanel />

          {/* ── Main Content Row ──────────────────────────── */}
          <div className="chart-grid">

            {/* Module progress list — main focus */}
            <div className="glass-card fade-in fade-in-2">
              <div className="card-header">
                <div>
                  <p className="section-title">Module Progress</p>
                  <p className="section-subtitle">Feature completion status per module</p>
                </div>
                {/* Legend */}
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

            {/* Right sidebar — donut + top movers */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Summary donut */}
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

              {/* Top performing modules */}
              <div className="glass-card fade-in fade-in-4">
                <div className="card-header">
                  <p className="card-title">Top Performers</p>
                </div>
                <div className="card-body" style={{ paddingTop: 12 }}>
                  <TopPerformers moduleData={moduleData} />
                </div>
              </div>

              {/* Needs attention */}
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

        </main>
      </div>
    </div>
  );
}