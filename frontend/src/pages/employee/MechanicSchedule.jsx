import React, { useState } from "react";
import MechanicLayout from "./MechanicLayout";

function MechanicSchedule() {
  const [selectedDate, setSelectedDate] = useState(2);
  const [currentMonth] = useState("February 2026");
  const [viewMode, setViewMode] = useState("week"); // week or day

  // Calendar days
  const calendarDays = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    hasJobs: [2, 4, 5, 7, 9, 10, 12, 14, 15, 16, 18, 20, 21].includes(i + 1),
  }));

  // Weekly schedule
  const weeklySchedule = [
    { day: "Monday", date: "Feb 2", jobs: 5, hours: "09:00 AM - 06:00 PM" },
    { day: "Tuesday", date: "Feb 3", jobs: 3, hours: "09:00 AM - 04:00 PM" },
    { day: "Wednesday", date: "Feb 4", jobs: 6, hours: "09:00 AM - 07:00 PM" },
    { day: "Thursday", date: "Feb 5", jobs: 4, hours: "09:00 AM - 05:00 PM" },
    { day: "Friday", date: "Feb 6", jobs: 5, hours: "09:00 AM - 06:00 PM" },
    { day: "Saturday", date: "Feb 7", jobs: 2, hours: "09:00 AM - 02:00 PM" },
    { day: "Sunday", date: "Feb 8", jobs: 0, hours: "Day Off" },
  ];

  // Daily schedule
  const dailySchedule = [
    {
      time: "09:00 AM",
      customer: "John Doe",
      vehicle: "Toyota Corolla 2020",
      service: "Oil Change",
      duration: "45 mins",
      status: "Completed",
      bay: "3",
    },
    {
      time: "10:00 AM",
      customer: "Jane Smith",
      vehicle: "Honda Civic 2019",
      service: "Brake Inspection",
      duration: "1 hour",
      status: "In Progress",
      bay: "3",
    },
    {
      time: "11:30 AM",
      customer: "Break Time",
      vehicle: "",
      service: "Lunch Break",
      duration: "30 mins",
      status: "Break",
      bay: "-",
    },
    {
      time: "12:00 PM",
      customer: "Robert Wilson",
      vehicle: "Ford Ranger 2021",
      service: "Engine Diagnostic",
      duration: "1.5 hours",
      status: "Scheduled",
      bay: "3",
    },
    {
      time: "02:00 PM",
      customer: "Emily Brown",
      vehicle: "Nissan Altima 2022",
      service: "Tire Replacement",
      duration: "1 hour",
      status: "Scheduled",
      bay: "3",
    },
    {
      time: "03:30 PM",
      customer: "Michael Chen",
      vehicle: "Mazda 3 2020",
      service: "Full Service",
      duration: "2 hours",
      status: "Scheduled",
      bay: "3",
    },
  ];

  const getStatusStyle = (status) => {
    const styles = {
      Completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "In Progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Scheduled: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      Break: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return styles[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  return (
    <MechanicLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              My Schedule
            </h1>
            <p className="text-gray-400 mt-1">
              View your work schedule and assignments
            </p>
          </div>
          <div className="flex gap-2 bg-gray-800/60 rounded-xl p-1 self-start">
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                viewMode === "week"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                viewMode === "day"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Day View
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <svg
                className="w-5 h-5 text-red-400"
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
              <h2 className="text-lg font-black text-white">Calendar</h2>
            </div>

            <div className="flex items-center justify-between mb-6">
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h3 className="font-bold text-white">{currentMonth}</h3>
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((item) => (
                <button
                  key={item.day}
                  onClick={() => setSelectedDate(item.day)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all relative ${
                    selectedDate === item.day
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : item.hasJobs
                        ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
                        : "hover:bg-white/5 text-gray-400"
                  }`}
                >
                  {item.day}
                  {item.hasJobs && selectedDate !== item.day && (
                    <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule View */}
          <div className="lg:col-span-3">
            {viewMode === "week" ? (
              /* Weekly View */
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white mb-6">
                  This Week
                </h2>
                <div className="space-y-4">
                  {weeklySchedule.map((day, index) => (
                    <div
                      key={index}
                      className={`border rounded-xl p-5 transition-all ${
                        day.jobs === 0
                          ? "border-white/5 bg-white/[0.02]"
                          : "border-white/5 hover:border-red-500/20 hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-lg font-bold text-white">
                              {day.day}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {day.date}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{day.hours}</p>
                        </div>
                        <div className="text-right">
                          {day.jobs > 0 ? (
                            <>
                              <p className="text-3xl font-black text-red-400">
                                {day.jobs}
                              </p>
                              <p className="text-sm text-gray-500">jobs</p>
                            </>
                          ) : (
                            <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-sm font-medium border border-white/5">
                              Day Off
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Daily View */
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white mb-6">
                  Schedule for February {selectedDate}, 2026
                </h2>
                <div className="space-y-4">
                  {dailySchedule.map((job, index) => (
                    <div
                      key={index}
                      className={`border rounded-xl p-5 transition-all ${
                        job.status === "Break"
                          ? "border-white/5 bg-white/[0.02]"
                          : "border-white/5 hover:border-red-500/20 hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-lg font-bold text-white">
                              {job.time}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(job.status)}`}
                            >
                              {job.status}
                            </span>
                          </div>

                          {job.status !== "Break" ? (
                            <>
                              <h3 className="font-bold text-white mb-2">
                                {job.customer}
                              </h3>

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

                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <div className="flex items-center gap-2">
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
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span>{job.duration}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
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
                            </>
                          ) : (
                            <p className="text-gray-400 text-sm">
                              {job.service}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MechanicLayout>
  );
}

export default MechanicSchedule;