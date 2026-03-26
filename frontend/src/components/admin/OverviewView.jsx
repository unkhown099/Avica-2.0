import { Line, Doughnut } from "react-chartjs-2";
import {
  StatCard,
  SkeletonCard,
  SkeletonRow,
  EmptyState,
  StatusBadge,
  AvatarInitial,
  CHART_BASE,
} from "./DashboardUI";

const SERVICE_COLORS = ["#ef4444", "#a855f7", "#3b82f6", "#10b981", "#f59e0b"];

export default function OverviewView({ data, loading, error }) {
  const stats = data?.stats ?? null;
  const transactions = data?.recent_transactions ?? [];
  const chart = data?.chart ?? null;
  const currentYear = new Date().getFullYear();

  // Build doughnut from chart services data if available, else empty
  const chartLabels = chart?.labels ?? [];
  const chartRevenue = chart?.revenue ?? [];
  const chartServices = chart?.services ?? [];

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Revenue (₱)",
        data: chartRevenue,
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
        data: chartServices,
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

  // Build service distribution doughnut from real chart data if we have services
  // Fall back to empty if no data yet
  const doughnutData = {
    labels: chartLabels.length ? chartLabels : ["No Data"],
    datasets: [
      {
        data: chartServices.length ? chartServices : [1],
        backgroundColor: chartServices.length
          ? chartLabels.map((_, i) => SERVICE_COLORS[i % SERVICE_COLORS.length])
          : ["#374151"],
        borderWidth: 2,
        borderColor: "#111827",
        hoverBorderColor: "#1f2937",
      },
    ],
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: { legend: { display: false }, tooltip: CHART_BASE.tooltip },
  };

  const chartSubtitle = chartLabels.length
    ? `${chartLabels[0]} – ${chartLabels[chartLabels.length - 1]} ${currentYear}`
    : `${currentYear}`;

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

  return (
    <>
      {/* Stat Cards */}
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
          ) : !chartLabels.length ? (
            <div className="h-64 sm:h-72 flex items-center justify-center text-gray-600 text-sm">
              No booking data available for {currentYear} yet.
            </div>
          ) : (
            <div className="h-64 sm:h-72">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          )}
        </div>

        {/* Doughnut - Monthly services distribution */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
          <div className="mb-6">
            <h3 className="text-lg font-black text-white">Services by Month</h3>
            <p className="text-gray-500 text-sm mt-0.5">
              Completed per month {currentYear}
            </p>
          </div>
          <div className="h-44 flex items-center justify-center mb-6">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div className="space-y-3">
            {chartLabels.length > 0 ? (
              chartLabels.map((label, i) => {
                const total = chartServices.reduce((a, b) => a + b, 0);
                const pct =
                  total > 0
                    ? `${Math.round((chartServices[i] / total) * 100)}%`
                    : "0%";
                const color = SERVICE_COLORS[i % SERVICE_COLORS.length];
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-400 flex-1">
                      {label}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: pct, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-xs font-bold text-white w-8 text-right">
                        {chartServices[i]}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-600 text-sm text-center">No data yet</p>
            )}
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
          <EmptyState message="No transactions found." />
        ) : (
          transactions.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group"
            >
              <div className="col-span-4 flex items-center gap-3">
                <AvatarInitial name={row.customer_name} />
                <span className="text-white font-semibold text-sm">
                  {row.customer_name}
                </span>
              </div>
              <div className="col-span-3 text-gray-400 text-sm">
                {row.service}
              </div>
              <div className="col-span-2 text-white font-bold text-sm">
                ₱{Number(row.amount).toLocaleString()}
              </div>
              <div className="col-span-2">
                <StatusBadge status={row.status} />
              </div>
              <div className="col-span-1 flex justify-end">
                <button className="opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
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
          ))
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
  );
}