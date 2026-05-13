"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ManagementState from "@/components/ManagementState";
import { DeviceTestingSummary, hasSheetFormulaError, parseDeviceTestingData, DeviceTestingEntry } from "@/lib/sheetData";
import { useCountUp } from "@/lib/useCountUp";
import { SheetDataProvider } from "@/lib/SheetDataContext";

type RoleGroup = {
  role: string;
  total: number;
  entries: DeviceTestingEntry[];
};

type LocationStat = {
  location: string;
  total: number;
  roleGroups: RoleGroup[];
  entries: DeviceTestingEntry[];
};

type RoleDetailGroup = {
  location: string;
  role: string;
  entries: DeviceTestingEntry[];
};

const ROLE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444"];
const TRACKED_ROLES = ["salesman", "driver", "sales executive"];

function isTrackedRole(role: string): boolean {
  const lower = role.toLowerCase();
  return TRACKED_ROLES.some((trackedRole) => lower.includes(trackedRole));
}

function formatRole(role: string): string {
  return role
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function periodSortValue(period: string): number {
  const lower = period.toLowerCase();
  if (lower.includes("previous")) return 0;
  const parsedDate = parseTestingPeriodDate(period);
  if (parsedDate) return parsedDate.getTime();
  return 1;
}

function parseTestingPeriodDate(period: string): Date | null {
  const parts = period.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (parts) {
    const first = Number(parts[1]);
    const second = Number(parts[2]);
    const year = Number(parts[3].length === 2 ? `20${parts[3]}` : parts[3]);
    const day = first > 12 ? first : second > 12 ? second : first;
    const month = first > 12 ? second : second > 12 ? first : second;
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(period);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDefaultTestingPeriod(periods: string[]): string {
  if (periods.length === 0) return "";

  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const datedPeriods = periods
    .map((period, index) => ({ period, index, date: parseTestingPeriodDate(period) }))
    .filter((item): item is { period: string; index: number; date: Date } => Boolean(item.date));

  const previousOrYesterday = datedPeriods
    .filter((item) => startOfDay(item.date).getTime() <= yesterday.getTime())
    .sort((a, b) => b.date.getTime() - a.date.getTime() || b.index - a.index);

  if (previousOrYesterday.length > 0) return previousOrYesterday[0].period;
  if (datedPeriods.length > 0) return datedPeriods.sort((a, b) => a.date.getTime() - b.date.getTime())[0].period;
  return periods[0];
}

function getPeriodTone(period: string): "previous" | "dated" {
  const lower = period.toLowerCase();
  if (lower.includes("previous")) return "previous";
  return "dated";
}

function DeviceKpi({ label, value, accent, caption }: { label: string; value: string | number; accent: string; caption: string }) {
  const numericValue = typeof value === "number" ? value : null;
  const animated = useCountUp(numericValue ?? 0);

  return (
    <div className="device-kpi glass-card">
      <div className="device-kpi-top">
        <span className="device-kpi-dot" style={{ background: accent }} />
        <span>{label}</span>
      </div>
      <div className="device-kpi-value" style={{ color: accent }}>{numericValue === null ? value : animated}</div>
      <div className="device-kpi-caption">{caption}</div>
    </div>
  );
}

function DeviceTestingContent({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const [deviceData, setDeviceData] = useState<DeviceTestingSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedRoleGroup, setSelectedRoleGroup] = useState<RoleDetailGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/sheets")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load device testing data");
        return response.json();
      })
      .then((json) => {
        if (!mounted) return;
        if (hasSheetFormulaError(json.deviceValues || [])) throw new Error("Sheet formula error");
        const parsed = parseDeviceTestingData(json.deviceValues || []);
        const periods = Array.from(new Set(parsed.allEntries.map((entry) => entry.status))).sort((a, b) => periodSortValue(b) - periodSortValue(a));
        setDeviceData(parsed);
        setSelectedPeriod(getDefaultTestingPeriod(periods));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Failed to load device testing data");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const availablePeriods = useMemo(
    () => (deviceData ? Array.from(new Set(deviceData.allEntries.map((entry) => entry.status))).sort((a, b) => periodSortValue(b) - periodSortValue(a)) : []),
    [deviceData],
  );

  const filteredEntries = useMemo(
    () => (deviceData ? deviceData.allEntries.filter((entry) => entry.status === selectedPeriod && isTrackedRole(entry.role)) : []),
    [deviceData, selectedPeriod],
  );

  const totalDevices = useMemo(() => filteredEntries.reduce((sum, entry) => sum + entry.count, 0), [filteredEntries]);

  const locationStats = useMemo<LocationStat[]>(() => {
    const grouped = filteredEntries.reduce((acc, entry) => {
      const locationKey = entry.location || "Unknown Location";
      if (!acc[locationKey]) acc[locationKey] = [];
      acc[locationKey].push(entry);
      return acc;
    }, {} as Record<string, DeviceTestingEntry[]>);

    return Object.entries(grouped)
      .filter(([location]) => !["all branch", "all"].includes(location.toLowerCase()))
      .map(([location, entries]) => {
        const roleGroups = Object.entries(
          entries.reduce((acc, entry) => {
            const roleKey = entry.role || "Unassigned Role";
            if (!acc[roleKey]) acc[roleKey] = [];
            acc[roleKey].push(entry);
            return acc;
          }, {} as Record<string, DeviceTestingEntry[]>),
        )
          .map(([role, roleEntries]) => ({
            role,
            total: roleEntries.reduce((sum, entry) => sum + entry.count, 0),
            entries: roleEntries,
          }))
          .sort((a, b) => b.total - a.total || a.role.localeCompare(b.role));

        return {
          location,
          entries,
          roleGroups,
          total: roleGroups.reduce((sum, group) => sum + group.total, 0),
        };
      })
      .filter((stat) => stat.total > 0)
      .sort((a, b) => b.total - a.total || a.location.localeCompare(b.location));
  }, [filteredEntries]);

  const roleChartData = useMemo(() => {
    const byRole = filteredEntries.reduce((acc, entry) => {
      const role = formatRole(entry.role || "Unassigned Role");
      acc[role] = (acc[role] || 0) + entry.count;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byRole)
      .map(([name, value], index) => ({ name, value, color: ROLE_COLORS[index % ROLE_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [filteredEntries]);

  const branchChartData = useMemo(
    () => locationStats.slice(0, 8).map((stat) => ({ name: stat.location, value: stat.total })),
    [locationStats],
  );

  const totalPersonnel = useMemo(() => {
    const names = new Set<string>();
    filteredEntries.forEach((entry) => {
      entry.names
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name && !["-", "NA"].includes(name.toUpperCase()))
        .forEach((name) => names.add(name));
    });
    return names.size;
  }, [filteredEntries]);

  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Device Testing" />
          <main className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(59,130,246,0.08)" }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#3b82f6", animation: "spin 0.9s linear infinite" }} />
                <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#8b5cf6", animation: "spin 1.3s linear infinite reverse" }} />
                <div style={{ position: "absolute", inset: 20, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#06b6d4", animation: "spin 1.7s linear infinite" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>DT</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Loading device testing data</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Fetching from Google Sheets...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !deviceData || deviceData.allEntries.length === 0) {
    return (
      <div className="app-shell">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Device Testing" />
          <main className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
            <ManagementState />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Device Testing" />
        <main className="page-content">
          <section className="device-hero">
            <div>
              <div className="device-hero-title-row">
                <h1>Device Testing</h1>
                <span className={`device-period-pill ${getPeriodTone(selectedPeriod)}`}>{selectedPeriod || "No period"}</span>
              </div>
              <p>Total overview of device testing coverage across branches, roles, devices, and assigned personnel.</p>
            </div>
            <div className="device-period-control">
              <label htmlFor="device-period">Testing Period</label>
              <select id="device-period" value={selectedPeriod} onChange={(event) => setSelectedPeriod(event.target.value)}>
                {availablePeriods.map((period) => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="device-kpi-grid">
            <DeviceKpi label="Devices Under Testing" value={totalDevices} accent="#3b82f6" caption={selectedPeriod || "Selected testing period"} />
            <DeviceKpi label="Branches Covered" value={locationStats.length} accent="#22c55e" caption="Tracked branch locations" />
            <DeviceKpi label="Testing Roles" value={roleChartData.length} accent="#f59e0b" caption="Sales, driver, and executive roles" />
            <DeviceKpi label="Personnel Covered" value={totalPersonnel} accent="#06b6d4" caption="Unique assigned team members" />
          </section>

          <section className="device-dashboard-grid">
            <div className="glass-card device-role-card">
              <div className="card-header">
                <div>
                  <p className="section-title">Role Coverage Overview</p>
                  <p className="section-subtitle">Device testing records by role</p>
                </div>
              </div>
              <div className="card-body">
                <div className="device-donut-wrap">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={roleChartData.length ? roleChartData : [{ name: "No data", value: 1, color: "#334155" }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={96}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {(roleChartData.length ? roleChartData : [{ name: "No data", value: 1, color: "#334155" }]).map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<DeviceTooltip suffix="devices" />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="device-donut-center">
                    <strong>{totalDevices}</strong>
                    <span>devices</span>
                  </div>
                </div>
                <div className="device-legend-grid">
                  {roleChartData.map((item) => (
                    <div className="device-legend-item" key={item.name}>
                      <span className="device-legend-dot" style={{ background: item.color }} />
                      <span>{item.name}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card device-branch-chart-card">
              <div className="card-header">
                <div>
                  <p className="section-title">Branch Device Coverage</p>
                  <p className="section-subtitle">Top branches by devices under testing</p>
                </div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={305}>
                  <BarChart data={branchChartData} margin={{ top: 8, right: 10, left: -18, bottom: 54 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={74} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<DeviceTooltip suffix="devices" />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="glass-card device-table-card">
            <div className="card-header">
              <div>
                <p className="section-title">Branch Testing Summary</p>
                <p className="section-subtitle">Click a role to review device IDs, personnel, and testing period details</p>
              </div>
            </div>
            <div className="card-body">
              <div className="device-table-wrap">
                <table className="status-table device-table">
                  <thead>
                    <tr>
                      <th>Branch</th>
                      <th>Total Devices</th>
                      <th>Role Coverage</th>
                      <th>Role Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationStats.map((stat) => (
                      <tr key={stat.location}>
                        <td>
                          <div className="test-name">{stat.location}</div>
                          <div className="test-suite">{stat.roleGroups.length} testing role{stat.roleGroups.length === 1 ? "" : "s"}</div>
                        </td>
                        <td>
                          <span className="device-total-pill">{stat.total}</span>
                        </td>
                        <td>
                          <div className="device-role-bars">
                            {stat.roleGroups.map((group, index) => (
                              <div key={group.role}>
                                <div className="device-role-bar-label">
                                  <span>{formatRole(group.role)}</span>
                                  <strong>{group.total}</strong>
                                </div>
                                <div className="progress-bar-wrap">
                                  <div
                                    className="progress-bar-fill"
                                    style={{ width: `${stat.total ? Math.round((group.total / stat.total) * 100) : 0}%`, background: ROLE_COLORS[index % ROLE_COLORS.length] }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="device-role-actions">
                            {stat.roleGroups.map((group) => (
                              <button
                                key={group.role}
                                className="device-detail-button"
                                type="button"
                                onClick={() => setSelectedRoleGroup({ location: stat.location, role: group.role, entries: group.entries })}
                              >
                                <span>{formatRole(group.role)}</span>
                                <strong>{group.total}</strong>
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {locationStats.length === 0 && (
                      <tr>
                        <td colSpan={4}>
                          <div className="device-empty-state">No device testing records found for this testing period.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="device-scope-card glass-card">
            <div className="card-header">
              <div>
                <p className="section-title">Testing Scope Note</p>
                <p className="section-subtitle">Modules outside device-based field testing</p>
              </div>
            </div>
            <div className="card-body">
              <div className="device-scope-grid">
                {[
                  "Store Manager",
                  "Store Operator",
                  "Admin",
                  "Customer Care",
                  "Cashier",
                  "Head Cashier",
                  "Branch Manager",
                  "Service Technician",
                ].map((module) => (
                  <span key={module}>{module}</span>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>

      {selectedRoleGroup && (
        <RoleDetailModal
          group={selectedRoleGroup}
          onClose={() => setSelectedRoleGroup(null)}
        />
      )}
    </div>
  );
}

function DeviceTooltip({ active, payload, suffix }: { active?: boolean; payload?: Array<{ payload: { name: string; color?: string; value: number } }>; suffix: string }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="device-chart-tooltip">
      <strong style={{ color: item.color || "#93c5fd" }}>{item.name}</strong>
      <span>{item.value} {suffix}</span>
    </div>
  );
}

function RoleDetailModal({
  group,
  onClose,
}: {
  group: RoleDetailGroup;
  onClose: () => void;
}) {
  const totalDevices = group.entries.reduce((sum, entry) => sum + entry.count, 0);
  const personnel = Array.from(
    new Set(
      group.entries.flatMap((entry) =>
        entry.names
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name && !["-", "NA"].includes(name.toUpperCase())),
      ),
    ),
  );

  return (
    <div className="device-modal-overlay" onClick={onClose}>
      <div className="device-modal glass-card" onClick={(event) => event.stopPropagation()}>
        <div className="device-modal-header">
          <div>
            <div className="device-modal-eyebrow">{group.location}</div>
            <h2>{formatRole(group.role)}</h2>
            <p>Device testing detail for the selected branch and role.</p>
          </div>
          <button type="button" className="device-modal-close" onClick={onClose} aria-label="Close role details">x</button>
        </div>

        <div className="device-modal-kpis">
          <div>
            <span>Total Devices</span>
            <strong>{totalDevices}</strong>
          </div>
          <div>
            <span>Testing Records</span>
            <strong>{group.entries.length}</strong>
          </div>
          <div>
            <span>Personnel</span>
            <strong>{personnel.length}</strong>
          </div>
        </div>

        {personnel.length > 0 && (
          <div className="device-modal-section">
            <div className="device-modal-section-title">Assigned Personnel</div>
            <div className="device-personnel-list">
              {personnel.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
        )}

        <div className="device-modal-section">
          <div className="device-modal-section-title">Testing Records</div>
          <div className="device-modal-table-wrap">
            <table className="status-table device-modal-table">
              <thead>
                <tr>
                  <th>Testing Period</th>
                  <th>Devices</th>
                  <th>Device / Route ID</th>
                  <th>Personnel</th>
                </tr>
              </thead>
              <tbody>
                {group.entries.map((entry, index) => (
                  <tr key={`${entry.status}-${entry.deviceId}-${index}`}>
                    <td>
                      <span className={`device-period-pill ${getPeriodTone(entry.status)}`}>{entry.status}</span>
                    </td>
                    <td className="sales-good-cell">{entry.count}</td>
                    <td className="mono">{entry.deviceId && !["-", "NA"].includes(entry.deviceId.toUpperCase()) ? entry.deviceId : "-"}</td>
                    <td>{entry.names && !["-", "NA"].includes(entry.names.toUpperCase()) ? entry.names : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeviceTestingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SheetDataProvider>
      <DeviceTestingContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
    </SheetDataProvider>
  );
}
