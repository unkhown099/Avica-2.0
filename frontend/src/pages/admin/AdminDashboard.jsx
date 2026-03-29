import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE } from "../../hooks/useAuth.js";
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
import html2canvas from "html2canvas";
import AdminLayout from "./AdminLayout.jsx";
import { useOverview } from "../../hooks/useDashboard";
import { ErrorBanner, exportToCSV } from "../../components/admin/DashboardUI";
import NotificationDropdown from "../../components/NotificationDropdown.jsx";

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

const SECTION_KEYS = ["overview", "revenue", "appointment", "customers", "inventory", "services", "employees"];

const VIEWS = [
  {
    key: "overview",
    label: "Overview",
    icon: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    key: "revenue",
    label: "Revenue",
    icon: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "appointment",
    label: "Appointment",
    icon: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: "customers",
    label: "Customers",
    icon: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: "services",
    label: "Services",
    icon: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: "employees",
    label: "Employees",
    icon: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V10H2v10h5m10 0v-2a4 4 0 10-8 0v2m8 0H9m4-12a4 4 0 110 8 4 4 0 010-8z" />
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
  done: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  cancelled: "bg-red-500/20 text-red-100 border-red-500/30",
  no_show: "bg-red-500/20 text-red-300 border-red-500/30",
  in_progress: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rescheduled: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

const STATUS_LABEL = {
  done: "Done",
  completed: "Completed",
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  no_show: "No Show",
  in_progress: "In Progress",
  rescheduled: "Rescheduled",
};

// ── Small reusable components ─────────────────────────────────────────────────
function StatCard({ title, value, icon, accentBg, accentText, border, sub }) {
  return (
    <div className={`bg-gray-900/60 border ${border} rounded-xl sm:rounded-2xl p-3 sm:p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}>
      <div className="flex items-start justify-between mb-2 sm:mb-4">
        <div className={`${accentBg} ${accentText} p-1.5 sm:p-3 rounded-lg sm:rounded-xl`}>{icon}</div>
      </div>
      <div className="text-lg sm:text-2xl font-black text-white mb-0.5 sm:mb-1 truncate">{value ?? "—"}</div>
      <div className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1 truncate">{title}</div>
      {sub && <div className={`text-[10px] sm:text-xs font-semibold ${accentText} truncate`}>{sub}</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-5 animate-pulse">
      <div className="flex justify-between mb-2 sm:mb-4">
        <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gray-800" />
      </div>
      <div className="h-5 sm:h-7 w-16 sm:w-24 bg-gray-800 rounded mb-1 sm:mb-2" />
      <div className="h-2 sm:h-4 w-20 sm:w-32 bg-gray-800 rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-4 border-b border-white/5 animate-pulse items-center">
      <div className="col-span-2 sm:col-span-4 flex items-center gap-2 sm:gap-3">
        <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gray-800 shrink-0" />
        <div className="h-2 sm:h-4 w-16 sm:w-28 bg-gray-800 rounded" />
      </div>
      <div className="hidden sm:block sm:col-span-3 h-2 sm:h-4 w-12 sm:w-20 bg-gray-800 rounded" />
      <div className="col-span-1 sm:col-span-2 h-2 sm:h-4 w-10 sm:w-14 bg-gray-800 rounded" />
      <div className="col-span-2 sm:col-span-2 h-4 sm:h-6 w-12 sm:w-20 bg-gray-800 rounded-full" />
      <div className="col-span-1 sm:col-span-1" />
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

function normalizeStatus(s = "") {
  return String(s).toLowerCase().replace(/\s+/g, "_");
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const location = useLocation();
  const [activeView, setActiveView] = useState("overview");
  const [activeExportSection, setActiveExportSection] = useState("overview");
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [chart, setChart] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [queueHistory, setQueueHistory] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryBranchFilter, setInventoryBranchFilter] = useState("All Branches");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const token =
          localStorage.getItem("access_token") ??
          sessionStorage.getItem("access_token");
        const baseUrl = API_BASE;
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const [dashboardRes, customersRes, inventoryRes, appointmentsRes, queueHistoryRes] = await Promise.all([
          fetch(`${baseUrl}/dashboard/`, { headers, credentials: "include" }),
          fetch(`${baseUrl}/customers/`, { headers, credentials: "include" }),
          fetch(`${baseUrl}/inventory/`, { headers, credentials: "include" }),
          fetch(`${baseUrl}/appointments/`, { headers, credentials: "include" }),
          fetch(`${baseUrl}/api/queue/history/`, { headers, credentials: "include" }),
        ]);

        if (!dashboardRes.ok) throw new Error(`Dashboard: ${dashboardRes.status}`);
        if (!customersRes.ok) throw new Error(`Customers: ${customersRes.status}`);
        if (!inventoryRes.ok) throw new Error(`Inventory: ${inventoryRes.status}`);
        if (!appointmentsRes.ok) throw new Error(`Appointments: ${appointmentsRes.status}`);

        const [dashboardData, customersData, inventoryData, appointmentsData, queueHistoryData] = await Promise.all([
          dashboardRes.json(),
          customersRes.json(),
          inventoryRes.json(),
          appointmentsRes.json(),
          queueHistoryRes.ok ? queueHistoryRes.json() : Promise.resolve([]),
        ]);

        setStats(dashboardData.stats);
        setTransactions(dashboardData.recent_transactions ?? []);
        setChart(dashboardData.chart ?? null);
        setAnalytics(dashboardData.analytics ?? null);
        setCustomers(customersData ?? []);
        setInventoryItems(inventoryData ?? []);
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData.results ?? []));
        setQueueHistory(Array.isArray(queueHistoryData) ? queueHistoryData : (queueHistoryData?.results ?? []));
      } catch (err) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (SECTION_KEYS.includes(hash)) {
      setActiveView(hash);
      setActiveExportSection(hash);
      return;
    }
    setActiveView("overview");
    setActiveExportSection("overview");
  }, []);

  // Watch location.hash for changes (for React Router Link clicks)
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (SECTION_KEYS.includes(hash)) {
      setActiveView(hash);
      setActiveExportSection(hash);
    }
  }, [location.hash]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (SECTION_KEYS.includes(hash)) {
        setActiveView(hash);
        setActiveExportSection(hash);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
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
    pageSize: 5,
    resetDeps: [transactions.length],
  });

  const revenueBranchPagination = usePagination({
    items: revenueByBranch,
    pageSize: 5,
    resetDeps: [revenueByBranch.length],
  });

  const customersPagination = usePagination({
    items: customers,
    pageSize: 5,
    resetDeps: [customers.length],
  });

  const inventoryPagination = usePagination({
    items: filteredInventoryItems,
    pageSize: 5,
    resetDeps: [inventoryBranchFilter, filteredInventoryItems.length],
  });

  const servicesPagination = usePagination({
    items: sortedServiceCards,
    pageSize: 5,
    resetDeps: [topServiceCards.length],
  });

  const employeeWorkloadRows = useMemo(() => {
    const grouped = queueHistory.reduce((acc, entry) => {
      const assignedName =
        entry?.assigned_employee?.full_name ||
        entry?.assigned_employee_name ||
        "Unassigned";

      if (!acc[assignedName]) {
        acc[assignedName] = {
          employee: assignedName,
          branch: entry?.branch || entry?.branch_name || "Unknown Branch",
          total: 0,
          completed: 0,
          skipped: 0,
        };
      }

      const status = normalizeStatus(entry?.status);
      acc[assignedName].total += 1;
      if (status === "done" || status === "completed") acc[assignedName].completed += 1;
      if (status === "skipped") acc[assignedName].skipped += 1;
      return acc;
    }, {});

    const rows = Object.values(grouped).sort((a, b) => {
      const totalDiff = Number(b.total) - Number(a.total);
      if (totalDiff !== 0) return totalDiff;
      return Number(b.completed) - Number(a.completed);
    });

    const grandTotal = rows.reduce((sum, row) => sum + Number(row.total), 0);
    return rows.map((row) => ({
      ...row,
      share: grandTotal > 0 ? (Number(row.total) / grandTotal) * 100 : 0,
    }));
  }, [queueHistory]);

  const employeeWorkloadPagination = usePagination({
    items: employeeWorkloadRows,
    pageSize: 5,
    resetDeps: [employeeWorkloadRows.length],
  });

  const appointmentsPagination = usePagination({
    items: appointments,
    pageSize: 5,
    resetDeps: [appointments.length],
  });

  const appointmentStatusCounts = appointments.reduce(
    (acc, apt) => {
      const key = normalizeStatus(apt.status);
      if (key === "confirmed") acc.confirmed += 1;
      else if (key === "pending") acc.pending += 1;
      else if (key === "cancelled") acc.cancelled += 1;
      else if (key === "no_show") acc.noShow += 1;
      return acc;
    },
    { confirmed: 0, pending: 0, cancelled: 0, noShow: 0 },
  );

  // ── Stat cards config ────────────────────────────────────────────────────
  const statCards = [
    {
      title: "Total Revenue",
      value: stats ? `₱${Number(stats.total_revenue).toLocaleString()}` : null,
      icon: (
        <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accentBg: "bg-red-500/10",
      accentText: "text-red-400",
      border: "border-red-500/20",
      sub: "Includes appointments and walk-ins",
    },
    {
      title: "Total Customers",
      value: stats ? Number(stats.total_customers).toLocaleString() : null,
      icon: (
        <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    cutout: "70%",
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
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: "Services",
        data: chart?.services ?? [],
        borderColor: "#a855f7",
        backgroundColor: "rgba(168,85,247,0.08)",
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 5,
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
        labels: { color: "#9ca3af", usePointStyle: true, padding: 10, font: { size: 10 } },
      },
      tooltip: CHART_BASE.tooltip,
    },
    scales: {
      x: { grid: CHART_BASE.grid, ticks: { ...CHART_BASE.ticks, maxRotation: 45, minRotation: 45 } },
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
        labels: { color: "#9ca3af", usePointStyle: true, padding: 10, font: { size: 10 } },
      },
      tooltip: CHART_BASE.tooltip,
    },
    scales: {
      x: { grid: CHART_BASE.grid, ticks: { ...CHART_BASE.ticks, maxRotation: 45, minRotation: 45 } },
      y: {
        beginAtZero: true,
        grid: CHART_BASE.grid,
        ticks: { ...CHART_BASE.ticks, callback: (v) => `₱${(v / 1000).toFixed(0)}k` },
      },
    },
  };

  const customerBarData = {
    labels: customers.slice(0, 5).map((c) => (c.first_name || "N/A").split(" ")[0]),
    datasets: [
      {
        label: "Total Spent (₱)",
        data: customers.slice(0, 5).map((c) => Number(c.total_spent ?? 0)),
        backgroundColor: ["#a855f7", "#7c3aed", "#6d28d9", "#8b5cf6", "#c4b5fd"],
        borderRadius: 6,
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
    } else if (activeView === "appointment") {
      exportToCSV(
        appointments.map((a) => [
          a.date ?? "—",
          a.time ?? "—",
          a.customer_name ?? "—",
          a.service ?? "—",
          a.branch_name ?? "—",
          a.status ?? "—",
        ]),
        ["Date", "Time", "Customer", "Service", "Branch", "Status"],
        "appointments.csv",
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
    } else if (activeView === "employees") {
      exportToCSV(
        employeeWorkloadRows.map((row) => [row.employee, row.branch, row.total, row.completed, row.skipped, row.share.toFixed(1)]),
        ["Employee", "Branch", "Total Tasks", "Completed", "Skipped", "Workload Share (%)"],
        "employees_workload.csv",
      );
    }
  };

  const handlePrintDashboard = async () => {
    const sectionSelector = {
      overview: "#admin-overview",
      revenue: "#admin-revenue",
      appointment: "#admin-appointment",
      customers: "#admin-customers",
      inventory: "#admin-inventory",
      services: "#admin-services",
      employees: "#admin-employees",
    }[activeView];
 
    const activeSection = document.querySelector(sectionSelector);
    if (!activeSection) return;

    try {
      const canvas = await html2canvas(activeSection, {
        backgroundColor: "#030712",
        scale: 2,
        useCORS: true,
        logging: false,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Admin Dashboard — ${viewLabel}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #fff; }
            img {
              width: 100%;
              height: auto;
              display: block;
            }
            @page { size: A4 portrait; margin: 8mm; }
            @media print {
              img { width: 100% !important; }
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" />
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
      printWindow.document.close();
    } catch (err) {
      console.error("Print failed:", err);
    }
  };

  useEffect(() => {
    const originalPrint = window.print.bind(window);
    const onKeyDown = (e) => {
      const isPrintShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p";
      if (!isPrintShortcut) return;
      e.preventDefault();
      handlePrintDashboard();
    };

    window.print = () => {
      handlePrintDashboard();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.print = originalPrint;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handlePrintDashboard]);

  const getInitial = (name = "") => name.charAt(0).toUpperCase();
  const viewLabel = VIEWS.find((v) => v.key === activeView)?.label ?? "Dashboard";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="" subtitle="">
      <style>{`
        @media print {
          #admin-dashboard-print {
            background: #fff !important;
            color: #111827 !important;
          }
          #admin-dashboard-print * {
            color: #111827 !important;
            text-shadow: none !important;
          }
          #admin-dashboard-print [class*="bg-"] {
            background: transparent !important;
          }
          #admin-dashboard-print [class*="border-"] {
            border-color: #d1d5db !important;
          }
          #admin-dashboard-print canvas {
            max-width: 100% !important;
            height: auto !important;
          }
        }
        
        /* Mobile responsive table overrides */
        @media (max-width: 640px) {
          .mobile-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          .mobile-card-view {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
        }
      `}</style>
      <div
        id="admin-dashboard-print"
        className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-3 sm:p-8 print:bg-white print:p-4"
      >
        <div>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight print:text-black">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5 print:text-gray-600">
              Welcome back — here's what's happening today.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 print:hidden">
            <NotificationDropdown />

          </div>
        </div>

        {/* ── Error Banner ────────────────────────────────────────────────── */}
        {error && (
          <ErrorBanner message={error} onRetry={refetch} />
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: OVERVIEW
        ══════════════════════════════════════════════════════════════════ */}
    {activeView === "overview" && (
  <section id="admin-overview" className="scroll-mt-20 sm:scroll-mt-24 mb-6 sm:mb-10">
    <div className="mb-3 sm:mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base sm:text-xl font-black text-white">Overview</h2>
        <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Snapshot of daily operations</p>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 print:hidden shrink-0">
        <button
          onClick={handlePrintDashboard}
          className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-white/20 transition-all text-xs sm:text-sm font-semibold"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span className="hidden sm:inline">Print</span>
        </button>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 transition-all text-xs sm:text-sm font-semibold"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>
    </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                : statCards.map((card, i) => <StatCard key={i} {...card} />)}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
              {/* Line Chart */}
              <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3 sm:mb-6">
                  <div>
                    <h3 className="text-sm sm:text-lg font-black text-white">Revenue & Services Trend</h3>
                    <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">{chartSubtitle} · includes walk-ins</p>
                  </div>
                </div>
                {loading ? (
                  <div className="h-40 sm:h-64 flex items-center justify-center">
                    <div className="w-5 h-5 sm:w-8 sm:h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : !chart?.labels?.length ? (
                  <div className="h-40 sm:h-64 flex items-center justify-center text-gray-600 text-xs sm:text-sm">
                    No booking data available for {currentYear} yet.
                  </div>
                ) : (
                  <div className="h-40 sm:h-64">
                    <Line data={lineChartData} options={lineChartOptions} />
                  </div>
                )}
              </div>

              {/* Doughnut */}
              <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 backdrop-blur-sm">
                <div className="mb-3 sm:mb-6">
                  <h3 className="text-sm sm:text-lg font-black text-white">Service Distribution</h3>
                  <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">By category this month</p>
                </div>
                <div className="h-32 sm:h-44 flex items-center justify-center mb-3 sm:mb-6">
                  {!serviceDistribution.length ? (
                    <div className="text-gray-600 text-xs sm:text-sm text-center">
                      No service distribution data this month.
                    </div>
                  ) : (
                    <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                  )}
                </div>
                <div className="space-y-1.5 sm:space-y-3">
                  {serviceBreakdown.slice(0, 4).map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5 sm:gap-3">
                      <div
                        className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[10px] sm:text-sm text-gray-400 flex-1 truncate">{item.label}</span>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-10 sm:w-16 h-1 sm:h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: item.pct, backgroundColor: item.color }}
                          />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-white w-5 sm:w-8 text-right">
                          {item.pct}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transactions Table - Mobile Responsive */}
            <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-3 sm:px-6 py-2 sm:py-4 border-b border-white/5">
                <div>
                  <h3 className="text-sm sm:text-lg font-black text-white">Recent Transactions</h3>
                  <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Latest paid activity (appointments + walk-ins)</p>
                </div>
              </div>
              
              {/* Mobile view - card layout */}
              <div className="block sm:hidden">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 border-b border-white/5 animate-pulse">
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-16 h-4 bg-gray-800 rounded"></div>
                        <div className="w-12 h-6 bg-gray-800 rounded-full"></div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-3 bg-gray-800 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : transactions.length === 0 ? (
                  <div className="px-3 py-6 flex flex-col items-center gap-2 text-center">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-xs">No transactions found.</p>
                  </div>
                ) : (
                  transactionsPagination.paginatedItems.map((row, i) => {
                    const statusKey = normalizeStatus(row.status);
                    return (
                      <div key={i} className="p-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center text-xs font-bold">
                              {getInitial(row.customer_name)}
                            </div>
                            <span className="text-white font-semibold text-xs">{row.customer_name}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLE[statusKey] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                            {STATUS_LABEL[statusKey] ?? row.status}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-gray-400 text-xs">{row.service}</div>
                          <div className="flex justify-between items-center">
                            <span className="text-white font-bold text-xs">₱{Number(row.amount).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop view - table layout */}
              <div className="hidden sm:block overflow-x-auto">
                <div className="min-w-[640px]">
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
                              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center text-sm font-bold shrink-0">
                                {getInitial(row.customer_name)}
                              </div>
                              <span className="text-white font-semibold text-sm">
                                {row.customer_name}
                              </span>
                            </div>
                          </div>
                          <div className="col-span-3 text-gray-400 text-sm truncate">{row.service}</div>
                          <div className="col-span-2 text-white font-bold text-sm">
                            ₱{Number(row.amount).toLocaleString()}
                          </div>
                          <div className="col-span-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[statusKey] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                            >
                              {STATUS_LABEL[statusKey] ?? row.status}
                            </span>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button className="opacity-100 p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              <div className="px-3 sm:px-6 py-2 sm:py-4">
                <p className="text-gray-500 text-[10px] sm:text-sm">
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
                  className="px-3 sm:px-6 pb-3 sm:pb-6"
                />
              )}
            </div>
        </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: REVENUE - Mobile responsive version
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "revenue" && (
        <section id="admin-revenue" className="scroll-mt-20 sm:scroll-mt-24 mb-6 sm:mb-10">
          <div className="mb-3 sm:mb-4 flex items-start justify-between gap-3">
  <div>
    <h2 className="text-base sm:text-xl font-black text-white">Revenue</h2>
    <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Income performance across branches</p>
  </div>
  <div className="flex items-center gap-1.5 sm:gap-2 print:hidden shrink-0">
    <button
      onClick={handlePrintDashboard}
      className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-white/20 transition-all text-xs sm:text-sm font-semibold"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      <span className="hidden sm:inline">Print</span>
    </button>
    <button
      onClick={handleExportCSV}
      className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 transition-all text-xs sm:text-sm font-semibold"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  </div>
</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
              {[
                {
                  title: "Total Revenue (Q1)",
                  value: stats ? `₱${Number(stats.total_revenue ?? 0).toLocaleString()}` : "—",
                  accentBg: "bg-red-500/10",
                  accentText: "text-red-400",
                  border: "border-red-500/20",
                  sub: "Appointments + walk-ins",
                  icon: (
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ),
                },
              ].map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 backdrop-blur-sm mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-lg font-black text-white mb-0.5">Revenue by Branch</h3>
              <p className="text-gray-500 text-[10px] sm:text-sm mb-3 sm:mb-6">Live totals from appointments and paid walk-ins</p>
              <div className="h-40 sm:h-72">
                <Bar data={revenueBarData} options={revenueBarOptions} />
              </div>
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-3 sm:px-6 py-2 sm:py-4 border-b border-white/5">
                <h3 className="text-sm sm:text-lg font-black text-white">Branch Revenue Detail</h3>
              </div>
              <div className="hidden sm:grid sm:grid-cols-2 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div>Branch</div>
                <div>Revenue</div>
              </div>
              
              {/* Mobile card view */}
              <div className="block sm:hidden">
                {revenueBranchPagination.paginatedItems.map((row, idx) => (
                  <div key={`${row.branch}-${idx}`} className="p-3 border-b border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-xs">{row.branch}</span>
                      <span className="text-red-400 font-bold text-xs">
                        ₱{Number(row.revenue ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop grid view */}
              <div className="hidden sm:block">
                {revenueBranchPagination.paginatedItems.map((row, idx) => (
                  <div
                    key={`${row.branch}-${idx}`}
                    className="grid grid-cols-2 gap-4 px-6 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <div className="text-white font-semibold text-sm">{row.branch}</div>
                    <div className="text-red-400 font-bold text-sm">
                      ₱{Number(row.revenue ?? 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                current={revenueBranchPagination.currentPage}
                total={revenueBranchPagination.totalPages}
                onChange={revenueBranchPagination.setCurrentPage}
                className="px-3 sm:px-6 py-2 sm:py-4"
              />
            </div>
        </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: APPOINTMENT - Mobile responsive version
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "appointment" && (
        <section id="admin-appointment" className="scroll-mt-20 sm:scroll-mt-24 mb-6 sm:mb-10">
     <div className="mb-3 sm:mb-4 flex items-start justify-between gap-3">
  <div>
    <h2 className="text-base sm:text-xl font-black text-white">Appointment</h2>
    <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Track and review all service bookings</p>
  </div>
  <div className="flex items-center gap-1.5 sm:gap-2 print:hidden shrink-0">
    <button
      onClick={handlePrintDashboard}
      className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-white/20 transition-all text-xs sm:text-sm font-semibold"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      <span className="hidden sm:inline">Print</span>
    </button>
    <button
      onClick={handleExportCSV}
      className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 transition-all text-xs sm:text-sm font-semibold"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  </div>
</div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
            {[
              {
                title: "Total Appointments",
                value: appointments.length.toLocaleString(),
                accentBg: "bg-blue-500/10",
                accentText: "text-blue-400",
                border: "border-blue-500/20",
                icon: (
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                title: "Confirmed",
                value: appointmentStatusCounts.confirmed.toLocaleString(),
                accentBg: "bg-emerald-500/10",
                accentText: "text-emerald-400",
                border: "border-emerald-500/20",
                icon: (
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ),
              },
              {
                title: "Pending",
                value: appointmentStatusCounts.pending.toLocaleString(),
                accentBg: "bg-amber-500/10",
                accentText: "text-amber-400",
                border: "border-amber-500/20",
                icon: (
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: "Cancelled / No Show",
                value: (appointmentStatusCounts.cancelled + appointmentStatusCounts.noShow).toLocaleString(),
                accentBg: "bg-red-500/10",
                accentText: "text-red-400",
                border: "border-red-500/20",
                icon: (
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ),
              },
            ].map((c, i) => (
              <StatCard key={i} {...c} />
            ))}
          </div>

          <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-3 sm:px-6 py-2 sm:py-4 border-b border-white/5">
              <h3 className="text-sm sm:text-lg font-black text-white">Appointment List</h3>
              <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">All scheduled appointment records</p>
            </div>
            
            {/* Mobile card view */}
            <div className="block sm:hidden">
              {appointmentsPagination.paginatedItems.length === 0 ? (
                <div className="px-3 py-6 text-center text-gray-500 text-xs">
                  No appointment data available.
                </div>
              ) : (
                appointmentsPagination.paginatedItems.map((apt, i) => {
                  const statusKey = normalizeStatus(apt.status);
                  return (
                    <div key={apt.id ?? `${apt.customer_name ?? "apt"}-${apt.date ?? "date"}-${i}`} className="p-3 border-b border-white/5">
                      <div className="flex justify-between items-start mb-1.5">
                        <div>
                          <div className="text-white font-semibold text-xs">{apt.customer_name ?? "—"}</div>
                          <div className="text-gray-400 text-[10px]">{apt.date ?? "—"} • {apt.time ? String(apt.time).slice(0, 5) : "—"}</div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLE[statusKey] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                          {STATUS_LABEL[statusKey] ?? apt.status ?? "—"}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <div className="text-gray-300 text-xs">{apt.service ?? "—"}</div>
                        <div className="text-gray-500 text-[10px] mt-0.5">{apt.branch_name ?? "—"}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[768px]">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-1">Time</div>
                  <div className="col-span-2">Customer</div>
                  <div className="col-span-3">Service</div>
                  <div className="col-span-2">Branch</div>
                  <div className="col-span-2">Status</div>
                </div>

                {appointmentsPagination.paginatedItems.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500 text-sm">
                    No appointment data available.
                  </div>
                ) : (
                  appointmentsPagination.paginatedItems.map((apt, i) => {
                    const statusKey = normalizeStatus(apt.status);
                    return (
                      <div
                        key={apt.id ?? `${apt.customer_name ?? "apt"}-${apt.date ?? "date"}-${i}`}
                        className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                      >
                        <div className="col-span-2 text-white font-semibold text-sm">
                          {apt.date ?? "—"}
                        </div>
                        <div className="col-span-1 text-gray-400 text-sm">
                          {apt.time ? String(apt.time).slice(0, 5) : "—"}
                        </div>
                        <div className="col-span-2 text-gray-300 text-sm truncate">
                          {apt.customer_name ?? "—"}
                        </div>
                        <div className="col-span-3 text-gray-300 text-sm truncate">
                          {apt.service ?? "—"}
                        </div>
                        <div className="col-span-2 text-gray-500 text-sm truncate">
                          {apt.branch_name ?? "—"}
                        </div>
                        <div className="col-span-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[statusKey] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                            {STATUS_LABEL[statusKey] ?? apt.status ?? "—"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {appointmentsPagination.totalPages > 1 && (
              <Pagination
                current={appointmentsPagination.currentPage}
                total={appointmentsPagination.totalPages}
                onChange={appointmentsPagination.setCurrentPage}
                className="px-3 sm:px-6 py-2 sm:py-4"
              />
            )}
          </div>
        </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: CUSTOMERS - Mobile responsive version
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "customers" && (
        <section id="admin-customers" className="scroll-mt-20 sm:scroll-mt-24 mb-6 sm:mb-10">
         <div className="mb-3 sm:mb-4 flex items-start justify-between gap-3">
  <div>
    <h2 className="text-base sm:text-xl font-black text-white">Customers</h2>
    <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Customer growth, value, and segments</p>
  </div>
  <div className="flex items-center gap-1.5 sm:gap-2 print:hidden shrink-0">
    <button
      onClick={handlePrintDashboard}
      className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-white/20 transition-all text-xs sm:text-sm font-semibold"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      <span className="hidden sm:inline">Print</span>
    </button>
    <button
      onClick={handleExportCSV}
      className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 transition-all text-xs sm:text-sm font-semibold"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  </div>
</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
              {[
                {
                  title: "Total Customers",
                  value: stats ? Number(stats.total_customers).toLocaleString() : "—",
                  accentBg: "bg-purple-500/10",
                  accentText: "text-purple-400",
                  border: "border-purple-500/20",
                  icon: (
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  ),
                },
              ].map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
              <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 backdrop-blur-sm">
                <h3 className="text-sm sm:text-lg font-black text-white mb-0.5">Customer Spend</h3>
                <p className="text-gray-500 text-[10px] sm:text-sm mb-3 sm:mb-6">Top customers by total spending</p>
                <div className="h-32 sm:h-56">
                  <Bar data={customerBarData} options={customerBarOptions} />
                </div>
              </div>

              <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 backdrop-blur-sm">
                <h3 className="text-sm sm:text-lg font-black text-white mb-0.5">Tier Distribution</h3>
                <p className="text-gray-500 text-[10px] sm:text-sm mb-3 sm:mb-6">Customer loyalty tiers</p>
                <div className="space-y-2 sm:space-y-4 mt-1 sm:mt-4">
                  {tierRows.map((t) => (
                    <div key={t.tier} className="flex items-center gap-1.5 sm:gap-4">
                      <span className="text-[10px] sm:text-sm text-gray-400 w-14 sm:w-20">{t.tier}</span>
                      <div className="flex-1 h-1 sm:h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${customers.length ? (t.count / customers.length) * 100 : 0}%`,
                            backgroundColor: t.color,
                          }}
                        />
                      </div>
                      <span className="text-[10px] sm:text-sm font-bold text-white w-5 text-right">
                        {t.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-3 sm:px-6 py-2 sm:py-4 border-b border-white/5">
                <h3 className="text-sm sm:text-lg font-black text-white">Customer List</h3>
                <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">All registered customers</p>
              </div>
              
              {/* Mobile card view */}
              <div className="block sm:hidden">
                {customersPagination.paginatedItems.map((c, i) => (
                  <div key={i} className="p-3 border-b border-white/5">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">
                          {getInitial(c.first_name)}
                        </div>
                        <span className="text-white font-semibold text-xs">
                          {`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()}
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${SEGMENT_STYLE[c.segment] ?? SEGMENT_STYLE.New}`}>
                        {c.segment ?? "New"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      <div>
                        <div className="text-gray-500 text-[10px]">Visits</div>
                        <div className="text-gray-400 text-xs font-semibold">{Number(c.visits ?? 0)}x</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[10px]">Total Spent</div>
                        <div className="text-white font-bold text-xs">₱{Number(c.total_spent ?? 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <div className="min-w-[768px]">
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
                      className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                    >
                      <div className="col-span-4 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {getInitial(c.first_name)}
                        </div>
                        <span className="text-white font-semibold text-sm truncate">
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
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold border ${SEGMENT_STYLE[c.segment] ?? SEGMENT_STYLE.New}`}>
                          {c.segment ?? "New"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Pagination
                current={customersPagination.currentPage}
                total={customersPagination.totalPages}
                onChange={customersPagination.setCurrentPage}
                className="px-3 sm:px-6 py-2 sm:py-4"
              />
            </div>
        </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: INVENTORY - Mobile responsive version
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "inventory" && (
        <section id="admin-inventory" className="scroll-mt-20 sm:scroll-mt-24 mb-6 sm:mb-10">
          <div className="mb-3 sm:mb-4 flex items-start justify-between gap-3">
  <div>
    <h2 className="text-base sm:text-xl font-black text-white">Inventory</h2>
    <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Stock status and branch-level supplies</p>
  </div>
  <div className="flex items-center gap-1.5 sm:gap-2 print:hidden shrink-0">
    <button
      onClick={handlePrintDashboard}
      className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-white/20 transition-all text-xs sm:text-sm font-semibold"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      <span className="hidden sm:inline">Print</span>
    </button>
    <button
      onClick={handleExportCSV}
      className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 transition-all text-xs sm:text-sm font-semibold"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  </div>
</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
              {[
                {
                  title: "Total SKUs",
                  value: String(inventoryItems.length),
                  accentBg: "bg-blue-500/10",
                  accentText: "text-blue-400",
                  border: "border-blue-500/20",
                  icon: (
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ),
                },
              ].map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-3 sm:px-6 py-2 sm:py-4 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-lg font-black text-white">Parts & Supplies Inventory</h3>
                    <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Current stock levels</p>
                  </div>
                  <select
                    value={inventoryBranchFilter}
                    onChange={(e) => setInventoryBranchFilter(e.target.value)}
                    className="bg-gray-900/60 border border-white/10 text-white rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer text-xs sm:text-sm w-full sm:w-auto"
                  >
                    {inventoryBranchOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Mobile card view */}
              <div className="block sm:hidden">
                {inventoryPagination.paginatedItems.map((item, i) => {
                  const invStatus = normalizeInventoryStatus(item.status);
                  return (
                    <div key={i} className="p-3 border-b border-white/5">
                      <div className="flex justify-between items-start mb-1.5">
                        <div>
                          <div className="text-white font-semibold text-xs">{item.name}</div>
                          <div className="text-gray-400 text-[10px]">{item.branch_name ?? "Central"}</div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${INV_STYLE[invStatus]}`}>
                          {invStatus === "ok"
                            ? "Available"
                            : invStatus === "low"
                              ? "Low"
                              : invStatus === "critical"
                                ? "Critical"
                                : "Out"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                        <div>
                          <div className="text-gray-500 text-[10px]">Stock</div>
                          <div className="text-gray-300 text-xs font-bold">
                            {Number(item.quantity ?? 0)} <span className="text-gray-600 font-normal text-[10px]">{item.unit}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-[10px]">Reorder At</div>
                          <div className="text-gray-500 text-xs">
                            {Number(item.minimum_qty ?? 0)} {item.unit}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <div className="min-w-[768px]">
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
                        className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                      >
                        <div className="col-span-4 text-white font-semibold text-sm truncate">{item.name}</div>
                        <div className="col-span-2 text-gray-400 text-sm truncate">
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
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold border ${INV_STYLE[invStatus]}`}>
                            {invStatus === "ok"
                              ? "Available"
                              : invStatus === "low"
                                ? "Low"
                                : invStatus === "critical"
                                  ? "Critical"
                                  : "Out"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Pagination
                current={inventoryPagination.currentPage}
                total={inventoryPagination.totalPages}
                onChange={inventoryPagination.setCurrentPage}
                className="px-3 sm:px-6 py-2 sm:py-4"
              />
            </div>
        </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: SERVICES - Mobile responsive version
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "services" && (
        <section id="admin-services" className="scroll-mt-20 sm:scroll-mt-24">
          <div className="mb-3 sm:mb-4 flex items-start justify-between gap-3">
  <div>
    <h2 className="text-base sm:text-xl font-black text-white">Services</h2>
    <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Service rankings and contribution</p>
  </div>
  <div className="flex items-center gap-1.5 sm:gap-2 print:hidden shrink-0">
    <button
      onClick={handlePrintDashboard}
      className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-white/20 transition-all text-xs sm:text-sm font-semibold"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      <span className="hidden sm:inline">Print</span>
    </button>
    <button
      onClick={handleExportCSV}
      className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 transition-all text-xs sm:text-sm font-semibold"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  </div>
</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
              {[
                {
                  title: "Total Services",
                  value: String(topServiceCards.reduce((a, s) => a + Number(s.count ?? 0), 0)),
                  accentBg: "bg-blue-500/10",
                  accentText: "text-blue-400",
                  border: "border-blue-500/20",
                  icon: (
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
              ].map((c, i) => (
                <StatCard key={i} {...c} />
              ))}
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-3 sm:px-6 py-2 sm:py-4 border-b border-white/5">
                <h3 className="text-sm sm:text-lg font-black text-white">Service Performance</h3>
                <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">All service types ranked by revenue</p>
              </div>
              
              {/* Mobile card view */}
              <div className="block sm:hidden">
                {topServiceCards.length === 0 ? (
                  <div className="px-3 py-6 text-center text-gray-500 text-xs">
                    No service performance data available.
                  </div>
                ) : (
                  servicesPagination.paginatedItems.map((s, i) => {
                    const totalRev = sortedServiceCards.reduce((a, x) => a + Number(x.revenue ?? 0), 0);
                    const pct = totalRev ? ((Number(s.revenue ?? 0) / totalRev) * 100).toFixed(1) : "0.0";
                    return (
                      <div key={i} className="p-3 border-b border-white/5">
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }}
                            />
                            <span className="text-white font-semibold text-xs">{s.service}</span>
                          </div>
                          <span className="text-[10px] font-bold" style={{ color: SERVICE_COLORS[i % SERVICE_COLORS.length] }}>
                            {pct}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                          <div>
                            <div className="text-gray-500 text-[10px]">Count</div>
                            <div className="text-gray-400 text-xs">{s.count}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-[10px]">Revenue</div>
                            <div className="text-white font-bold text-xs">₱{Number(s.revenue ?? 0).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <div className="min-w-[768px]">
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
                          className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                        >
                          <div className="col-span-4 flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }}
                            />
                            <span className="text-white font-semibold text-sm truncate">{s.service}</span>
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
                </div>
              </div>

              {topServiceCards.length > 0 && (
                <Pagination
                  current={servicesPagination.currentPage}
                  total={servicesPagination.totalPages}
                  onChange={servicesPagination.setCurrentPage}
                  className="px-3 sm:px-6 py-2 sm:py-4"
                />
              )}
            </div>
        </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW: EMPLOYEES
        ══════════════════════════════════════════════════════════════════ */}
        {activeView === "employees" && (
        <section id="admin-employees" className="scroll-mt-20 sm:scroll-mt-24">
          <div className="mb-3 sm:mb-4 flex items-start justify-between gap-3">
  <div>
    <h2 className="text-base sm:text-xl font-black text-white">Employees</h2>
    <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">Track employee workload distribution across all branches</p>
  </div>
  <div className="flex items-center gap-1.5 sm:gap-2 print:hidden shrink-0">
    <button
      onClick={handlePrintDashboard}
      className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-white/20 transition-all text-xs sm:text-sm font-semibold"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      <span className="hidden sm:inline">Print</span>
    </button>
    <button
      onClick={handleExportCSV}
      className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 transition-all text-xs sm:text-sm font-semibold"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  </div>
</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
            {[
              {
                title: "Assigned Employees",
                value: String(employeeWorkloadRows.filter((row) => row.employee !== "Unassigned").length),
                sub: "With recorded service load",
                accentBg: "bg-cyan-500/10",
                accentText: "text-cyan-400",
                border: "border-cyan-500/20",
                icon: (
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V10H2v10h5m10 0v-2a4 4 0 10-8 0v2m8 0H9m4-12a4 4 0 110 8 4 4 0 010-8z" />
                  </svg>
                ),
              },
              {
                title: "Total Assigned Tasks",
                value: String(employeeWorkloadRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0)),
                accentBg: "bg-blue-500/10",
                accentText: "text-blue-400",
                border: "border-blue-500/20",
                icon: (
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
              },
              {
                title: "Completion Rate",
                value: `${(
                  (employeeWorkloadRows.reduce((sum, row) => sum + Number(row.completed ?? 0), 0) /
                    Math.max(1, employeeWorkloadRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0))) *
                  100
                ).toFixed(1)}%`,
                sub: "Completed tasks across all branches",
                accentBg: "bg-emerald-500/10",
                accentText: "text-emerald-400",
                border: "border-emerald-500/20",
                icon: (
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((c, i) => (
              <StatCard key={i} {...c} />
            ))}
          </div>

          <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-3 sm:px-6 py-2 sm:py-4 border-b border-white/5">
              <h3 className="text-sm sm:text-lg font-black text-white">Employee Workload Distribution</h3>
              <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">All employees by assigned tasks</p>
            </div>

            <div className="block sm:hidden">
              {employeeWorkloadRows.length === 0 ? (
                <div className="px-3 py-6 text-center text-gray-500 text-xs">
                  No workload data available yet.
                </div>
              ) : (
                employeeWorkloadPagination.paginatedItems.map((row, i) => (
                  <div key={`${row.employee}-${i}`} className="p-3 border-b border-white/5">
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <div className="text-white font-semibold text-xs">{row.employee}</div>
                        <div className="text-gray-400 text-[10px]">{row.branch}</div>
                      </div>
                      <span className="text-cyan-300 text-[10px] font-bold">{row.share.toFixed(1)}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                      <div>
                        <div className="text-gray-500 text-[10px]">Total</div>
                        <div className="text-gray-300 text-xs font-semibold">{row.total}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[10px]">Completed</div>
                        <div className="text-emerald-400 text-xs font-semibold">{row.completed}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[10px]">Skipped</div>
                        <div className="text-amber-400 text-xs font-semibold">{row.skipped}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                  <div className="col-span-3">Employee</div>
                  <div className="col-span-3">Branch</div>
                  <div className="col-span-2">Total Tasks</div>
                  <div className="col-span-2">Completed</div>
                  <div className="col-span-2">Workload Share</div>
                </div>
                {employeeWorkloadRows.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500 text-sm">
                    No workload data available yet.
                  </div>
                ) : (
                  employeeWorkloadPagination.paginatedItems.map((row, i) => (
                    <div key={`${row.employee}-${i}`} className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center">
                      <div className="col-span-3 text-white font-semibold text-sm truncate">{row.employee}</div>
                      <div className="col-span-3 text-gray-400 text-sm truncate">{row.branch}</div>
                      <div className="col-span-2 text-gray-300 text-sm font-semibold">{row.total}</div>
                      <div className="col-span-2 text-emerald-400 text-sm font-semibold">{row.completed}</div>
                      <div className="col-span-2">
                        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden mb-1">
                          <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, Math.max(0, row.share)).toFixed(1)}%` }} />
                        </div>
                        <span className="text-xs text-cyan-300 font-semibold">{row.share.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {employeeWorkloadRows.length > 0 && (
              <Pagination
                current={employeeWorkloadPagination.currentPage}
                total={employeeWorkloadPagination.totalPages}
                onChange={employeeWorkloadPagination.setCurrentPage}
                className="px-3 sm:px-6 py-2 sm:py-4"
              />
            )}
          </div>
        </section>
        )}
        </div>
      </div>
    </AdminLayout>
  );
}