import { useState, useEffect } from "react";
import { API_BASE } from "../../hooks/useAuth.js";
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
  { key: "overview",   label: "Overview" },
  { key: "revenue",    label: "Revenue" },
  { key: "bookings",   label: "Bookings" },
  { key: "users",      label: "Users" },
  { key: "operations", label: "Operations" },
];

// ── Panels ────────────────────────────────────────────────────────────────────
function OverviewPanel({ data, loading }) {
  const labels = data?.chart_labels ?? [];

  const revLineData = {
    labels,
    datasets: [{
      label: "Revenue (₱)",
      data: data?.monthly_revenue ?? [],
      borderColor: "#22c55e",
      backgroundColor: "rgba(34,197,94,0.08)",
      fill: true, tension: 0.4, pointRadius: 3,
      pointBackgroundColor: "#22c55e", borderWidth: 2,
    }],
  };

  const bookLineData = {
    labels,
    datasets: [{
      label: "Bookings",
      data: data?.monthly_bookings ?? [],
      borderColor: "#60a5fa",
      backgroundColor: "rgba(96,165,250,0.08)",
      fill: true, tension: 0.4, pointRadius: 3,
      pointBackgroundColor: "#60a5fa", borderWidth: 2,
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
      <SectionLabel>At a glance</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <StatCard
              title="Total revenue"
              value={data ? `₱${Number(data.revenue.total).toLocaleString()}` : null}
              sub={data ? `₱${Number(data.revenue.this_month).toLocaleString()} this month` : null}
              accentBg="bg-green-500/10" accentText="text-green-400" border="border-green-500/20"
              icon={<Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
            />
            <StatCard
              title="Total bookings"
              value={data ? Number(data.bookings.total).toLocaleString() : null}
              sub={data ? `${data.bookings.today} today` : null}
              accentBg="bg-blue-500/10" accentText="text-blue-400" border="border-blue-500/20"
              icon={<Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
            />
            <StatCard
              title="Total users"
              value={data ? Number(data.users.total).toLocaleString() : null}
              sub={data ? `${Number(data.users.customers).toLocaleString()} customers` : null}
              accentBg="bg-red-500/10" accentText="text-red-400" border="border-red-500/20"
              icon={<Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
            />
            <StatCard
              title="Low stock items"
              value={data ? Number(data.low_stock_items).toLocaleString() : null}
              sub="Needs attention"
              accentBg="bg-red-500/10" accentText="text-red-400" border="border-red-500/20"
              icon={<Icon d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {loading ? <><SkeletonChart /><SkeletonChart /></> : (
          <>
            <ChartCard title="Revenue trend" badge={{ label: "Last 7 months", className: "text-green-400 bg-green-500/10" }} height={140}>
              <Line data={revLineData} options={miniOpts} />
            </ChartCard>
            <ChartCard title="Bookings trend" badge={{ label: "Last 7 months", className: "text-blue-400 bg-blue-500/10" }} height={140}>
              <Line data={bookLineData} options={miniOpts} />
            </ChartCard>
          </>
        )}
      </div>

      <SectionLabel>Staff by role</SectionLabel>
      <StaffTable staffByRole={data?.staff_by_role} loading={loading} />
    </div>
  );
}

function RevenuePanel({ data, loading }) {
  const labels = data?.chart_labels ?? [];

  const monthlyRevData = {
    labels,
    datasets: [{
      label: "Revenue (₱)",
      data: data?.monthly_revenue ?? [],
      borderColor: "#22c55e",
      backgroundColor: "rgba(34,197,94,0.10)",
      fill: true, tension: 0.4, pointRadius: 4,
      pointBackgroundColor: "#22c55e", borderWidth: 2,
    }],
  };

  const branchRevData = {
    labels: data?.branches_list ?? [],
    datasets: [{
      label: "Revenue (₱)",
      data: data?.revenue_by_branch ?? [],
      backgroundColor: "rgba(34,197,94,0.25)",
      borderColor: "#22c55e",
      borderWidth: 1, borderRadius: 6,
    }],
  };

  const revenueYAxis = {
    ticks: {
      color: "#4b5563", font: { size: 11 },
      callback: (v) => `₱${(v / 1000).toFixed(0)}k`,
    },
    grid: { color: "rgba(255,255,255,0.04)", borderDash: [4, 4] },
  };

  return (
    <div>
      <SectionLabel>Revenue</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {loading ? <><SkeletonCard /><SkeletonCard /></> : (
          <>
            <StatCard
              title="Total revenue"
              value={data ? `₱${Number(data.revenue.total).toLocaleString()}` : null}
              sub="From completed bookings"
              accentBg="bg-green-500/10" accentText="text-green-400" border="border-green-500/20"
              icon={<Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
            />
            <StatCard
              title="Revenue this month"
              value={data ? `₱${Number(data.revenue.this_month).toLocaleString()}` : null}
              sub="From completed bookings"
              accentBg="bg-green-500/10" accentText="text-green-400" border="border-green-500/20"
              icon={<Icon d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
            />
          </>
        )}
      </div>

      {loading ? (
        <><SkeletonChart height={220} /><div className="mt-4"><SkeletonChart height={180} /></div></>
      ) : (
        <>
          <ChartCard
            title="Monthly revenue (₱)"
            badge={{ label: "7-month view", className: "text-green-400 bg-green-500/10" }}
            height={220} className="mb-4"
          >
            <Line
              data={monthlyRevData}
              options={{ ...baseChartOptions, scales: { x: axisDefaults.x, y: revenueYAxis } }}
            />
          </ChartCard>
          <ChartCard title="Revenue by branch" height={180}>
            <Bar
              data={branchRevData}
              options={{
                ...baseChartOptions,
                scales: {
                  x: { ticks: { color: "#4b5563", font: { size: 11 } }, grid: { display: false } },
                  y: revenueYAxis,
                },
              }}
            />
          </ChartCard>
        </>
      )}
    </div>
  );
}

function BookingsPanel({ data, loading }) {
  const dailyBookData = {
    labels: data?.daily_labels ?? [],
    datasets: [{
      label: "Bookings",
      data: data?.daily_bookings ?? [],
      backgroundColor: "rgba(96,165,250,0.3)",
      borderColor: "#60a5fa",
      borderWidth: 1, borderRadius: 4,
    }],
  };

  const statusColors = [
    "rgba(34,197,94,0.8)",
    "rgba(96,165,250,0.8)",
    "rgba(239,68,68,0.8)",
    "rgba(234,179,8,0.8)",
    "rgba(167,139,250,0.8)",
  ];
  const statusData = {
    labels: data?.bookings_status_labels ?? [],
    datasets: [{
      data: data?.bookings_by_status ?? [],
      backgroundColor: statusColors.slice(0, data?.bookings_by_status?.length ?? 0),
      borderWidth: 0,
    }],
  };

  const monthlyBookData = {
    labels: data?.chart_labels ?? [],
    datasets: [{
      label: "Bookings",
      data: data?.monthly_bookings ?? [],
      borderColor: "#60a5fa",
      backgroundColor: "rgba(96,165,250,0.08)",
      fill: true, tension: 0.4, pointRadius: 3,
      pointBackgroundColor: "#60a5fa", borderWidth: 2,
    }],
  };

  const donutOptions = {
    ...baseChartOptions,
    cutout: "68%",
    plugins: {
      legend: {
        display: true, position: "bottom",
        labels: { color: "#6b7280", font: { size: 11 }, boxWidth: 10, padding: 10 },
      },
      tooltip: tooltipDefaults,
    },
  };

  return (
    <div>
      <SectionLabel>Bookings</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <StatCard
              title="Total bookings"
              value={data ? Number(data.bookings.total).toLocaleString() : null}
              accentBg="bg-blue-500/10" accentText="text-blue-400" border="border-blue-500/20"
              icon={<Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
            />
            <StatCard
              title="Bookings today"
              value={data ? Number(data.bookings.today).toLocaleString() : null}
              accentBg="bg-green-500/10" accentText="text-green-400" border="border-green-500/20"
              icon={<Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
            />
            <StatCard
              title="This month"
              value={data ? Number(data.bookings.this_month).toLocaleString() : null}
              accentBg="bg-yellow-500/10" accentText="text-yellow-400" border="border-yellow-500/20"
              icon={<Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
            />
          </>
        )}
      </div>

      {loading ? (
        <>
          <SkeletonChart height={200} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <SkeletonChart height={200} /><SkeletonChart height={200} />
          </div>
        </>
      ) : (
        <>
          <ChartCard title="Daily bookings — last 30 days" height={200} className="mb-4">
            <Bar
              data={dailyBookData}
              options={{
                ...baseChartOptions,
                scales: {
                  x: { ticks: { color: "#374151", font: { size: 10 }, maxTicksLimit: 10 }, grid: { display: false } },
                  y: axisDefaults.y,
                },
              }}
            />
          </ChartCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChartCard title="Bookings by status" height={200}>
              <Doughnut data={statusData} options={donutOptions} />
            </ChartCard>
            <ChartCard title="Monthly trend" height={200}>
              <Line data={monthlyBookData} options={baseChartOptions} />
            </ChartCard>
          </div>
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
        label: "Customers",
        data: data?.monthly_customers ?? [],
        borderColor: "#60a5fa", fill: false, tension: 0.4,
        pointRadius: 3, pointBackgroundColor: "#60a5fa", borderWidth: 2,
      },
      {
        label: "Staff",
        data: data?.monthly_staff ?? [],
        borderColor: "#ef4444", fill: false, tension: 0.4,
        pointRadius: 3, pointBackgroundColor: "#ef4444", borderWidth: 2,
      },
    ],
  };

  const donutOptions = {
    ...baseChartOptions,
    cutout: "68%",
    plugins: {
      legend: {
        display: true, position: "bottom",
        labels: { color: "#6b7280", font: { size: 11 }, boxWidth: 10, padding: 10 },
      },
      tooltip: tooltipDefaults,
    },
  };

  const growthOptions = {
    ...baseChartOptions,
    plugins: {
      legend: {
        display: true, position: "bottom",
        labels: { color: "#6b7280", font: { size: 11 }, boxWidth: 10, padding: 10 },
      },
      tooltip: tooltipDefaults,
    },
  };

  return (
    <div>
      <SectionLabel>Users</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <StatCard
              title="Total users"
              value={data ? Number(data.users.total).toLocaleString() : null}
              accentBg="bg-red-500/10" accentText="text-red-400" border="border-red-500/20"
              icon={<Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
            />
            <StatCard
              title="Staff accounts"
              value={data ? Number(data.users.staff).toLocaleString() : null}
              accentBg="bg-yellow-500/10" accentText="text-yellow-400" border="border-yellow-500/20"
              icon={<Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
            />
            <StatCard
              title="Customer accounts"
              value={data ? Number(data.users.customers).toLocaleString() : null}
              accentBg="bg-green-500/10" accentText="text-green-400" border="border-green-500/20"
              icon={<Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
            />
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <SkeletonChart height={220} /><SkeletonChart height={220} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <ChartCard title="User breakdown" height={220}>
            <Doughnut data={userDonutData} options={donutOptions} />
          </ChartCard>
          <ChartCard title="User growth" height={220}>
            <Line data={userGrowthData} options={growthOptions} />
          </ChartCard>
        </div>
      )}

      <SectionLabel>Staff by role</SectionLabel>
      <StaffTable staffByRole={data?.staff_by_role} loading={loading} />
    </div>
  );
}

function OperationsPanel({ data, loading }) {
  const queueData = {
    labels: data?.queue_branches_list ?? [],
    datasets: [{
      label: "Queue entries",
      data: data?.queue_by_branch ?? [],
      backgroundColor: "rgba(249,115,22,0.3)",
      borderColor: "#f97316",
      borderWidth: 1, borderRadius: 5,
    }],
  };

  const servicesData = {
    labels: data?.service_categories ?? [],
    datasets: [{
      label: "Bookings",
      data: data?.services_by_category ?? [],
      backgroundColor: "rgba(167,139,250,0.3)",
      borderColor: "#a78bfa",
      borderWidth: 1, borderRadius: 4,
    }],
  };

  return (
    <div>
      <SectionLabel>Operations</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <StatCard
              title="Branches"
              value={data ? Number(data.branches).toLocaleString() : null}
              accentBg="bg-blue-500/10" accentText="text-blue-400" border="border-blue-500/20"
              icon={<Icon d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />}
            />
            <StatCard
              title="Services"
              value={data ? Number(data.services).toLocaleString() : null}
              accentBg="bg-purple-500/10" accentText="text-purple-400" border="border-purple-500/20"
              icon={<Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}
            />
            <StatCard
              title="Active queue"
              value={data ? Number(data.active_queue_entries).toLocaleString() : null}
              accentBg="bg-orange-500/10" accentText="text-orange-400" border="border-orange-500/20"
              icon={<Icon d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h9l2-2zm0 0l2-5h3l2 5v1h-2m-5 0H9" />}
            />
            <StatCard
              title="Low stock items"
              value={data ? Number(data.low_stock_items).toLocaleString() : null}
              sub="Needs attention"
              accentBg="bg-red-500/10" accentText="text-red-400" border="border-red-500/20"
              icon={<Icon d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />}
            />
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonChart height={220} /><SkeletonChart height={220} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ChartCard title="Active queue by branch" height={220}>
            <Bar
              data={queueData}
              options={{
                ...baseChartOptions,
                scales: {
                  x: { ticks: { color: "#4b5563", font: { size: 11 } }, grid: { display: false } },
                  y: { ticks: { color: "#4b5563", font: { size: 11 }, stepSize: 1 }, grid: { color: "rgba(255,255,255,0.04)" } },
                },
              }}
            />
          </ChartCard>
          <ChartCard title="Top services by bookings" height={220}>
            <Bar
              data={servicesData}
              options={{
                ...baseChartOptions,
                indexAxis: "y",
                scales: {
                  x: { ticks: { color: "#4b5563", font: { size: 11 } }, grid: { color: "rgba(255,255,255,0.04)" } },
                  y: { ticks: { color: "#4b5563", font: { size: 11 } }, grid: { display: false } },
                },
              }}
            />
          </ChartCard>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const token =
        localStorage.getItem("access_token") ??
        sessionStorage.getItem("access_token");

      const res = await fetch(`${API_BASE}/super-admin/dashboard/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
      setData(await res.json());
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  return (
    <SuperAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-3 sm:p-8">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              Full system overview — all branches, users, and operations.
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
        {activeTab === "overview"   && <OverviewPanel   data={data} loading={loading} />}
        {activeTab === "revenue"    && <RevenuePanel    data={data} loading={loading} />}
        {activeTab === "bookings"   && <BookingsPanel   data={data} loading={loading} />}
        {activeTab === "users"      && <UsersPanel      data={data} loading={loading} />}
        {activeTab === "operations" && <OperationsPanel data={data} loading={loading} />}

      </div>
    </SuperAdminLayout>
  );
}