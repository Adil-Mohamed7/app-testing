"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
import { hasSheetFormulaError, parseMasterBranchwiseData, SalesSummary } from "@/lib/sheetData";
import { SheetDataProvider } from "@/lib/SheetDataContext";

type CategoryKey =
  | "completed"
  | "dnu"
  | "ups"
  | "notDone"
  | "entryMistake"
  | "incomplete"
  | "absent"
  | "vacation"
  | "alAin"
  | "other";

type CategoryCountMap = Record<CategoryKey, number>;

type ExecutiveRow = CategoryCountMap & {
  executive: string;
  total: number;
  issueTotal: number;
  completionRate: number;
  latest?: string;
};

type SalesEntry = SalesSummary["entries"][number];

type BranchSummary = {
  key: string;
  label: string;
  totalItems: number;
  completedItems: number;
  totalRoutes: number;
  completedRoutes: number;
  totalExecutives: number;
  completedExecutives: number;
  entryMistakes: number;
  completionRate: number;
};

const CATEGORY_META: Record<CategoryKey, { label: string; short: string; color: string; tone: string }> = {
  completed: { label: "Completed", short: "Done", color: "#22c55e", tone: "green" },
  dnu: { label: "Data Not Updated", short: "Data Not Updated", color: "#ef4444", tone: "red" },
  ups: { label: "Update Pending From Spinecodes", short: "Update Pending", color: "#06b6d4", tone: "cyan" },
  notDone: { label: "Not Done", short: "Not Done", color: "#f59e0b", tone: "amber" },
  entryMistake: { label: "Entry Mistakes", short: "Mistakes", color: "#8b5cf6", tone: "violet" },
  incomplete: { label: "Incomplete", short: "INC", color: "#f97316", tone: "orange" },
  absent: { label: "Absent", short: "Absent", color: "#64748b", tone: "slate" },
  vacation: { label: "Vacation", short: "Vacation", color: "#14b8a6", tone: "teal" },
  alAin: { label: "Al Ain", short: "Al Ain", color: "#38bdf8", tone: "blue" },
  other: { label: "Other", short: "Other", color: "#94a3b8", tone: "muted" },
};

const CATEGORY_ORDER: CategoryKey[] = [
  "completed",
  "dnu",
  "ups",
  "notDone",
  "entryMistake",
  "incomplete",
  "absent",
  "vacation",
  "alAin",
  "other",
];

const emptyCategoryCounts = (): CategoryCountMap =>
  CATEGORY_ORDER.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as CategoryCountMap);

