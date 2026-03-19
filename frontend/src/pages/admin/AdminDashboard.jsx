import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
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
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
);

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

function StatCard({
  title,
  value,
  change,
  icon,
  accentBg,
  accentText,
  border,
}) {
  return (
    <div
      className={`bg-gray-900/60 border ${border} rounded-2xl p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${accentBg} ${accentText} p-3 rounded-xl`}>{icon}</div>
        <div
          className={`flex items-center gap-1 text-xs font-semibold ${accentText} ${accentBg} px-2 py-1 rounded-full`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
      </div>
      <div className="text-2xl font-black text-white mb-1">{value ?? "—"}</div>
      <div className="text-sm text-gray-500 mb-3">{title}</div>
      {change && (
        <div className={`text-xs font-semibold ${accentText}`}>{change}</div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-800" />
        <div className="w-10 h-6 rounded-full bg-gray-800" />
      </div>
      <div className="h-7 w-24 bg-gray-800 rounded mb-2" />
      <div className="h-4 w-32 bg-gray-800 rounded mb-3" />
      <div className="h-3 w-28 bg-gray-800 rounded" />
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

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [chart, setChart] = useState(null);
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

  // ── Stat cards ──────────────────────────────────────────────────────────────
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

  // ── Line chart — live data from API ────────────────────────────────────────
  const lineChartData = {
    labels: chart?.labels ?? [],
    datasets: [
      {
        label: "Revenue (₱)",
        data: chart?.revenue ?? [],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.08)",
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
        backgroundColor: "rgba(107, 114, 128, 0.05)",
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
      tooltip: {
        backgroundColor: "#111827",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#f9fafb",
        bodyColor: "#9ca3af",
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#6b7280" },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        beginAtZero: true,
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#6b7280", callback: (v) => `₱${v.toLocaleString()}` },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { color: "#6b7280" },
      },
    },
  };

  // ── Doughnut — static for now ──────────────────────────────────────────────
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
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111827",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#f9fafb",
        bodyColor: "#9ca3af",
      },
    },
  };

  const serviceBreakdown = [
    { label: "Oil Change", color: "#ef4444", pct: "35%" },
    { label: "Tire Service", color: "#a855f7", pct: "25%" },
    { label: "Engine Repair", color: "#3b82f6", pct: "20%" },
    { label: "Body Work", color: "#10b981", pct: "12%" },
    { label: "Other", color: "#f59e0b", pct: "8%" },
  ];

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getInitial = (name = "") => name.charAt(0).toUpperCase();
  const normalizeStatus = (s = "") => s.toLowerCase().replace(/\s+/g, "_");
  const currentYear = new Date().getFullYear();
  const chartSubtitle = chart?.labels?.length
    ? `${chart.labels[0]} – ${chart.labels[chart.labels.length - 1]} ${currentYear}`
    : `${currentYear}`;

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Welcome back — here's what's happening today.
          </p>
        </div>

        {/* Error Banner */}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : statCards.map((card, i) => <StatCard key={i} {...card} />)}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Line Chart */}
          <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-white">
                  Revenue & Services Trend
                </h3>
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

          {/* Doughnut Chart */}
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

        {/* Recent Transactions Table */}
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

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
            <div className="col-span-4">Customer</div>
            <div className="col-span-3">Service</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Body */}
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
              <p className="text-gray-500 text-sm">No transactions found.</p>
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
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;