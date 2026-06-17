"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import SidebarModuleList from "./SidebarModuleList";
import DeviceTestingSidebarWidget from "./DeviceTestingSidebarWidget";

const NAV_ITEMS = [
  { icon: "🧾", label: "Sales Closing", active: false },
];

const INTEGRATIONS = [
  { icon: "⚙️", label: "Settings",      active: false },
];

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const [modulesOpen, setModulesOpen] = useState(true);
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const moduleSelected = Boolean(params.get("module"));
  const isDeviceTestingPage = pathname === "/device-testing";
  const isSalesPage = pathname === "/sales";
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <aside className={`sidebar${isOpen ? " open" : ""}`}>
      {/* Close button for mobile */}
      <button
        className="sidebar-close-btn"
        onClick={onClose}
        style={{
          display: "none",
          position: "absolute",
          top: 16,
          right: 16,
          width: 32,
          height: 32,
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 18,
          color: "var(--text-secondary)",
          zIndex: 10,
        }}
      >
        ✕
      </button>
      
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
          className={`nav-item${!moduleSelected && !isDeviceTestingPage && !isSalesPage ? " active" : ""}`}
          onClick={() => {
            router.push("/", { scroll: false });
            onClose?.();
          }}
          style={{ justifyContent: "space-between" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="nav-icon">▦</span>
            Dashboard
          </span>
          {!moduleSelected && !isDeviceTestingPage && !isSalesPage && <span style={{ fontSize: 11, opacity: 0.7, color: "var(--accent-blue)" }}>● active</span>}
        </button>

        {NAV_ITEMS.map((item) => (
          <a key={item.label} className={`nav-item${item.label === "Sales Closing" && isSalesPage ? " active" : ""}`} href="#" onClick={(e) => {
            e.preventDefault();
            if (item.label === "Sales Closing") {
              router.push("/sales");
            }
            onClose?.();
          }} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </a>
        ))}
        
        <button
          type="button"
          className={`nav-item${isDeviceTestingPage ? " active" : ""}`}
          onClick={() => {
            router.push("/device-testing", { scroll: false });
            onClose?.();
          }}
          style={{ justifyContent: "space-between" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="nav-icon">🔧</span>
            Device Testing
          </span>
          {isDeviceTestingPage && <span style={{ fontSize: 11, opacity: 0.7, color: "var(--accent-blue)" }}>● active</span>}
        </button>

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
          {modulesOpen && <div style={{ paddingLeft: 6, paddingTop: 4 }}><SidebarModuleList onItemClick={onClose} /></div>}
        </Suspense>



        {/* Integrations */}
        <span className="nav-label" style={{ marginTop: 16 }}>Integrations</span>
        {INTEGRATIONS.map((item) => (
          <a key={item.label} className={`nav-item${item.active ? " active" : ""}`} href="#" onClick={onClose}>
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
