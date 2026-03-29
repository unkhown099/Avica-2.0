import React, { useState, useEffect, useCallback } from "react";
import ManagerLayout from "./ManagerLayout";
import { API_BASE } from "../../hooks/useAuth.js";
import Swal from "sweetalert2";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

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

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toApiTime(timeInput) {
  if (!timeInput) return "";
  const value = String(timeInput).trim();
  if (value.includes("AM") || value.includes("PM")) return value;
  const parts = value.split(":");
  if (parts.length < 2) return value;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  if (Number.isNaN(h)) return value;
  const period = h >= 12 ? "PM" : "AM";
  const normalizedHour = h % 12 === 0 ? 12 : h % 12;
  return `${normalizedHour}:${m} ${period}`;
}

function normalizeName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getMechanicLabel(booking) {
  const mechanic =
    booking.assigned_employee_name ||
    booking.preferred_employee_name ||
    booking.staff;
  if (!mechanic || String(mechanic).trim().toLowerCase() === "tba")
    return "Unassigned";
  return mechanic;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

const statusStyle = {
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  cancelled: "bg-red-500/20 text-red-100 border-red-500/30",
  no_show: "bg-red-500/20 text-red-300 border-red-500/30",
  done: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  rescheduled: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

const statusLabel = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  no_show: "No Show",
  done: "Done",
  rescheduled: "Rescheduled",
};

const APPOINTMENT_STATUS_PRIORITY = {
  pending: 0,
  confirmed: 1,
  rescheduled: 2,
  done: 3,
  cancelled: 4,
  no_show: 5,
};

function sortBookingsByPriority(rows) {
  return [...rows].sort((a, b) => {
    const aPriority = APPOINTMENT_STATUS_PRIORITY[a?.status] ?? 3;
    const bPriority = APPOINTMENT_STATUS_PRIORITY[b?.status] ?? 3;
    if (aPriority !== bPriority) return aPriority - bPriority;
    const aTime = String(a?.time ?? "");
    const bTime = String(b?.time ?? "");
    if (aTime !== bTime) return aTime.localeCompare(bTime);
    return (a?.id ?? 0) - (b?.id ?? 0);
  });
}

function ManagerAppointments() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.getDate());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [assignedByBooking, setAssignedByBooking] = useState({});

  const notify = (icon, title) => {
    Swal.fire({
      toast: true,
      position: "top-end",
      timer: 2200,
      timerProgressBar: true,
      showConfirmButton: false,
      icon,
      title,
      background: "#111827",
      color: "#f9fafb",
    });
  };

  const monthName = new Date(year, month).toLocaleString("en-PH", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const fetchBookings = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/staff/bookings/`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const rows = Array.isArray(data) ? data : (data.results ?? []);
        setBookings(rows);
        setAssignedByBooking(
          rows.reduce((acc, row) => {
            acc[row.id] = row.assigned_employee_id
              ? String(row.assigned_employee_id)
              : "";
            return acc;
          }, {}),
        );
      })
      .catch((err) =>
        notify("error", err.message || "Failed to load appointments."),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const fetchEmployees = useCallback(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue/employees/`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) =>
        setEmployees(Array.isArray(data) ? data : (data.results ?? [])),
      )
      .catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (!employees.length || !bookings.length) return;
    setAssignedByBooking((prev) => {
      const next = { ...prev };
      let changed = false;
      bookings.forEach((b) => {
        if (next[b.id]) return;
        const candidateName = normalizeName(
          b.assigned_employee_name || b.preferred_employee_name || b.staff,
        );
        if (!candidateName || candidateName === "tba") return;
        const matched = employees.find(
          (emp) => normalizeName(emp.full_name) === candidateName,
        );
        if (matched) {
          next[b.id] = String(matched.id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [employees, bookings]);

  const selectedISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
  const dayBookings = sortBookingsByPriority(
    bookings.filter((b) => b.date === selectedISO),
  );

  const dotsForDay = (day) => {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return bookings.filter((b) => b.date === iso).map((b) => b.status);
  };

  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;

  const handleAction = async (id, newStatus, assignedEmployeeId = null) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/api/staff/bookings/${id}/action/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          status: newStatus,
          assigned_employee_id: assignedEmployeeId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Action failed.");
      }
      const updated = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b)),
      );
      setAssignedByBooking((prev) => ({
        ...prev,
        [id]: updated.assigned_employee_id
          ? String(updated.assigned_employee_id)
          : "",
      }));
    } catch (e) {
      notify("error", e.message || "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRescheduleProposal = async (booking) => {
    const { value: formValues } = await Swal.fire({
      title: "Propose Reschedule Options",
      html: `<div class="space-y-4 text-left">
        <div><label class="block text-sm font-medium text-gray-400 mb-1">Option 1 Date</label><input id="swal-date-1" type="date" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"></div>
        <div><label class="block text-sm font-medium text-gray-400 mb-1">Option 1 Time (24h)</label><input id="swal-time-1" type="time" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"></div>
        <div><label class="block text-sm font-medium text-gray-400 mb-1">Option 2 Date (optional)</label><input id="swal-date-2" type="date" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"></div>
        <div><label class="block text-sm font-medium text-gray-400 mb-1">Option 2 Time (24h, optional)</label><input id="swal-time-2" type="time" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"></div>
      </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Send Proposal",
      confirmButtonColor: "#3b82f6",
      background: "#111827",
      color: "#fff",
      preConfirm: () => ({
        d1: document.getElementById("swal-date-1").value,
        t1: document.getElementById("swal-time-1").value,
        d2: document.getElementById("swal-date-2").value,
        t2: document.getElementById("swal-time-2").value,
      }),
    });
    if (!formValues) return;
    if (!formValues.d1 || !formValues.t1) {
      Swal.fire({
        icon: "error",
        title: "Missing option",
        text: "Option 1 date and time are required.",
        background: "#111827",
        color: "#fff",
      });
      return;
    }
    const options = [{ date: formValues.d1, time: toApiTime(formValues.t1) }];
    if (formValues.d2 && formValues.t2)
      options.push({ date: formValues.d2, time: toApiTime(formValues.t2) });
    setActionLoading(booking.id);
    try {
      const res = await fetch(
        `${API_BASE}/api/staff/bookings/${booking.id}/action/`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ action: "propose_reschedule", options }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to send proposal.");
      }
      const updated = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b)),
      );
      notify("success", "Reschedule options sent to customer.");
    } catch (e) {
      notify("error", e.message || "Failed to send proposal.");
    } finally {
      setActionLoading(null);
    }
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

  return (
    <ManagerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Appointments
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Review and approve customer bookings
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            {
              label: "Total This Month",
              value: bookings.length,
              color: "text-white",
              border: "border-white/5",
            },
            {
              label: "Confirmed",
              value: confirmed,
              color: "text-emerald-400",
              border: "border-emerald-500/20",
            },
            {
              label: "Pending Approval",
              value: pending,
              color: "text-amber-400",
              border: "border-amber-500/20",
            },
          ].map(({ label, value, color, border }) => (
            <div
              key={label}
              className={`bg-gray-900/60 ${border} border rounded-2xl p-3 sm:p-4 backdrop-blur-sm`}
            >
              <div className={`text-xl sm:text-2xl font-black ${color} mb-1`}>
                {value}
              </div>
              <div className="text-xs text-gray-400 leading-snug">{label}</div>
            </div>
          ))}
        </div>

        {/* Calendar + Appointments: stack on mobile, side-by-side on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Calendar */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-black text-white">
                Calendar
              </h2>
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
                <span className="text-xs sm:text-sm text-gray-300 font-semibold px-1 sm:px-2">
                  {monthName}
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

            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] sm:text-xs font-semibold text-gray-600 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const dots = dotsForDay(day);
                  const isSelected = selectedDate === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${isSelected ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span>{day}</span>
                      {dots.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dots.slice(0, 3).map((s, idx) => (
                            <div
                              key={idx}
                              className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/70" : s === "confirmed" ? "bg-emerald-400" : s === "pending" ? "bg-amber-400" : s === "done" ? "bg-blue-400" : "bg-red-400"}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                },
              )}
            </div>

            <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-white/5 grid grid-cols-2 sm:block gap-x-3 gap-y-1.5 sm:space-y-2">
              {[
                ["bg-emerald-400", "Confirmed"],
                ["bg-amber-400", "Pending"],
                ["bg-blue-400", "Done"],
                ["bg-red-400", "Cancelled"],
              ].map(([dot, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <div className={`w-2 h-2 rounded-full ${dot}`} /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Appointments Panel */}
          <div className="lg:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-black text-white">
                {formatDate(selectedISO)}
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {loading
                  ? "Loading..."
                  : `${dayBookings.length} appointment${dayBookings.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <svg
                  className="w-5 h-5 animate-spin mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Loading appointments...
              </div>
            )}

            {!loading && dayBookings.length === 0 && (
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
                  No bookings for this date
                </p>
              </div>
            )}

            {!loading && dayBookings.length > 0 && (
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                {dayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-gray-800/60 border border-white/5 rounded-xl p-4 sm:p-5 hover:border-white/10 transition-all"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${b.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" : b.status === "pending" ? "bg-amber-500/20 text-amber-400" : b.status === "done" ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"}`}
                        >
                          {(b.service || "?").charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-black text-sm sm:text-base truncate">
                            {b.customer_name || "Unknown Customer"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {b.service} · {b.time}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ml-2 ${statusStyle[b.status] || statusStyle.pending}`}
                      >
                        {statusLabel[b.status] || b.status}
                      </span>
                    </div>

                    {/* Details grid — 2-col on mobile, 2-col on larger */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
                      {[
                        {
                          path: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                          label: b.customer_name || "Unknown Customer",
                        },
                        {
                          path: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                          label: b.vehicle || "No vehicle info",
                        },
                        {
                          path: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
                          label: b.service,
                        },
                        {
                          path: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
                          label: b.branch || "—",
                        },
                        {
                          path: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                          label: `Mechanic: ${getMechanicLabel(b)}`,
                        },
                        b.plate_number && {
                          path: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                          label: b.plate_number,
                        },
                      ]
                        .filter(Boolean)
                        .map((row, j) => (
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
                                d={row.path}
                              />
                            </svg>
                            <span className="text-gray-400 truncate text-xs sm:text-sm">
                              {row.label}
                            </span>
                          </div>
                        ))}
                    </div>

                    {b.notes && (
                      <div className="mb-4 bg-white/3 rounded-lg px-3 py-2 text-gray-500 text-xs border border-white/5">
                        📝 {b.notes}
                      </div>
                    )}

                    {(b.status === "pending" || b.status === "confirmed") && (
                      <div className="mb-4 grid grid-cols-1 gap-2">
                        {(() => {
                          const isAssignmentLocked =
                            b.status === "confirmed" &&
                            Boolean(
                              assignedByBooking[b.id] || b.assigned_employee_id,
                            );
                          return (
                            <>
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                  {isAssignmentLocked
                                    ? "Assigned Mechanic (Locked)"
                                    : "Assign Mechanic"}
                                </label>
                                <select
                                  value={assignedByBooking[b.id] ?? ""}
                                  onChange={(e) =>
                                    setAssignedByBooking((prev) => ({
                                      ...prev,
                                      [b.id]: e.target.value,
                                    }))
                                  }
                                  disabled={isAssignmentLocked}
                                  className="w-full bg-gray-900/70 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500/50"
                                >
                                  <option value="">Unassigned</option>
                                  {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                      {emp.full_name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {b.status === "confirmed" &&
                                !isAssignmentLocked && (
                                  <button
                                    onClick={() =>
                                      handleAction(
                                        b.id,
                                        "confirmed",
                                        assignedByBooking[b.id] || null,
                                      )
                                    }
                                    disabled={actionLoading === b.id}
                                    className="w-full bg-blue-600/20 hover:bg-blue-600 border border-blue-600/40 text-blue-400 hover:text-white text-sm font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
                                  >
                                    Save Assignment
                                  </button>
                                )}
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {b.status === "pending" && (
                      <div className="pt-3 border-t border-white/5 flex gap-2">
                        <button
                          onClick={() =>
                            handleAction(
                              b.id,
                              "confirmed",
                              assignedByBooking[b.id] || null,
                            )
                          }
                          disabled={
                            actionLoading === b.id ||
                            !(assignedByBooking[b.id] || "").trim()
                          }
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-600/40 text-emerald-400 hover:text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
                        >
                          {actionLoading === b.id ? (
                            <svg
                              className="w-4 h-4 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                          ) : (
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleRescheduleProposal(b)}
                          disabled={actionLoading === b.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-600/40 text-indigo-300 hover:text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
                        >
                          Reschedule
                        </button>
                      </div>
                    )}

                    {(b.status === "confirmed" ||
                      b.status === "rescheduled") && (
                      <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {b.status === "rescheduled"
                            ? "Awaiting customer response"
                            : "Confirmed"}
                        </div>
                        <button
                          onClick={() => handleAction(b.id, "done")}
                          disabled={actionLoading === b.id}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-600/40 text-blue-400 hover:text-white text-xs font-semibold py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                        >
                          Mark as Done
                        </button>
                        <button
                          onClick={() => handleRescheduleProposal(b)}
                          disabled={actionLoading === b.id}
                          className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-600/40 text-indigo-300 hover:text-white text-xs font-semibold py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                        >
                          Propose Reschedule
                        </button>
                      </div>
                    )}

                    {b.status === "cancelled" && (
                      <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-red-400 text-sm">
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
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Rejected / Cancelled
                      </div>
                    )}
                    {b.status === "no_show" && (
                      <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-red-300 text-sm">
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
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        No Show
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}

export default ManagerAppointments;