function formatName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeBranchKey(branch: string): string {
  const normalized = String(branch || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  if (!normalized) return "";
  if (normalized.includes("abudhabi") || normalized === "auh") return "abu-dhabi";
  if (normalized.includes("dubai") || normalized === "dxb") return "dubai";
  if (normalized.includes("alain")) return "al-ain";
  if (normalized.includes("sharjah") || normalized.includes("sharja")) return "sharjah";
  if (normalized.includes("fujairah") || normalized.includes("fujariah") || normalized.includes("fujeirah")) return "fujairah";
  if (normalized.includes("ajman")) return "ajman";
  if (normalized.includes("rak") || normalized.includes("rasalkhaimah")) return "ras-al-khaimah";
  if (normalized.includes("uaq") || normalized.includes("ummalquwain")) return "umm-al-quwain";
  return normalized;
}

function formatBranchLabel(branch: string): string {
  const key = normalizeBranchKey(branch);
  const labels: Record<string, string> = {
    "abu-dhabi": "Abu Dhabi",
    dubai: "Dubai",
    "al-ain": "Al Ain",
    sharjah: "Sharjah",
    fujairah: "Fujairah",
    ajman: "Ajman",
    "ras-al-khaimah": "Ras Al Khaimah",
    "umm-al-quwain": "Umm Al Quwain",
  };

  return labels[key] || formatName(branch);
}

function categorizeStatus(raw: string): CategoryKey {
  const status = String(raw || "").trim();
  const s = status.toLowerCase();

  if (!s) return "other";
  if (/\bdnu\b|data not updated|not updated/.test(s)) return "dnu";
  if (/\bups\b|\bup\b|update pending|updated pending/.test(s)) return "ups";
  if (/\bnot done\b|notdone/.test(s)) return "notDone";
  if (/\bem\b|entry mistake|entrymistake/.test(s)) return "entryMistake";
  if (/\binc\b|incomplete/.test(s)) return "incomplete";
  if (/absent/.test(s)) return "absent";
  if (/vacation|leave/.test(s)) return "vacation";
  if (/^completed?$|^\bdone\b$/.test(s)) return "completed";
  if (/al ain|alain/.test(s)) return "alAin";
  return "other";
}

function isSalesExecutiveModule(moduleName: string): boolean {
  const normalized = String(moduleName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  return normalized === "salesexecutive" || normalized === "salesexecutives";
}

function buildCategoryCountsFromEntries(entries: SalesEntry[], selectedDate: string | null): CategoryCountMap {
  const counts = emptyCategoryCounts();
  if (!selectedDate) return counts;

  for (const entry of entries) {
    const raw = entry.statusesByDate[selectedDate];
    if (!raw) continue;
    counts[categorizeStatus(raw)] += 1;
  }

  return counts;
}

function summarizeBranch(entries: SalesEntry[], selectedDate: string | null, key: string, label: string): BranchSummary {
  const counts = buildCategoryCountsFromEntries(entries, selectedDate);
  const countableEntries = entries.filter((entry) => entry.module || entry.executive);
  const executiveEntries = countableEntries.filter((entry) => isSalesExecutiveModule(entry.module));
  const routeEntries = countableEntries.filter((entry) => !isSalesExecutiveModule(entry.module));
  const isCompletedForDate = (entry: SalesEntry) =>
    selectedDate ? categorizeStatus(entry.statusesByDate[selectedDate]) === "completed" : false;
  const completedRoutes = routeEntries.filter(isCompletedForDate).length;
  const completedExecutives = executiveEntries.filter(isCompletedForDate).length;
  const totalItems = routeEntries.length + executiveEntries.length;
  const completedItems = completedRoutes + completedExecutives;

  return {
    key,
    label,
    totalItems,
    completedItems,
    totalRoutes: routeEntries.length,
    completedRoutes,
    totalExecutives: executiveEntries.length,
    completedExecutives,
    entryMistakes: counts.entryMistake,
    completionRate: totalItems ? Math.round((completedItems / totalItems) * 100) : 0,
  };
}

function parseSheetDate(dateLabel: string): Date | null {
  const raw = String(dateLabel || "").trim();
  if (!raw) return null;

  const parts = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (parts) {
    const first = Number(parts[1]);
    const second = Number(parts[2]);
    const year = Number(parts[3].length === 2 ? `20${parts[3]}` : parts[3]);
    const day = first > 12 ? first : second > 12 ? second : first;
    const month = first > 12 ? second : second > 12 ? first : second;
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toInputDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayInputDate(): string {
  return toInputDateValue(new Date());
}

function findSheetDateLabel(dates: string[], inputDate: string): string | null {
  if (!inputDate) return null;
  const selected = new Date(`${inputDate}T00:00:00`);
  if (Number.isNaN(selected.getTime())) return null;
  const selectedTime = startOfDay(selected).getTime();

  return dates.find((label) => {
    const parsed = parseSheetDate(label);
    return parsed ? startOfDay(parsed).getTime() === selectedTime : false;
  }) || null;
}

function getLatestSheetDateLabel(dates: string[]): string | null {
  const parsedDates = dates
    .map((label, index) => ({ label, index, date: parseSheetDate(label) }))
    .filter((item): item is { label: string; index: number; date: Date } => Boolean(item.date))
    .sort((a, b) => b.date.getTime() - a.date.getTime() || b.index - a.index);

  return parsedDates[0]?.label || dates[dates.length - 1] || null;
}

function formatInputDateForDisplay(inputDate: string): string {
  if (!inputDate) return "selected date";
  const parsed = new Date(`${inputDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return inputDate;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function summarizeRow(executive: string, counts: CategoryCountMap, latest?: string): ExecutiveRow {
  const total = CATEGORY_ORDER.reduce((sum, key) => sum + counts[key], 0);
  const issueTotal = counts.dnu + counts.notDone + counts.entryMistake + counts.incomplete;
  return {
    executive,
    ...counts,
    total,
    issueTotal,
    completionRate: total ? Math.round((counts.completed / total) * 100) : 0,
    latest,
  };
}

function rankExecutiveRows(rows: ExecutiveRow[], category: CategoryKey, mode: "most" | "least"): ExecutiveRow[] {
  return [...rows]
    .filter((row) => row.total > 0 && (mode === "least" || row[category] > 0))
    .sort((a, b) => {
      const diff = mode === "most" ? b[category] - a[category] : a[category] - b[category];
      return diff || b.total - a.total || a.executive.localeCompare(b.executive);
    });
}

function SalesKpi({ label, value, accent, caption }: { label: string; value: string | number; accent: string; caption: string }) {
  return (
    <div className="sales-kpi glass-card">
      <div className="sales-kpi-top">
        <span className="sales-kpi-dot" style={{ background: accent }} />
        <span>{label}</span>
      </div>
      <div className="sales-kpi-value" style={{ color: accent }}>{value}</div>
      <div className="sales-kpi-caption">{caption}</div>
    </div>
  );
}

type RankingGroup = {
  value: number;
  rows: ExecutiveRow[];
};

function groupRankedRows(rows: ExecutiveRow[], metric: CategoryKey): RankingGroup[] {
  const groups: RankingGroup[] = [];

  for (const row of rows) {
    const value = Number(row[metric]);
    const latestGroup = groups[groups.length - 1];
    if (latestGroup && latestGroup.value === value) {
      latestGroup.rows.push(row);
    } else {
      groups.push({ value, rows: [row] });
    }
  }

  return groups;
}

function RankingList({ rows, metric, emptyText }: { rows: ExecutiveRow[]; metric: CategoryKey; emptyText: string }) {
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandedValues, setExpandedValues] = useState<Set<number>>(() => new Set());
  const groups = useMemo(() => groupRankedRows(rows, metric), [rows, metric]);
  const visibleGroups = groups.slice(0, visibleCount);
  const maxValue = Math.max(...groups.map((group) => group.value), 1);

  function toggleGroup(value: number) {
    setExpandedValues((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  return (
    <div className="sales-ranking-list">
      {groups.length > 0 ? (
        <>
          {visibleGroups.map((group, index) => {
            const isExpanded = expandedValues.has(group.value) || group.rows.length === 1;
            const primaryRow = group.rows[0];
            const barValue = Math.round((group.value / maxValue) * 100);
            return (
              <div className="sales-ranking-row" key={`${metric}-${group.value}`}>
                <div className="sales-rank-number">{index + 1}</div>
                <div className="sales-rank-main">
                  <button
                    className="sales-rank-label"
                    type="button"
                    onClick={() => group.rows.length > 1 && toggleGroup(group.value)}
                  >
                    <span>
                      {group.rows.length === 1
                        ? formatName(primaryRow.executive)
                        : isExpanded
                          ? `${group.rows.length} tied`
                          : `${formatName(primaryRow.executive)} +${group.rows.length - 1}`}
                    </span>
                    <strong>{group.value}</strong>
                  </button>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{ width: `${barValue}%`, background: CATEGORY_META[metric].color }} />
                  </div>
                  {group.rows.length > 1 && isExpanded && (
                    <div className="sales-rank-expanded">
                      {group.rows.map((row) => (
                        <span key={row.executive}>{formatName(row.executive)}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {visibleCount < groups.length && (
            <button className="sales-view-more-btn" type="button" onClick={() => setVisibleCount((count) => count + 10)}>
              View more
            </button>
          )}
        </>
      ) : (
        <div className="sales-empty-state">{emptyText}</div>
      )}
    </div>
  );
}

function SalesContent({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) {
  const [data, setData] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateInput, setSelectedDateInput] = useState(getTodayInputDate);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [rankingCategory, setRankingCategory] = useState<CategoryKey>("completed");
  const [rankingMode, setRankingMode] = useState<"most" | "least">("most");

  useEffect(() => {
    let mounted = true;
    fetch("/api/sheets")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load sales data");
        return response.json();
      })
      .then((json) => {
        if (!mounted) return;
        if (hasSheetFormulaError(json.masterValues || [])) throw new Error("Sheet formula error");
        const parsed = parseMasterBranchwiseData(json.masterValues || []);
        setData(parsed);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Failed to load sales data");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const branchOptions = useMemo(() => {
    if (!data) return [];
    const options = new Map<string, { label: string; order: number }>();
    for (const entry of data.entries) {
      const key = normalizeBranchKey(entry.region);
      if (!key || key === "all") continue;
      if (!options.has(key)) options.set(key, { label: formatBranchLabel(entry.region), order: options.size });
    }
    return Array.from(options.entries())
      .map(([key, option]) => ({ key, label: option.label, order: option.order }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data]);

  const selectedSheetDate = useMemo(
    () => (data ? findSheetDateLabel(data.dates, selectedDateInput) : null),
    [data, selectedDateInput],
  );
  const selectedDateDisplay = useMemo(() => formatInputDateForDisplay(selectedDateInput), [selectedDateInput]);
  const latestSheetDate = useMemo(() => (data ? getLatestSheetDateLabel(data.dates) : null), [data]);
  const hasSelectedDateData = Boolean(selectedSheetDate);

  const scopedEntries = useMemo(() => {
    if (!data) return [];
    if (selectedBranch === "all") return data.entries;
    return data.entries.filter((entry) => normalizeBranchKey(entry.region) === selectedBranch);
  }, [data, selectedBranch]);

  const selectedBranchLabel = useMemo(() => {
    if (selectedBranch === "all") return "All Branches";
    return branchOptions.find((branch) => branch.key === selectedBranch)?.label || "Selected Branch";
  }, [branchOptions, selectedBranch]);

  const branchSummaries = useMemo(() => {
    if (!data) return [];
    const allSummary = summarizeBranch(data.entries, selectedSheetDate, "all", "All Branches");
    const perBranch = branchOptions.map((branch) =>
      summarizeBranch(
        data.entries.filter((entry) => normalizeBranchKey(entry.region) === branch.key),
        selectedSheetDate,
        branch.key,
        branch.label,
      ),
    );
    return [allSummary, ...perBranch];
  }, [branchOptions, data, selectedSheetDate]);

  const categoryCounts = useMemo(() => buildCategoryCountsFromEntries(scopedEntries, selectedSheetDate), [scopedEntries, selectedSheetDate]);
  const totalForSelected = useMemo(() => CATEGORY_ORDER.reduce((sum, key) => sum + categoryCounts[key], 0), [categoryCounts]);

  const categoryChartData = useMemo(
    () =>
      CATEGORY_ORDER.map((key) => ({
        key,
        name: CATEGORY_META[key].label,
        value: categoryCounts[key],
        color: CATEGORY_META[key].color,
      })).filter((item) => item.value > 0),
    [categoryCounts],
  );

  const executiveRows = useMemo<ExecutiveRow[]>(() => {
    if (!data || !selectedSheetDate) return [];
    const grouped = new Map<string, CategoryCountMap>();
    const latest = new Map<string, string>();

    for (const entry of scopedEntries) {
      const raw = entry.statusesByDate[selectedSheetDate];
      if (!raw) continue;
      if (!entry.executive) continue;
      const current = grouped.get(entry.executive) || emptyCategoryCounts();
      current[categorizeStatus(raw)] += 1;
      grouped.set(entry.executive, current);
      latest.set(entry.executive, raw);
    }

    return Array.from(grouped.entries())
      .map(([executive, counts]) => summarizeRow(executive, counts, latest.get(executive)))
      .sort((a, b) => b.completed - a.completed || b.completionRate - a.completionRate || a.executive.localeCompare(b.executive));
  }, [data, scopedEntries, selectedSheetDate]);

  const defaultCutoffDate = useMemo(() => selectedSheetDate || latestSheetDate, [latestSheetDate, selectedSheetDate]);

  const combinedRows = useMemo<ExecutiveRow[]>(() => {
    if (!data) return [];
    const cutoff = defaultCutoffDate ? parseSheetDate(defaultCutoffDate) : null;
    const grouped = new Map<string, CategoryCountMap>();
    const latest = new Map<string, string>();

    for (const entry of scopedEntries) {
      for (const date of data.dates) {
        const parsedDate = parseSheetDate(date);
        if (cutoff && parsedDate && startOfDay(parsedDate).getTime() > startOfDay(cutoff).getTime()) continue;

        const raw = entry.statusesByDate[date];
        if (!raw) continue;
        if (!entry.executive) continue;

        const current = grouped.get(entry.executive) || emptyCategoryCounts();
        current[categorizeStatus(raw)] += 1;
        grouped.set(entry.executive, current);
        latest.set(entry.executive, raw);
      }
    }

    return Array.from(grouped.entries())
      .map(([executive, counts]) => summarizeRow(executive, counts, latest.get(executive)))
      .sort((a, b) => b.completed - a.completed || b.completionRate - a.completionRate || a.executive.localeCompare(b.executive));
  }, [data, defaultCutoffDate, scopedEntries]);

  const selectedRankedRows = useMemo(() => rankExecutiveRows(executiveRows, rankingCategory, rankingMode), [executiveRows, rankingCategory, rankingMode]);
  const combinedRankedRows = useMemo(() => rankExecutiveRows(combinedRows, rankingCategory, rankingMode), [combinedRows, rankingCategory, rankingMode]);

  const completionRate = totalForSelected ? Math.round((categoryCounts.completed / totalForSelected) * 100) : 0;
  const selectedBranchSummary = branchSummaries.find((branch) => branch.key === selectedBranch) || branchSummaries[0];

  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Sales Closing" />
          <main className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(59,130,246,0.08)" }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#3b82f6", animation: "spin 0.9s linear infinite" }} />
                <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#8b5cf6", animation: "spin 1.3s linear infinite reverse" }} />
                <div style={{ position: "absolute", inset: 20, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#06b6d4", animation: "spin 1.7s linear infinite" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>SC</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Loading sales data</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Fetching from Google Sheets...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !data || data.dates.length === 0 || data.entries.length === 0) {
    return (
      <div className="app-shell">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Sales Closing" />
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
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} title="Sales Closing" />
        <main className="page-content">
          <section className="sales-hero">
            <div>
              <div className="sales-hero-title-row">
                <h1>Sales Closing</h1>
                <span className="sales-live-pill">Branchwise</span>
              </div>
              <p>Total overview of sales closing testing progress from the master branchwise sheet.</p>
            </div>
            <div className="sales-date-control">
              <label htmlFor="sales-date">Date</label>
              <input
                id="sales-date"
                type="date"
                value={selectedDateInput}
                onChange={(event) => setSelectedDateInput(event.target.value)}
              />
              <span>{selectedSheetDate ? `Sheet date: ${selectedSheetDate}` : "No sheet column for this date"}</span>
            </div>
          </section>

          {!hasSelectedDateData && (
            <section className="sales-no-data-card glass-card">
              <div>
                <span className="sales-no-data-icon">!</span>
              </div>
              <div>
                <p className="section-title">Data not available for {selectedDateDisplay}</p>
                <p className="section-subtitle">
                  This date is not available in the Master Sheet. Please choose a date that exists in the sheet{latestSheetDate ? `, or check the latest sheet date: ${latestSheetDate}.` : "."}
                </p>
              </div>
            </section>
          )}

          <section className="sales-branch-filter-card glass-card">
            <div className="card-header">
              <div>
                <p className="section-title">Branchwise Results</p>
                <p className="section-subtitle">Select a branch to update the route and executive cards below</p>
              </div>
            </div>
            <div className="card-body">
              <div className="sales-branch-filter-grid">
                {branchSummaries.map((branch) => (
                  <button
                    className={`sales-branch-filter ${selectedBranch === branch.key ? "active" : ""}`}
                    key={branch.key}
                    onClick={() => setSelectedBranch(branch.key)}
                    type="button"
                  >
                    <span>{branch.label}</span>
                    <strong>{branch.totalItems}</strong>
                    <div className="sales-branch-card-footer">
                      <em>{branch.completedItems} completed</em>
                      <b>{branch.completionRate}%</b>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="sales-kpi-grid">
            <SalesKpi label="Routes Completed" value={`${selectedBranchSummary?.completedRoutes || 0}/${selectedBranchSummary?.totalRoutes || 0}`} accent="#22c55e" caption={`${selectedBranchLabel} · ${selectedDateDisplay}`} />
            <SalesKpi label="Executives Completed" value={`${selectedBranchSummary?.completedExecutives || 0}/${selectedBranchSummary?.totalExecutives || 0}`} accent="#06b6d4" caption="Completed executives in branch" />
            <SalesKpi label="Entry Mistakes" value={categoryCounts.entryMistake} accent="#8b5cf6" caption="Selected date mistakes" />
            <SalesKpi label="Completed" value={categoryCounts.completed} accent="#3b82f6" caption={`${completionRate}% completion rate`} />
          </section>

          <section className="sales-dashboard-grid">
            <div className="glass-card sales-breakdown-card">
              <div className="card-header">
                <div>
                  <p className="section-title">Testing Status Overview</p>
                  <p className="section-subtitle">Management view for {selectedBranchLabel}</p>
                </div>
              </div>
              <div className="card-body">
                <div className="sales-donut-wrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={categoryChartData.length ? categoryChartData : [{ name: "No data", value: 1, color: "#334155" }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={72}
                        outerRadius={102}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {(categoryChartData.length ? categoryChartData : [{ name: "No data", value: 1, color: "#334155" }]).map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const item = payload[0].payload;
                          return (
                            <div className="sales-chart-tooltip">
                              <strong style={{ color: item.color }}>{item.name}</strong>
                              <span>{item.value} test records</span>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="sales-donut-center">
                    <strong>{totalForSelected}</strong>
                    <span>test records</span>
                  </div>
                </div>
                <div className="sales-legend-grid">
                  {CATEGORY_ORDER.filter((key) => categoryCounts[key] > 0 || ["completed", "dnu", "ups", "entryMistake"].includes(key)).map((key) => {
                    const pct = totalForSelected ? Math.round((categoryCounts[key] / totalForSelected) * 100) : 0;
                    return (
                      <div className="sales-legend-item" key={key}>
                        <span className="sales-legend-dot" style={{ background: CATEGORY_META[key].color }} />
                        <span>{CATEGORY_META[key].label}</span>
                        <strong>{categoryCounts[key]}</strong>
                        <em>{pct}%</em>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="glass-card sales-category-card">
              <div className="card-header">
                <div>
                  <p className="section-title">Testing Category Volume</p>
                  <p className="section-subtitle">Compare category counts for {selectedBranchLabel}</p>
                </div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryChartData} margin={{ top: 8, right: 6, left: -18, bottom: 16 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={54} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div className="sales-chart-tooltip">
                            <strong style={{ color: item.color }}>{item.name}</strong>
                            <span>{item.value} test records</span>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {categoryChartData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card sales-ranking-card">
              <div className="card-header sales-ranking-header">
                <div>
                  <p className="section-title">Executive Testing Rankings</p>
                  <p className="section-subtitle">Best completed rankings update with the selected branch</p>
                </div>
                <div className="sales-ranking-controls">
                  <select value={rankingCategory} onChange={(event) => setRankingCategory(event.target.value as CategoryKey)}>
                    {CATEGORY_ORDER.map((key) => (
                      <option key={key} value={key}>{CATEGORY_META[key].label}</option>
                    ))}
                  </select>
                  <div className="sales-segmented">
                    <button className={rankingMode === "most" ? "active" : ""} onClick={() => setRankingMode("most")} type="button">Most</button>
                    <button className={rankingMode === "least" ? "active" : ""} onClick={() => setRankingMode("least")} type="button">Least</button>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="sales-ranking-split">
                  <div>
                    <div className="sales-ranking-scope">
                      <span>Daily Performance</span>
                      <strong>{selectedBranchLabel} · {selectedDateDisplay}</strong>
                    </div>
                    <RankingList
                      key={`daily-${selectedBranch}-${selectedSheetDate}-${rankingCategory}-${rankingMode}`}
                      rows={selectedRankedRows}
                      metric={rankingCategory}
                      emptyText={hasSelectedDateData ? "No executives found for this date." : "Data not available for this selected date."}
                    />
                  </div>
                  <div>
                    <div className="sales-ranking-scope">
                      <span>Overall Progress</span>
                      <strong>{selectedBranchLabel} · Through {defaultCutoffDate || "-"}</strong>
                    </div>
                    <RankingList
                      key={`overall-${selectedBranch}-${defaultCutoffDate}-${rankingCategory}-${rankingMode}`}
                      rows={combinedRankedRows}
                      metric={rankingCategory}
                      emptyText="No overall ranking available."
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card sales-table-card">
            <div className="card-header">
              <div>
                <p className="section-title">Executive Testing Summary</p>
                <p className="section-subtitle">Selected date testing counts by category for {selectedBranchLabel}</p>
              </div>
            </div>
            <div className="card-body">
              <div className="sales-table-wrap">
                <table className="status-table sales-table">
                  <thead>
                    <tr>
                      <th>Executive</th>
                      <th>Total</th>
                      <th>Done</th>
                      <th>Data Not Updated</th>
                      <th>Update Pending</th>
                      <th>Not Done</th>
                      <th>Mistakes</th>
                      <th>INC</th>
                      <th>Rate</th>
                      <th>Latest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executiveRows.map((row) => (
                      <tr key={row.executive}>
                        <td>
                          <div className="test-name">{formatName(row.executive)}</div>
                        </td>
                        <td>{row.total}</td>
                        <td className="sales-good-cell">{row.completed}</td>
                        <td className="sales-risk-cell">{row.dnu}</td>
                        <td>{row.ups}</td>
                        <td>{row.notDone}</td>
                        <td>{row.entryMistake}</td>
                        <td>{row.incomplete}</td>
                        <td>
                          <span className="sales-rate-pill">{row.completionRate}%</span>
                        </td>
                        <td>
                          <span className="badge skip">{row.latest || "-"}</span>
                        </td>
                      </tr>
                    ))}
                    {executiveRows.length === 0 && (
                      <tr>
                        <td colSpan={10}>
                          <div className="sales-empty-state">{hasSelectedDateData ? "No executive testing records for this date." : "Data not available for this selected date."}</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SheetDataProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <SalesContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </Suspense>
    </SheetDataProvider>
  );
}
