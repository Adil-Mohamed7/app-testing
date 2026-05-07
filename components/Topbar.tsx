"use client";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>Test Dashboard</h1>
        <p className="breadcrumb">Overview · All Environments · Last 15 days</p>
      </div>

      <div className="topbar-right">
        <div className="live-badge">
          <span className="live-dot" />
          Live
        </div>

        <button id="btn-filter" className="topbar-btn">
          <span>⚙</span> Filters
        </button>

        <button id="btn-export" className="topbar-btn">
          <span>↓</span> Export
        </button>

        <button id="btn-run" className="topbar-btn primary">
          <span>▶</span> Run Suite
        </button>
      </div>
    </header>
  );
}
