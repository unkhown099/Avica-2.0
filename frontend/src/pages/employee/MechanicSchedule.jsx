import React, { useState, useEffect, useCallback } from "react";
import MechanicLayout from "./MechanicLayout";
import { useAuth, API_BASE } from "../../hooks/useAuth";

// Helper functions
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

const statusStyle = {
  done: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  in_service: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  waiting: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  break: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30"
};

const statusLabel = {
  done: "Completed",
  in_service: "In Progress",
  waiting: "Waiting",
  break: "Break",
  pending: "Pending",
  cancelled: "Cancelled"
};

function MechanicSchedule() {
  const { token, isAuthenticated } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.getDate());
  const [viewMode, setViewMode] = useState("week"); // week or day
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scheduleData, setScheduleData] = useState({
    weekly_schedule: [],
    daily_schedule: [],
    jobs: []
  });

  const monthName = new Date(year, month).toLocaleString("en-PH", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const selectedISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;

  // Helper function to make authenticated requests
  const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    return response.json();
  };

  const fetchWeeklySchedule = useCallback(async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE}/api/mechanic/schedule/week/?date=${selectedISO}`);
      setScheduleData(prev => ({ ...prev, weekly_schedule: data.weekly_schedule }));
    } catch (err) {
      console.error('Error fetching weekly schedule:', err);
    }
  }, [selectedISO]);

  const fetchDailySchedule = useCallback(async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE}/api/mechanic/schedule/day/?date=${selectedISO}`);
      setScheduleData(prev => ({ ...prev, daily_schedule: data.daily_schedule }));
    } catch (err) {
      console.error('Error fetching daily schedule:', err);
    }
  }, [selectedISO]);

  const fetchAllJobs = useCallback(async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE}/api/mechanic/jobs/`);
      setScheduleData(prev => ({ ...prev, jobs: data.results || [] }));
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
          await Promise.all([
            fetchWeeklySchedule(),
            fetchDailySchedule(),
            fetchAllJobs()
          ]);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, token, viewMode, selectedISO, fetchWeeklySchedule, fetchDailySchedule, fetchAllJobs]);

  const dotsForDay = (day) => {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return scheduleData.jobs.filter((job) => {
      const jobDate = new Date(job.queued_at).toISOString().split('T')[0];
      return jobDate === iso;
    }).map((job) => job.status);
  };

  const dotColor = (s, isSelected) => {
    if (isSelected) return "bg-white/70";
    if (s === "done") return "bg-emerald-400";
    if (s === "in_service") return "bg-blue-400";
    if (s === "waiting") return "bg-amber-400";
    return "bg-red-400";
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
    setSelectedDate(1);
  };
  
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
    setSelectedDate(1);
  };

  if (loading) {
    return (
      <MechanicLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
            <p className="text-gray-400">Loading schedule...</p>
          </div>
        </div>
      </MechanicLayout>
    );
  }

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="text-lg font-black text-white">Calendar</h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm text-gray-300 font-semibold px-2">
                  {monthName}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-gray-600 py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dots = dotsForDay(day);
                const isSelected = selectedDate === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                      isSelected
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                        : "hover:bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>{day}</span>
                    {dots.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dots.slice(0, 3).map((s, idx) => (
                          <div
                            key={idx}
                            className={`w-1 h-1 rounded-full ${dotColor(s, isSelected)}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
              {[
                { color: "bg-emerald-400", label: "Completed" },
                { color: "bg-blue-400", label: "In Progress" },
                { color: "bg-amber-400", label: "Waiting" },
                { color: "bg-red-400", label: "Cancelled/Skipped" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-gray-500">
                  <div className={`w-2 h-2 rounded-full ${color}`} /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Schedule View */}
          <div className="lg:col-span-2">
            {viewMode === "week" ? (
              /* Weekly View */
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white mb-6">
                  This Week
                </h2>
                <div className="space-y-4">
                  {scheduleData.weekly_schedule && scheduleData.weekly_schedule.length > 0 ? (
                    scheduleData.weekly_schedule.map((day, index) => (
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
                                No Schedule
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No schedule data available for this week
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Daily View */
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white mb-6">
                  Schedule for {formatDate(selectedISO)}
                </h2>
                <div className="space-y-4">
                  {scheduleData.daily_schedule && scheduleData.daily_schedule.length > 0 ? (
                    scheduleData.daily_schedule.map((job, index) => (
                      <div
                        key={index}
                        className={`border rounded-xl p-5 transition-all ${
                          job.status === "break"
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
                                className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusStyle[job.status] || statusStyle.waiting}`}
                              >
                                {statusLabel[job.status] || job.status}
                              </span>
                            </div>

                            {job.status !== "break" && job.customer_name ? (
                              <>
                                <h3 className="font-bold text-white mb-2">
                                  {job.customer_name}
                                </h3>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span>{job.vehicle}</span>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{job.service}</span>
                                  </div>

                                  {job.duration && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>{job.duration}</span>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <p className="text-gray-400 text-sm">
                                {job.service || "Break time"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No jobs scheduled for this day
                    </div>
                  )}
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