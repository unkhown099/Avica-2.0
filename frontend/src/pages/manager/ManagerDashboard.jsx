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
import ManagerLayout from "./ManagerLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import { API_BASE, useAuth } from "../../hooks/useAuth.js";
import { ErrorBanner, StatCard, SkeletonCard, SkeletonRow, exportToCSV } from "../../components/admin/DashboardUI";

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
  ok: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  low: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
  out: "bg-red-600/20 text-red-200 border-red-600/30",
};

const SEGMENT_STYLE = {
  Loyal: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Regular: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  New: "bg-gray-500/15 text-gray-300 border-gray-500/30",
};

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizeStatus(s = "") {
  return String(s).toLowerCase().replace(/\s+/g, "_");
}

function normalizeInventoryStatus(status = "") {
  const s = String(status).toLowerCase();
  if (s.includes("low")) return "low";
  if (s.includes("out")) return "out";
  return "ok";
}

function toNumber(n) {
  if (typeof n === "number") return n;
  const parsed = Number(String(n ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getInitial(name = "") {
  return String(name).charAt(0).toUpperCase();
}

function deriveInventoryStatus(item) {
  const qty = toNumber(item?.quantity);
  const min = toNumber(item?.minimum_qty);
  const status = normalizeInventoryStatus(item?.status);
  if (qty <= 0 || status === "out") return "out";
  if (min > 0 && qty <= Math.max(1, Math.floor(min / 2))) return "critical";
  if ((min > 0 && qty <= min) || status === "low") return "low";
  return "ok";
}

// ── Responsive Table: desktop = grid, mobile = stacked cards ──────────────
function TableDesktopRow({ children, className = "" }) {
  return (
    <div className={`hidden sm:grid ${className} gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center`}>
      {children}
    </div>
  );
}

function TableDesktopHeader({ children, className = "" }) {
  return (
    <div className={`hidden sm:grid ${className} gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5`}>
      {children}
    </div>
  );
}

export default function ManagerDashboard() {
  const location = useLocation();
  const { headers } = useAuth();
  const [activeView, setActiveView] = useState("overview");
  const [stats, setStats] = useState([]);
  const [trend, setTrend] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [branchName, setBranchName] = useState("Branch Dashboard");
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [services, setServices] = useState([]);
  const [servicePriceMap, setServicePriceMap] = useState({});
  const [queueHistory, setQueueHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    if (!headers?.Authorization) return;
    try {
      setLoading(true);
      setError("");
      const [dashboardRes, bookingsRes, customersRes, inventoryRes, queueHistoryRes] = await Promise.all([
        fetch(`${API_BASE}/api/manager/dashboard/`, { headers, credentials: "include" }),
        fetch(`${API_BASE}/api/staff/bookings/`, { headers, credentials: "include" }),
        fetch(`${API_BASE}/customers/`, { headers, credentials: "include" }),
        fetch(`${API_BASE}/inventory/`, { headers, credentials: "include" }),
        fetch(`${API_BASE}/api/queue/history/`, { headers, credentials: "include" }),
      ]);

      if (!dashboardRes.ok) {
        const payload = await dashboardRes.json().catch(() => ({}));
        throw new Error(payload.detail || "Failed to load manager dashboard.");
      }

      const dashboardData = await dashboardRes.json();
      const bookingsData = bookingsRes.ok ? await bookingsRes.json() : [];
      const customersData = customersRes.ok ? await customersRes.json() : [];
      const inventoryData = inventoryRes.ok ? await inventoryRes.json() : [];
      const queueHistoryData = queueHistoryRes.ok ? await queueHistoryRes.json() : [];

      const branch = dashboardData?.branch_name || "";
      const servicesRes = await fetch(
        `${API_BASE}/services/${branch ? `?branch=${encodeURIComponent(branch)}` : ""}`,
        { headers, credentials: "include" },
      );
      const servicesData = servicesRes.ok ? await servicesRes.json() : [];
      const branchServicePriceMap = toArray(servicesData).reduce((acc, item) => {
        const key = String(item?.name ?? "").trim();
        if (!key) return acc;
        acc[key] = toNumber(item?.price ?? 0);
        return acc;
      }, {});

      const bookings = toArray(bookingsData).filter(
        (b) => !branch || !b?.branch_name || b.branch_name === branch,
      );
      const doneBookings = bookings.filter((b) => normalizeStatus(b.status) === "done");

      const serviceMap = doneBookings.reduce((acc, row) => {
        const key = row.service || "Other";
        const price = toNumber(row.price) || toNumber(branchServicePriceMap[key] ?? 0);
        if (!acc[key]) acc[key] = { service: key, count: 0, revenue: 0, avg_time: "—" };
        acc[key].count += 1;
        acc[key].revenue += price;
        return acc;
      }, {});

      setBranchName(branch || "Branch Dashboard");
      setStats(toArray(dashboardData?.stats));
      setTrend(toArray(dashboardData?.trend));
      setDistribution(toArray(dashboardData?.distribution));
      setAppointments(bookings);
      setCustomers(toArray(customersData));
      setInventory(
        toArray(inventoryData).filter((item) => !branch || !item?.branch_name || item.branch_name === branch),
      );
      setServicePriceMap(branchServicePriceMap);
      setQueueHistory(
        toArray(queueHistoryData).filter((entry) => !branch || !entry?.branch || entry.branch === branch),
      );
      setServices(
        Object.values(serviceMap).sort((a, b) => Number(b.revenue ?? 0) - Number(a.revenue ?? 0)),
      );
    } catch (err) {
      setError(err.message || "Failed to load manager dashboard.");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (SECTION_KEYS.includes(hash)) setActiveView(hash);
  }, []);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (SECTION_KEYS.includes(hash)) setActiveView(hash);
  }, [location.hash]);

  const appointmentsPagination = usePagination({ items: appointments, pageSize: 10, resetDeps: [appointments.length] });
  const customersPagination = usePagination({ items: customers, pageSize: 10, resetDeps: [customers.length] });
  const inventoryPagination = usePagination({ items: inventory, pageSize: 10, resetDeps: [inventory.length] });
  const servicesPagination = usePagination({ items: services, pageSize: 10, resetDeps: [services.length] });

  const employeeWorkloadRows = useMemo(() => {
    const grouped = queueHistory.reduce((acc, entry) => {
      const assignedName =
        entry?.assigned_employee?.full_name ||
        entry?.assigned_employee_name ||
        "Unassigned";
      if (!acc[assignedName]) {
        acc[assignedName] = { employee: assignedName, total: 0, completed: 0, skipped: 0 };
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

  const workloadPagination = usePagination({ items: employeeWorkloadRows, pageSize: 8, resetDeps: [employeeWorkloadRows.length] });

  const overviewTransactions = useMemo(() => {
    return [...appointments]
      .sort((a, b) => {
        const ad = `${a.date ?? ""} ${a.time ?? ""}`;
        const bd = `${b.date ?? ""} ${b.time ?? ""}`;
        return bd.localeCompare(ad);
      })
      .map((row) => ({
        customer_name: row.customer_name ?? "Unknown",
        service: row.service ?? "—",
        amount: toNumber(row.price ?? 0),
        status: row.status ?? "pending",
      }));
  }, [appointments]);

  const transactionsPagination = usePagination({ items: overviewTransactions, pageSize: 10, resetDeps: [overviewTransactions.length] });

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
      const key = deriveInventoryStatus(item);
      if (key === "ok") acc.ok += 1;
      else if (key === "low") acc.low += 1;
      else if (key === "critical") acc.critical += 1;
      else acc.out += 1;
      return acc;
    },
    { ok: 0, low: 0, critical: 0, out: 0 },
  );

  const queueMonthlyTrend = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("en-US", { month: "short" }),
        revenue: 0,
        services: 0,
      });
    }
    const monthMap = Object.fromEntries(months.map((m) => [m.key, m]));

    queueHistory.forEach((entry) => {
      const rawDate = entry?.completed_at || entry?.queued_at;
      const d = rawDate ? new Date(rawDate) : null;
      if (!d || Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = monthMap[key];
      if (!bucket) return;
      const status = normalizeStatus(entry.status);
      const paymentStatus = normalizeStatus(entry.payment_status);
      if (status === "done" || status === "completed") bucket.services += 1;
      if (paymentStatus === "paid") bucket.revenue += toNumber(entry.price ?? entry.service_base_price ?? 0);
    });

    return months.map(({ key, ...rest }) => rest);
  }, [queueHistory]);

  const getBookingRevenueValue = useCallback(
    (booking) => {
      const directPrice = toNumber(booking?.price ?? 0);
      if (directPrice > 0) return directPrice;
      const serviceName = String(booking?.service ?? "").trim();
      return toNumber(servicePriceMap[serviceName] ?? 0);
    },
    [servicePriceMap],
  );

  const resolvedTrend = useMemo(() => {
    const apiTrend = trend.map((row) => ({
      label: row?.label ?? "",
      revenue: Number(row?.revenue ?? 0),
      services: Number(row?.services ?? 0),
    }));
    const hasApiRevenue = apiTrend.some((row) => row.revenue > 0);
    if (hasApiRevenue) return apiTrend;

    const hasQueueRevenue = queueMonthlyTrend.some((row) => row.revenue > 0);
    if (hasQueueRevenue) return queueMonthlyTrend;

    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("en-US", { month: "short" }),
        revenue: 0,
        services: 0,
      });
    }
    const monthMap = Object.fromEntries(months.map((m) => [m.key, m]));

    appointments.forEach((a) => {
      const dateValue = a?.date ? new Date(a.date) : null;
      if (!dateValue || Number.isNaN(dateValue.getTime())) return;
      const key = `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, "0")}`;
      const bucket = monthMap[key];
      if (!bucket) return;
      const status = normalizeStatus(a.status);
      if (status === "done" || status === "completed") bucket.services += 1;
      if (["done", "completed", "confirmed"].includes(status)) {
        bucket.revenue += getBookingRevenueValue(a);
      }
    });

    return months.map(({ key, ...rest }) => rest);
  }, [trend, appointments, queueMonthlyTrend, getBookingRevenueValue]);

  const todayISO = new Date().toISOString().slice(0, 10);
  const totalRevenue = resolvedTrend.reduce((sum, row) => sum + Number(row.revenue ?? 0), 0);
  const bookingsToday = appointments.filter((a) => String(a.date ?? "").slice(0, 10) === todayISO).length;
  const doneAppointments = appointments.filter((a) => ["done", "completed"].includes(normalizeStatus(a.status))).length;
  const completionRate = appointments.length ? (doneAppointments / appointments.length) * 100 : 0;
  const paymentRate = completionRate;

  const newCustomers30d = customers.filter((c) => {
    if (!c?.created_at) return false;
    const created = new Date(c.created_at);
    if (Number.isNaN(created.getTime())) return false;
    return (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24) <= 30;
  }).length;

  const customerSpendRows = useMemo(() => {
    const grouped = appointments.reduce((acc, row) => {
      const name = String(row.customer_name ?? "").trim() || "Unknown";
      if (!acc[name]) acc[name] = { name, visits: 0, total_spent: 0 };
      acc[name].visits += 1;
      acc[name].total_spent += toNumber(row.price ?? 0);
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => Number(b.total_spent) - Number(a.total_spent));
  }, [appointments]);

  const topCustomer = customerSpendRows[0] ?? null;
  const tierRows = [
    { tier: "Loyal", count: customerSpendRows.filter((c) => c.visits >= 5).length, color: "#10b981" },
    { tier: "Regular", count: customerSpendRows.filter((c) => c.visits >= 2 && c.visits < 5).length, color: "#3b82f6" },
    { tier: "New", count: customerSpendRows.filter((c) => c.visits <= 1).length, color: "#6b7280" },
  ];

  const customerBarData = {
    labels: customerSpendRows.slice(0, 6).map((c) => c.name),
    datasets: [{ label: "Spend (₱)", data: customerSpendRows.slice(0, 6).map((c) => Number(c.total_spent ?? 0)), backgroundColor: "rgba(168,85,247,0.5)", borderRadius: 8 }],
  };

  const revenueMonthlyBarData = {
    labels: resolvedTrend.map((t) => t.label),
    datasets: [{ label: "Monthly Revenue", data: resolvedTrend.map((t) => Number(t.revenue ?? 0)), backgroundColor: "rgba(239,68,68,0.6)", borderRadius: 8 }],
  };

  const revenueContributionData = {
    labels: resolvedTrend.filter((t) => Number(t.revenue ?? 0) > 0).map((t) => t.label),
    datasets: [{
      data: resolvedTrend.filter((t) => Number(t.revenue ?? 0) > 0).map((t) => Number(t.revenue ?? 0)),
      backgroundColor: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"],
      borderWidth: 2,
      borderColor: "#111827",
    }],
  };

  const lineChartData = {
    labels: resolvedTrend.map((t) => t.label),
    datasets: [
      { label: "Revenue (₱)", data: resolvedTrend.map((t) => Number(t.revenue ?? 0)), borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.08)", tension: 0.4, pointRadius: 4, fill: true, yAxisID: "y" },
      { label: "Services", data: resolvedTrend.map((t) => Number(t.services ?? 0)), borderColor: "#a855f7", backgroundColor: "rgba(168,85,247,0.08)", tension: 0.4, pointRadius: 4, fill: true, yAxisID: "y1" },
    ],
  };

  const managerStatCards = (stats || []).map((s, i) => {
    const icons = [
      <svg key="r" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      <svg key="s" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      <svg key="c" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      <svg key="a" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    ];
    const accents = [
      { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
      { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
      { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
      { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    ];
    const acc = accents[i % accents.length];
    return { title: s.title, value: s.value, sub: s.change, icon: icons[i % icons.length], accentBg: acc.bg, accentText: acc.text, border: acc.border };
  });

  const managerKpiCards = useMemo(() => {
    if (managerStatCards.length >= 4) {
      return managerStatCards.slice(0, 4).map((card) => {
        const title = String(card.title ?? "").toLowerCase();
        const valueNumber = toNumber(card.value);
        if (title.includes("revenue") && valueNumber <= 0 && totalRevenue > 0) {
          return { ...card, value: `₱${Number(totalRevenue).toLocaleString()}`, sub: "From paid branch queue history" };
        }
        return card;
      });
    }

    const revenueTotal = resolvedTrend.reduce((sum, row) => sum + Number(row.revenue ?? 0), 0);
    const doneCount = appointments.filter((a) => normalizeStatus(a.status) === "done").length;
    const uniqueCustomers = new Set(appointments.map((a) => String(a.customer_name ?? "").trim()).filter(Boolean)).size;
    const satisfactionValue = stats.find((s) => String(s.title ?? "").toLowerCase().includes("satisfaction"))?.value;

    return [
      { title: "Branch Revenue", value: `₱${Number(revenueTotal).toLocaleString()}`, sub: "Branch-limited total", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, accentBg: "bg-red-500/10", accentText: "text-red-400", border: "border-red-500/20" },
      { title: "Services Completed", value: Number(doneCount).toLocaleString(), sub: "Done appointments", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, accentBg: "bg-blue-500/10", accentText: "text-blue-400", border: "border-blue-500/20" },
      { title: "Active Customers", value: Number(uniqueCustomers).toLocaleString(), sub: "From branch bookings", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, accentBg: "bg-purple-500/10", accentText: "text-purple-400", border: "border-purple-500/20" },
      { title: "Customer Satisfaction", value: satisfactionValue ?? "0%", sub: "Current branch score", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, accentBg: "bg-emerald-500/10", accentText: "text-emerald-400", border: "border-emerald-500/20" },
    ];
  }, [managerStatCards, resolvedTrend, appointments, stats]);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: true, position: "bottom", labels: { color: "#9ca3af", usePointStyle: true, padding: 20, font: { size: 12 } } },
      tooltip: { backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1, titleColor: "#f9fafb", bodyColor: "#9ca3af" },
    },
    scales: {
      x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#6b7280" } },
      y: { type: "linear", position: "left", beginAtZero: true, grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#6b7280" } },
      y1: { type: "linear", position: "right", beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { color: "#6b7280" } },
    },
  };

  const doughnutChartData = {
    labels: distribution.map((d) => d.label),
    datasets: [{ data: distribution.map((d) => d.val), backgroundColor: distribution.map((d) => d.color), borderWidth: 2, borderColor: "#111827" }],
  };

  const viewLabel = { overview: "Overview", revenue: "Revenue", customers: "Customers", appointment: "Appointment", inventory: "Inventory", services: "Services", employees: "Employees" }[activeView];

  const handleExportCSV = () => {
    if (activeView === "overview" || activeView === "revenue") {
      exportToCSV(resolvedTrend.map((t) => [t.label, t.revenue, t.services]), ["Period", "Revenue", "Services"], "manager_revenue_trend.csv");
    } else if (activeView === "customers") {
      exportToCSV(customers.map((c) => [`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(), c.email ?? "—", c.contact_number ?? "—"]), ["Name", "Email", "Contact"], "manager_customers.csv");
    } else if (activeView === "appointment") {
      exportToCSV(appointments.map((a) => [a.date ?? "—", a.time ?? "—", a.customer_name ?? "—", a.service ?? "—", a.status ?? "—"]), ["Date", "Time", "Customer", "Service", "Status"], "manager_appointments.csv");
    } else if (activeView === "inventory") {
      exportToCSV(inventory.map((i) => [i.name ?? "—", i.category ?? "—", i.quantity ?? 0, i.unit ?? "—", i.status ?? "—"]), ["Item", "Category", "Quantity", "Unit", "Status"], "manager_inventory.csv");
    } else if (activeView === "services") {
      exportToCSV(services.map((s) => [s.service ?? "—", s.count ?? 0, s.revenue ?? 0]), ["Service", "Count", "Revenue"], "manager_services.csv");
    } else if (activeView === "employees") {
      exportToCSV(employeeWorkloadRows.map((row) => [row.employee, row.total, row.completed, row.skipped, row.share.toFixed(1)]), ["Employee", "Total Tasks", "Completed", "Skipped", "Workload Share (%)"], "manager_employees_workload.csv");
    }
  };

  const handlePrintDashboard = async () => {
    const selector = { overview: "#manager-overview", revenue: "#manager-revenue", customers: "#manager-customers", appointment: "#manager-appointment", inventory: "#manager-inventory", services: "#manager-services", employees: "#manager-employees" }[activeView];
    const activeSection = document.querySelector(selector);
    if (!activeSection) return;
    const canvas = await html2canvas(activeSection, { backgroundColor: "#030712", scale: 2, useCORS: true, logging: false, scrollY: -window.scrollY });
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Manager Dashboard - ${viewLabel}</title></head><body style="margin:0"><img src="${canvas.toDataURL("image/png")}" style="width:100%" /></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const chartBarOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#9ca3af" } } },
    scales: { x: { ticks: { color: "#6b7280" }, grid: { color: "rgba(255,255,255,0.04)" } }, y: { ticks: { color: "#6b7280" }, grid: { color: "rgba(255,255,255,0.04)" } } },
  };

  return (
    <ManagerLayout title="" subtitle="">
      <style>{`
        @media print {
          #manager-dashboard-print { background: #fff !important; color: #111827 !important; }
          #manager-dashboard-print * { color: #111827 !important; text-shadow: none !important; }
          #manager-dashboard-print [class*="bg-"] { background: transparent !important; }
          #manager-dashboard-print [class*="border-"] { border-color: #d1d5db !important; }
          #manager-dashboard-print canvas { max-width: 100% !important; height: auto !important; }
        }
      `}</style>

      <div id="manager-dashboard-print" className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8 print:bg-white print:p-4">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Manager Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm">Welcome back — {branchName}</p>
        </div>

        <ErrorBanner message={error} />

        {loading ? (
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 text-gray-400">Loading dashboard data...</div>
        ) : (
          <>
            {/* ── OVERVIEW ─────────────────────────────────────────────── */}
            {activeView === "overview" && (
              <section id="manager-overview" className="scroll-mt-24 mb-10">
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

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-8">
                  {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : managerKpiCards.map((card, i) => <StatCard key={i} {...card} />)}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6">
                  <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                    <div className="mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-black text-white">Revenue & Services Trend</h3>
                      <p className="text-gray-500 text-sm mt-0.5">Branch performance trend</p>
                    </div>
                    <div className="h-56 sm:h-72">
                      <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                  </div>
                  <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                    <div className="mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-black text-white">Service Distribution</h3>
                      <p className="text-gray-500 text-sm mt-0.5">By category this month</p>
                    </div>
                    <div className="h-40 flex items-center justify-center mb-4">
                      <Doughnut data={doughnutChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {distribution.map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-xs sm:text-sm text-gray-400 flex-1">{item.label}</span>
                          <span className="text-xs font-bold text-white">{item.pct}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/5">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white">Recent Transactions</h3>
                      <p className="text-gray-500 text-sm mt-0.5">Latest paid branch activity</p>
                    </div>
                  </div>

                  {/* Desktop header */}
                  <TableDesktopHeader className="grid-cols-12">
                    <div className="col-span-4">Customer</div>
                    <div className="col-span-3">Service</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </TableDesktopHeader>

                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : (
                    transactionsPagination.paginatedItems.map((row, i) => {
                      const statusKey = normalizeStatus(row.status);
                      return (
                        <div key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          {/* Desktop row */}
                          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                            <div className="col-span-4 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center text-sm font-bold shrink-0">{getInitial(row.customer_name)}</div>
                              <span className="text-white font-semibold text-sm truncate">{row.customer_name}</span>
                            </div>
                            <div className="col-span-3 text-gray-400 text-sm truncate">{row.service}</div>
                            <div className="col-span-2 text-white font-bold text-sm">₱{Number(row.amount ?? 0).toLocaleString()}</div>
                            <div className="col-span-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[statusKey] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>{STATUS_LABEL[statusKey] ?? row.status}</span>
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                              </button>
                            </div>
                          </div>
                          {/* Mobile card */}
                          <div className="sm:hidden px-4 py-3">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center text-xs font-bold shrink-0">{getInitial(row.customer_name)}</div>
                                <span className="text-white font-semibold text-sm truncate">{row.customer_name}</span>
                              </div>
                              <span className="text-white font-bold text-sm whitespace-nowrap">₱{Number(row.amount ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 pl-10">
                              <span className="text-gray-400 text-xs truncate">{row.service}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[statusKey] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>{STATUS_LABEL[statusKey] ?? row.status}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {!loading && <Pagination current={transactionsPagination.currentPage} total={transactionsPagination.totalPages} onChange={transactionsPagination.setCurrentPage} className="px-4 sm:px-6 py-4" />}
                </div>
              </section>
            )}

            {/* ── REVENUE ──────────────────────────────────────────────── */}
            {activeView === "revenue" && (
              <section id="manager-revenue" className="scroll-mt-24 mb-10">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                  {[
                    { title: "Total Revenue (Q1)", value: `₱${Number(totalRevenue).toLocaleString()}`, accentBg: "bg-red-500/10", accentText: "text-red-400", border: "border-red-500/20", sub: "Appointments + walk-ins", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                    { title: "Bookings Today", value: Number(bookingsToday).toLocaleString(), accentBg: "bg-gray-500/10", accentText: "text-gray-400", border: "border-gray-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg> },
                    { title: "Completion Rate", value: `${completionRate.toFixed(1)}%`, accentBg: "bg-emerald-500/10", accentText: "text-emerald-400", border: "border-emerald-500/20", sub: `Paid rate: ${paymentRate.toFixed(1)}%`, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
                  ].map((c, i) => <StatCard key={i} {...c} />)}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                  <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                    <h3 className="text-base sm:text-lg font-black text-white mb-1">Monthly Revenue Trend</h3>
                    <p className="text-gray-500 text-sm mb-4 sm:mb-6">Revenue movement across recent months</p>
                    <div className="h-56 sm:h-72">
                      <Bar data={revenueMonthlyBarData} options={chartBarOptions} />
                    </div>
                  </div>
                  <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                    <h3 className="text-base sm:text-lg font-black text-white mb-1">Revenue Contribution</h3>
                    <p className="text-gray-500 text-sm mb-4 sm:mb-6">Share of each month in total revenue</p>
                    <div className="h-56 sm:h-72">
                      {revenueContributionData.labels.length ? (
                        <Doughnut data={revenueContributionData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: "#9ca3af" } } } }} />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-600 text-sm">No revenue data available yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── CUSTOMERS ────────────────────────────────────────────── */}
            {activeView === "customers" && (
              <section id="manager-customers" className="scroll-mt-24 mb-10">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                  {[
                    { title: "Total Customers", value: Number(customers.length).toLocaleString(), accentBg: "bg-purple-500/10", accentText: "text-purple-400", border: "border-purple-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                    { title: "New Customers (30d)", value: Number(newCustomers30d).toLocaleString(), accentBg: "bg-blue-500/10", accentText: "text-blue-400", border: "border-blue-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
                    { title: "Top Spender", value: topCustomer?.name ?? "—", sub: topCustomer ? `₱${Number(topCustomer.total_spent ?? 0).toLocaleString()} total` : undefined, accentBg: "bg-yellow-500/10", accentText: "text-yellow-400", border: "border-yellow-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
                  ].map((c, i) => <StatCard key={i} {...c} />)}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
                  <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                    <h3 className="text-base sm:text-lg font-black text-white mb-1">Customer Spend</h3>
                    <p className="text-gray-500 text-sm mb-4 sm:mb-6">Top customers by total spending</p>
                    <div className="h-48 sm:h-56">
                      <Bar data={customerBarData} options={chartBarOptions} />
                    </div>
                  </div>
                  <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                    <h3 className="text-base sm:text-lg font-black text-white mb-1">Tier Distribution</h3>
                    <p className="text-gray-500 text-sm mb-4 sm:mb-6">Customer loyalty tiers</p>
                    <div className="space-y-4 mt-4">
                      {tierRows.map((t) => (
                        <div key={t.tier} className="flex items-center gap-4">
                          <span className="text-sm text-gray-400 w-16 sm:w-20">{t.tier}</span>
                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${customerSpendRows.length ? (t.count / customerSpendRows.length) * 100 : 0}%`, backgroundColor: t.color }} />
                          </div>
                          <span className="text-sm font-bold text-white w-6 text-right">{t.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Customers Table */}
                <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <div className="px-4 sm:px-6 py-4 border-b border-white/5">
                    <h3 className="text-base sm:text-lg font-black text-white">Customer List</h3>
                    <p className="text-gray-500 text-sm mt-0.5">All branch customers</p>
                  </div>
                  <TableDesktopHeader className="grid-cols-12">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-2">Visits</div>
                    <div className="col-span-3">Total Spent</div>
                    <div className="col-span-2">Joined</div>
                    <div className="col-span-1">Segment</div>
                  </TableDesktopHeader>

                  {customersPagination.paginatedItems.map((c, i) => {
                    const fullName = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Unknown";
                    const aggregate = customerSpendRows.find((row) => row.name === fullName) ?? { visits: 0, total_spent: 0 };
                    const segment = aggregate.visits >= 5 ? "Loyal" : aggregate.visits >= 2 ? "Regular" : "New";
                    return (
                      <div key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        {/* Desktop */}
                        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-sm font-bold shrink-0">{getInitial(fullName)}</div>
                            <span className="text-white font-semibold text-sm truncate">{fullName}</span>
                          </div>
                          <div className="col-span-2 text-gray-400 text-sm font-semibold">{Number(aggregate.visits ?? 0)}x</div>
                          <div className="col-span-3 text-white font-bold text-sm">₱{Number(aggregate.total_spent ?? 0).toLocaleString()}</div>
                          <div className="col-span-2 text-gray-500 text-xs">{c.created_at ? String(c.created_at).slice(0, 10) : "—"}</div>
                          <div className="col-span-1"><span className={`px-2 py-1 rounded-full text-xs font-semibold border ${SEGMENT_STYLE[segment]}`}>{segment}</span></div>
                        </div>
                        {/* Mobile card */}
                        <div className="sm:hidden px-4 py-3">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">{getInitial(fullName)}</div>
                              <span className="text-white font-semibold text-sm truncate">{fullName}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEGMENT_STYLE[segment]}`}>{segment}</span>
                          </div>
                          <div className="flex items-center gap-4 pl-10 text-xs text-gray-400">
                            <span>{Number(aggregate.visits ?? 0)}x visits</span>
                            <span className="text-white font-bold">₱{Number(aggregate.total_spent ?? 0).toLocaleString()}</span>
                            <span>{c.created_at ? String(c.created_at).slice(0, 10) : "—"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <Pagination current={customersPagination.currentPage} total={customersPagination.totalPages} onChange={customersPagination.setCurrentPage} className="px-4 sm:px-6 py-4" />
                </div>
              </section>
            )}

            {/* ── APPOINTMENTS ─────────────────────────────────────────── */}
            {activeView === "appointment" && (
              <section id="manager-appointment" className="scroll-mt-24 mb-10">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                  {[
                    { title: "Total Appointments", value: appointments.length.toLocaleString(), accentBg: "bg-blue-500/10", accentText: "text-blue-400", border: "border-blue-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
                    { title: "Confirmed", value: appointmentStatusCounts.confirmed.toLocaleString(), accentBg: "bg-emerald-500/10", accentText: "text-emerald-400", border: "border-emerald-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> },
                    { title: "Pending", value: appointmentStatusCounts.pending.toLocaleString(), accentBg: "bg-yellow-500/10", accentText: "text-yellow-400", border: "border-yellow-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2 2m6-2a8 8 0 11-16 0 8 8 0 0116 0z" /></svg> },
                    { title: "Cancelled / No Show", value: (appointmentStatusCounts.cancelled + appointmentStatusCounts.noShow).toLocaleString(), accentBg: "bg-red-500/10", accentText: "text-red-400", border: "border-red-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> },
                  ].map((c, i) => <StatCard key={i} {...c} />)}
                </div>

                <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <div className="px-4 sm:px-6 py-4 border-b border-white/5">
                    <h3 className="text-base sm:text-lg font-black text-white">Appointment Queue</h3>
                    <p className="text-gray-500 text-sm mt-0.5">Your branch bookings only</p>
                  </div>
                  <TableDesktopHeader className="grid-cols-12">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Time</div>
                    <div className="col-span-3">Customer</div>
                    <div className="col-span-2">Service</div>
                    <div className="col-span-2">Staff</div>
                    <div className="col-span-1">Status</div>
                  </TableDesktopHeader>

                  {appointmentsPagination.paginatedItems.map((a) => {
                    const statusKey = normalizeStatus(a.status);
                    return (
                      <div key={a.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        {/* Desktop */}
                        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                          <div className="col-span-2 text-gray-300 text-sm">{a.date ?? "—"}</div>
                          <div className="col-span-2 text-gray-400 text-sm">{a.time ?? "—"}</div>
                          <div className="col-span-3 text-white font-semibold text-sm">{a.customer_name ?? "—"}</div>
                          <div className="col-span-2 text-gray-300 text-sm">{a.service ?? "—"}</div>
                          <div className="col-span-2 text-gray-400 text-sm">{a.staff || "Unassigned"}</div>
                          <div className="col-span-1">
                            <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_STYLE[statusKey] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30"}`}>{STATUS_LABEL[statusKey] ?? (a.status || "—")}</span>
                          </div>
                        </div>
                        {/* Mobile card */}
                        <div className="sm:hidden px-4 py-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-white font-semibold text-sm">{a.customer_name ?? "—"}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLE[statusKey] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30"}`}>{STATUS_LABEL[statusKey] ?? (a.status || "—")}</span>
                          </div>
                          <div className="text-gray-300 text-xs">{a.service ?? "—"}</div>
                          <div className="flex items-center gap-3 text-gray-500 text-xs">
                            <span>{a.date ?? "—"} {a.time ? `· ${a.time}` : ""}</span>
                            {a.staff && <span>· {a.staff}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <Pagination current={appointmentsPagination.currentPage} total={appointmentsPagination.totalPages} onChange={appointmentsPagination.setCurrentPage} className="px-4 sm:px-6 py-4" />
                </div>
              </section>
            )}

            {/* ── INVENTORY ────────────────────────────────────────────── */}
            {activeView === "inventory" && (
              <section id="manager-inventory" className="scroll-mt-24 mb-10">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                  {[
                    { title: "Total SKUs", value: String(inventory.length), accentBg: "bg-blue-500/10", accentText: "text-blue-400", border: "border-blue-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
                    { title: "Below Reorder Level", value: String(inventoryCounts.low), accentBg: "bg-amber-500/10", accentText: "text-amber-400", border: "border-amber-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg> },
                    { title: "Urgent Replenishment", value: String(inventoryCounts.critical + inventoryCounts.out), sub: "Needs immediate reorder", accentBg: "bg-red-500/10", accentText: "text-red-400", border: "border-red-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> },
                  ].map((c, i) => <StatCard key={i} {...c} />)}
                </div>

                <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <div className="px-4 sm:px-6 py-4 border-b border-white/5">
                    <h3 className="text-base sm:text-lg font-black text-white">Parts & Supplies Inventory</h3>
                    <p className="text-gray-500 text-sm mt-0.5">Current stock levels</p>
                  </div>
                  <TableDesktopHeader className="grid-cols-12">
                    <div className="col-span-4">Item</div>
                    <div className="col-span-2">Branch</div>
                    <div className="col-span-2">Stock</div>
                    <div className="col-span-2">Reorder At</div>
                    <div className="col-span-2">Status</div>
                  </TableDesktopHeader>

                  {inventoryPagination.paginatedItems.map((item) => {
                    const invStatus = deriveInventoryStatus(item);
                    const invLabel = invStatus === "ok" ? "Available" : invStatus === "low" ? "Running Low" : invStatus === "critical" ? "Reorder Now" : "Out of Stock";
                    return (
                      <div key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        {/* Desktop */}
                        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                          <div className="col-span-4 text-white font-semibold text-sm">{item.name ?? "—"}</div>
                          <div className="col-span-2 text-gray-400 text-sm">{item.branch_name ?? branchName}</div>
                          <div className="col-span-2 text-gray-300 text-sm font-bold">{Number(item.quantity ?? 0)} <span className="text-gray-600 font-normal">{item.unit ?? ""}</span></div>
                          <div className="col-span-2 text-gray-500 text-sm">{Number(item.minimum_qty ?? 0)} {item.unit ?? ""}</div>
                          <div className="col-span-2"><span className={`px-2 py-1 rounded-full text-xs font-semibold border ${INV_STYLE[invStatus]}`}>{invLabel}</span></div>
                        </div>
                        {/* Mobile card */}
                        <div className="sm:hidden px-4 py-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-white font-semibold text-sm">{item.name ?? "—"}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${INV_STYLE[invStatus]}`}>{invLabel}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="font-bold text-gray-300">{Number(item.quantity ?? 0)} {item.unit ?? ""}</span>
                            <span>· min {Number(item.minimum_qty ?? 0)} {item.unit ?? ""}</span>
                            <span>· {item.branch_name ?? branchName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <Pagination current={inventoryPagination.currentPage} total={inventoryPagination.totalPages} onChange={inventoryPagination.setCurrentPage} className="px-4 sm:px-6 py-4" />
                </div>
              </section>
            )}

            {/* ── SERVICES ─────────────────────────────────────────────── */}
            {activeView === "services" && (
              <section id="manager-services" className="scroll-mt-24">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                  {[
                    { title: "Total Services", value: String(services.reduce((a, s) => a + Number(s.count ?? 0), 0)), accentBg: "bg-blue-500/10", accentText: "text-blue-400", border: "border-blue-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                    { title: "Top Service", value: services[0]?.service ?? "—", sub: "Highest revenue generator", accentBg: "bg-red-500/10", accentText: "text-red-400", border: "border-red-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
                    { title: "Total Service Revenue", value: `₱${services.reduce((a, s) => a + Number(s.revenue ?? 0), 0).toLocaleString()}`, accentBg: "bg-emerald-500/10", accentText: "text-emerald-400", border: "border-emerald-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                  ].map((c, i) => <StatCard key={i} {...c} />)}
                </div>

                <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <div className="px-4 sm:px-6 py-4 border-b border-white/5">
                    <h3 className="text-base sm:text-lg font-black text-white">Service Performance</h3>
                    <p className="text-gray-500 text-sm mt-0.5">All service types ranked by revenue</p>
                  </div>
                  <TableDesktopHeader className="grid-cols-12">
                    <div className="col-span-4">Service</div>
                    <div className="col-span-2">Count</div>
                    <div className="col-span-3">Revenue</div>
                    <div className="col-span-2">Avg Time</div>
                    <div className="col-span-1">Share</div>
                  </TableDesktopHeader>

                  {services.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500 text-sm">No service performance data available.</div>
                  ) : (
                    servicesPagination.paginatedItems.map((s, idx) => {
                      const totalServiceRevenue = services.reduce((a, x) => a + Number(x.revenue ?? 0), 0);
                      const pct = totalServiceRevenue ? ((Number(s.revenue ?? 0) / totalServiceRevenue) * 100).toFixed(1) : "0.0";
                      return (
                        <div key={`${s.service}-${idx}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          {/* Desktop */}
                          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                            <div className="col-span-4 text-white font-semibold text-sm">{s.service ?? "—"}</div>
                            <div className="col-span-2 text-gray-400 text-sm">{Number(s.count ?? 0)}</div>
                            <div className="col-span-3 text-emerald-400 font-bold text-sm">₱{Number(s.revenue ?? 0).toLocaleString()}</div>
                            <div className="col-span-2 text-gray-500 text-xs">{s.avg_time ?? "—"}</div>
                            <div className="col-span-1 text-gray-300 text-xs font-semibold">{pct}%</div>
                          </div>
                          {/* Mobile card */}
                          <div className="sm:hidden px-4 py-3">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-white font-semibold text-sm">{s.service ?? "—"}</span>
                              <span className="text-emerald-400 font-bold text-sm">₱{Number(s.revenue ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span>{Number(s.count ?? 0)} services</span>
                              <span>· {pct}% share</span>
                              {s.avg_time && s.avg_time !== "—" && <span>· {s.avg_time}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <Pagination current={servicesPagination.currentPage} total={servicesPagination.totalPages} onChange={servicesPagination.setCurrentPage} className="px-4 sm:px-6 py-4" />
                </div>
              </section>
            )}

            {/* ── EMPLOYEES ────────────────────────────────────────────── */}
            {activeView === "employees" && (
              <section id="manager-employees" className="scroll-mt-24">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                  {[
                    { title: "Assigned Employees", value: String(employeeWorkloadRows.filter((row) => row.employee !== "Unassigned").length), sub: "With recorded service load", accentBg: "bg-cyan-500/10", accentText: "text-cyan-400", border: "border-cyan-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V10H2v10h5m10 0v-2a4 4 0 10-8 0v2m8 0H9m4-12a4 4 0 110 8 4 4 0 010-8z" /></svg> },
                    { title: "Total Assigned Tasks", value: String(employeeWorkloadRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0)), accentBg: "bg-blue-500/10", accentText: "text-blue-400", border: "border-blue-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
                    { title: "Completion Rate", value: `${((employeeWorkloadRows.reduce((sum, row) => sum + Number(row.completed ?? 0), 0) / Math.max(1, employeeWorkloadRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0))) * 100).toFixed(1)}%`, sub: "Completed tasks across branch", accentBg: "bg-emerald-500/10", accentText: "text-emerald-400", border: "border-emerald-500/20", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                  ].map((c, i) => <StatCard key={i} {...c} />)}
                </div>

                <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <div className="px-4 sm:px-6 py-4 border-b border-white/5">
                    <h3 className="text-base sm:text-lg font-black text-white">Employee Workload Distribution</h3>
                    <p className="text-gray-500 text-sm mt-0.5">Tasks handled per employee in this branch</p>
                  </div>
                  <TableDesktopHeader className="grid-cols-12">
                    <div className="col-span-4">Employee</div>
                    <div className="col-span-2">Total Tasks</div>
                    <div className="col-span-2">Completed</div>
                    <div className="col-span-2">Skipped</div>
                    <div className="col-span-2">Workload Share</div>
                  </TableDesktopHeader>

                  {employeeWorkloadRows.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500 text-sm">No workload data available yet.</div>
                  ) : (
                    workloadPagination.paginatedItems.map((row, idx) => (
                      <div key={`${row.employee}-${idx}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        {/* Desktop */}
                        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                          <div className="col-span-4 text-white font-semibold text-sm">{row.employee}</div>
                          <div className="col-span-2 text-gray-300 text-sm font-semibold">{row.total}</div>
                          <div className="col-span-2 text-emerald-400 text-sm font-semibold">{row.completed}</div>
                          <div className="col-span-2 text-amber-400 text-sm font-semibold">{row.skipped}</div>
                          <div className="col-span-2">
                            <div className="h-2 rounded-full bg-gray-800 overflow-hidden mb-1">
                              <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, Math.max(0, row.share)).toFixed(1)}%` }} />
                            </div>
                            <p className="text-xs text-cyan-300 font-semibold">{row.share.toFixed(1)}%</p>
                          </div>
                        </div>
                        {/* Mobile card */}
                        <div className="sm:hidden px-4 py-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-white font-semibold text-sm">{row.employee}</span>
                            <span className="text-cyan-300 text-xs font-bold">{row.share.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden mb-2">
                            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, Math.max(0, row.share)).toFixed(1)}%` }} />
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-gray-400">{row.total} tasks</span>
                            <span className="text-emerald-400">{row.completed} done</span>
                            <span className="text-amber-400">{row.skipped} skipped</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <Pagination current={workloadPagination.currentPage} total={workloadPagination.totalPages} onChange={workloadPagination.setCurrentPage} className="px-4 sm:px-6 py-4" />
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </ManagerLayout>
  );
}