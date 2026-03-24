import { useState, useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import AdminLayout from "./AdminLayout.jsx";
import { useOverview } from "../../hooks/useDashboard";
import { ErrorBanner, exportToCSV } from "../../components/admin/DashboardUI";
import OverviewView from "../../components/admin/OverviewView";
import RevenueView from "../../components/admin/RevenueView";
import CustomersView from "../../components/admin/CustomersView";
import InventoryView from "../../components/admin/InventoryView";
import ServicesView from "../../components/admin/ServicesView";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
);

// ── View definitions ──────────────────────────────────────────────────────────
const VIEWS = [
  {
    key: "overview",
    label: "Overview",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    key: "revenue",
    label: "Revenue",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "customers",
    label: "Customers",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: "services",
    label: "Services",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const SERVICE_COLORS = ["#ef4444", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#06b6d4"];

// ── Shared chart theme helpers ────────────────────────────────────────────────
const CHART_BASE = {
  tooltip: {
    backgroundColor: "#111827",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    titleColor: "#f9fafb",
    bodyColor: "#9ca3af",
  },
  grid: { color: "rgba(255,255,255,0.04)" },
  ticks: { color: "#6b7280" },
};

// ── Status badge styles ───────────────────────────────────────────────────────
const STATUS_STYLE = {
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const STATUS_LABEL = {
  completed: "Completed",
  pending: "Pending",
  cancelled: "Cancelled",
  in_progress: "In Progress",
};

// ── Small reusable components ─────────────────────────────────────────────────
function StatCard({ title, value, icon, accentBg, accentText, border, sub }) {
  return (
    <div className={`bg-gray-900/60 border ${border} rounded-2xl p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${accentBg} ${accentText} p-3 rounded-xl`}>{icon}</div>
      </div>
      <div className="text-2xl font-black text-white mb-1">{value ?? "—"}</div>
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      {sub && <div className={`text-xs font-semibold ${accentText}`}>{sub}</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-800" />
      </div>
      <div className="h-7 w-24 bg-gray-800 rounded mb-2" />
      <div className="h-4 w-32 bg-gray-800 rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 animate-pulse items-center">
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-800 shrink-0" />
        <div className="h-4 w-28 bg-gray-800 rounded" />
      </div>
      <div className="col-span-3 h-4 w-20 bg-gray-800 rounded" />
      <div className="col-span-2 h-4 w-14 bg-gray-800 rounded" />
      <div className="col-span-2 h-6 w-20 bg-gray-800 rounded-full" />
      <div className="col-span-1" />
    </div>
  );
}

// ── CUSTOMER segment badge ────────────────────────────────────────────────────
const SEGMENT_STYLE = {
  "High Value": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Regular: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "At Risk": "bg-orange-700/20 text-orange-400 border-orange-700/30",
  New: "bg-gray-400/20 text-gray-300 border-gray-400/30",
};

// ── INVENTORY status badge ────────────────────────────────────────────────────
const INV_STYLE = {
  ok: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  low: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  out: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

function normalizeInventoryStatus(status) {
  const s = String(status ?? "").trim().toLowerCase();
  if (s === "low" || s.includes("low")) return "low";
  if (s.includes("out of stock") || s.includes("out_of_stock")) return "out";
  if (s === "critical" || s.includes("critical") || s.includes("reorder")) return "critical";
  if (s === "ok" || s.includes("in stock")) return "ok";
  return "ok";
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeView, setActiveView] = useState("overview");
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [chart, setChart] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryBranchFilter, setInventoryBranchFilter] = useState("All Branches");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const token =
          localStorage.getItem("access_token") ??
          sessionStorage.getItem("access_token");
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const [dashboardRes, customersRes, inventoryRes] = await Promise.all([
          fetch(`${baseUrl}/dashboard/`, { headers, credentials: "include" }),
          fetch(`${baseUrl}/customers/`, { headers, credentials: "include" }),
          fetch(`${baseUrl}/inventory/`, { headers, credentials: "include" }),
        ]);

        if (!dashboardRes.ok) throw new Error(`Dashboard: ${dashboardRes.status}`);
        if (!customersRes.ok) throw new Error(`Customers: ${customersRes.status}`);
        if (!inventoryRes.ok) throw new Error(`Inventory: ${inventoryRes.status}`);

        const [dashboardData, customersData, inventoryData] = await Promise.all([
          dashboardRes.json(),
          customersRes.json(),
          inventoryRes.json(),
        ]);

        setStats(dashboardData.stats);
        setTransactions(dashboardData.recent_transactions ?? []);
        setChart(dashboardData.chart ?? null);
        setAnalytics(dashboardData.analytics ?? null);
        setCustomers(customersData ?? []);
        setInventoryItems(inventoryData ?? []);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Overview hook (used for error banner / refetch)
  const { data, loading: overviewLoading, error: overviewError, refetch } = useOverview();

  // ── Derived data ─────────────────────────────────────────────────────────
  const serviceDistribution = analytics?.service_distribution ?? [];
  const topServicesData = analytics?.top_services ?? [];
  const revenueByBranch = analytics?.revenue_by_branch ?? [];
  const topServiceCards = topServicesData;

  const topCustomer =
    customers.length > 0
      ? [...customers].sort((a, b) => Number(b.total_spent ?? 0) - Number(a.total_spent ?? 0))[0]
      : null;

  const inventoryBranchOptions = [
    "All Branches",
    ...Array.from(new Set(inventoryItems.map((i) => i.branch_name || "Central"))),
  ];

  const filteredInventoryItems = inventoryItems.filter((i) =>
    inventoryBranchFilter === "All Branches"
      ? true
      : (i.branch_name || "Central") === inventoryBranchFilter,
  );

  const lowStockCount = filteredInventoryItems.filter(
    (i) => normalizeInventoryStatus(i.status) === "low",
  ).length;

  const criticalStockCount = filteredInventoryItems.filter((i) => {
    const status = normalizeInventoryStatus(i.status);
    return status === "critical" || status === "out";
  }).length;

  const sortedServiceCards = [...topServiceCards].sort(
    (a, b) => b.revenue - a.revenue,
  );

  const transactionsPagination = usePagination({
    items: transactions,
    pageSize: 10,
    resetDeps: [activeView, transactions.length],
  });

  const revenueBranchPagination = usePagination({
    items: revenueByBranch,
    pageSize: 10,
    resetDeps: [activeView, revenueByBranch.length],
  });

  const customersPagination = usePagination({
    items: customers,
    pageSize: 10,
    resetDeps: [activeView, customers.length],
  });

  const inventoryPagination = usePagination({
    items: filteredInventoryItems,
    pageSize: 10,
    resetDeps: [activeView, inventoryBranchFilter, filteredInventoryItems.length],
  });

  const servicesPagination = usePagination({
    items: sortedServiceCards,
    pageSize: 10,
    resetDeps: [activeView, topServiceCards.length],
  });

  // ── Stat cards config ────────────────────────────────────────────────────
  const statCards = [
    {
      title: "Total Revenue",
      value: stats ? `₱${Number(stats.total_revenue).toLocaleString()}` : null,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accentBg: "bg-red-500/10",
      accentText: "text-red-400",
      border: "border-red-500/20",
    },
    {
      title: "Total Customers",
      value: stats ? Number(stats.total_customers).toLocaleString() : null,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      accentBg: "bg-purple-500/10",
      accentText: "text-purple-400",
      border: "border-purple-500/20",
    },
    {
      title: "Services Completed",
      value: stats ? Number(stats.services_completed).toLocaleString() : null,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      accentBg: "bg-blue-500/10",
      accentText: "text-blue-400",
      border: "border-blue-500/20",
    },
    {
      title: "Avg. Satisfaction",
      value: stats ? `${(((stats.avg_satisfaction ?? 0) / 5) * 100).toFixed(1)}%` : null,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accentBg: "bg-emerald-500/10",
      accentText: "text-emerald-400",
      border: "border-emerald-500/20",
    },
  ];

  // ── Chart data ───────────────────────────────────────────────────────────
  const doughnutChartData = {
    labels: serviceDistribution.map((item) => item.label),
    datasets: [
      {
        data: serviceDistribution.map((item) => item.count),
        backgroundColor: SERVICE_COLORS.slice(0, serviceDistribution.length),
        borderWidth: 2,
        borderColor: "#111827",
        hoverBorderColor: "#1f2937",
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: { legend: { display: false }, tooltip: CHART_BASE.tooltip },
  };

  const serviceBreakdown = serviceDistribution.map((item, idx) => ({
    label: item.label,
    color: SERVICE_COLORS[idx % SERVICE_COLORS.length],
    pct: `${Number(item.pct ?? 0).toFixed(1)}%`,
  }));

  const currentYear = new Date().getFullYear();
  const chartSubtitle = chart?.labels?.length
    ? `${chart.labels[0]} – ${chart.labels[chart.labels.length - 1]} ${currentYear}`
    : `${currentYear}`;

  const lineChartData = {
    labels: chart?.labels ?? [],
    datasets: [
      {
        label: "Revenue (₱)",
        data: chart?.revenue ?? [],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.08)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: "Services",
        data: chart?.services ?? [],
        borderColor: "#a855f7",
        backgroundColor: "rgba(168,85,247,0.08)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: { color: "#9ca3af", usePointStyle: true, padding: 20, font: { size: 12 } },
      },
      tooltip: CHART_BASE.tooltip,
    },
    scales: {
      x: { grid: CHART_BASE.grid, ticks: CHART_BASE.ticks },
      y: {
        beginAtZero: true,
        grid: CHART_BASE.grid,
        ticks: { ...CHART_BASE.ticks, callback: (v) => `₱${(v / 1000).toFixed(0)}k` },
      },
    },
  };

  const revenueBarData = {
    labels: revenueByBranch.map((r) => r.branch),
    datasets: [
      {
        label: "Revenue",
        data: revenueByBranch.map((r) => r.revenue),
        backgroundColor: "rgba(239,68,68,0.7)",
        borderRadius: 6,
      },
    ],
  };

  const revenueBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: { color: "#9ca3af", usePointStyle: true, padding: 20, font: { size: 12 } },
      },
      tooltip: CHART_BASE.tooltip,
    },
    scales: {
      x: { grid: CHART_BASE.grid, ticks: CHART_BASE.ticks },
      y: {
        beginAtZero: true,
        grid: CHART_BASE.grid,
        ticks: { ...CHART_BASE.ticks, callback: (v) => `₱${(v / 1000).toFixed(0)}k` },
      },
    },
  };

  const customerBarData = {
    labels: customers.map((c) => (c.first_name || "N/A").split(" ")[0]),
    datasets: [
      {
        label: "Total Spent (₱)",
        data: customers.map((c) => Number(c.total_spent ?? 0)),
        backgroundColor: ["#a855f7", "#7c3aed", "#6d28d9", "#8b5cf6", "#c4b5fd"],
        borderRadius: 8,
      },
    ],
  };

  const customerBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: { legend: { display: false }, tooltip: CHART_BASE.tooltip },
    scales: {
      x: {
        beginAtZero: true,
        grid: CHART_BASE.grid,
        ticks: { ...CHART_BASE.ticks, callback: (v) => `₱${(v / 1000).toFixed(0)}k` },
      },
      y: { grid: { display: false }, ticks: CHART_BASE.ticks },
    },
  };

  const tierDistribution = customers.reduce((acc, c) => {
    const segment = c.segment || "New";
    acc[segment] = (acc[segment] ?? 0) + 1;
    return acc;
  }, {});

  const tierRows = [
    { tier: "High Value", color: "#06b6d4" },
    { tier: "Regular", color: "#eab308" },
    { tier: "At Risk", color: "#ea580c" },
    { tier: "New", color: "#9ca3af" },
  ].map((row) => ({ ...row, count: tierDistribution[row.tier] ?? 0 }));

  // ── Export handler ───────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (activeView === "overview") {
      exportToCSV(
        transactions.map((r) => [r.customer_name, r.service, r.amount, r.status]),
        ["Customer", "Service", "Amount", "Status"],
        "transactions_overview.csv",
      );
    } else if (activeView === "revenue") {
      exportToCSV(
        revenueByBranch.map((r) => [r.branch, r.revenue]),
        ["Branch", "Revenue"],
        "revenue_by_branch.csv",
      );
    } else if (activeView === "customers") {
      exportToCSV(
        customers.map((c) => [
          `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(),
          c.visits ?? 0,
          c.total_spent ?? 0,
          c.avg_rating ?? "—",
          c.segment ?? "—",
        ]),
        ["Name", "Visits", "Total Spent", "Avg Rating", "Segment"],
        "customers.csv",
      );
    } else if (activeView === "inventory") {
      exportToCSV(
        filteredInventoryItems.map((i) => [
          i.name,
          i.branch_name ?? "Central",
          i.quantity,
          i.unit,
          i.status,
          i.minimum_qty,
        ]),
        ["Item", "Branch", "Stock", "Unit", "Status", "Reorder At"],
        "inventory.csv",
      );
    } else if (activeView === "services") {
      exportToCSV(
        topServiceCards.map((s) => [s.service, s.count, s.revenue, s.avg_time ?? "—"]),
        ["Service", "Count", "Revenue", "Avg Time"],
        "services.csv",
      );
    }
  };

  const getInitial = (name = "") => name.charAt(0).toUpperCase();
  const normalizeStatus = (s = "") => s.toLowerCase().replace(/\s+/g, "_");
  const viewLabel = VIEWS.find((v) => v.key === activeView)?.label ?? "Dashboard";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8 print:bg-white print:p-4">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight print:text-black">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1 print:text-gray-600">
              Welcome back — here's what's happening today.
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-white/20 transition-all text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 transition-all text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* ── View Toggle Pills ───────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 mb-6 p-1 bg-gray-900/60 border border-white/5 rounded-2xl w-fit print:hidden flex-wrap">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setActiveView(v.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeView === v.key
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>

        {/* ── Error Banner ────────────────────────────────────────────────── */}
        {error && activeView === "overview" && (
          <ErrorBanner message={error} onRetry={refetch} />
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: OVERVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "overview" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                : statCards.map((card, i) => <StatCard key={i} {...card} />)}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
              {/* Line Chart */}
              <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-white">Revenue & Services Trend</h3>
                    <p className="text-gray-500 text-sm mt-0.5">{chartSubtitle}</p>
                  </div>
                </div>
                {loading ? (
                  <div className="h-64 sm:h-72 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : !chart?.labels?.length ? (
                  <div className="h-64 sm:h-72 flex items-center justify-center text-gray-600 text-sm">
                    No booking data available for {currentYear} yet.
                  </div>
                ) : (
                  <div className="h-64 sm:h-72">
                    <Line data={lineChartData} options={lineChartOptions} />
                  </div>
                )}
              </div>

              {/* Doughnut */}
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-white">Service Distribution</h3>
                  <p className="text-gray-500 text-sm mt-0.5">By category this month</p>
                </div>
                <div className="h-44 flex items-center justify-center mb-6">
                  {!serviceDistribution.length ? (
                    <div className="text-gray-600 text-sm text-center">
                      No service distribution data this month.
                    </div>
                  ) : (
                    <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                  )}
                </div>
                <div className="space-y-3">
                  {serviceBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-400 flex-1">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: item.pct, backgroundColor: item.color }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white w-8 text-right">
                          {item.pct}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-black text-white">Recent Transactions</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Latest service activity</p>
                </div>
                <button className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors">
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-4">Customer</div>
                <div className="col-span-3">Service</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : transactions.length === 0 ? (
                <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
                  <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 text-sm">No transactions found.</p>
                </div>
              ) : (
                transactionsPagination.paginatedItems.map((row, i) => {
                  const statusKey = normalizeStatus(row.status);
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group"
                    >
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center text-sm font-bold shrink-0">
                            {getInitial(row.customer_name)}
                          </div>
                          <span className="text-white font-semibold text-sm">
                            {row.customer_name}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-3 text-gray-400 text-sm">{row.service}</div>
                      <div className="col-span-2 text-white font-bold text-sm">
                        ₱{Number(row.amount).toLocaleString()}
                      </div>
                      <div className="col-span-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[statusKey] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                        >
                          {STATUS_LABEL[statusKey] ?? row.status}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              <div className="px-6 py-4">
                <p className="text-gray-500 text-sm">
                  Showing{" "}
                  <span className="text-white font-semibold">
                    {loading ? "—" : `${transactionsPagination.startItem}-${transactionsPagination.endItem}`}
                  </span>{" "}
                  of{" "}
                  <span className="text-white font-semibold">
                    {loading ? "—" : transactions.length}
                  </span>{" "}
                  transactions
                </p>
              </div>

              {!loading && (
                <Pagination
                  current={transactionsPagination.currentPage}
                  total={transactionsPagination.totalPages}
                  onChange={transactionsPagination.setCurrentPage}
                  className="px-6 pb-6"
                />
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: REVENUE
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "revenue" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                {
                  title: "Total Revenue (Q1)",
                  value: stats ? `₱${Number(stats.total_revenue ?? 0).toLocaleString()}` : "—",
                  accentBg: "bg-red-500/10",
                  accentText: "text-red-400",
                  border: "border-red-500/20",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  title: "Bookings Today",
                  value: analytics?.bookings_today != null ? Number(analytics.bookings_today).toLocaleString() : "—",
                  accentBg: "bg-gray-500/10",
                  accentText: "text-gray-400",
                  border: "border-gray-500/20",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  ),
                },
                {
                  title: "Completion Rate",
                  value: analytics?.completion_rate != null ? `${Number(analytics.completion_rate).toFixed(1)}%` : "—",
                  accentBg: "bg-emerald-500/10",
                  accentText: "text-emerald-400",
                  border: "border-emerald-500/20",
                  sub: analytics?.payment_rate != null ? `Paid rate: ${Number(analytics.payment_rate).toFixed(1)}%` : undefined,
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ),
                },
              ].map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm mb-6">
              <h3 className="text-lg font-black text-white mb-1">Revenue by Branch</h3>
              <p className="text-gray-500 text-sm mb-6">Live totals from all bookings</p>
              <div className="h-72">
                <Bar data={revenueBarData} options={revenueBarOptions} />
              </div>
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-black text-white">Branch Revenue Detail</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div>Branch</div>
                <div>Revenue</div>
              </div>
              {revenueBranchPagination.paginatedItems.map((row, idx) => (
                <div
                  key={`${row.branch}-${idx}`}
                  className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="text-white font-semibold">{row.branch}</div>
                  <div className="text-red-400 font-bold">
                    ₱{Number(row.revenue ?? 0).toLocaleString()}
                  </div>
                </div>
              ))}

              <Pagination
                current={revenueBranchPagination.currentPage}
                total={revenueBranchPagination.totalPages}
                onChange={revenueBranchPagination.setCurrentPage}
                className="px-6 py-4"
              />
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: CUSTOMERS
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "customers" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                {
                  title: "Total Customers",
                  value: stats ? Number(stats.total_customers).toLocaleString() : "—",
                  accentBg: "bg-purple-500/10",
                  accentText: "text-purple-400",
                  border: "border-purple-500/20",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                },
                {
                  title: "New Customers (30d)",
                  value: analytics?.new_customers_30d != null ? Number(analytics.new_customers_30d).toLocaleString() : "—",
                  accentBg: "bg-blue-500/10",
                  accentText: "text-blue-400",
                  border: "border-blue-500/20",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                },
                {
                  title: "Top Spender",
                  value: topCustomer ? `${topCustomer.first_name} ${topCustomer.last_name}`.trim() : "—",
                  sub: topCustomer ? `₱${Number(topCustomer.total_spent ?? 0).toLocaleString()} total` : undefined,
                  accentBg: "bg-yellow-500/10",
                  accentText: "text-yellow-400",
                  border: "border-yellow-500/20",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  ),
                },
              ].map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-black text-white mb-1">Customer Spend</h3>
                <p className="text-gray-500 text-sm mb-6">Top customers by total spending</p>
                <div className="h-56">
                  <Bar data={customerBarData} options={customerBarOptions} />
                </div>
              </div>

              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-black text-white mb-1">Tier Distribution</h3>
                <p className="text-gray-500 text-sm mb-6">Customer loyalty tiers</p>
                <div className="space-y-4 mt-4">
                  {tierRows.map((t) => (
                    <div key={t.tier} className="flex items-center gap-4">
                      <span className="text-sm text-gray-400 w-20">{t.tier}</span>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${customers.length ? (t.count / customers.length) * 100 : 0}%`,
                            backgroundColor: t.color,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-white w-6 text-right">
                        {t.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-black text-white">Customer List</h3>
                <p className="text-gray-500 text-sm mt-0.5">All registered customers</p>
              </div>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Visits</div>
                <div className="col-span-3">Total Spent</div>
                <div className="col-span-2">Avg Rating</div>
                <div className="col-span-1">Segment</div>
              </div>
              {customersPagination.paginatedItems.map((c, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-sm font-bold shrink-0">
                      {getInitial(c.first_name)}
                    </div>
                    <span className="text-white font-semibold text-sm">
                      {`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()}
                    </span>
                  </div>
                  <div className="col-span-2 text-gray-400 text-sm font-semibold">
                    {Number(c.visits ?? 0)}x
                  </div>
                  <div className="col-span-3 text-white font-bold text-sm">
                    ₱{Number(c.total_spent ?? 0).toLocaleString()}
                  </div>
                  <div className="col-span-2 text-gray-500 text-xs">
                    {c.avg_rating != null ? `${Number(c.avg_rating).toFixed(1)} / 5` : "—"}
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${SEGMENT_STYLE[c.segment] ?? SEGMENT_STYLE.New}`}>
                      {c.segment ?? "New"}
                    </span>
                  </div>
                </div>
              ))}

              <Pagination
                current={customersPagination.currentPage}
                total={customersPagination.totalPages}
                onChange={customersPagination.setCurrentPage}
                className="px-6 py-4"
              />
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: INVENTORY
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "inventory" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                {
                  title: "Total SKUs",
                  value: String(inventoryItems.length),
                  accentBg: "bg-blue-500/10",
                  accentText: "text-blue-400",
                  border: "border-blue-500/20",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  ),
                },
                {
                  title: "Below Reorder Level",
                  value: String(lowStockCount),
                  accentBg: "bg-amber-500/10",
                  accentText: "text-amber-400",
                  border: "border-amber-500/20",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  ),
                },
                {
                  title: "Urgent Replenishment",
                  value: String(criticalStockCount),
                  sub: "Needs immediate reorder",
                  accentBg: "bg-red-500/10",
                  accentText: "text-red-400",
                  border: "border-red-500/20",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ),
                },
              ].map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-white">Parts & Supplies Inventory</h3>
                    <p className="text-gray-500 text-sm mt-0.5">Current stock levels</p>
                  </div>
                  <select
                    value={inventoryBranchFilter}
                    onChange={(e) => setInventoryBranchFilter(e.target.value)}
                    className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[180px]"
                  >
                    {inventoryBranchOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-4">Item</div>
                <div className="col-span-2">Branch</div>
                <div className="col-span-2">Stock</div>
                <div className="col-span-2">Reorder At</div>
                <div className="col-span-2">Status</div>
              </div>
              {inventoryPagination.paginatedItems.map((item, i) => {
                const invStatus = normalizeInventoryStatus(item.status);
                return (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <div className="col-span-4 text-white font-semibold text-sm">{item.name}</div>
                    <div className="col-span-2 text-gray-400 text-sm">
                      {item.branch_name ?? "Central"}
                    </div>
                    <div className="col-span-2 text-gray-300 text-sm font-bold">
                      {Number(item.quantity ?? 0)}{" "}
                      <span className="text-gray-600 font-normal">{item.unit}</span>
                    </div>
                    <div className="col-span-2 text-gray-500 text-sm">
                      {Number(item.minimum_qty ?? 0)} {item.unit}
                    </div>
                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${INV_STYLE[invStatus]}`}>
                        {invStatus === "ok"
                          ? "Available 🟢"
                          : invStatus === "low"
                          ? "Running Low 🟡"
                          : invStatus === "critical"
                          ? "Reorder Now 🔴"
                          : "Out of Stock ⚫"}
                      </span>
                    </div>
                  </div>
                );
              })}

              <Pagination
                current={inventoryPagination.currentPage}
                total={inventoryPagination.totalPages}
                onChange={inventoryPagination.setCurrentPage}
                className="px-6 py-4"
              />
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: SERVICES
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "services" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                {
                  title: "Total Services",
                  value: String(topServiceCards.reduce((a, s) => a + Number(s.count ?? 0), 0)),
                  accentBg: "bg-blue-500/10",
                  accentText: "text-blue-400",
                  border: "border-blue-500/20",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                },
                {
                  title: "Top Service",
                  value: topServiceCards.length ? topServiceCards[0].service : "—",
                  sub: "Highest revenue generator",
                  accentBg: "bg-red-500/10",
                  accentText: "text-red-400",
                  border: "border-red-500/20",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  ),
                },
                {
                  title: "Total Service Revenue",
                  value: `₱${topServiceCards.reduce((a, s) => a + Number(s.revenue ?? 0), 0).toLocaleString()}`,
                  accentBg: "bg-emerald-500/10",
                  accentText: "text-emerald-400",
                  border: "border-emerald-500/20",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
              ].map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-black text-white">Service Performance</h3>
                <p className="text-gray-500 text-sm mt-0.5">All service types ranked by revenue</p>
              </div>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-4">Service</div>
                <div className="col-span-2">Count</div>
                <div className="col-span-3">Revenue</div>
                <div className="col-span-2">Avg Time</div>
                <div className="col-span-1">Share</div>
              </div>
              {topServiceCards.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500 text-sm">
                  No service performance data available.
                </div>
              ) : (
                servicesPagination.paginatedItems.map((s, i) => {
                    const totalRev = sortedServiceCards.reduce((a, x) => a + Number(x.revenue ?? 0), 0);
                    const pct = totalRev ? ((Number(s.revenue ?? 0) / totalRev) * 100).toFixed(1) : "0.0";
                    return (
                      <div
                        key={i}
                        className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                      >
                        <div className="col-span-4 flex items-center gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }}
                          />
                          <span className="text-white font-semibold text-sm">{s.service}</span>
                        </div>
                        <div className="col-span-2 text-gray-400 text-sm">{s.count}</div>
                        <div className="col-span-3 text-white font-bold text-sm">
                          ₱{Number(s.revenue ?? 0).toLocaleString()}
                        </div>
                        <div className="col-span-2 text-gray-500 text-xs">{s.avg_time ?? "—"}</div>
                        <div className="col-span-1">
                          <span
                            className="text-xs font-bold"
                            style={{ color: SERVICE_COLORS[i % SERVICE_COLORS.length] }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}

              {topServiceCards.length > 0 && (
                <Pagination
                  current={servicesPagination.currentPage}
                  total={servicesPagination.totalPages}
                  onChange={servicesPagination.setCurrentPage}
                  className="px-6 py-4"
                />
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}