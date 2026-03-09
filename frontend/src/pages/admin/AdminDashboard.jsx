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
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      cardBg: "bg-gradient-to-br from-red-50 to-pink-50",
      borderColor: "border-red-100",
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
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
      cardBg: "bg-gradient-to-br from-red-50 to-orange-50",
      borderColor: "border-red-100",
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
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
      cardBg: "bg-gradient-to-br from-red-50 to-pink-50",
      borderColor: "border-red-100",
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
      cardBg: "bg-gradient-to-br from-red-50 to-amber-50",
      borderColor: "border-red-100",
    },
  ];

  const lineChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue (₱)",
        data: [50000, 52000, 48000, 58000, 61000, 70000],
        borderColor: "#dc2626",
        backgroundColor: "rgba(220, 38, 38, 0.1)",
        tension: 0.4,
        yAxisID: "y",
      },
      {
        label: "Services",
        data: [120, 135, 125, 138, 145, 165],
        borderColor: "#1f2937",
        backgroundColor: "rgba(31, 41, 55, 0.1)",
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: true, position: "bottom" },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
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
          "#dc2626",
          "#1f2937",
          "#6b7280",
          "#ef4444",
          "#374151",
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const serviceBreakdown = [
    { label: "Oil Change", color: "bg-red-600", pct: "35%" },
    { label: "Tire Service", color: "bg-gray-900", pct: "25%" },
    { label: "Engine Repair", color: "bg-gray-500", pct: "20%" },
    { label: "Body Work", color: "bg-red-400", pct: "12%" },
    { label: "Other", color: "bg-gray-700", pct: "8%" },
  ];

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/50 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
        {/* Title */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Admin Dashboard
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.cardBg} rounded-xl p-5 shadow-sm border-2 ${stat.borderColor}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-sm text-gray-600 mb-1 truncate">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    {stat.value}
                  </h3>
                </div>
                <div
                  className={`${stat.iconBg} ${stat.iconColor} p-3 rounded-lg flex-shrink-0`}
                >
                  {stat.icon}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <svg
                  className={`w-4 h-4 flex-shrink-0 ${stat.iconColor}`}
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
                <span
                  className={`${stat.iconColor} font-medium text-xs sm:text-sm`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Line Chart */}
          <div className="xl:col-span-2 bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6">
              Revenue & Services Trend
            </h3>
            <div className="h-60 sm:h-72 lg:h-80">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6">
              Service Distribution
            </h3>
            <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center mb-4 sm:mb-6">
              <Doughnut
                data={doughnutChartData}
                options={doughnutChartOptions}
              />
            </div>
            <div className="space-y-2">
              {serviceBreakdown.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 ${item.color} rounded-full flex-shrink-0`}
                    ></div>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;