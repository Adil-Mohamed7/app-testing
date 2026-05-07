// ── Real project data (hardcoded — will connect to Google Sheets) ──────
export const projectMeta = {
  projectName: "AppTest Suite",
  lastUpdated: "May 6, 2026",
  totalTasks: 277,
  completed: 186,
  pending: 71,
  overallProgress: 67,
};

export const moduleData = [
  { id: "store-manager",      name: "Store Manager",      total: 20,  completed: 18, ongoing: 1, testing: 0, hold: 0, started: 0, cancelled: 0, pending: 1,  progress: 90 },
  { id: "store-operator",     name: "Store Operator",     total: 21,  completed: 15, ongoing: 0, testing: 0, hold: 2, started: 1, cancelled: 0, pending: 3,  progress: 71 },
  { id: "sales-app",          name: "Sales App",          total: 87,  completed: 50, ongoing: 6, testing: 0, hold: 2, started: 0, cancelled: 2, pending: 27, progress: 57 },
  { id: "driver-app",         name: "Driver App",         total: 5,   completed: 1,  ongoing: 0, testing: 0, hold: 0, started: 0, cancelled: 0, pending: 4,  progress: 20 },
  { id: "sales-executive",    name: "Sales Executive",    total: 23,  completed: 14, ongoing: 0, testing: 0, hold: 0, started: 0, cancelled: 0, pending: 9,  progress: 61 },
  { id: "sales-manager",      name: "Sales Manager",      total: 10,  completed: 6,  ongoing: 2, testing: 0, hold: 0, started: 0, cancelled: 0, pending: 2,  progress: 60 },
  { id: "head-cashier",       name: "Head Cashier",       total: 5,   completed: 2,  ongoing: 0, testing: 0, hold: 0, started: 0, cancelled: 0, pending: 3,  progress: 40 },
  { id: "admin",              name: "Admin",              total: 8,   completed: 7,  ongoing: 0, testing: 0, hold: 0, started: 0, cancelled: 0, pending: 1,  progress: 88 },
  { id: "customer-care",      name: "Customer Care",      total: 49,  completed: 37, ongoing: 1, testing: 0, hold: 0, started: 0, cancelled: 1, pending: 10, progress: 76 },
  { id: "cashier",            name: "Cashier",            total: 41,  completed: 29, ongoing: 1, testing: 0, hold: 1, started: 0, cancelled: 0, pending: 10, progress: 71 },
  { id: "service-technician", name: "Service Technician", total: 7,   completed: 6,  ongoing: 0, testing: 0, hold: 0, started: 0, cancelled: 0, pending: 1,  progress: 86 },
  { id: "customer-app",       name: "Customer App",       total: 1,   completed: 1,  ongoing: 0, testing: 0, hold: 0, started: 0, cancelled: 0, pending: 0,  progress: 100 },
  { id: "branch-manager",     name: "Branch Manager",     total: 0,   completed: 0,  ongoing: 0, testing: 0, hold: 0, started: 0, cancelled: 0, pending: 0,  progress: 0 },
];

// Status metadata for colours & labels
export const STATUS_META = {
  completed: { label: "Completed", color: "#22c55e",  bg: "rgba(34,197,94,0.15)"  },
  ongoing:   { label: "Ongoing",   color: "#3b82f6",  bg: "rgba(59,130,246,0.15)" },
  testing:   { label: "Testing",   color: "#8b5cf6",  bg: "rgba(139,92,246,0.15)" },
  hold:      { label: "On Hold",   color: "#f59e0b",  bg: "rgba(245,158,11,0.15)" },
  started:   { label: "Started",   color: "#06b6d4",  bg: "rgba(6,182,212,0.15)"  },
  cancelled: { label: "Cancelled", color: "#ef4444",  bg: "rgba(239,68,68,0.15)"  },
  pending:   { label: "Pending",   color: "#475569",  bg: "rgba(71,85,105,0.2)"   },
};

// For the summary donut
export const summaryDonut = [
  { name: "Completed", value: 186, color: "#22c55e" },
  { name: "Ongoing",   value: 12,  color: "#3b82f6" },
  { name: "Hold",      value: 6,   color: "#f59e0b" },
  { name: "Cancelled", value: 3,   color: "#ef4444" },
  { name: "Pending",   value: 71,  color: "#334155" },
];

// Top KPIs
export const topKPIs = [
  { id: "total",     label: "Total Features", value: "277",  delta: "across 13 modules", deltaDir: "neutral", icon: "📋", color: "blue"   },
  { id: "completed", label: "Completed",      value: "186",  delta: "+18 this week",     deltaDir: "up",      icon: "✅", color: "green"  },
  { id: "pending",   label: "Pending",        value: "71",   delta: "needs attention",   deltaDir: "down",    icon: "⏳", color: "amber"  },
  { id: "progress",  label: "Overall Progress", value: "67%", delta: "+4% vs last week", deltaDir: "up",      icon: "🚀", color: "violet" },
];
