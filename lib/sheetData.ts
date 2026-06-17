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
  // Branch data configuration - A4 has "Abu Dhabi", B4 has 23
  branchSheetName: "Branch wise Status",
  branchTableRange: "'Branch wise Status'!A4:E8", // A4:E8 covers 5 branches with 5 columns
  branchHeaders: ["Branch", "Total", "New", "Existing", "NA"],
  
  // Device Testing configuration
  deviceTestingSheetName: "Testing Metrics",
  deviceTestingRange: "'Testing Metrics'!A2:G500", // Starting from A2 as specified
  deviceHeaders: ["Status", "Location", "Role", "Count", "Names", "Device ID"],
  // Master branchwise testing (sales closing) - dynamic date columns start at D
  masterBranchSheetName: "Master Sheet",
  masterBranchRange: "'Master Sheet'!A1:ZZ500",
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

export type BranchData = {
  branch: string;
  total: number;
  new: number;
  existing: number;
  na: number;
};

export type DeviceTestingEntry = {
  status: string;
  location: string;
  role: string;
  count: number;
  names: string;
  deviceId: string;
};

export type DeviceTestingSummary = {
  totalDevices: number;
  byStatus: Record<string, number>;
  byLocation: Record<string, number>;
  byDate: Record<string, number>;
  allEntries: DeviceTestingEntry[];
};

export type MasterEntry = {
  region: string;
  module: string;
  executive: string;
  statusesByDate: Record<string, string>;
};

export type SalesSummary = {
  dates: string[];
  entries: MasterEntry[];
  perDateCounts: Record<string, Record<string, number>>; // date -> status -> count
  byExecutive: Record<string, { totalDays: number; counts: Record<string, number>; latest?: string }>;
  topPerformer?: { executive: string; completed: number } | null;
  mostMistakes?: { executive: string; mistakes: number } | null;
};

export type SheetData = {
  projectMeta: ProjectMeta;
  moduleData: ModuleData[];
  summaryDonut: SummaryDonutItem[];
  topKPIs: KpiItem[];
  branchData: BranchData[];
};

function parseNumber(value: unknown) {
  if (value === undefined || value === null) return 0;
  const text = String(value).replace(/[^0-9.-]/g, "").trim();
  return text.length === 0 ? 0 : Number(text);
}

export function hasSheetFormulaError(values: unknown): boolean {
  if (!Array.isArray(values)) return false;
  return values.some((item) => {
    if (Array.isArray(item)) return hasSheetFormulaError(item);
    const text = String(item || "").trim();
    return /^#(REF|VALUE|DIV\/0|N\/A|NAME\?|NUM|NULL)!?$/i.test(text) || text.toLowerCase().includes("formula parse error");
  });
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
      label: "Total Test Items",
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
      label: "Testing Progress",
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
    branchData: [],
  };
}

function parseBranchRow(row: unknown[]): BranchData {
  return {
    branch: String(row[0] || "").trim(),
    total: parseNumber(row[1]),
    new: parseNumber(row[2]),
    existing: parseNumber(row[3]),
    na: parseNumber(row[4]),
  };
}

export function parseBranchData(values: unknown[][]): BranchData[] {
  if (!values || values.length === 0) return [];
  
  const rows = values.filter((row) => Array.isArray(row) && row.length > 0);
  const dataRows = rows
    .filter((row) => {
      const first = String(row[0] || "").toLowerCase().trim();
      return first.length > 0 && first !== "branch";
    })
    .map(parseBranchRow);
  
  return dataRows;
}

export function parseDeviceTestingData(values: unknown[][]): DeviceTestingSummary {
  if (!values || values.length === 0) {
    return {
      totalDevices: 0,
      byStatus: {},
      byLocation: {},
      byDate: {},
      allEntries: [],
    };
  }

  const rows = (values || []).filter((row) => Array.isArray(row) && row.length > 0) as unknown[][];
  const entries: DeviceTestingEntry[] = [];
  
  let totalDevices = 0;
  const byStatus: Record<string, number> = {};
  const byLocation: Record<string, number> = {};
  const byDate: Record<string, number> = {};

  // Roles to include in device count
  const countableRoles = ["Salesman", "Driver", "Sales executive", "Sales Executive"];

  for (const row of rows) {
    if (!row || row.length === 0) continue;
    
    const status = String(row[0] || "").trim();
    const location = String(row[1] || "").trim();
    const role = String(row[2] || "").trim();
    const countStr = String(row[3] || "").trim();
    const names = String(row[4] || "").trim();
    const deviceId = String(row[5] || "").trim();

    // Skip empty rows or header rows
    if (!status || status.toLowerCase() === "status") continue;
    
    // Parse count, handle numeric or "NA"
    const count = isNaN(Number(countStr)) ? 0 : Number(countStr);
    
    if (count > 0) {
      entries.push({
        status,
        location,
        role,
        count,
        names,
        deviceId,
      });

      // Only count if role is in countable roles
      if (countableRoles.some(r => role.toLowerCase().includes(r.toLowerCase()))) {
        totalDevices += count;
        byStatus[status] = (byStatus[status] || 0) + count;
        byLocation[location] = (byLocation[location] || 0) + count;
        byDate[status] = (byDate[status] || 0) + count;
      }
    }
  }

  return {
    totalDevices,
    byStatus,
    byLocation,
    byDate,
    allEntries: entries,
  };
}

