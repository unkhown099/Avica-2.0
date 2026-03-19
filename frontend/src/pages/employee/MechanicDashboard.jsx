import React from "react";
import MechanicLayout from "./MechanicLayout";

function MechanicDashboard() {
  // Stats data with updated theme colors
  const stats = [
    {
      title: "Today's Jobs",
      value: "5",
      change: "+2 completed, 3 pending",
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      accent: "#ef4444",
      accentBg: "bg-red-500/10",
      accentText: "text-red-400",
      border: "border-red-500/20",
    },
    {
      title: "Active Job",
      value: "1",
      change: "Oil Change - In Progress",
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
      title: "This Week",
      value: "18",
      change: "Jobs completed",
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      accent: "#10b981",
      accentBg: "bg-emerald-500/10",
      accentText: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    {
      title: "Customer Rating",
      value: "4.8",
      change: "Based on 24 reviews",
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
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
      accent: "#a855f7",
      accentBg: "bg-purple-500/10",
      accentText: "text-purple-400",
      border: "border-purple-500/20",
    },
  ];

  // Today's schedule
  const todaySchedule = [
    {
      time: "09:00 AM",
      customer: "John Doe",
      vehicle: "Toyota Corolla 2020",
      service: "Oil Change",
      status: "Completed",
      bay: "3",
    },
    {
      time: "11:00 AM",
      customer: "Jane Smith",
      vehicle: "Honda Civic 2019",
      service: "Brake Inspection",
      status: "In Progress",
      bay: "3",
    },
    {
      time: "02:00 PM",
      customer: "Robert Wilson",
      vehicle: "Ford Ranger 2021",
      service: "Engine Diagnostic",
      status: "Scheduled",
      bay: "3",
    },
    {
      time: "04:00 PM",
      customer: "Emily Brown",
      vehicle: "Nissan Altima 2022",
      service: "Tire Replacement",
      status: "Scheduled",
      bay: "3",
    },
  ];

  const notifications = [
    {
      title: "New job assigned",
      message: "Engine Diagnostic - 2:00 PM",
      type: "info",
    },
    {
      title: "Parts available",
      message: "Brake pads for Bay 3",
      type: "success",
    },
    {
      title: "Break reminder",
      message: "Take a break in 30 mins",
      type: "warning",
    },
  ];

  const getStatusStyle = (status) => {
    const styles = {
      Completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "In Progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Scheduled: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
    return styles[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getNotificationStyle = (type) => {
    const styles = {
      info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    };
    return styles[type] || styles.info;
  };

  return (
    <MechanicLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Mechanic Dashboard
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Welcome back, Mike Johnson — San Mateo Rizal Branch
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-black text-white">
                    Today's Schedule
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5">
                    Bay 3 assignments
                  </p>
                </div>
                <button className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors">
                  View all →
                </button>
              </div>

              <div className="divide-y divide-white/5">
                {todaySchedule.map((job, index) => (
                  <div
                    key={index}
                    className="p-6 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-lg font-black text-white">
                            {job.time}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(job.status)}`}
                          >
                            {job.status}
                          </span>
                        </div>

                        <h4 className="font-bold text-white mb-2">
                          {job.customer}
                        </h4>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            <span>{job.vehicle}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <svg
                              className="w-4 h-4 text-gray-600"
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
                            <span>{job.service}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>Bay {job.bay}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {job.status === "Scheduled" && (
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-lg shadow-blue-600/30 transition-colors">
                            Start Job
                          </button>
                        )}
                        {job.status === "In Progress" && (
                          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-colors">
                            Complete
                          </button>
                        )}
                        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-semibold text-sm border border-white/5 transition-colors">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Notifications */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-black text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/30">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Report Issue
                </button>

                <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
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
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  Request Parts
                </button>

                <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-white/5">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  View Schedule
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-black text-white mb-4">
                Notifications
              </h3>
              <div className="space-y-3">
                {notifications.map((notif, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-xl ${getNotificationStyle(notif.type)}`}
                  >
                    <p className="text-sm font-semibold">{notif.title}</p>
                    <p className="text-xs opacity-80 mt-1">{notif.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MechanicLayout>
  );
}

export default MechanicDashboard;