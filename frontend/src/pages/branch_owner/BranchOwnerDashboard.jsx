import React, { useEffect, useState } from "react";
import BranchOwnerLayout from "./BranchOwnerLayout";
import NotificationDropdown from "../../components/NotificationDropdown";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { API_BASE } from "../../hooks/useAuth.js";
import { getUserFromSession } from "../../utils/getUser.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const BRANCH_COLORS = [
  "#ef4444",
  "#a855f7",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
];

function StatCard({
  title,
  value,
  change,
  accentBg,
  accentText,
  border,
  icon,
  loading,
}) {
  return (
    <div
      className={`bg-gray-900/60 border ${border} rounded-2xl p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${accentBg} ${accentText} p-3 rounded-xl`}>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {icon}
          </svg>
        </div>
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
      {loading ? (
        <div className="h-7 w-24 bg-gray-800 rounded animate-pulse mb-1" />
      ) : (
        <div className="text-2xl font-black text-white mb-1">{value}</div>
      )}
      <div className="text-sm text-gray-500 mb-2">{title}</div>
      {loading ? (
        <div className="h-3 w-32 bg-gray-800 rounded animate-pulse" />
      ) : (
        <div className={`text-xs font-semibold ${accentText}`}>{change}</div>
      )}
    </div>
  );
}

export default function BranchOwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [branchRevenue, setBranchRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [headers, setHeaders] = useState({});

  // Check authentication and get headers
  useEffect(() => {
    const user = getUserFromSession();
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    if (user && token) {
      setIsAuthenticated(true);
      setHeaders({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const [sRes, tRes, bRes] = await Promise.all([
          fetch(`${API_BASE}/owner/dashboard/stats/`, {
            headers,
            credentials: "include",
          }),
          fetch(`${API_BASE}/owner/dashboard/trend/`, {
            headers,
            credentials: "include",
          }),
          fetch(`${API_BASE}/owner/dashboard/branch-revenue/`, {
            headers,
            credentials: "include",
          }),
        ]);

        if (!sRes.ok) {
          if (sRes.status === 401 || sRes.status === 403) {
            // Token expired or invalid - clear storage and redirect
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("user");
            setIsAuthenticated(false);
            throw new Error("Session expired. Please login again.");
          }
          throw new Error("Failed to load dashboard stats.");
        }

        setStats(await sRes.json());

        if (tRes.ok) {
          setTrend(await tRes.json());
        } else {
          setTrend([]);
        }

        if (bRes.ok) {
          setBranchRevenue(await bRes.json());
        } else {
          setBranchRevenue([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isAuthenticated, headers]);

  // ── Chart data ──────────────────────────────────────────────────────────────
  const lineChartData = {
    labels: trend.map((p) => p.label),
    datasets: [
      {
        label: "Revenue (₱)",
        data: trend.map((p) => p.revenue),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.08)",
        tension: 0.4,
        pointBackgroundColor: "#ef4444",
        pointRadius: 4,
        yAxisID: "y",
        fill: true,
      },
      {
        label: "Services",
        data: trend.map((p) => p.services),
        borderColor: "#6b7280",
        backgroundColor: "rgba(107,114,128,0.05)",
        tension: 0.4,
        pointBackgroundColor: "#6b7280",
        pointRadius: 4,
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
        ticks: { color: "#6b7280" },
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

  const totalBranchRev = branchRevenue.reduce((s, b) => s + b.revenue, 0);

  const doughnutChartData = {
    labels: branchRevenue.map((b) => b.name),
    datasets: [
      {
        data: branchRevenue.map((b) => b.revenue),
        backgroundColor: branchRevenue.map(
          (_, i) => BRANCH_COLORS[i % BRANCH_COLORS.length],
        ),
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

  const fmt = (n) => {
    if (n == null) return "—";
    if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₱${(n / 1_000).toFixed(1)}k`;
    return `₱${n.toLocaleString()}`;
  };

  const fmtChange = (pct, suffix = "% from last month") =>
    pct == null ? "—" : `${pct >= 0 ? "+" : ""}${pct}${suffix}`;

  const statCards = [
    {
      title: "Total Revenue",
      value: fmt(stats?.total_revenue),
      change: fmtChange(stats?.revenue_change_pct),
      accentBg: "bg-red-500/10",
      accentText: "text-red-400",
      border: "border-red-500/20",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      title: "Total Branches",
      value: stats?.total_branches ?? "—",
      change: "Active locations",
      accentBg: "bg-blue-500/10",
      accentText: "text-blue-400",
      border: "border-blue-500/20",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      ),
    },
    {
      title: "Services Completed",
      value: stats?.services_completed?.toLocaleString() ?? "—",
      change: fmtChange(stats?.services_change_pct),
      accentBg: "bg-purple-500/10",
      accentText: "text-purple-400",
      border: "border-purple-500/20",
      icon: (
        <>
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
        </>
      ),
    },
    {
      title: "Avg. Satisfaction",
      value:
        stats?.avg_satisfaction != null ? `${stats.avg_satisfaction}%` : "—",
      change: fmtChange(stats?.satisfaction_change_pct, "% from last month"),
      accentBg: "bg-emerald-500/10",
      accentText: "text-emerald-400",
      border: "border-emerald-500/20",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      ),
    },
  ];

  // If not authenticated, show message
  if (!isAuthenticated && !loading) {
    return (
      <BranchOwnerLayout title="" subtitle="">
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-red-400 text-xl mb-4">
                ⚠️ Authentication Required
              </div>
              <p className="text-gray-400">
                Please login to access the owner dashboard.
              </p>
            </div>
          </div>
        </div>
      </BranchOwnerLayout>
    );
  }

  return (
    <BranchOwnerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Owner Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              {loading
                ? "Loading…"
                : "Here's what's happening across all your branches."}
            </p>
          </div>
          <NotificationDropdown />
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <StatCard key={i} {...s} loading={loading} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Line Chart */}
          <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-6">
              <h3 className="text-lg font-black text-white">
                Revenue & Services Trend
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">Last 6 months</p>
            </div>
            {loading ? (
              <div className="h-72 bg-gray-800/40 rounded-xl animate-pulse" />
            ) : trend.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-gray-600 text-sm">
                No data yet
              </div>
            ) : (
              <div className="h-72">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            )}
          </div>

          {/* Doughnut */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-6">
              <h3 className="text-lg font-black text-white">
                Branch Revenue Distribution
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">This month</p>
            </div>
            {loading ? (
              <div className="h-44 bg-gray-800/40 rounded-xl animate-pulse mb-6" />
            ) : branchRevenue.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-gray-600 text-sm">
                No data yet
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center mb-6">
                <Doughnut
                  data={doughnutChartData}
                  options={doughnutChartOptions}
                />
              </div>
            )}
            <div className="space-y-3">
              {branchRevenue.map((b, i) => (
                <div key={b.id} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length],
                    }}
                  />
                  <span className="text-sm text-gray-400 flex-1 truncate">
                    {b.name}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {fmt(b.revenue)}
                  </span>
                  {totalBranchRev > 0 && (
                    <span className="text-xs text-gray-600">
                      {Math.round((b.revenue / totalBranchRev) * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BranchOwnerLayout>
  );
}