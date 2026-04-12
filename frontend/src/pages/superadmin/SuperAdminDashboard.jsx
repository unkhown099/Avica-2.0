import { useState, useEffect } from "react";
import { apiFetch } from "../../hooks/api";
import SuperAdminLayout from "./SuperAdminLayout.jsx";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend
);

// ── Shared chart options ───────────────────────────────────────────────────────
const tooltipDefaults = {
  backgroundColor: "#1f2937",
  titleColor: "#9ca3af",
  bodyColor: "#fff",
  borderColor: "rgba(255,255,255,0.08)",
  borderWidth: 1,
  padding: 10,
  bodyFont: { size: 13, weight: "bold" },
  titleFont: { size: 12 },
};

const axisDefaults = {
  x: {
    ticks: { color: "#4b5563", font: { size: 11 } },
    grid: { color: "rgba(255,255,255,0.04)" },
  },
  y: {
    ticks: { color: "#4b5563", font: { size: 11 } },
    grid: { color: "rgba(255,255,255,0.04)", borderDash: [4, 4] },
  },
};

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: tooltipDefaults },
  scales: axisDefaults,
};

// ── Small components ──────────────────────────────────────────────────────────
function StatCard({ title, value, icon, accentBg, accentText, border, sub }) {
  return (
    <div className={`bg-gray-900/60 border ${border} rounded-2xl p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}>
      <div className="mb-4">
        <div className={`${accentBg} ${accentText} p-3 rounded-xl w-fit`}>{icon}</div>
      </div>
      <div className="text-2xl font-black text-white mb-1 truncate">{value ?? "—"}</div>
      <div className="text-sm text-gray-500 mb-1 truncate">{title}</div>
      {sub && <div className={`text-xs font-semibold ${accentText} truncate`}>{sub}</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-gray-800 mb-4" />
      <div className="h-7 w-24 bg-gray-800 rounded mb-2" />
      <div className="h-4 w-32 bg-gray-800 rounded" />
    </div>
  );
}

function SkeletonChart({ height = 200 }) {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 animate-pulse">
      <div className="h-5 w-40 bg-gray-800 rounded mb-4" />
      <div className="bg-gray-800/50 rounded-xl" style={{ height }} />
    </div>
  );
}

function ChartCard({ title, badge, children, height = 200, className = "" }) {
  return (
    <div className={`bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-400">{title}</span>
        {badge && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">
      {children}
    </h2>
  );
}

const Icon = ({ d }) => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

function StaffTable({ staffByRole, loading }) {
  if (loading) {
    return (
      <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between px-6 py-4 border-b border-white/5 animate-pulse">
            <div className="h-4 w-28 bg-gray-800 rounded" />
            <div className="h-4 w-8 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }
  if (!staffByRole?.length) {
    return (
      <div className="bg-gray-900/60 border border-white/5 rounded-2xl px-6 py-10 text-center text-gray-500 text-sm">
        No staff data available.
      </div>
    );
  }
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
      <div className="grid grid-cols-2 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
        <div>Role</div>
        <div className="text-right">Count</div>
      </div>
      {staffByRole.map((r) => (
        <div key={r.role} className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-white font-semibold text-sm">{r.role}</span>
          </div>
          <div className="text-right">
            <span className="text-red-400 font-bold text-sm">{r.count}</span>
          </div>
        </div>
      ))}
      <div className="px-6 py-3 flex justify-between items-center">
        <span className="text-gray-500 text-xs">
          {staffByRole.length} role{staffByRole.length !== 1 ? "s" : ""}
        </span>
        <span className="text-gray-500 text-xs">
          Total:{" "}
          <span className="text-white font-bold">
            {staffByRole.reduce((s, r) => s + r.count, 0)}
          </span>{" "}
          staff
        </span>
      </div>
    </div>
  );
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "performance", label: "Performance" },
  { key: "users", label: "Users" },
  { key: "system", label: "System Health" },
];

// ── Panels ────────────────────────────────────────────────────────────────────
function OverviewPanel({ data, loading }) {
  const labels = data?.chart_labels ?? [];

  const userGrowthData = {
    labels,
    datasets: [
      {
        label: "Total Users",
        data: data?.monthly_users ?? [],
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96,165,250,0.08)",
        fill: true, 
        tension: 0.4, 
        pointRadius: 3,
        pointBackgroundColor: "#60a5fa", 
        borderWidth: 2,
      },
    ],
  };

  const responseTimeData = {
    labels: data?.response_labels ?? labels,
    datasets: [{
      label: "API Response (ms)",
      data: data?.api_response_times ?? [],
      borderColor: "#22c55e",
      backgroundColor: "rgba(34,197,94,0.08)",
      fill: true, 
      tension: 0.4, 
      pointRadius: 3,
      pointBackgroundColor: "#22c55e", 
      borderWidth: 2,
    }],
  };

  const miniOpts = {
    ...baseChartOptions,
    scales: {
      x: { ticks: { color: "#374151", font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: "#374151", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.03)" } },
    },
  };

  return (
    <div>
      <SectionLabel>System Performance at a glance</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <StatCard
              title="Total users"
              value={data ? Number(data.users.total).toLocaleString() : null}
              sub={`${data ? Number(data.users.customers).toLocaleString() : 0} customers`}
              accentBg="bg-blue-500/10" 
              accentText="text-blue-400" 
              border="border-blue-500/20"
              icon={<Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
            />
            <StatCard
              title="Active sessions"
              value={data ? Number(data.active_sessions).toLocaleString() : null}
              sub="Current users online"
              accentBg="bg-green-500/10" 
              accentText="text-green-400" 
              border="border-green-500/20"
              icon={<Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
            />
            <StatCard
              title="API Response Time"
              value={data ? `${Number(data.avg_response_time).toFixed(0)}ms` : null}
              sub={data?.response_status || "Normal"}
              accentBg="bg-yellow-500/10" 
              accentText="text-yellow-400" 
              border="border-yellow-500/20"
              icon={<Icon d="M13 10V3L4 14h7v7l9-11h-7z" />}
            />
            <StatCard
              title="Error Rate"
              value={data ? `${(data.error_rate * 100).toFixed(1)}%` : null}
              sub="Last 24 hours"
              accentBg="bg-red-500/10" 
              accentText="text-red-400" 
              border="border-red-500/20"
              icon={<Icon d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {loading ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : (
          <>
            <ChartCard title="User growth trend" badge={{ label: "Last 7 months", className: "text-blue-400 bg-blue-500/10" }} height={140}>
              <Line data={userGrowthData} options={miniOpts} />
            </ChartCard>
            <ChartCard title="API Response Time (ms)" badge={{ label: "Last 7 days", className: "text-green-400 bg-green-500/10" }} height={140}>
              <Line data={responseTimeData} options={miniOpts} />
            </ChartCard>
          </>
        )}
      </div>

      <SectionLabel>Staff by role</SectionLabel>
      <StaffTable staffByRole={data?.staff_by_role} loading={loading} />
    </div>
  );
}

function PerformancePanel({ data, loading }) {
  const labels = data?.chart_labels ?? [];

  const cpuData = {
    labels,
    datasets: [{
      label: "CPU Usage (%)",
      data: data?.cpu_usage ?? [],
      borderColor: "#ef4444",
      backgroundColor: "rgba(239,68,68,0.08)",
      fill: true, 
      tension: 0.4, 
      pointRadius: 3,
      pointBackgroundColor: "#ef4444", 
      borderWidth: 2,
    }],
  };

  const memoryData = {
    labels,
    datasets: [{
      label: "Memory Usage (%)",
      data: data?.memory_usage ?? [],
      borderColor: "#8b5cf6",
      backgroundColor: "rgba(139,92,246,0.08)",
      fill: true, 
      tension: 0.4, 
      pointRadius: 3,
      pointBackgroundColor: "#8b5cf6", 
      borderWidth: 2,
    }],
  };

  const requestData = {
    labels: data?.request_labels ?? labels,
    datasets: [{
      label: "Requests per minute",
      data: data?.requests_per_minute ?? [],
      borderColor: "#f59e0b",
      backgroundColor: "rgba(245,158,11,0.08)",
      fill: true, 
      tension: 0.4, 
      pointRadius: 3,
      pointBackgroundColor: "#f59e0b", 
      borderWidth: 2,
    }],
  };

  return (
    <div>
      <SectionLabel>System Performance Metrics</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <StatCard
              title="CPU Usage"
              value={data ? `${Number(data.current_cpu).toFixed(1)}%` : null}
              sub={data?.cpu_status || "Normal"}
              accentBg="bg-red-500/10" 
              accentText="text-red-400" 
              border="border-red-500/20"
              icon={<Icon d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />}
            />
            <StatCard
              title="Memory Usage"
              value={data ? `${Number(data.current_memory).toFixed(1)}%` : null}
              sub={`${data ? (data.current_memory_used_gb || 0).toFixed(1) : 0} GB / ${data?.total_memory_gb || 8} GB`}
              accentBg="bg-purple-500/10" 
              accentText="text-purple-400" 
              border="border-purple-500/20"
              icon={<Icon d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />}
            />
            <StatCard
              title="Requests/sec"
              value={data ? Number(data.requests_per_second).toFixed(1) : null}
              sub={`Peak: ${data?.peak_requests_per_second || 0}`}
              accentBg="bg-orange-500/10" 
              accentText="text-orange-400" 
              border="border-orange-500/20"
              icon={<Icon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
            />
            <StatCard
              title="Uptime"
              value={data?.uptime_days ? `${data.uptime_days}d` : "—"}
              sub={data?.uptime_percentage ? `${data.uptime_percentage}%` : "99.9%"}
              accentBg="bg-green-500/10" 
              accentText="text-green-400" 
              border="border-green-500/20"
              icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
            />
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          <SkeletonChart height={220} />
          <SkeletonChart height={220} />
          <SkeletonChart height={220} />
        </div>
      ) : (
        <>
          <ChartCard title="CPU Usage Trend" badge={{ label: "Last 24 hours", className: "text-red-400 bg-red-500/10" }} height={200} className="mb-4">
            <Line data={cpuData} options={baseChartOptions} />
          </ChartCard>
          <ChartCard title="Memory Usage Trend" badge={{ label: "Last 24 hours", className: "text-purple-400 bg-purple-500/10" }} height={200} className="mb-4">
            <Line data={memoryData} options={baseChartOptions} />
          </ChartCard>
          <ChartCard title="Request Volume" badge={{ label: "Requests per minute", className: "text-orange-400 bg-orange-500/10" }} height={200}>
            <Line data={requestData} options={baseChartOptions} />
          </ChartCard>
        </>
      )}
    </div>
  );
}

function UsersPanel({ data, loading }) {
  const userDonutData = {
    labels: ["Customers", "Staff"],
    datasets: [{
      data: data ? [data.users.customers, data.users.staff] : [],
      backgroundColor: ["rgba(96,165,250,0.8)", "rgba(239,68,68,0.8)"],
      borderWidth: 0,
    }],
  };

  const userGrowthData = {
    labels: data?.chart_labels ?? [],
    datasets: [
      {
        label: "Total Users",
        data: data?.monthly_users ?? [],
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96,165,250,0.08)",
        fill: true, 
        tension: 0.4,
        pointRadius: 3, 
        pointBackgroundColor: "#60a5fa", 
        borderWidth: 2,
      },
    ],
  };

  const donutOptions = {
    ...baseChartOptions,
    cutout: "68%",
    plugins: {
      legend: {
        display: true, 
        position: "bottom",
        labels: { color: "#6b7280", font: { size: 11 }, boxWidth: 10, padding: 10 },
      },
      tooltip: tooltipDefaults,
    },
  };

  return (
    <div>
      <SectionLabel>User Analytics</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <StatCard
              title="Total users"
              value={data ? Number(data.users.total).toLocaleString() : null}
              sub="All time"
              accentBg="bg-red-500/10" 
              accentText="text-red-400" 
              border="border-red-500/20"
              icon={<Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
            />
            <StatCard
              title="New users (30d)"
              value={data ? Number(data.new_users_last_30d).toLocaleString() : null}
              sub={`${data?.growth_rate_percentage || 0}% growth`}
              accentBg="bg-green-500/10" 
              accentText="text-green-400" 
              border="border-green-500/20"
              icon={<Icon d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
            />
            <StatCard
              title="Active users (7d)"
              value={data ? Number(data.active_users_last_7d).toLocaleString() : null}
              sub={`${((data?.active_users_last_7d || 0) / (data?.users?.total || 1) * 100).toFixed(1)}% of total`}
              accentBg="bg-blue-500/10" 
              accentText="text-blue-400" 
              border="border-blue-500/20"
              icon={<Icon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
            />
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <SkeletonChart height={220} />
          <SkeletonChart height={220} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <ChartCard title="User breakdown" height={220}>
            <Doughnut data={userDonutData} options={donutOptions} />
          </ChartCard>
          <ChartCard title="User growth trend" height={220}>
            <Line data={userGrowthData} options={baseChartOptions} />
          </ChartCard>
        </div>
      )}

      <SectionLabel>Staff by role</SectionLabel>
      <StaffTable staffByRole={data?.staff_by_role} loading={loading} />
    </div>
  );
}

function SystemHealthPanel({ data, loading }) {
  const healthChecks = [
    { name: "Database", status: data?.database_status || "healthy", metric: `${data?.database_response_ms || 15}ms` },
    { name: "Cache", status: data?.cache_status || "healthy", metric: `${data?.cache_hit_rate || 85}% hit rate` },
    { name: "API Gateway", status: data?.gateway_status || "healthy", metric: `${data?.gateway_response_ms || 45}ms` },
    { name: "Storage", status: data?.storage_status || "healthy", metric: `${data?.storage_used_gb || 10.2}/${data?.storage_total_gb || 50} GB` },
    { name: "Queue Workers", status: data?.queue_status || "healthy", metric: `${data?.active_workers || 4} active` },
    { name: "Background Jobs", status: data?.jobs_status || "healthy", metric: `${data?.pending_jobs || 0} pending` },
  ];

  const getStatusColor = (status) => {
    if (status === "healthy") return "text-green-400 bg-green-500/10";
    if (status === "warning") return "text-yellow-400 bg-yellow-500/10";
    return "text-red-400 bg-red-500/10";
  };

  const getStatusIcon = (status) => {
    if (status === "healthy") return "✓";
    if (status === "warning") return "⚠";
    return "✕";
  };

  return (
    <div>
      <SectionLabel>System Health Status</SectionLabel>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : (
          healthChecks.map((check) => (
            <div key={check.name} className="bg-gray-900/60 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold">{check.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(check.status)}`}>
                  {getStatusIcon(check.status)} {check.status}
                </span>
              </div>
              <div className="text-2xl font-black text-white mb-1">{check.metric}</div>
              <div className="text-xs text-gray-500">Current value</div>
            </div>
          ))
        )}
      </div>

      {loading ? (
        <SkeletonChart height={220} />
      ) : (
        <ChartCard title="System Load (Last 24h)" badge={{ label: "Live", className: "text-green-400 bg-green-500/10" }} height={220}>
          <Line 
            data={{
              labels: data?.system_load_labels ?? [],
              datasets: [{
                label: "System Load",
                data: data?.system_load_history ?? [],
                borderColor: "#ef4444",
                backgroundColor: "rgba(239,68,68,0.08)",
                fill: true, 
                tension: 0.4,
                pointRadius: 2,
                borderWidth: 2,
              }]
            }} 
            options={baseChartOptions} 
          />
        </ChartCard>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFetch("/super-admin/dashboard/");
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchDashboard(); 
  }, []);

  return (
    <SuperAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-3 sm:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              System Performance Dashboard
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              Monitor system health, performance metrics, and user analytics.
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 transition-all text-sm font-semibold w-fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4">
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button onClick={fetchDashboard} className="text-red-400 hover:text-red-300 text-sm font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/[0.06] overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap rounded-t-lg border-b-2 transition-all ${
                activeTab === tab.key
                  ? "text-red-400 border-red-500 bg-red-500/5"
                  : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/[0.03]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panels */}
        {activeTab === "overview" && <OverviewPanel data={data} loading={loading} />}
        {activeTab === "performance" && <PerformancePanel data={data} loading={loading} />}
        {activeTab === "users" && <UsersPanel data={data} loading={loading} />}
        {activeTab === "system" && <SystemHealthPanel data={data} loading={loading} />}
      </div>
    </SuperAdminLayout>
  );
}