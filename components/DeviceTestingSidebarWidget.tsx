"use client";

import { useEffect, useState } from "react";
import { DeviceTestingSummary, parseDeviceTestingData } from "@/lib/sheetData";

export default function DeviceTestingSidebarWidget() {
  const [summary, setSummary] = useState<DeviceTestingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/sheets");
        const json = await response.json();
        const parsed = parseDeviceTestingData(json.deviceValues || []);
        setSummary(parsed);
      } catch (error) {
        console.error("Failed to fetch device testing summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "12px",
          background: "var(--bg-secondary)",
          borderRadius: "6px",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div
      style={{
        padding: "16px",
        background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))",
        border: "1px solid rgba(102, 126, 234, 0.2)",
        borderRadius: "8px",
        marginTop: "12px",
      }}
    >
      <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary)" }}>
        🔧 Device Testing
      </div>
      <div style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px", color: "var(--accent-blue)" }}>
        {summary.totalDevices}
      </div>
      <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
        <div>📍 {Object.keys(summary.byLocation).length} locations</div>
        <div>📅 {Object.keys(summary.byStatus).length} date ranges</div>
        <div>👥 {new Set(summary.allEntries.map((e) => e.role)).size} roles</div>
      </div>
    </div>
  );
}
