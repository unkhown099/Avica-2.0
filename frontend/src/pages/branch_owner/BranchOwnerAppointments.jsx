import React, { useState, useEffect, useCallback } from "react";
import BranchOwnerLayout from "./BranchOwnerLayout";
import { useAuth, API_BASE } from "../../hooks/useAuth.js";

const STATUS_STYLE = {
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/20  text-amber-400  border-amber-500/30",
  cancelled: "bg-red-500/20    text-red-400    border-red-500/30",
  done: "bg-blue-500/20   text-blue-400   border-blue-500/30",
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthStr(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export default function BranchOwnerAppointments() {
  const { headers, isAuthenticated } = useAuth();

  const today = new Date();
  const [viewMonth, setViewMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [branchFilter, setBranchFilter] = useState("");
  const [branches, setBranches] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [calendar, setCalendar] = useState({}); // {day: [status, ...]}
  const [loading, setLoading] = useState(true);
  const [calLoading, setCalLoading] = useState(true);

  // ── Fetch branches for filter ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_BASE}/owner/branches/`, { headers, credentials: "include" })
      .then((r) => r.json())
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isAuthenticated, headers]);

  // ── Fetch calendar dots ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    setCalLoading(true);
    const params = new URLSearchParams({
      month: `${viewMonth.year}-${pad(viewMonth.month)}`,
    });
    if (branchFilter) params.set("branch", branchFilter);
    fetch(`${API_BASE}/owner/appointments/calendar/?${params}`, {
      headers,
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => setCalendar(data ?? {}))
      .catch(() => setCalendar({}))
      .finally(() => setCalLoading(false));
  }, [isAuthenticated, headers, viewMonth, branchFilter]);

  // ── Fetch appointments for selected date ────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (branchFilter) params.set("branch", branchFilter);
      const res = await fetch(`${API_BASE}/owner/appointments/?${params}`, {
        headers,
        credentials: "include",
      });
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, headers, selectedDate, branchFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ── Month navigation ────────────────────────────────────────────────────────
  const prevMonth = () =>
    setViewMonth((m) => {
      const mo = m.month === 1 ? 12 : m.month - 1;
      const yr = m.month === 1 ? m.year - 1 : m.year;
      return { year: yr, month: mo };
    });
  const nextMonth = () =>
    setViewMonth((m) => {
      const mo = m.month === 12 ? 1 : m.month + 1;
      const yr = m.month === 12 ? m.year + 1 : m.year;
      return { year: yr, month: mo };
    });

  const totalDays = daysInMonth(viewMonth.year, viewMonth.month);
  const firstDay = new Date(viewMonth.year, viewMonth.month - 1, 1).getDay(); // 0=Sun
  const monthLabel = new Date(
    viewMonth.year,
    viewMonth.month - 1,
    1,
  ).toLocaleString("en-PH", { month: "long", year: "numeric" });

  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const selectedLabel = selectedDateObj.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Summary counts across the full month
  const confirmedCount = Object.values(calendar)
    .flat()
    .filter((s) => s === "confirmed").length;
  const pendingCount = Object.values(calendar)
    .flat()
    .filter((s) => s === "pending").length;
  const totalCount = Object.values(calendar).flat().length;

  return (
    <BranchOwnerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Appointments
          </h1>
          <p className="text-gray-400 mt-1">
            View service appointments across all branches
          </p>
        </div>

        {/* Stats + Branch Filter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-black text-white mb-1">
              {totalCount}
            </div>
            <div className="text-xs text-gray-400">Total This Month</div>
          </div>
          <div className="bg-gray-900/60 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-black text-emerald-400 mb-1">
              {confirmedCount}
            </div>
            <div className="text-xs text-gray-400">Confirmed</div>
          </div>
          <div className="bg-gray-900/60 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-black text-amber-400 mb-1">
              {pendingCount}
            </div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm flex items-center">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-gray-900">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-white">Calendar</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <span className="text-sm text-gray-300 font-semibold px-2">
                  {monthLabel}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold text-gray-600 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} />
              ))}

              {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                const dateStr = `${viewMonth.year}-${pad(viewMonth.month)}-${pad(day)}`;
                const isSelected = selectedDate === dateStr;
                const dots = calendar[day] ?? [];
                const hasConf = dots.includes("confirmed");
                const hasPend = dots.includes("pending");

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                      isSelected
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                        : "hover:bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>{day}</span>
                    {dots.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {hasConf && (
                          <div
                            className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/70" : "bg-emerald-400"}`}
                          />
                        )}
                        {hasPend && (
                          <div
                            className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/70" : "bg-amber-400"}`}
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />{" "}
                Confirmed
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-amber-400" /> Pending
              </div>
            </div>
          </div>

          {/* Appointments Panel */}
          <div className="lg:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-lg font-black text-white">{selectedLabel}</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {loading
                  ? "Loading…"
                  : `${appointments.length} appointment${appointments.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-800/60 rounded-xl p-5 animate-pulse"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-700" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-700 rounded" />
                        <div className="h-3 w-20 bg-gray-700 rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-3 bg-gray-700 rounded" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-16 text-center">
                <svg
                  className="w-12 h-12 text-gray-700 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500 text-lg">No appointments</p>
                <p className="text-gray-600 text-sm mt-1">
                  No appointments for this date
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-gray-800/60 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                            apt.status === "confirmed"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {(apt.customer_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-black text-base">
                            {apt.customer_name}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {apt.time} · {apt.customer_email}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLE[apt.status] ?? STATUS_STYLE.pending}`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                      {[
                        {
                          d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                          label: apt.vehicle || "—",
                        },
                        {
                          d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
                          label: apt.service,
                        },
                        {
                          d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
                          label: apt.branch_name,
                        },
                        {
                          d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                          label: `Staff: ${apt.staff || "TBA"}`,
                        },
                      ].map((row, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-2 text-sm"
                        >
                          <svg
                            className="w-3.5 h-3.5 text-gray-600 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={row.d}
                            />
                          </svg>
                          <span className="text-gray-400 truncate">
                            {row.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-emerald-400 font-bold text-sm">
                        ₱{Number(apt.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </BranchOwnerLayout>
  );
}