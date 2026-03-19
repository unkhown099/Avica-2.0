import React from "react";
import BranchOwnerLayout from "./BranchOwnerLayout";
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

function BranchOwnerDashboard() {
  const stats = [
    {
      title: "Total Revenue",
      value: "₱457,000",
      change: "+15.3% from last month",
      color: "#ef4444",
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
      value: "5",
      change: "Across all locations",
      color: "#3b82f6",
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
      value: "1,525",
      change: "+12.8% from last month",
      color: "#a855f7",
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
      value: "88%",
      change: "+3.2% from last month",
      color: "#10b981",
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

  const lineChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue (₱)",
        data: [350000, 380000, 360000, 420000, 450000, 457000],
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
        data: [1200, 1300, 1250, 1380, 1450, 1525],
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

  const branchData = [
    {
      label: "San Mateo Rizal",
      color: "#ef4444",
      value: "₱125k",
      data: 125000,
    },
    { label: "South Caloocan", color: "#a855f7", value: "₱98k", data: 98000 },
    { label: "Quezon City", color: "#3b82f6", value: "₱82k", data: 82000 },
    { label: "North Caloocan", color: "#10b981", value: "₱87k", data: 87000 },
    { label: "Camarin", color: "#f59e0b", value: "₱65k", data: 65000 },
  ];

  const doughnutChartData = {
    labels: branchData.map((b) => b.label),
    datasets: [
      {
        data: branchData.map((b) => b.data),
        backgroundColor: branchData.map((b) => b.color),
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
    <BranchOwnerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Branch Owner Dashboard
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Welcome back — here's what's happening across your branches.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`bg-gray-900/60 border ${stat.border} rounded-2xl p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`${stat.accentBg} ${stat.accentText} p-3 rounded-xl`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {stat.icon}
                  </svg>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-semibold ${stat.accentText} ${stat.accentBg} px-2 py-1 rounded-full`}
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
              <div className="text-2xl font-black text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mb-2">{stat.title}</div>
              <div className={`text-xs font-semibold ${stat.accentText}`}>
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-white">
                  Revenue & Services Trend
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  January – June 2025
                </p>
              </div>
            </div>
            <div className="h-72">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-6">
              <h3 className="text-lg font-black text-white">
                Branch Revenue Distribution
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">
                By branch this month
              </p>
            </div>
            <div className="h-44 flex items-center justify-center mb-6">
              <Doughnut
                data={doughnutChartData}
                options={doughnutChartOptions}
              />
            </div>
            <div className="space-y-3">
              {branchData.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.color }}
                  />
                  <span className="text-sm text-gray-400 flex-1">
                    {b.label}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {b.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BranchOwnerLayout>
  );
}

export default BranchOwnerDashboard;