import React from "react";
import ManagerLayout from "./ManagerLayout";
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

import { API_BASE, useAuth } from "../../hooks/useAuth.js";

function ManagerDashboard() {
  const { headers } = useAuth();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/manager/dashboard/`, { headers });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Failed to fetch dashboard data.");
        }
        setData(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (headers.Authorization) fetchData();
  }, [headers]);

  if (loading) {
    return (
      <ManagerLayout title="" subtitle="">
        <div className="min-h-screen bg-gray-950 p-8 flex items-center justify-center">
          <div className="text-gray-400 animate-pulse font-bold">Loading Dashboard...</div>
        </div>
      </ManagerLayout>
    );
  }

  if (error) {
    return (
      <ManagerLayout title="" subtitle="">
        <div className="min-h-screen bg-gray-950 p-8 flex items-center justify-center">
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 max-w-md text-center">
            <h2 className="text-xl font-black mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  const { stats, trend, distribution, branch_name } = data || {};

  const lineChartData = {
    labels: trend?.map((p) => p.label) || [],
    datasets: [
      {
        label: "Revenue (₱)",
        data: trend?.map((p) => p.revenue) || [],
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
        data: trend?.map((p) => p.services) || [],
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

  const serviceData = distribution || [];

  const doughnutChartData = {
    labels: serviceData.map((s) => s.label),
    datasets: [
      {
        data: serviceData.map((s) => s.val),
        backgroundColor: serviceData.map((s) => s.color),
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

  return (
    <ManagerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Manager Dashboard
            </h1>
            <p className="text-gray-400 mt-1">{branch_name || "Branch Dashboard"}</p>
          </div>
          <NotificationDropdown />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {(stats || []).map((stat, i) => {
            const icons = [
              <path key="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
              <path key="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
              <path key="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
              <path key="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            ];
            const accents = [
              { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
              { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
              { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
              { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" }
            ];
            const acc = accents[i % 4];

            return (
              <div
                key={i}
                className={`bg-gray-900/60 border ${acc.border} rounded-2xl p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${acc.bg} ${acc.text} p-3 rounded-xl`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {icons[i % 4]}
                    </svg>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${acc.text} ${acc.bg} px-2 py-1 rounded-full`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 mb-2">{stat.title}</div>
                <div className={`text-xs font-semibold ${acc.text}`}>{stat.change}</div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-6">
              <h3 className="text-lg font-black text-white">
                Revenue & Services Trend
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">
                January – June 2025
              </p>
            </div>
            <div className="h-72">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

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
              {serviceData.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-sm text-gray-400 flex-1">
                    {s.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: s.pct, backgroundColor: s.color }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white w-8 text-right">
                      {s.pct}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}

export default ManagerDashboard;