import React from "react";
import AdminLayout from "./AdminLayout";
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

function AdminDashboard() {
  const stats = [
    {
      title: "Total Revenue",
      value: "₱385,000",
      change: "+12.5% from last month",
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
      accent: "#ef4444",
      accentBg: "bg-red-500/10",
      accentText: "text-red-400",
      border: "border-red-500/20",
    },
    {
      title: "Total Customers",
      value: "1,247",
      change: "+8.2% from last month",
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
      accent: "#a855f7",
      accentBg: "bg-purple-500/10",
      accentText: "text-purple-400",
      border: "border-purple-500/20",
    },
    {
      title: "Services Completed",
      value: "883",
      change: "+15.3% from last month",
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
      accent: "#3b82f6",
      accentBg: "bg-blue-500/10",
      accentText: "text-blue-400",
      border: "border-blue-500/20",
    },
    {
      title: "Avg. Satisfaction",
      value: "89%",
      change: "+2.1% from last month",
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
      accent: "#10b981",
      accentBg: "bg-emerald-500/10",
      accentText: "text-emerald-400",
      border: "border-emerald-500/20",
    },
  ];

  const lineChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue (₱)",
        data: [50000, 52000, 48000, 58000, 61000, 70000],
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
        label: "Services",
        data: [120, 135, 125, 138, 145, 165],
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
    { label: "Oil Change", color: "#ef4444", pct: "35%", val: 35 },
    { label: "Tire Service", color: "#a855f7", pct: "25%", val: 25 },
    { label: "Engine Repair", color: "#3b82f6", pct: "20%", val: 20 },
    { label: "Body Work", color: "#10b981", pct: "12%", val: 12 },
    { label: "Other", color: "#f59e0b", pct: "8%", val: 8 },
  ];

  const recentActivity = [
    {
      name: "Juan dela Cruz",
      service: "Oil Change",
      amount: "₱850",
      status: "Completed",
      avatar: "J",
    },
    {
      name: "Maria Santos",
      service: "Tire Service",
      amount: "₱1,200",
      status: "In Progress",
      avatar: "M",
    },
    {
      name: "Pedro Reyes",
      service: "Engine Repair",
      amount: "₱4,500",
      status: "Completed",
      avatar: "P",
    },
    {
      name: "Ana Gonzales",
      service: "Body Work",
      amount: "₱8,000",
      status: "Pending",
      avatar: "A",
    },
    {
      name: "Carlo Mendoza",
      service: "Oil Change",
      amount: "₱850",
      status: "Completed",
      avatar: "C",
    },
  ];

  const statusStyle = {
    Completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "In Progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Welcome back — here's what's happening today.
          </p>
        </div>

        {/* Stats Cards */}
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
                  {stat.icon}
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
              <div className="text-sm text-gray-500 mb-3">{stat.title}</div>
              <div className={`text-xs font-semibold ${stat.accentText}`}>
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Line Chart */}
          <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-white">
                  Revenue & Services Trend
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  January – June 2025
                </p>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl p-1 self-start sm:self-auto">
                {["6M", "1Y", "All"].map((t) => (
                  <button
                    key={t}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${t === "6M" ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "text-gray-500 hover:text-gray-300"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 sm:h-72">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
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
                  <span className="text-sm text-gray-400 flex-1 truncate">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:block w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
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

          {/* Table Header (Desktop only) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
            <div className="col-span-4">Customer</div>
            <div className="col-span-3">Service</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {recentActivity.map((row, i) => (
              <div
                key={i}
                className="flex flex-col md:grid md:grid-cols-12 gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors md:items-center group"
              >
                {/* Customer Column */}
                <div className="md:col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center text-sm font-bold shrink-0">
                      {row.avatar}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {row.name}
                      </div>
                      <div className="md:hidden text-xs text-gray-500 mt-0.5">
                        {row.service}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Column (Desktop only, hidden on mobile as it's under Name) */}
                <div className="hidden md:block md:col-span-3 text-gray-400 text-sm">
                  {row.service}
                </div>

                {/* Amount and Status Row (Mobile side-by-side) */}
                <div className="flex items-center justify-between md:col-span-4">
                  <div className="text-white font-bold text-sm md:w-1/2">
                    {row.amount}
                  </div>
                  <div className="md:w-1/2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${statusStyle[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </div>
                </div>

                {/* Actions Column */}
                <div className="hidden md:flex md:col-span-1 justify-end">
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
            ))}
          </div>

          <div className="px-6 py-4">
            <p className="text-gray-500 text-sm">
              Showing <span className="text-white font-semibold">5</span> of{" "}
              <span className="text-white font-semibold">883</span> transactions
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;