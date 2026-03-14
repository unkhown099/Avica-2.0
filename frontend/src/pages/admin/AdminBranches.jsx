import React from "react";
import AdminLayout from "./AdminLayout";

function AdminBranches() {
  const branches = [
    {
      name: "San Mateo Rizal",
      location: "San Mateo, Rizal",
      status: "Active",
      manager: "Carl Roy Gamilla",
      staff: 15,
      mechanics: 8,
      bayUtilization: 85,
      services: 450,
      revenue: "₱125,000",
      satisfaction: 92,
    },
    {
      name: "South Caloocan",
      location: "South Caloocan City",
      status: "Active",
      manager: "Shawn Cabutin",
      staff: 12,
      mechanics: 6,
      bayUtilization: 78,
      services: 320,
      revenue: "₱98,000",
      satisfaction: 88,
    },
    {
      name: "Quezon City",
      location: "Quezon City, Metro Manila",
      status: "Active",
      manager: "John Charles Aguilar",
      staff: 9,
      mechanics: 5,
      bayUtilization: 74,
      services: 265,
      revenue: "₱82,000",
      satisfaction: 90,
    },
    {
      name: "North Caloocan",
      location: "North Caloocan City",
      status: "Active",
      manager: "Jerald Galdiano",
      staff: 10,
      mechanics: 5,
      bayUtilization: 72,
      services: 280,
      revenue: "₱87,000",
      satisfaction: 85,
    },
    {
      name: "Camarin",
      location: "Camarin, Caloocan City",
      status: "Active",
      manager: "Maria Santos",
      staff: 8,
      mechanics: 4,
      bayUtilization: 68,
      services: 210,
      revenue: "₱65,000",
      satisfaction: 87,
    },
  ];

  const totalStaff = branches.reduce((s, b) => s + b.staff, 0);

  const bayColor = (pct) =>
    pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Branches
            </h1>
            <p className="text-gray-400 mt-1">
              Monitor and compare performance across all branches
            </p>
          </div>
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 self-start md:self-auto">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Branch
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Branches",
              value: branches.length,
              color: "#ef4444",
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
              label: "Total Staff",
              value: totalStaff,
              color: "#a855f7",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              ),
            },
            {
              label: "Total Revenue",
              value: "₱457,000",
              color: "#10b981",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: stat.color + "22" }}
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: stat.color }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {stat.icon}
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-black text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {branches.map((branch, i) => (
            <div
              key={i}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm hover:border-white/10 transition-all flex flex-col"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-white">
                    {branch.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    <svg
                      className="w-3.5 h-3.5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {branch.location}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  {branch.status}
                </span>
              </div>

              {/* Manager */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-black shrink-0">
                  {branch.manager.charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-gray-500">Branch Manager</div>
                  <div className="text-white font-semibold text-sm">
                    {branch.manager}
                  </div>
                </div>
              </div>

              {/* Staff & Mechanics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-white">
                    {branch.staff}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Staff</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-white">
                    {branch.mechanics}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Mechanics</div>
                </div>
              </div>

              {/* Bay Utilization */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-semibold">
                    Bay Utilization
                  </span>
                  <span
                    className="text-xs font-black"
                    style={{ color: bayColor(branch.bayUtilization) }}
                  >
                    {branch.bayUtilization}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${branch.bayUtilization}%`,
                      backgroundColor: bayColor(branch.bayUtilization),
                    }}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-4 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Services Completed</span>
                  <span className="text-white font-bold">
                    {branch.services}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Monthly Revenue</span>
                  <span className="text-emerald-400 font-bold">
                    {branch.revenue}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Satisfaction</span>
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-white font-bold text-sm">
                      {branch.satisfaction}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/20">
                  View Details
                </button>
                <button className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-sm rounded-xl transition-all">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminBranches;