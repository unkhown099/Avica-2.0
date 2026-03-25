import React, { useState, useEffect, useCallback, useMemo } from "react";
import AdminLayout from "./AdminLayout";
import { API_BASE } from "../../hooks/useAuth.js";
import axios from "axios";
import Swal from "sweetalert2";

const API = API_BASE;
const getToken = () =>
  localStorage.getItem("access_token") ??
  sessionStorage.getItem("access_token");
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

// ── Helpers ──────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const STATUS_STYLE = {
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  cancelled: "bg-red-500/20 text-red-100 border-red-500/30",
  done: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  rescheduled: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};
const STATUS_LABEL = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  done: "Done",
  rescheduled: "Rescheduled",
};
const STATUS_DOT = {
  confirmed: "bg-emerald-400",
  pending: "bg-amber-400",
  cancelled: "bg-red-400",
  done: "bg-blue-400",
  rescheduled: "bg-indigo-400",
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-gray-800/60 border border-white/5 rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-700 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-4 w-28 bg-gray-700 rounded" />
          <div className="h-3 w-16 bg-gray-700 rounded" />
        </div>
        <div className="ml-auto h-6 w-20 bg-gray-700 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-3 bg-gray-700 rounded" />
        ))}
      </div>
      <div className="flex gap-2 pt-3 border-t border-white/5">
        <div className="flex-1 h-9 bg-gray-700 rounded-xl" />
        <div className="flex-1 h-9 bg-gray-700 rounded-xl" />
      </div>
    </div>
  );
}

// ── Status Edit Modal ─────────────────────────────────────────────────────────
function EditModal({ appointment, onClose, onSaved }) {
  const [form, setForm] = useState({
    status: appointment.status,
    staff: appointment.staff ?? "",
    time: appointment.time ?? "",
    notes: appointment.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    try {
      setSaving(true);
      await axios.patch(`${API}/appointments/${appointment.id}/`, form, {
        headers: authHeaders(),
      });
      onSaved();
      onClose();
      Swal.fire({
        icon: "success",
        title: "Appointment updated",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
        background: "#111827",
        color: "#f9fafb",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.detail ?? "Could not update.",
        background: "#111827",
        color: "#f9fafb",
      });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-white">Edit Appointment</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {appointment.customer_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Status
            </label>
            <select
              className={inputCls}
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Assigned Mechanic
            </label>
            <input
              className={inputCls}
              placeholder="e.g. Mike Johnson"
              value={form.staff}
              onChange={(e) =>
                setForm((p) => ({ ...p, staff: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Time
            </label>
            <input
              className={inputCls}
              placeholder="e.g. 09:00 AM"
              value={form.time}
              onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Notes
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 border border-white/10 text-gray-400 hover:text-white px-6 py-3 rounded-xl transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-red-600/30"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function AdminAppointments() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [branches, setBranches] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editItem, setEditItem] = useState(null);

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [aptRes, branchRes] = await Promise.all([
        axios.get(`${API}/appointments/`, {
          headers: authHeaders(),
          params: { year: currentYear, month: currentMonth + 1 },
        }),
        axios.get(`${API}/branches/`, { headers: authHeaders() }),
      ]);
      setAppointments(aptRes.data);
      setBranches(branchRes.data);
    } catch {
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteAppointment = async (apt) => {
    const result = await Swal.fire({
      title: "Cancel appointment?",
      text: `This will delete the booking for ${apt.customer_name}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#ef4444",
      background: "#111827",
      color: "#f9fafb",
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${API}/appointments/${apt.id}/`, {
        headers: authHeaders(),
      });
      setAppointments((prev) => prev.filter((a) => a.id !== apt.id));
    } catch {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not delete appointment.",
        background: "#111827",
        color: "#f9fafb",
      });
    }
  };

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  // Map day → list of statuses for dot indicators
  const dayStatusMap = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      const d = new Date(a.date).getDate();
      if (!map[d]) map[d] = [];
      if (!map[d].includes(a.status)) map[d].push(a.status);
    });
    return map;
  }, [appointments]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
    setSelectedDay(1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
    setSelectedDay(1);
  };

  // ── Filtered appointments for selected day ────────────────────────────────
  const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

  const dayAppointments = appointments.filter((a) => {
    const matchDate = a.date === selectedDateStr;
    const matchBranch =
      branchFilter === "All Branches" || a.branch_name === branchFilter;
    return matchDate && matchBranch;
  });

  // ── Stats ────────────────────────────────────────────────────────────────
  const confirmedCount = appointments.filter(
    (a) => a.status === "confirmed",
  ).length;
  const pendingCount = appointments.filter(
    (a) => a.status === "pending",
  ).length;

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Appointments
          </h1>
          <p className="text-gray-400 mt-1">
            Manage service appointments and schedules
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4">
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={fetchData}
              className="ml-auto text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-black text-white mb-1">
              {loading ? (
                <div className="h-7 w-8 bg-gray-800 rounded animate-pulse" />
              ) : (
                appointments.length
              )}
            </div>
            <div className="text-xs text-gray-400">Total This Month</div>
          </div>
          <div className="bg-gray-900/60 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-black text-emerald-400 mb-1">
              {loading ? (
                <div className="h-7 w-8 bg-gray-800 rounded animate-pulse" />
              ) : (
                confirmedCount
              )}
            </div>
            <div className="text-xs text-gray-400">Confirmed</div>
          </div>
          <div className="bg-gray-900/60 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-black text-amber-400 mb-1">
              {loading ? (
                <div className="h-7 w-8 bg-gray-800 rounded animate-pulse" />
              ) : (
                pendingCount
              )}
            </div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          {/* Branch filter */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm flex items-center">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
              <option className="bg-gray-900" value="All Branches">
                All Branches
              </option>
              {branches.map((b) => (
                <option key={b.id} className="bg-gray-900">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Calendar ────────────────────────────────────────────────── */}
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
                <span className="text-sm text-gray-300 font-semibold px-2 min-w-[120px] text-center">
                  {MONTH_NAMES[currentMonth]} {currentYear}
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

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_HEADERS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold text-gray-600 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for first day offset */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const statuses = dayStatusMap[day] ?? [];
                  const isSelected = selectedDay === day;
                  const isToday =
                    day === today.getDate() &&
                    currentMonth === today.getMonth() &&
                    currentYear === today.getFullYear();
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all ${isSelected
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                        : isToday
                          ? "border border-red-500/40 text-red-400 hover:bg-red-500/10"
                          : "hover:bg-white/5 text-gray-400 hover:text-white"
                        }`}
                    >
                      <span>{day}</span>
                      {statuses.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {statuses.map((s, idx) => (
                            <div
                              key={idx}
                              className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/70" : (STATUS_DOT[s] ?? "bg-gray-500")}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                },
              )}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
              {Object.entries(STATUS_DOT).map(([key, dot]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <div className={`w-2 h-2 rounded-full ${dot}`} />
                  {STATUS_LABEL[key]} Appointments
                </div>
              ))}
            </div>
          </div>

          {/* ── Appointments Panel ───────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black text-white">
                    {MONTH_NAMES[currentMonth]} {selectedDay}, {currentYear}
                  </h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {loading
                      ? "Loading..."
                      : `${dayAppointments.length} appointment${dayAppointments.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : dayAppointments.length === 0 ? (
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
                    No appointments scheduled for this date
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayAppointments.map((apt) => {
                    const statusKey = apt.status?.toLowerCase();
                    return (
                      <div
                        key={apt.id}
                        className="bg-gray-800/60 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group"
                      >
                        {/* Card header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${STATUS_STYLE[statusKey] ?? "bg-gray-500/20 text-gray-400"}`}
                            >
                              {apt.customer_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-black text-base">
                                {apt.customer_name}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {apt.time}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[statusKey] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                          >
                            {STATUS_LABEL[statusKey] ?? apt.status}
                          </span>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
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
                              label: apt.branch_name ?? "—",
                            },
                            {
                              d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                              label: `Mechanic: ${apt.staff || "Unassigned"}`,
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

                        {apt.notes && (
                          <div className="mb-4 px-3 py-2 bg-white/5 rounded-lg text-xs text-gray-500 italic">
                            {apt.notes}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t border-white/5">
                          <button
                            onClick={() => setEditItem(apt)}
                            className="flex-1 text-center text-sm font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded-xl transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteAppointment(apt)}
                            className="flex-1 text-center text-sm font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 py-2 rounded-xl transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editItem && (
        <EditModal
          appointment={editItem}
          onClose={() => setEditItem(null)}
          onSaved={fetchData}
        />
      )}
    </AdminLayout>
  );
}

export default AdminAppointments;