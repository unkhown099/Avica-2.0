import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { StatCard, SkeletonCard, EmptyState, CHART_BASE } from "./DashboardUI";
import { useAppointments } from "../../hooks/useDashboard";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parsePrice(value) {
  try {
    return parseFloat(String(value).replace(/[₱,]/g, "").trim()) || 0;
  } catch {
    return 0;
  }
}

export default function RevenueView() {
  const { data: appointments, loading, error } = useAppointments();
  const currentYear = new Date().getFullYear();

  // Derive monthly revenue/expenses/profit from real appointments
  const monthly = useMemo(() => {
    const map = {};
    (appointments ?? []).forEach((appt) => {
      const date = new Date(appt.created_at ?? appt.date);
      if (isNaN(date) || date.getFullYear() !== currentYear) return;
      const m = date.getMonth(); // 0-11
      if (!map[m]) map[m] = { revenue: 0, count: 0 };
      map[m].revenue += parsePrice(appt.price ?? appt.total ?? 0);
      map[m].count += 1;
    });

    // Build array for months that have data, or all 12 if none
    const months = Object.keys(map)
      .map(Number)
      .sort((a, b) => a - b);
    if (months.length === 0) return [];

    return months.map((m) => {
      const rev = map[m].revenue;
      // Estimate expenses as ~38% of revenue (common auto-shop ratio)
      const exp = Math.round(rev * 0.38);
      return {
        month: MONTH_LABELS[m],
        revenue: Math.round(rev),
        expenses: exp,
        profit: Math.round(rev - exp),
        count: map[m].count,
      };
    });
  }, [appointments, currentYear]);

  const totalRevenue = monthly.reduce((a, r) => a + r.revenue, 0);
  const totalExpenses = monthly.reduce((a, r) => a + r.expenses, 0);
  const totalProfit = monthly.reduce((a, r) => a + r.profit, 0);

  const revenueBarData = {
    labels: monthly.map((r) => r.month),
    datasets: [
      {
        label: "Revenue",
        data: monthly.map((r) => r.revenue),
        backgroundColor: "rgba(239,68,68,0.7)",
        borderRadius: 6,
      },
      {
        label: "Expenses",
        data: monthly.map((r) => r.expenses),
        backgroundColor: "rgba(107,114,128,0.5)",
        borderRadius: 6,
      },
      {
        label: "Profit",
        data: monthly.map((r) => r.profit),
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

  const statCards = [
    {
      title: "Total Revenue",
      value: `₱${totalRevenue.toLocaleString()}`,
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
      title: "Total Expenses (est.)",
      value: `₱${totalExpenses.toLocaleString()}`,
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
      title: "Net Profit (est.)",
      value: `₱${totalProfit.toLocaleString()}`,
      sub: `Based on ${monthly.length} month${monthly.length !== 1 ? "s" : ""} of data`,
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
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm mb-6">
        <h3 className="text-lg font-black text-white mb-1">
          Monthly Revenue Breakdown
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Revenue, Expenses & Profit — {currentYear}
        </p>
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : monthly.length === 0 ? (
          <div className="h-72 flex items-center justify-center">
            <EmptyState
              message={`No appointment data for ${currentYear} yet.`}
            />
          </div>
        ) : (
          <div className="h-72">
            <Bar data={revenueBarData} options={revenueBarOptions} />
          </div>
        )}
      </div>

      {/* Revenue detail table */}
      <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-lg font-black text-white">Monthly Detail</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            Expenses are estimated at 38% of revenue
          </p>
        </div>
        <div className="grid grid-cols-5 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
          <div>Month</div>
          <div>Appointments</div>
          <div>Revenue</div>
          <div>Expenses</div>
          <div>Profit</div>
        </div>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-white/5 animate-pulse"
            >
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-4 bg-gray-800 rounded" />
              ))}
            </div>
          ))
        ) : monthly.length === 0 ? (
          <EmptyState message="No revenue data available." />
        ) : (
          monthly.map((r) => (
            <div
              key={r.month}
              className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
            >
              <div className="text-white font-semibold">
                {r.month} {currentYear}
              </div>
              <div className="text-gray-400 text-sm">{r.count}</div>
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
          ))
        )}
      </div>
    </>
  );
}
