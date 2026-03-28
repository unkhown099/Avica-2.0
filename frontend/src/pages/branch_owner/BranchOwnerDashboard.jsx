import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bar, Line, Doughnut } from "react-chartjs-2";
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
import html2canvas from "html2canvas";
import BranchOwnerLayout from "./BranchOwnerLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import { API_BASE } from "../../hooks/useAuth.js";
import { ErrorBanner, exportToCSV } from "../../components/admin/DashboardUI";
import { getUserFromSession } from "../../utils/getUser.js";

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

const SECTION_KEYS = [
  "overview",
  "revenue",
  "customers",
  "appointment",
  "inventory",
  "services",
];

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
    key: "appointment",
    label: "Appointment",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: "customers",
    label: "Customers",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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

const STATUS_STYLE = {
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  cancelled: "bg-red-500/20 text-red-100 border-red-500/30",
  no_show: "bg-red-500/20 text-red-300 border-red-500/30",
  done: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const STATUS_LABEL = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  no_show: "No Show",
  done: "Done",
  completed: "Completed",
};

const INV_STYLE = {
  ok: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  low: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  out: "bg-red-500/20 text-red-400 border-red-500/30",
};

const BRANCH_COLORS = ["#ef4444", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#06b6d4", "#ec4899"];

function normalizeStatus(s = "") {
  return String(s).toLowerCase().replace(/\s+/g, "_");
}

function normalizeInventoryStatus(status = "") {
  const s = String(status).toLowerCase();
  if (s.includes("low")) return "low";
  if (s.includes("out")) return "out";
  return "ok";
}

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

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

export default function BranchOwnerDashboard() {
  const location = useLocation();
  const [activeView, setActiveView] = useState("overview");
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [trend, setTrend] = useState([]);
  const [branchRevenue, setBranchRevenue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [headers, setHeaders] = useState({});

  useEffect(() => {
    const user = getUserFromSession();
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (user && token) {
      setIsAuthenticated(true);
      setHeaders({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      return;
    }
    setIsAuthenticated(false);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);

      const sessionUser = getUserFromSession();
      const role = String(sessionUser?.role ?? "").trim().toLowerCase();
      const isOwnerRole =
        role === "business owner" ||
        role === "business_owner" ||
        role === "owner";

      let authExpired = false;

      const fetchFirstAvailable = async (paths, fallbackValue) => {
        for (const path of paths) {
          try {
            const res = await fetch(`${API_BASE}${path}`, { headers, credentials: "include" });
            if (res.status === 401) {
              authExpired = true;
              return fallbackValue;
            }
            if (res.ok) return await res.json();
            if (res.status === 403 || res.status === 404) continue;
            return fallbackValue;
          } catch {
            return fallbackValue;
          }
        }
        return fallbackValue;
      };

      const [
        dashboardData,
        ownerStatsData,
        ownerTrendData,
        ownerBranchRevenueData,
        customersData,
        inventoryData,
        appointmentsData,
        ownerServicesData,
      ] = await Promise.all([
        fetchFirstAvailable(isOwnerRole ? [] : ["/dashboard/"], null),
        fetchFirstAvailable(["/owner/dashboard/stats/"], null),
        fetchFirstAvailable(["/owner/dashboard/trend/"], []),
        fetchFirstAvailable(["/owner/dashboard/branch-revenue/"], []),
        fetchFirstAvailable(["/customers/"], []),
        fetchFirstAvailable(
          isOwnerRole ? ["/owner/inventory/"] : ["/inventory/", "/owner/inventory/"],
          [],
        ),
        fetchFirstAvailable(
          isOwnerRole ? ["/owner/appointments/"] : ["/appointments/", "/owner/appointments/"],
          [],
        ),
        fetchFirstAvailable(["/owner/services/?performance=1", "/owner/services/"], []),
      ]);

      if (authExpired) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        setIsAuthenticated(false);
        throw new Error("Session expired. Please login again.");
      }

      const dashboardStats = dashboardData?.stats ?? ownerStatsData ?? null;
      const dashboardChart = dashboardData?.chart ?? null;
      const dashboardAnalytics = dashboardData?.analytics ?? null;
      const dashboardTrend = dashboardChart
        ? (dashboardChart.labels ?? []).map((label, idx) => ({
            label,
            revenue: Number(dashboardChart.revenue?.[idx] ?? 0),
            services: Number(dashboardChart.services?.[idx] ?? 0),
          }))
        : toArray(ownerTrendData);
      const analyticsRevenueByBranch = toArray(dashboardAnalytics?.revenue_by_branch).map((row) => ({
        name: row.branch ?? row.name ?? "—",
        revenue: Number(row.revenue ?? 0),
      }));
      const fallbackTopServices = toArray(ownerServicesData).map((service) => ({
        ...service,
        service: service.service ?? service.name ?? service.service_name ?? "—",
        count: Number(service.count ?? service.bookings ?? service.total_bookings ?? 0),
        revenue: Number(service.revenue ?? 0),
        avg_time: service.avg_time ?? "—",
      }));
      const topServices = toArray(dashboardAnalytics?.top_services).length
        ? toArray(dashboardAnalytics?.top_services)
        : fallbackTopServices;

      setStats(dashboardStats);
      setAnalytics(dashboardAnalytics);
      setTrend(dashboardTrend);
      setBranchRevenue(
        analyticsRevenueByBranch.length > 0
          ? analyticsRevenueByBranch
          : toArray(ownerBranchRevenueData),
      );
      setAppointments(toArray(appointmentsData));
      setServices(topServices);
      setInventory(toArray(inventoryData));
      setCustomers(toArray(customersData));
    } catch (err) {
      setError(err.message || "Failed to load owner dashboard.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, headers]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (SECTION_KEYS.includes(hash)) {
      setActiveView(hash);
      return;
    }
    setActiveView("overview");
  }, []);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (SECTION_KEYS.includes(hash)) setActiveView(hash);
  }, [location.hash]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (SECTION_KEYS.includes(hash)) setActiveView(hash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const fmtMoney = (n) => {
    const v = Number(n ?? 0);
    return `₱${v.toLocaleString()}`;
  };

  const fmtCompactMoney = (n) => {
    const v = Number(n ?? 0);
    if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `₱${(v / 1_000).toFixed(1)}k`;
    return `₱${v.toLocaleString()}`;
  };

  const totalBranchRev = branchRevenue.reduce((sum, row) => sum + Number(row.revenue ?? 0), 0);
  const sortedBranchRevenue = useMemo(
    () => [...branchRevenue].sort((a, b) => Number(b.revenue ?? 0) - Number(a.revenue ?? 0)),
    [branchRevenue],
  );
  const topCustomer = useMemo(() => {
    if (customers.length === 0) return null;
    return [...customers].sort((a, b) => Number(b.total_spent ?? 0) - Number(a.total_spent ?? 0))[0];
  }, [customers]);

  const lineChartData = {
    labels: trend.map((p) => p.label),
    datasets: [
      {
        label: "Revenue (₱)",
        data: trend.map((p) => p.revenue),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.08)",
        tension: 0.4,
        pointRadius: 4,
        fill: true,
        yAxisID: "y",
      },
      {
        label: "Services",
        data: trend.map((p) => p.services),
        borderColor: "#a855f7",
        backgroundColor: "rgba(168,85,247,0.08)",
        tension: 0.4,
        pointRadius: 4,
        fill: true,
        yAxisID: "y1",
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
        type: "linear",
        position: "left",
        beginAtZero: true,
        grid: CHART_BASE.grid,
        ticks: CHART_BASE.ticks,
      },
      y1: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: CHART_BASE.ticks,
      },
    },
  };

  const doughnutChartData = {
    labels: branchRevenue.map((b) => b.name),
    datasets: [
      {
        data: branchRevenue.map((b) => Number(b.revenue ?? 0)),
        backgroundColor: branchRevenue.map((_, i) => BRANCH_COLORS[i % BRANCH_COLORS.length]),
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

  const appointmentsPagination = usePagination({
    items: appointments,
    pageSize: 10,
    resetDeps: [appointments.length],
  });

  const servicesByRevenue = useMemo(() => {
    return [...services]
      .map((s) => {
        const serviceName = s.service ?? s.name ?? s.service_name ?? "—";
        const count = Number(s.count ?? 0);
        const revenue = Number(s.revenue ?? 0);
        return {
          ...s,
          _serviceName: serviceName,
          _count: count,
          _revenue: revenue,
          _avgTime: s.avg_time ?? "—",
        };
      })
      .sort((a, b) => Number(b._revenue ?? 0) - Number(a._revenue ?? 0));
  }, [services]);

  const customersPagination = usePagination({
    items: customers,
    pageSize: 10,
    resetDeps: [customers.length],
  });

  const servicesPagination = usePagination({
    items: servicesByRevenue,
    pageSize: 10,
    resetDeps: [servicesByRevenue.length],
  });

  const inventoryPagination = usePagination({
    items: inventory,
    pageSize: 10,
    resetDeps: [inventory.length],
  });

  const appointmentStatusCounts = appointments.reduce(
    (acc, row) => {
      const key = normalizeStatus(row.status);
      if (key === "confirmed") acc.confirmed += 1;
      else if (key === "pending") acc.pending += 1;
      else if (key === "cancelled") acc.cancelled += 1;
      else if (key === "no_show") acc.noShow += 1;
      return acc;
    },
    { confirmed: 0, pending: 0, cancelled: 0, noShow: 0 },
  );

  const inventoryCounts = inventory.reduce(
    (acc, item) => {
      const key = normalizeInventoryStatus(item.status);
      if (key === "ok") acc.ok += 1;
      else if (key === "low") acc.low += 1;
      else acc.out += 1;
      return acc;
    },
    { ok: 0, low: 0, out: 0 },
  );

  const handleExportCSV = () => {
    if (activeView === "overview") {
      exportToCSV(
        trend.map((t) => [t.label, t.revenue, t.services]),
        ["Period", "Revenue", "Services"],
        "owner_overview_trend.csv",
      );
    } else if (activeView === "revenue") {
      exportToCSV(
        sortedBranchRevenue.map((r) => [r.name, r.revenue]),
        ["Branch", "Revenue"],
        "owner_revenue_by_branch.csv",
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
        "owner_customers.csv",
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
        "owner_appointments.csv",
      );
    } else if (activeView === "inventory") {
      exportToCSV(
        inventory.map((i) => [
          i.name ?? "—",
          i.branch_name ?? "—",
          i.category ?? "—",
          i.quantity ?? 0,
          i.unit ?? "—",
          i.status ?? "—",
        ]),
        ["Item", "Branch", "Category", "Quantity", "Unit", "Status"],
        "owner_inventory.csv",
      );
    } else if (activeView === "services") {
      exportToCSV(
        servicesByRevenue.map((s) => [
          s._serviceName ?? "—",
          s._count ?? 0,
          s._revenue ?? 0,
          s._avgTime ?? "—",
        ]),
        ["Service", "Count", "Revenue", "Avg Time"],
        "owner_services.csv",
      );
    }
  };

  const viewLabel = VIEWS.find((v) => v.key === activeView)?.label ?? "Dashboard";

  const handlePrintDashboard = async () => {
    const sectionSelector = {
      overview: "#owner-overview",
      revenue: "#owner-revenue",
      customers: "#owner-customers",
      appointment: "#owner-appointment",
      inventory: "#owner-inventory",
      services: "#owner-services",
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
          <title>Owner Dashboard — ${viewLabel}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #fff; }
            img {
              width: 100%;
              height: auto;
              display: block;
            }
            @page { size: A4 portrait; margin: 8mm; }
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

  if (!isAuthenticated && !loading) {
    return (
      <BranchOwnerLayout title="" subtitle="">
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-red-400 text-xl mb-4">⚠️ Authentication Required</div>
              <p className="text-gray-400">Please login to access the owner dashboard.</p>
            </div>
          </div>
        </div>
      </BranchOwnerLayout>
    );
  }

  return (
    <BranchOwnerLayout title="" subtitle="">
      <div
        id="owner-dashboard-print"
        className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8"
      >
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Owner Dashboard</h1>
            <p className="text-gray-400 mt-1">
              {loading ? "Loading..." : "Branch owner analytics with section views."}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:mt-14">
            <button
              onClick={handlePrintDashboard}
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

        {error && <ErrorBanner message={error} onRetry={fetchAll} />}

        {activeView === "overview" && (
          <section id="owner-overview" className="scroll-mt-24 mb-10">
            <div className="mb-4">
              <h2 className="text-xl font-black text-white">Overview</h2>
              <p className="text-gray-500 text-sm mt-0.5">Snapshot across all branches</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                : [
                    {
                      title: "Total Revenue",
                      value: fmtCompactMoney(stats?.total_revenue),
                      accentBg: "bg-red-500/10",
                      accentText: "text-red-400",
                      border: "border-red-500/20",
                      sub: `${stats?.revenue_change_pct ?? 0}% from last month`,
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                    },
                    {
                      title: "Total Branches",
                      value: Number(stats?.total_branches ?? 0).toLocaleString(),
                      accentBg: "bg-blue-500/10",
                      accentText: "text-blue-400",
                      border: "border-blue-500/20",
                      sub: "Active locations",
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                        </svg>
                      ),
                    },
                    {
                      title: "Services Completed",
                      value: Number(stats?.services_completed ?? 0).toLocaleString(),
                      accentBg: "bg-purple-500/10",
                      accentText: "text-purple-400",
                      border: "border-purple-500/20",
                      sub: `${stats?.services_change_pct ?? 0}% from last month`,
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ),
                    },
                    {
                      title: "Avg. Satisfaction",
                      value: `${Number(stats?.avg_satisfaction ?? 0)}%`,
                      accentBg: "bg-emerald-500/10",
                      accentText: "text-emerald-400",
                      border: "border-emerald-500/20",
                      sub: `${stats?.satisfaction_change_pct ?? 0}% from last month`,
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 10.1c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ),
                    },
                  ].map((card, i) => <StatCard key={i} {...card} />)}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-white">Revenue & Services Trend</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Owner dashboard trend</p>
                </div>
                {loading ? (
                  <div className="h-72 bg-gray-800/40 rounded-xl animate-pulse" />
                ) : trend.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-gray-600 text-sm">No data yet</div>
                ) : (
                  <div className="h-72">
                    <Line data={lineChartData} options={lineChartOptions} />
                  </div>
                )}
              </div>

              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-white">Branch Revenue Distribution</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Current period</p>
                </div>
                {loading ? (
                  <div className="h-44 bg-gray-800/40 rounded-xl animate-pulse mb-6" />
                ) : branchRevenue.length === 0 ? (
                  <div className="h-44 flex items-center justify-center text-gray-600 text-sm">No data yet</div>
                ) : (
                  <div className="h-44 flex items-center justify-center mb-6">
                    <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                  </div>
                )}
                <div className="space-y-3">
                  {branchRevenue.map((b, i) => (
                    <div key={b.id ?? `${b.name}-${i}`} className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length] }}
                      />
                      <span className="text-sm text-gray-400 flex-1 truncate">{b.name}</span>
                      <span className="text-xs font-bold text-white">{fmtCompactMoney(b.revenue)}</span>
                      {totalBranchRev > 0 && (
                        <span className="text-xs text-gray-600">
                          {Math.round((Number(b.revenue ?? 0) / totalBranchRev) * 100)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeView === "revenue" && (
          <section id="owner-revenue" className="scroll-mt-24 mb-10">
            <div className="mb-4">
              <h2 className="text-xl font-black text-white">Revenue</h2>
              <p className="text-gray-500 text-sm mt-0.5">Revenue comparison by branch</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard
                title="Total Revenue"
                value={fmtMoney(stats?.total_revenue)}
                accentBg="bg-red-500/10"
                accentText="text-red-400"
                border="border-red-500/20"
                sub="Includes appointments and walk-ins"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
                  </svg>
                }
              />
              <StatCard
                title="Best Performing Branch"
                value={sortedBranchRevenue[0]?.name ?? "—"}
                accentBg="bg-blue-500/10"
                accentText="text-blue-400"
                border="border-blue-500/20"
                sub={sortedBranchRevenue[0] ? fmtCompactMoney(sortedBranchRevenue[0].revenue) : undefined}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M9 17V9m4 8V5m4 12v-3" />
                  </svg>
                }
              />
              <StatCard
                title="Revenue Change"
                value={`${Number(stats?.revenue_change_pct ?? 0)}%`}
                accentBg="bg-emerald-500/10"
                accentText="text-emerald-400"
                border="border-emerald-500/20"
                sub="Month-over-month"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
              />
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm mb-6">
              <h3 className="text-lg font-black text-white mb-1">Revenue by Branch</h3>
              <p className="text-gray-500 text-sm mb-6">Live totals from owner data</p>
              <div className="h-72">
                <Bar
                  data={{
                    labels: sortedBranchRevenue.map((r) => r.name),
                    datasets: [{ label: "Revenue", data: sortedBranchRevenue.map((r) => Number(r.revenue ?? 0)), backgroundColor: "rgba(239,68,68,0.7)", borderRadius: 6 }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: "bottom", labels: { color: "#9ca3af" } }, tooltip: CHART_BASE.tooltip },
                    scales: {
                      x: { grid: CHART_BASE.grid, ticks: CHART_BASE.ticks },
                      y: { beginAtZero: true, grid: CHART_BASE.grid, ticks: CHART_BASE.ticks },
                    },
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {activeView === "customers" && (
          <section id="owner-customers" className="scroll-mt-24 mb-10">
            <div className="mb-4">
              <h2 className="text-xl font-black text-white">Customers</h2>
              <p className="text-gray-500 text-sm mt-0.5">Customer insights aligned with admin view</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard
                title="Total Customers"
                value={Number(stats?.total_customers ?? customers.length).toLocaleString()}
                accentBg="bg-purple-500/10"
                accentText="text-purple-400"
                border="border-purple-500/20"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Top Spender"
                value={topCustomer ? `${topCustomer.first_name ?? ""} ${topCustomer.last_name ?? ""}`.trim() : "—"}
                sub={topCustomer ? fmtMoney(topCustomer.total_spent ?? 0) : undefined}
                accentBg="bg-yellow-500/10"
                accentText="text-yellow-400"
                border="border-yellow-500/20"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                }
              />
              <StatCard
                title="Avg. Rating"
                value={
                  customers.length
                    ? `${(
                        customers.reduce((sum, c) => sum + Number(c.avg_rating ?? 0), 0) /
                        customers.filter((c) => c.avg_rating != null).length || 0
                      ).toFixed(1)} / 5`
                    : "—"
                }
                accentBg="bg-blue-500/10"
                accentText="text-blue-400"
                border="border-blue-500/20"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 10.1c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                }
              />
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-black text-white">Customer List</h3>
              </div>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Visits</div>
                <div className="col-span-3">Total Spent</div>
                <div className="col-span-2">Avg Rating</div>
                <div className="col-span-1">Segment</div>
              </div>
              {customersPagination.paginatedItems.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500 text-sm">No customers available.</div>
              ) : (
                customersPagination.paginatedItems.map((c, i) => (
                  <div
                    key={c.id ?? i}
                    className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <div className="col-span-4 text-white font-semibold text-sm">
                      {`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.name || "—"}
                    </div>
                    <div className="col-span-2 text-gray-400 text-sm">{Number(c.visits ?? 0)}x</div>
                    <div className="col-span-3 text-white font-bold text-sm">{fmtMoney(c.total_spent ?? 0)}</div>
                    <div className="col-span-2 text-gray-500 text-xs">
                      {c.avg_rating != null ? `${Number(c.avg_rating).toFixed(1)} / 5` : "—"}
                    </div>
                    <div className="col-span-1 text-gray-400 text-xs">{c.segment ?? "—"}</div>
                  </div>
                ))
              )}
              {customersPagination.totalPages > 1 && (
                <Pagination
                  current={customersPagination.currentPage}
                  total={customersPagination.totalPages}
                  onChange={customersPagination.setCurrentPage}
                  className="px-6 py-4"
                />
              )}
            </div>
          </section>
        )}

        {activeView === "appointment" && (
          <section id="owner-appointment" className="scroll-mt-24 mb-10">
            <div className="mb-4">
              <h2 className="text-xl font-black text-white">Appointment</h2>
              <p className="text-gray-500 text-sm mt-0.5">All branch bookings</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
              <StatCard title="Total Appointments" value={appointments.length.toLocaleString()} accentBg="bg-blue-500/10" accentText="text-blue-400" border="border-blue-500/20" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
              <StatCard title="Confirmed" value={appointmentStatusCounts.confirmed.toLocaleString()} accentBg="bg-emerald-500/10" accentText="text-emerald-400" border="border-emerald-500/20" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
              <StatCard title="Pending" value={appointmentStatusCounts.pending.toLocaleString()} accentBg="bg-amber-500/10" accentText="text-amber-400" border="border-amber-500/20" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>} />
              <StatCard title="Cancelled / No Show" value={(appointmentStatusCounts.cancelled + appointmentStatusCounts.noShow).toLocaleString()} accentBg="bg-red-500/10" accentText="text-red-400" border="border-red-500/20" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} />
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-black text-white">Appointment List</h3>
                <p className="text-gray-500 text-sm mt-0.5">Owner appointment records</p>
              </div>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-2">Date</div>
                <div className="col-span-1">Time</div>
                <div className="col-span-2">Customer</div>
                <div className="col-span-3">Service</div>
                <div className="col-span-2">Branch</div>
                <div className="col-span-2">Status</div>
              </div>

              {appointmentsPagination.paginatedItems.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500 text-sm">No appointment data available.</div>
              ) : (
                appointmentsPagination.paginatedItems.map((apt, i) => {
                  const statusKey = normalizeStatus(apt.status);
                  return (
                    <div
                      key={apt.id ?? `${apt.customer_name ?? "apt"}-${apt.date ?? "date"}-${i}`}
                      className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                    >
                      <div className="col-span-2 text-white font-semibold text-sm">{apt.date ?? "—"}</div>
                      <div className="col-span-1 text-gray-400 text-sm">{apt.time ? String(apt.time).slice(0, 5) : "—"}</div>
                      <div className="col-span-2 text-gray-300 text-sm">{apt.customer_name ?? "—"}</div>
                      <div className="col-span-3 text-gray-300 text-sm">{apt.service ?? "—"}</div>
                      <div className="col-span-2 text-gray-500 text-sm">{apt.branch_name ?? "—"}</div>
                      <div className="col-span-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[statusKey] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                          {STATUS_LABEL[statusKey] ?? apt.status ?? "—"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {appointmentsPagination.totalPages > 1 && (
                <Pagination
                  current={appointmentsPagination.currentPage}
                  total={appointmentsPagination.totalPages}
                  onChange={appointmentsPagination.setCurrentPage}
                  className="px-6 py-4"
                />
              )}
            </div>
          </section>
        )}

        {activeView === "inventory" && (
          <section id="owner-inventory" className="scroll-mt-24 mb-10">
            <div className="mb-4">
              <h2 className="text-xl font-black text-white">Inventory</h2>
              <p className="text-gray-500 text-sm mt-0.5">Stock levels and status</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard title="Total Items" value={inventory.length.toLocaleString()} accentBg="bg-blue-500/10" accentText="text-blue-400" border="border-blue-500/20" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
              <StatCard title="Low Stock" value={inventoryCounts.low.toLocaleString()} accentBg="bg-amber-500/10" accentText="text-amber-400" border="border-amber-500/20" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>} />
              <StatCard title="Out of Stock" value={inventoryCounts.out.toLocaleString()} accentBg="bg-red-500/10" accentText="text-red-400" border="border-red-500/20" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} />
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-black text-white">Inventory List</h3>
              </div>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-3">Item</div>
                <div className="col-span-2">Branch</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-1">Unit</div>
                <div className="col-span-2">Status</div>
              </div>
              {inventoryPagination.paginatedItems.map((item, i) => {
                const key = normalizeInventoryStatus(item.status);
                return (
                  <div key={item.id ?? i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center">
                    <div className="col-span-3 text-white font-semibold text-sm">{item.name ?? "—"}</div>
                    <div className="col-span-2 text-gray-400 text-sm">{item.branch_name ?? "—"}</div>
                    <div className="col-span-2 text-gray-500 text-sm">{item.category ?? "—"}</div>
                    <div className="col-span-2 text-gray-300 text-sm">{Number(item.quantity ?? 0).toLocaleString()}</div>
                    <div className="col-span-1 text-gray-500 text-sm">{item.unit ?? "—"}</div>
                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${INV_STYLE[key]}`}>
                        {key === "ok" ? "In Stock" : key === "low" ? "Low Stock" : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                );
              })}
              {inventoryPagination.totalPages > 1 && (
                <Pagination
                  current={inventoryPagination.currentPage}
                  total={inventoryPagination.totalPages}
                  onChange={inventoryPagination.setCurrentPage}
                  className="px-6 py-4"
                />
              )}
            </div>
          </section>
        )}

        {activeView === "services" && (
          <section id="owner-services" className="scroll-mt-24">
            <div className="mb-4">
              <h2 className="text-xl font-black text-white">Services</h2>
              <p className="text-gray-500 text-sm mt-0.5">Service performance summary</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard title="Total Services" value={servicesByRevenue.reduce((sum, s) => sum + Number(s._count ?? 0), 0).toLocaleString()} accentBg="bg-blue-500/10" accentText="text-blue-400" border="border-blue-500/20" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
              <StatCard title="Top Service" value={servicesByRevenue[0]?._serviceName ?? "—"} accentBg="bg-red-500/10" accentText="text-red-400" border="border-red-500/20" sub="Highest revenue generator" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4m5-2l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>} />
              <StatCard title="Total Service Revenue" value={fmtMoney(servicesByRevenue.reduce((sum, s) => sum + Number(s._revenue ?? 0), 0))} accentBg="bg-emerald-500/10" accentText="text-emerald-400" border="border-emerald-500/20" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-lg font-black text-white">Service Performance</h3>
              </div>
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-4">Service</div>
                <div className="col-span-2">Count</div>
                <div className="col-span-3">Revenue</div>
                <div className="col-span-2">Avg Time</div>
                <div className="col-span-1">Share</div>
              </div>
              {servicesPagination.paginatedItems.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500 text-sm">No services available.</div>
              ) : (
                servicesPagination.paginatedItems.map((s, i) => {
                  const totalRev = servicesByRevenue.reduce((acc, row) => acc + Number(row._revenue ?? 0), 0);
                  const pct = totalRev ? ((Number(s._revenue ?? 0) / totalRev) * 100).toFixed(1) : "0.0";
                  return (
                  <div key={s.id ?? i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center">
                    <div className="col-span-4 text-white font-semibold text-sm">{s._serviceName ?? "—"}</div>
                    <div className="col-span-2 text-gray-400 text-sm">{Number(s._count ?? 0).toLocaleString()}</div>
                    <div className="col-span-3 text-emerald-400 font-bold text-sm">{fmtMoney(s._revenue)}</div>
                    <div className="col-span-2 text-gray-500 text-sm">{s._avgTime}</div>
                    <div className="col-span-1 text-gray-400 text-sm">{pct}%</div>
                  </div>
                );
                })
              )}
              {servicesPagination.totalPages > 1 && (
                <Pagination
                  current={servicesPagination.currentPage}
                  total={servicesPagination.totalPages}
                  onChange={servicesPagination.setCurrentPage}
                  className="px-6 py-4"
                />
              )}
            </div>
          </section>
        )}
      </div>
    </BranchOwnerLayout>
  );
}
