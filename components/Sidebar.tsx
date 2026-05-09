"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SidebarModuleList from "./SidebarModuleList";

const NAV_ITEMS = [
  { icon: "📊", label: "Reports", active: false },
  { icon: "🔔", label: "Alerts", active: false },
];

const INTEGRATIONS = [
  { icon: "📋", label: "Google Sheets", active: false },
  { icon: "⚙️", label: "Settings",      active: false },
];

export default function Sidebar() {
  const [modulesOpen, setModulesOpen] = useState(true);
  const params = useSearchParams();
  const router = useRouter();
  const moduleSelected = Boolean(params.get("module"));
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">⚡</div>
        <div className="logo-text">
          AppTest
          <span>Dashboard v1.0</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* Main nav */}
        <span className="nav-label">Main</span>
        <button
          type="button"
          className={`nav-item${!moduleSelected ? " active" : ""}`}
          onClick={() => router.push("/", { scroll: false })}
          style={{ justifyContent: "space-between" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="nav-icon">▦</span>
            Dashboard
          </span>
          {!moduleSelected && <span style={{ fontSize: 11, opacity: 0.7, color: "var(--accent-blue)" }}>● active</span>}
        </button>
        {NAV_ITEMS.map((item) => (
          <a key={item.label} className={`nav-item${item.active ? " active" : ""}`} href="#">
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </a>
        ))}

        {/* Modules section */}
        <button
          type="button"
          className="nav-item"
          style={{ marginTop: 16, justifyContent: "space-between", width: "100%" }}
          onClick={() => setModulesOpen((open) => !open)}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="nav-icon">📦</span>
            Modules
          </span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{modulesOpen ? "▾" : "▸"}</span>
        </button>

        <Suspense fallback={
          <div style={{ padding: "8px 0", color: "var(--text-muted)", fontSize: 12 }}>Loading…</div>
        }>
          {modulesOpen && <div style={{ paddingLeft: 6, paddingTop: 4 }}><SidebarModuleList /></div>}
        </Suspense>

        {/* Integrations */}
        <span className="nav-label" style={{ marginTop: 16 }}>Integrations</span>
        {INTEGRATIONS.map((item) => (
          <a key={item.label} className={`nav-item${item.active ? " active" : ""}`} href="#">
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sync-time">
          <span>🕐</span>
          <span>Last sync {timeStr}</span>
        </div>
      </div>
    </aside>
  );
}
