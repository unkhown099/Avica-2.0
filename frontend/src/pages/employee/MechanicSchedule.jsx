import React, { useCallback, useEffect, useMemo, useState } from "react";
import MechanicLayout from "./MechanicLayout";
import { API_BASE } from "../../hooks/useAuth.js";

function authHeaders() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("access") ||
    sessionStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeStatus(status = "") {
  return String(status).toLowerCase().replace(/\s+/g, "_");
}

function isApprovedStatus(status = "") {
  return normalizeStatus(status) === "confirmed";
}

function toMinutes(t) {
  if (!t) return Number.MAX_SAFE_INTEGER;
  const parts = String(t).split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  return h * 60 + m;
}

function toDisplayTime(t) {
  if (!t) return "—";
  const [hRaw, mRaw] = String(t).split(":");
  const h = Number(hRaw);
  const m = Number(mRaw ?? 0);
  if (Number.isNaN(h)) return String(t);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function statusLabel(statusKey) {
  const map = {
    confirmed: "Confirmed",
    pending: "Pending",
    cancelled: "Cancelled",
    no_show: "No Show",
    done: "Completed",
    rescheduled: "Rescheduled",
  };
  return map[statusKey] ?? statusKey ?? "—";
}

function statusClass(statusKey) {
  const styles = {
    done: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
    no_show: "bg-red-500/20 text-red-200 border-red-500/30",
    rescheduled: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  };
  return styles[statusKey] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

function buildMonthDays(year, month, bookings) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const hasJobs = bookings.some((b) => b.date === iso);
    return { day, hasJobs };
  });
}

function getWeekStart(dateObj) {
  const d = new Date(dateObj);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function MechanicSchedule() {
  const now = new Date();
  const [viewMode, setViewMode] = useState("week");
  const [bookings, setBookings] = useState([]);
  const [scheduleConfig, setScheduleConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.getDate());

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/api/staff/bookings/`, {
        headers: authHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to load schedule (${res.status})`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : data.results ?? [];
      setBookings(rows.filter((row) => isApprovedStatus(row.status)));
    } catch (err) {
      setError(err.message || "Failed to load schedule.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const fetchManagerScheduleConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/manager/schedule-config/`, {
        headers: authHeaders(),
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setScheduleConfig(data?.config ?? null);
    } catch {
      setScheduleConfig(null);
    }
  }, []);

  useEffect(() => {
    fetchManagerScheduleConfig();
  }, [fetchManagerScheduleConfig]);

  const currentMonthLabel = useMemo(
    () => new Date(year, month, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" }),
    [year, month],
  );

  const selectedISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;

  const calendarDays = useMemo(
    () => buildMonthDays(year, month, bookings),
    [year, month, bookings],
  );

  const selectedDateObj = useMemo(
    () => new Date(year, month, selectedDate),
    [year, month, selectedDate],
  );

  const weekRows = useMemo(() => {
    const weekStart = getWeekStart(selectedDateObj);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayBookings = bookings.filter((b) => b.date === iso);
      const confirmed = dayBookings.filter((b) => isApprovedStatus(b.status)).length;
      const weekday = d.toLocaleDateString("en-PH", { weekday: "long" });
      const dayCfg = scheduleConfig?.days?.[weekday];
      const enabled = dayCfg?.enabled !== false;
      const start = dayCfg?.start;
      const end = dayCfg?.end;
      const hours = enabled && start && end ? `${toDisplayTime(start)} - ${toDisplayTime(end)}` : "No schedule set";
      return {
        day: d.toLocaleDateString("en-PH", { weekday: "long" }),
        date: d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
        iso,
        jobs: confirmed,
        hours,
      };
    });
  }, [selectedDateObj, bookings]);

  const dayBookings = useMemo(() => {
    return bookings
      .filter((b) => b.date === selectedISO)
      .slice()
      .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  }, [bookings, selectedISO]);

  const changeMonth = (delta) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    setSelectedDate((prev) => Math.min(prev, maxDay));
  };

  return (
    <MechanicLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">My Schedule</h1>
            <p className="text-gray-400 mt-1">Live bookings assigned to your branch</p>
          </div>
          <div className="flex gap-2 bg-gray-800/60 rounded-xl p-1 self-start sm:mt-12">
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                viewMode === "week" ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                viewMode === "day" ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Day View
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-lg font-black text-white">Calendar</h2>
            </div>

            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                ‹
              </button>
              <h3 className="font-bold text-white">{currentMonthLabel}</h3>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500">
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
                    <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm text-gray-400">
                Loading schedule...
              </div>
            ) : viewMode === "week" ? (
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white mb-6">This Week</h2>
                <div className="space-y-4">
                  {weekRows.map((day, index) => (
                    <div
                      key={`${day.iso}-${index}`}
                      className={`border rounded-xl p-5 transition-all ${
                        day.jobs === 0
                          ? "border-white/5 bg-white/[0.02]"
                          : "border-white/5 hover:border-red-500/20 hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-lg font-bold text-white">{day.day}</h3>
                            <span className="text-sm text-gray-500">{day.date}</span>
                          </div>
                          <p className="text-sm text-gray-400">{day.hours}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-red-400">{day.jobs}</p>
                          <p className="text-sm text-gray-500">jobs</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-black text-white mb-6">
                  Schedule for {new Date(year, month, selectedDate).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                </h2>
                <div className="space-y-4">
                  {dayBookings.length === 0 ? (
                    <div className="text-sm text-gray-500">No bookings for this day.</div>
                  ) : (
                    dayBookings.map((job) => {
                      const statusKey = normalizeStatus(job.status);
                      const customer = job.customer_name || "Unknown Customer";
                      return (
                        <div
                          key={job.id}
                          className="border border-white/5 rounded-xl p-5 hover:border-red-500/20 hover:bg-white/[0.02] transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-lg font-bold text-white">{toDisplayTime(job.time)}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusClass(statusKey)}`}>
                                  {statusLabel(statusKey)}
                                </span>
                              </div>

                              <h3 className="font-bold text-white mb-2">{customer}</h3>

                              <div className="space-y-2 text-sm text-gray-400">
                                <div>{job.vehicle || "—"}</div>
                                <div>{job.service || "—"}</div>
                                <div>Plate: {job.plate_number || "—"}</div>
                                <div>Staff: {job.assigned_employee_name || job.staff || "TBA"}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
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