function isHeaderLike(row: unknown[]): boolean {
  if (!row || row.length === 0) return false;
  const first = String(row[0] || "").toLowerCase();
  return first === "region" || first === "module" || first === "sales executive";
}

export function parseMasterBranchwiseData(values: unknown[][]): SalesSummary {
  const rows = (values || []).filter((r) => Array.isArray(r)) as unknown[][];
  if (!rows || rows.length === 0) {
    return { dates: [], entries: [], perDateCounts: {}, byExecutive: {}, topPerformer: null, mostMistakes: null };
  }

  // Find header row (contains 'Region' or 'Sales Executive')
  const headerRow = rows.find(isHeaderLike) || rows[0];
  const headerIdx = rows.indexOf(headerRow);
  const headers = headerRow.map((h) => String(h || "").trim());

  // Dates start from column index 3 (0-based: 0 Region,1 Module,2 Sales Executive)
  const dateStart = 3;
  const dates: string[] = [];
  for (let c = dateStart; c < headers.length; c++) {
    const h = headers[c] || "";
    if (String(h).trim().length > 0) dates.push(String(h).trim());
  }

  const entries: MasterEntry[] = [];
  const perDateCounts: Record<string, Record<string, number>> = {};
  const byExecutive: Record<string, { totalDays: number; counts: Record<string, number>; latest?: string }> = {};

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    if (!row || row.length === 0) continue;
    const region = String(row[0] || "").trim();
    const moduleName = String(row[1] || "").trim();
    const executive = String(row[2] || "").trim();

    const statusesByDate: Record<string, string> = {};
    let totalDays = 0;

    for (let i = 0; i < dates.length; i++) {
      const col = dateStart + i;
      const raw = String(row[col] || "").trim();
      const status = raw;
      const date = dates[i];

      if (status && status.length > 0) {
        totalDays += 1;
        statusesByDate[date] = status;

        // update perDateCounts
        perDateCounts[date] = perDateCounts[date] || {};
        perDateCounts[date][status] = (perDateCounts[date][status] || 0) + 1;
      }
    }

    // Include the row even if `executive` is empty so branches are discovered.
    entries.push({ region, module: moduleName, executive, statusesByDate });

    // Only aggregate per-executive stats when an executive value exists
    if (executive) {
      byExecutive[executive] = byExecutive[executive] || { totalDays: 0, counts: {}, latest: undefined };
      byExecutive[executive].totalDays += totalDays;
      byExecutive[executive].latest = Object.keys(statusesByDate).length ? statusesByDate[dates[dates.length - 1]] : undefined;
      byExecutive[executive].counts = byExecutive[executive].counts || {};
      // accumulate counts by status from statusesByDate
      for (const d of Object.keys(statusesByDate)) {
        const s = statusesByDate[d];
        byExecutive[executive].counts[s] = (byExecutive[executive].counts[s] || 0) + 1;
      }
    }
  }

  // compute top performer (most 'Completed') and most mistakes
  let topPerformer: { executive: string; completed: number } | null = null;
  let mostMistakes: { executive: string; mistakes: number } | null = null;
  for (const [exec, info] of Object.entries(byExecutive)) {
    const completedCount = Object.entries(info.counts).reduce((acc, [k, v]) => acc + (/completed/i.test(k) ? v : 0), 0);
    const mistakesCount = Object.entries(info.counts).reduce((acc, [k, v]) => acc + (/(em|entry mistake|entrymistake)/i.test(k) ? v : 0), 0);
    if (!topPerformer || completedCount > topPerformer.completed) topPerformer = { executive: exec, completed: completedCount };
    if (!mostMistakes || mistakesCount > mostMistakes.mistakes) mostMistakes = { executive: exec, mistakes: mistakesCount };
  }

  return { dates, entries, perDateCounts, byExecutive, topPerformer, mostMistakes };
}

export async function fetchSheetData(): Promise<SheetData> {
  const response = await fetch("/api/sheets", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load sheet data");
  }

  const json = await response.json();
  if (hasSheetFormulaError([json.values, json.branchValues])) {
    throw new Error("Sheet formula error");
  }
  const sheetData = parseSheetValues(json.values || []);
  
  // Add branch data if available
  if (json.branchValues) {
    sheetData.branchData = parseBranchData(json.branchValues);
  }
  
  return sheetData;
}
