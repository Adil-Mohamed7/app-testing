export const sheetConfig = {
  sheetName: "sheet236",
  tableRange: "sheet236!B4:K19",
  moduleHeaders: [
    "Module",
    "Total",
    "COMPLETED",
    "ONGOING",
    "TESTING",
    "HOLD",
    "STARTED",
    "cancelled",
    "PENDING",
    "Project Progress Overview (%)",
  ],
};

export const STATUS_META = {
  completed: { label: "Completed", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  ongoing: { label: "Ongoing", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  testing: { label: "Testing", color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
  hold: { label: "On Hold", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  started: { label: "Started", color: "#06b6d4", bg: "rgba(6,182,212,0.15)" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  pending: { label: "Pending", color: "#475569", bg: "rgba(71,85,105,0.2)" },
};

export type ModuleData = {
  id: string;
  name: string;
  total: number;
  completed: number;
  ongoing: number;
  testing: number;
  hold: number;
  started: number;
  cancelled: number;
  pending: number;
  progress: number;
};

export type ProjectMeta = {
  projectName: string;
  lastUpdated: string;
  totalTasks: number;
  completed: number;
  pending: number;
  overallProgress: number;
};

export type KpiItem = {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaDir: "up" | "down" | "neutral";
  icon: string;
  color: string;
};

export type SummaryDonutItem = {
  name: string;
  value: number;
  color: string;
};

export type SheetData = {
  projectMeta: ProjectMeta;
  moduleData: ModuleData[];
  summaryDonut: SummaryDonutItem[];
  topKPIs: KpiItem[];
};

function parseNumber(value: unknown) {
  if (value === undefined || value === null) return 0;
  const text = String(value).replace(/[^0-9.-]/g, "").trim();
  return text.length === 0 ? 0 : Number(text);
}

function parseProgress(value: unknown) {
  if (value === undefined || value === null) return 0;
  const text = String(value).replace(/%/g, "").trim();
  return Number(text) || 0;
}

function normalizeId(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function isHeaderRow(row: unknown[]) {
  const first = String(row[0] || "").toLowerCase();
  return first === "module" || first === "project" || first === "total";
}

function parseSheetRow(row: unknown[]): ModuleData {
  return {
    id: normalizeId(String(row[0] || "").trim()),
    name: String(row[0] || "").trim(),
    total: parseNumber(row[1]),
    completed: parseNumber(row[2]),
    ongoing: parseNumber(row[3]),
    testing: parseNumber(row[4]),
    hold: parseNumber(row[5]),
    started: parseNumber(row[6]),
    cancelled: parseNumber(row[7]),
    pending: parseNumber(row[8]),
    progress: parseProgress(row[9]),
  };
}

function buildProjectMeta(moduleData: ModuleData[]): ProjectMeta {
  const totals = moduleData.reduce(
    (acc, current) => {
      acc.totalTasks += current.total;
      acc.completed += current.completed;
      acc.pending += current.pending;
      return acc;
    },
    { totalTasks: 0, completed: 0, pending: 0 },
  );

  const overallProgress = totals.totalTasks > 0
    ? Math.round((totals.completed / totals.totalTasks) * 100)
    : 0;

  return {
    projectName: "AppTest Suite",
    lastUpdated: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    totalTasks: totals.totalTasks,
    completed: totals.completed,
    pending: totals.pending,
    overallProgress,
  };
}

function buildSummaryDonut(moduleData: ModuleData[]): SummaryDonutItem[] {
  const totals = moduleData.reduce(
    (acc, current) => {
      acc.completed += current.completed;
      acc.ongoing += current.ongoing + current.testing + current.started;
      acc.hold += current.hold;
      acc.cancelled += current.cancelled;
      acc.pending += current.pending;
      return acc;
    },
    { completed: 0, ongoing: 0, hold: 0, cancelled: 0, pending: 0 },
  );

  return [
    { name: "Completed", value: totals.completed, color: STATUS_META.completed.color },
    { name: "Ongoing", value: totals.ongoing, color: STATUS_META.ongoing.color },
    { name: "Hold", value: totals.hold, color: STATUS_META.hold.color },
    { name: "Cancelled", value: totals.cancelled, color: STATUS_META.cancelled.color },
    { name: "Pending", value: totals.pending, color: STATUS_META.pending.color },
  ];
}

function buildTopKPIs(projectMeta: ProjectMeta): KpiItem[] {
  return [
    {
      id: "total",
      label: "Total Features",
      value: String(projectMeta.totalTasks),
      delta: "from sheet",
      deltaDir: "neutral",
      icon: "📋",
      color: "blue",
    },
    {
      id: "completed",
      label: "Completed",
      value: String(projectMeta.completed),
      delta: "live total",
      deltaDir: "up",
      icon: "✅",
      color: "green",
    },
    {
      id: "pending",
      label: "Pending",
      value: String(projectMeta.pending),
      delta: "live total",
      deltaDir: "down",
      icon: "⏳",
      color: "amber",
    },
    {
      id: "progress",
      label: "Overall Progress",
      value: `${projectMeta.overallProgress}%`,
      delta: "sheet-based",
      deltaDir: "neutral",
      icon: "🚀",
      color: "violet",
    },
  ];
}

export function parseSheetValues(values: unknown[][]): SheetData {
  const rows = (values || []).filter((row) => Array.isArray(row) && row.length > 0) as unknown[][];
  const dataRows = rows
    .filter((row) => !isHeaderRow(row) && String(row[0] || "").trim().length > 0)
    .map(parseSheetRow);

  const projectMeta = buildProjectMeta(dataRows);
  const summaryDonut = buildSummaryDonut(dataRows);
  const topKPIs = buildTopKPIs(projectMeta);

  return {
    projectMeta,
    moduleData: dataRows,
    summaryDonut,
    topKPIs,
  };
}

export async function fetchSheetData(): Promise<SheetData> {
  const response = await fetch("/api/sheets", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load sheet data");
  }

  const json = await response.json();
  return parseSheetValues(json.values || []);
}
