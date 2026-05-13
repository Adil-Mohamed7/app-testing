"use client";

import { useState } from "react";

export default function Topbar({
  onMenuToggle,
  onMenuClick,
  title = "Test Dashboard",
}: {
  onMenuToggle?: () => void;
  onMenuClick?: () => void;
  title?: string;
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onMenuClick || onMenuToggle}
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            cursor: "pointer",
            marginRight: 12,
            fontSize: 18,
          }}
        >
          ☰
        </button>
        <div>
          <h1>{title}</h1>
          <p className="breadcrumb">Overview · All Environments · Last 15 days</p>
        </div>
      </div>

      <div className="topbar-right">
        <div className="live-badge">
          <span className="live-dot" />
          Live
        </div>

        <button id="btn-export" className="topbar-btn">
          <span>↓</span> <span>Export</span>
        </button>
      </div>
    </header>
  );
}
