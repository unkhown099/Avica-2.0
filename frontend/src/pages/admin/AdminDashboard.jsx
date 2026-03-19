import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { Line, Doughnut, Bar } from "react-chartjs-2";
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

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};
const STATUS_LABEL = {
  completed: "Completed",
  in_progress: "In Progress",
  pending: "Pending",
  cancelled: "Cancelled",
};

// View tabs definition
const VIEWS = [
  {
    key: "overview",
    label: "Overview",
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    key: "revenue",
    label: "Revenue",
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    key: "customers",
    label: "Customers",
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    key: "services",
    label: "Services",
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

// ── Mock extra data for non-overview views ────────────────────────────────────
const MOCK_CUSTOMERS = [
  {
    name: "Maria Santos",
    visits: 12,
    spent: 28500,
    last_visit: "Mar 18, 2026",
    tier: "Gold",
  },
  {
    name: "Jose Reyes",
    visits: 8,
    spent: 14200,
    last_visit: "Mar 17, 2026",
    tier: "Silver",
  },
  {
    name: "Ana Cruz",
    visits: 5,
    spent: 9800,
    last_visit: "Mar 15, 2026",
    tier: "Silver",
  },
  {
    name: "Pedro Lim",
    visits: 20,
    spent: 52000,
    last_visit: "Mar 19, 2026",
    tier: "Platinum",
  },
  {
    name: "Rosa Dela Cruz",
    visits: 3,
    spent: 4500,
    last_visit: "Mar 10, 2026",
    tier: "Bronze",
  },
];

const MOCK_INVENTORY = [
  {
    item: "Engine Oil (10W-30)",
    stock: 48,
    unit: "liters",
    status: "ok",
    reorder: 20,
  },
  { item: "Oil Filter", stock: 12, unit: "pcs", status: "low", reorder: 15 },
  { item: "Air Filter", stock: 30, unit: "pcs", status: "ok", reorder: 10 },
  {
    item: "Brake Pads (Front)",
    stock: 6,
    unit: "sets",
    status: "critical",
    reorder: 8,
  },
  { item: "Wiper Blades", stock: 24, unit: "pcs", status: "ok", reorder: 10 },
  { item: "Coolant", stock: 9, unit: "liters", status: "low", reorder: 12 },
  { item: "Spark Plugs", stock: 40, unit: "pcs", status: "ok", reorder: 16 },
];

const MOCK_REVENUE_BREAKDOWN = [
  { month: "Jan", revenue: 82000, expenses: 34000, profit: 48000 },
  { month: "Feb", revenue: 95000, expenses: 38000, profit: 57000 },
  { month: "Mar", revenue: 110000, expenses: 41000, profit: 69000 },
];

const MOCK_SERVICES = [
  { service: "Oil Change", count: 87, revenue: 43500, avg_time: "45 min" },
  { service: "Tire Service", count: 62, revenue: 74400, avg_time: "1.5 hrs" },
  { service: "Engine Repair", count: 29, revenue: 145000, avg_time: "4 hrs" },
  { service: "Body Work", count: 18, revenue: 126000, avg_time: "8 hrs" },
  { service: "Brake Service", count: 41, revenue: 61500, avg_time: "2 hrs" },
  { service: "AC Service", count: 33, revenue: 49500, avg_time: "1.5 hrs" },
];

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

// ── Small reusable components ─────────────────────────────────────────────────
function StatCard({ title, value, icon, accentBg, accentText, border, sub }) {
  return (
    <div
      className={`bg-gray-900/60 border ${border} rounded-2xl p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${accentBg} ${accentText} p-3 rounded-xl`}>{icon}</div>
      </div>
      <div className="text-2xl font-black text-white mb-1">{value ?? "—"}</div>
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      {sub && (
        <div className={`text-xs font-semibold ${accentText}`}>{sub}</div>
      )}
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

// ── TIER badge ────────────────────────────────────────────────────────────────
const TIER_STYLE = {
  Platinum: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Gold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Silver: "bg-gray-400/20 text-gray-300 border-gray-400/30",
  Bronze: "bg-orange-700/20 text-orange-400 border-orange-700/30",
};

// ── INVENTORY status badge ────────────────────────────────────────────────────
const INV_STYLE = {
  ok: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  low: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ── Export helpers ────────────────────────────────────────────────────────────
function exportToCSV(rows, headers, filename) {
  const csvContent = [
    headers.join(","),
    ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function handlePrint(viewLabel) {
  window.print();
}

// ── Main Component ────────────────────────────────────────────────────────────
function AdminDashboard() {
  const [activeView, setActiveView] = useState("overview");
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [chart, setChart] = useState(null);
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
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/dashboard/`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          },
        );
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setStats(data.stats);
        setTransactions(data.recent_transactions ?? []);
        setChart(data.chart ?? null);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // ── Stat cards config ────────────────────────────────────────────────────
  const statCards = [
    {
      title: "Total Revenue",
      value: stats ? `₱${Number(stats.total_revenue).toLocaleString()}` : null,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
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
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
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
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      accentBg: "bg-blue-500/10",
      accentText: "text-blue-400",
      border: "border-blue-500/20",
    },
    {
      title: "Avg. Satisfaction",
      value: stats
        ? `${(((stats.avg_satisfaction ?? 0) / 5) * 100).toFixed(1)}%`
        : null,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      accentBg: "bg-emerald-500/10",
      accentText: "text-emerald-400",
      border: "border-emerald-500/20",
    },
  ];

  // ── Chart data ───────────────────────────────────────────────────────────
  const lineChartData = {
    labels: chart?.labels ?? [],
    datasets: [
      {
        label: "Revenue (₱)",
        data: chart?.revenue ?? [],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.08)",
        tension: 0.4,
        pointBackgroundColor: "#ef4444",
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y",
        fill: true,
      },
      {
        label: "Services Completed",
        data: chart?.services ?? [],
        borderColor: "#6b7280",
        backgroundColor: "rgba(107,114,128,0.05)",
        tension: 0.4,
        pointBackgroundColor: "#6b7280",
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y1",
        fill: true,
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
        labels: {
          color: "#9ca3af",
          usePointStyle: true,
          pointStyleWidth: 8,
          padding: 20,
          font: { size: 12 },
        },
      },
      tooltip: CHART_BASE.tooltip,
    },
    scales: {
      x: { grid: CHART_BASE.grid, ticks: CHART_BASE.ticks },
      y: {
        type: "linear",
        display: true,
        position: "left",
        beginAtZero: true,
        grid: CHART_BASE.grid,
        ticks: {
          ...CHART_BASE.ticks,
          callback: (v) => `₱${v.toLocaleString()}`,
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: CHART_BASE.ticks,
      },
    },
  };

  const doughnutChartData = {
    labels: [
      "Oil Change",
      "Tire Service",
      "Engine Repair",
      "Body Work",
      "Other",
    ],
    datasets: [
      {
        data: [35, 25, 20, 12, 8],
        backgroundColor: [
          "#ef4444",
          "#a855f7",
          "#3b82f6",
          "#10b981",
          "#f59e0b",
        ],
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
  const serviceBreakdown = [
    { label: "Oil Change", color: "#ef4444", pct: "35%" },
    { label: "Tire Service", color: "#a855f7", pct: "25%" },
    { label: "Engine Repair", color: "#3b82f6", pct: "20%" },
    { label: "Body Work", color: "#10b981", pct: "12%" },
    { label: "Other", color: "#f59e0b", pct: "8%" },
  ];

  // Revenue view bar chart
  const revenueBarData = {
    labels: MOCK_REVENUE_BREAKDOWN.map((r) => r.month),
    datasets: [
      {
        label: "Revenue",
        data: MOCK_REVENUE_BREAKDOWN.map((r) => r.revenue),
        backgroundColor: "rgba(239,68,68,0.7)",
        borderRadius: 6,
      },
      {
        label: "Expenses",
        data: MOCK_REVENUE_BREAKDOWN.map((r) => r.expenses),
        backgroundColor: "rgba(107,114,128,0.5)",
        borderRadius: 6,
      },
      {
        label: "Profit",
        data: MOCK_REVENUE_BREAKDOWN.map((r) => r.profit),
        backgroundColor: "rgba(16,185,129,0.6)",
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
        labels: {
          color: "#9ca3af",
          usePointStyle: true,
          padding: 20,
          font: { size: 12 },
        },
      },
      tooltip: CHART_BASE.tooltip,
    },
    scales: {
      x: { grid: CHART_BASE.grid, ticks: CHART_BASE.ticks },
      y: {
        beginAtZero: true,
        grid: CHART_BASE.grid,
        ticks: {
          ...CHART_BASE.ticks,
          callback: (v) => `₱${(v / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  // Customer spend bar chart
  const customerBarData = {
    labels: MOCK_CUSTOMERS.map((c) => c.name.split(" ")[0]),
    datasets: [
      {
        label: "Total Spent (₱)",
        data: MOCK_CUSTOMERS.map((c) => c.spent),
        backgroundColor: [
          "#a855f7",
          "#7c3aed",
          "#6d28d9",
          "#8b5cf6",
          "#c4b5fd",
        ],
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
        ticks: {
          ...CHART_BASE.ticks,
          callback: (v) => `₱${(v / 1000).toFixed(0)}k`,
        },
      },
      y: { grid: { display: false }, ticks: CHART_BASE.ticks },
    },
  };

  // ── Export handlers ──────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (activeView === "overview" || activeView === "revenue") {
      exportToCSV(
        transactions.map((r) => [
          r.customer_name,
          r.service,
          r.amount,
          r.status,
        ]),
        ["Customer", "Service", "Amount", "Status"],
        `transactions_${activeView}.csv`,
      );
    } else if (activeView === "customers") {
      exportToCSV(
        MOCK_CUSTOMERS.map((c) => [
          c.name,
          c.visits,
          c.spent,
          c.last_visit,
          c.tier,
        ]),
        ["Name", "Visits", "Total Spent", "Last Visit", "Tier"],
        "customers.csv",
      );
    } else if (activeView === "inventory") {
      exportToCSV(
        MOCK_INVENTORY.map((i) => [
          i.item,
          i.stock,
          i.unit,
          i.status,
          i.reorder,
        ]),
        ["Item", "Stock", "Unit", "Status", "Reorder At"],
        "inventory.csv",
      );
    } else if (activeView === "services") {
      exportToCSV(
        MOCK_SERVICES.map((s) => [s.service, s.count, s.revenue, s.avg_time]),
        ["Service", "Count", "Revenue", "Avg Time"],
        "services.csv",
      );
    }
  };

  const getInitial = (name = "") => name.charAt(0).toUpperCase();
  const normalizeStatus = (s = "") => s.toLowerCase().replace(/\s+/g, "_");
  const currentYear = new Date().getFullYear();
  const chartSubtitle = chart?.labels?.length
    ? `${chart.labels[0]} – ${chart.labels[chart.labels.length - 1]} ${currentYear}`
    : `${currentYear}`;

  const viewLabel =
    VIEWS.find((v) => v.key === activeView)?.label ?? "Dashboard";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="" subtitle="">
      <div
        ref={printRef}
        className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8 print:bg-white print:p-4"
      >
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

          {/* Action buttons: Print + Excel */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => handlePrint(viewLabel)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-white/20 transition-all text-sm font-semibold"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 transition-all text-sm font-semibold"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
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
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4">
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: OVERVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "overview" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                : statCards.map((card, i) => <StatCard key={i} {...card} />)}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
              {/* Line Chart */}
              <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-white">
                      Revenue & Services Trend
                    </h3>
                    <p className="text-gray-500 text-sm mt-0.5">
                      {chartSubtitle}
                    </p>
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
                  <h3 className="text-lg font-black text-white">
                    Service Distribution
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5">
                    By category this month
                  </p>
                </div>
                <div className="h-44 flex items-center justify-center mb-6">
                  <Doughnut
                    data={doughnutChartData}
                    options={doughnutChartOptions}
                  />
                </div>
                <div className="space-y-3">
                  {serviceBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-400 flex-1">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: item.pct,
                              backgroundColor: item.color,
                            }}
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
                  <h3 className="text-lg font-black text-white">
                    Recent Transactions
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5">
                    Latest service activity
                  </p>
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
                  <svg
                    className="w-10 h-10 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm">
                    No transactions found.
                  </p>
                </div>
              ) : (
                transactions.map((row, i) => {
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
                      <div className="col-span-3 text-gray-400 text-sm">
                        {row.service}
                      </div>
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
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
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
                    {loading ? "—" : transactions.length}
                  </span>{" "}
                  of{" "}
                  <span className="text-white font-semibold">
                    {loading ? "—" : (stats?.services_completed ?? "—")}
                  </span>{" "}
                  transactions
                </p>
              </div>
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
                  value: "₱287,000",
                  accentBg: "bg-red-500/10",
                  accentText: "text-red-400",
                  border: "border-red-500/20",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Total Expenses (Q1)",
                  value: "₱113,000",
                  accentBg: "bg-gray-500/10",
                  accentText: "text-gray-400",
                  border: "border-gray-500/20",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Net Profit (Q1)",
                  value: "₱174,000",
                  accentBg: "bg-emerald-500/10",
                  accentText: "text-emerald-400",
                  border: "border-emerald-500/20",
                  sub: "+12.4% vs last quarter",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  ),
                },
              ].map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm mb-6">
              <h3 className="text-lg font-black text-white mb-1">
                Monthly Revenue Breakdown
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Revenue, Expenses & Profit — Q1 {currentYear}
              </p>
              <div className="h-72">
                <Bar data={revenueBarData} options={revenueBarOptions} />
              </div>
            </div>

            {/* Revenue table */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-black text-white">
                  Monthly Detail
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div>Month</div>
                <div>Revenue</div>
                <div>Expenses</div>
                <div>Profit</div>
              </div>
              {MOCK_REVENUE_BREAKDOWN.map((r) => (
                <div
                  key={r.month}
                  className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="text-white font-semibold">
                    {r.month} {currentYear}
                  </div>
                  <div className="text-red-400 font-bold">
                    ₱{r.revenue.toLocaleString()}
                  </div>
                  <div className="text-gray-400">
                    ₱{r.expenses.toLocaleString()}
                  </div>
                  <div className="text-emerald-400 font-bold">
                    ₱{r.profit.toLocaleString()}
                  </div>
                </div>
              ))}
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
                  value: stats
                    ? Number(stats.total_customers).toLocaleString()
                    : "—",
                  accentBg: "bg-purple-500/10",
                  accentText: "text-purple-400",
                  border: "border-purple-500/20",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Avg. Visits/Customer",
                  value: "8.4",
                  accentBg: "bg-blue-500/10",
                  accentText: "text-blue-400",
                  border: "border-blue-500/20",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Top Spender",
                  value: "Pedro Lim",
                  sub: "₱52,000 total",
                  accentBg: "bg-yellow-500/10",
                  accentText: "text-yellow-400",
                  border: "border-yellow-500/20",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  ),
                },
              ].map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              {/* Customer spend chart */}
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-black text-white mb-1">
                  Customer Spend
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Top customers by total spending
                </p>
                <div className="h-56">
                  <Bar data={customerBarData} options={customerBarOptions} />
                </div>
              </div>

              {/* Tier distribution */}
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-black text-white mb-1">
                  Tier Distribution
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Customer loyalty tiers
                </p>
                <div className="space-y-4 mt-4">
                  {[
                    { tier: "Platinum", count: 1, color: "#06b6d4" },
                    { tier: "Gold", count: 1, color: "#eab308" },
                    { tier: "Silver", count: 2, color: "#9ca3af" },
                    { tier: "Bronze", count: 1, color: "#ea580c" },
                  ].map((t) => (
                    <div key={t.tier} className="flex items-center gap-4">
                      <span className="text-sm text-gray-400 w-20">
                        {t.tier}
                      </span>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(t.count / 5) * 100}%`,
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

            {/* Customers Table */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-black text-white">Customer List</h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  All registered customers
                </p>
              </div>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Visits</div>
                <div className="col-span-3">Total Spent</div>
                <div className="col-span-2">Last Visit</div>
                <div className="col-span-1">Tier</div>
              </div>
              {MOCK_CUSTOMERS.map((c, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-sm font-bold shrink-0">
                      {getInitial(c.name)}
                    </div>
                    <span className="text-white font-semibold text-sm">
                      {c.name}
                    </span>
                  </div>
                  <div className="col-span-2 text-gray-400 text-sm font-semibold">
                    {c.visits}x
                  </div>
                  <div className="col-span-3 text-white font-bold text-sm">
                    ₱{c.spent.toLocaleString()}
                  </div>
                  <div className="col-span-2 text-gray-500 text-xs">
                    {c.last_visit}
                  </div>
                  <div className="col-span-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold border ${TIER_STYLE[c.tier] ?? ""}`}
                    >
                      {c.tier}
                    </span>
                  </div>
                </div>
              ))}
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
                  value: String(MOCK_INVENTORY.length),
                  accentBg: "bg-blue-500/10",
                  accentText: "text-blue-400",
                  border: "border-blue-500/20",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Low Stock Items",
                  value: String(
                    MOCK_INVENTORY.filter((i) => i.status === "low").length,
                  ),
                  accentBg: "bg-amber-500/10",
                  accentText: "text-amber-400",
                  border: "border-amber-500/20",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Critical Items",
                  value: String(
                    MOCK_INVENTORY.filter((i) => i.status === "critical")
                      .length,
                  ),
                  sub: "Needs immediate reorder",
                  accentBg: "bg-red-500/10",
                  accentText: "text-red-400",
                  border: "border-red-500/20",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ),
                },
              ].map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-black text-white">
                  Parts & Supplies Inventory
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  Current stock levels
                </p>
              </div>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-5">Item</div>
                <div className="col-span-2">Stock</div>
                <div className="col-span-2">Reorder At</div>
                <div className="col-span-2">Level</div>
                <div className="col-span-1">Status</div>
              </div>
              {MOCK_INVENTORY.map((item, i) => {
                const pct = Math.min(
                  100,
                  Math.round((item.stock / (item.reorder * 3)) * 100),
                );
                const barColor =
                  item.status === "ok"
                    ? "#10b981"
                    : item.status === "low"
                      ? "#f59e0b"
                      : "#ef4444";
                return (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <div className="col-span-5 text-white font-semibold text-sm">
                      {item.item}
                    </div>
                    <div className="col-span-2 text-gray-300 text-sm font-bold">
                      {item.stock}{" "}
                      <span className="text-gray-600 font-normal">
                        {item.unit}
                      </span>
                    </div>
                    <div className="col-span-2 text-gray-500 text-sm">
                      {item.reorder} {item.unit}
                    </div>
                    <div className="col-span-2">
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-span-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${INV_STYLE[item.status]}`}
                      >
                        {item.status === "ok"
                          ? "OK"
                          : item.status === "low"
                            ? "Low"
                            : "Critical"}
                      </span>
                    </div>
                  </div>
                );
              })}
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
                  value: String(MOCK_SERVICES.reduce((a, s) => a + s.count, 0)),
                  accentBg: "bg-blue-500/10",
                  accentText: "text-blue-400",
                  border: "border-blue-500/20",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Top Service",
                  value: "Engine Repair",
                  sub: "Highest revenue generator",
                  accentBg: "bg-red-500/10",
                  accentText: "text-red-400",
                  border: "border-red-500/20",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Total Service Revenue",
                  value: `₱${MOCK_SERVICES.reduce((a, s) => a + s.revenue, 0).toLocaleString()}`,
                  accentBg: "bg-emerald-500/10",
                  accentText: "text-emerald-400",
                  border: "border-emerald-500/20",
                  icon: (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                },
              ].map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-black text-white">
                  Service Performance
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  All service types ranked by revenue
                </p>
              </div>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-4">Service</div>
                <div className="col-span-2">Count</div>
                <div className="col-span-3">Revenue</div>
                <div className="col-span-2">Avg Time</div>
                <div className="col-span-1">Share</div>
              </div>
              {[...MOCK_SERVICES]
                .sort((a, b) => b.revenue - a.revenue)
                .map((s, i) => {
                  const totalRev = MOCK_SERVICES.reduce(
                    (a, x) => a + x.revenue,
                    0,
                  );
                  const pct = ((s.revenue / totalRev) * 100).toFixed(1);
                  const colors = [
                    "#ef4444",
                    "#a855f7",
                    "#3b82f6",
                    "#10b981",
                    "#f59e0b",
                    "#06b6d4",
                  ];
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: colors[i] }}
                        />
                        <span className="text-white font-semibold text-sm">
                          {s.service}
                        </span>
                      </div>
                      <div className="col-span-2 text-gray-400 text-sm">
                        {s.count}
                      </div>
                      <div className="col-span-3 text-white font-bold text-sm">
                        ₱{s.revenue.toLocaleString()}
                      </div>
                      <div className="col-span-2 text-gray-500 text-xs">
                        {s.avg_time}
                      </div>
                      <div className="col-span-1">
                        <span
                          className="text-xs font-bold"
                          style={{ color: colors[i] }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;