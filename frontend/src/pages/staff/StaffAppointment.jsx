import React, { useState, useEffect, useCallback } from "react";
import StaffLayout from "./StaffLayout";
import { API_BASE, getAuthHeaders } from "../../hooks/useAuth.js";
import Swal from "sweetalert2";

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

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// FIX 1: Added "done" to statusStyle and statusLabel
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

// ─── Component ────────────────────────────────────────────────────────────────

function StaffAppointments() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.getDate());

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [assignedByBooking, setAssignedByBooking] = useState({});

  const monthName = new Date(year, month).toLocaleString("en-PH", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const fetchBookings = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/api/staff/bookings/`, {
      headers: getAuthHeaders(),
    })
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
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const fetchEmployees = useCallback(() => {
    fetch(`${API_BASE}/api/queue/employees/`, {
      headers: getAuthHeaders(),
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

  // FIX 2: Stats now include "done" count and correctly count all statuses
  const totalThisMonth = bookings.filter((b) => {
    const d = new Date(b.date + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;

  const stats = [
    {
      label: "Total This Month",
      value: totalThisMonth,
      color: "text-white",
      border: "border-white/5",
    },
    {
      label: "Confirmed",
      value: bookings.filter((b) => b.status === "confirmed").length,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    {
      label: "Pending Approval",
      value: bookings.filter((b) => b.status === "pending").length,
      color: "text-amber-400",
      border: "border-amber-500/20",
    },
    {
      label: "Completed",
      value: bookings.filter((b) => b.status === "done").length,
      color: "text-blue-400",
      border: "border-blue-500/20",
    },
  ];

  const handleAction = async (id, newStatus, assignedEmployeeId = null) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/api/staff/bookings/${id}/action/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          assigned_employee_id: assignedEmployeeId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Action failed. Please try again.");
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
      alert(e.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async (booking) => {
    const { value: formValues } = await Swal.fire({
      title: "Propose Reschedule Options",
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Reason for Reschedule <span style="color:#f87171">*</span></label>
            <textarea id="swal-reason" rows="2" maxlength="300" placeholder="e.g. Staff unavailable, equipment maintenance..." class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" style="width:100%"></textarea>
            <p id="swal-reason-err" class="text-red-400 text-xs mt-1 hidden">Please provide a reason (at least 10 characters).</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Option 1 Date <span style="color:#f87171">*</span></label>
            <input id="swal-input1" type="date" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" value="${booking.date}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Option 1 Time (24h) <span style="color:#f87171">*</span></label>
            <input id="swal-input2" type="time" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Option 2 Date (optional)</label>
            <input id="swal-input3" type="date" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Option 2 Time (24h, optional)</label>
            <input id="swal-input4" type="time" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Send Proposal",
      confirmButtonColor: "#3b82f6",
      background: "#111827",
      color: "#fff",
      preConfirm: () => {
        const PROFANITY = [
          "fuck",
          "shit",
          "ass",
          "bitch",
          "bastard",
          "damn",
          "crap",
          "dick",
          "piss",
          "cunt",
          "faggot",
          "nigger",
          "whore",
          "slut",
        ];
        const reason = document.getElementById("swal-reason").value.trim();
        const reasonErr = document.getElementById("swal-reason-err");
        const lowerReason = reason.toLowerCase();
        const hasProfanity = PROFANITY.some((w) => lowerReason.includes(w));

        if (reason.length < 10) {
          reasonErr.textContent =
            "Please provide a reason (at least 10 characters).";
          reasonErr.classList.remove("hidden");
          return false;
        }
        if (hasProfanity) {
          reasonErr.textContent =
            "Please keep your message professional — no profanity.";
          reasonErr.classList.remove("hidden");
          return false;
        }
        reasonErr.classList.add("hidden");

        return {
          reason,
          date1: document.getElementById("swal-input1").value,
          time1: document.getElementById("swal-input2").value,
          date2: document.getElementById("swal-input3").value,
          time2: document.getElementById("swal-input4").value,
        };
      },
    });

    if (formValues) {
      if (!formValues.date1 || !formValues.time1) {
        Swal.fire({
          icon: "error",
          title: "Missing info",
          text: "Option 1 date and time are required.",
          background: "#111827",
          color: "#fff",
        });
        return;
      }

      const options = [
        { date: formValues.date1, time: toApiTime(formValues.time1) },
      ];
      if (formValues.date2 && formValues.time2) {
        options.push({
          date: formValues.date2,
          time: toApiTime(formValues.time2),
        });
      }
      const rescheduleReason = formValues.reason;

      setActionLoading(booking.id);
      try {
        const res = await fetch(
          `${API_BASE}/api/staff/bookings/${booking.id}/action/`,
          {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              action: "propose_reschedule",
              options,
              reason: rescheduleReason,
            }),
          },
        );
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setBookings((prev) =>
          prev.map((b) => (b.id === updated.id ? updated : b)),
        );
        Swal.fire({
          icon: "success",
          title: "Proposal Sent",
          text: "Reschedule options were sent to the customer.",
          timer: 2000,
          showConfirmButton: false,
          background: "#111827",
          color: "#fff",
        });
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Failed to send reschedule proposal. Please try again.",
          background: "#111827",
          color: "#fff",
        });
      } finally {
        setActionLoading(null);
      }
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

  // FIX 3: Calendar dot color now handles "done" status
  const dotColor = (s, isSelected) => {
    if (isSelected) return "bg-white/70";
    if (s === "confirmed") return "bg-emerald-400";
    if (s === "pending") return "bg-amber-400";
    if (s === "done") return "bg-blue-400";
    return "bg-red-400"; // cancelled
  };

  return (
    <StaffLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Appointments
            </h1>
            <p className="text-gray-400 mt-1">View appointments</p>
          </div>
        </div>

        {/* FIX 2: Stats grid now 4 columns including "Completed" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, color, border }) => (
            <div
              key={label}
              className={`bg-gray-900/60 ${border} border rounded-2xl p-4 backdrop-blur-sm`}
            >
              <div className={`text-2xl font-black ${color} mb-1`}>{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
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
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
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
                },
              )}
            </div>

            {/* FIX 3: Legend now includes "done" */}
            <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
              {[
                { color: "bg-emerald-400", label: "Confirmed" },
                { color: "bg-amber-400", label: "Pending" },
                { color: "bg-blue-400", label: "Done" },
                { color: "bg-red-400", label: "Cancelled" },
              ].map(({ color, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <div className={`w-2 h-2 rounded-full ${color}`} /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Appointments Panel */}
          <div className="lg:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-lg font-black text-white">
                {formatDate(selectedISO)}
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {loading
                  ? "Loading..."
                  : `${dayBookings.length} appointment${dayBookings.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-600/10 border border-red-600/25 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}

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

            {!loading && !error && dayBookings.length === 0 && (
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

            {!loading && !error && dayBookings.length > 0 && (
              <div className="space-y-4 max-h-[55vh] sm:max-h-[60vh] lg:max-h-[65vh] overflow-y-auto pr-1">
                {dayBookings.map((b) => {
                  const isWalkIn = b.notes?.toLowerCase().includes("walk-in");
                  // FIX 1: icon bg also handles "done"
                  const iconBg =
                    b.status === "confirmed"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : b.status === "pending"
                        ? "bg-amber-500/20 text-amber-400"
                        : b.status === "done"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-red-500/20 text-red-400";
                  return (
                    <div
                      key={b.id}
                      className="bg-gray-800/60 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${iconBg}`}
                          >
                            {(b.service || "?").charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-black text-base">
                              {b.customer_name || "Unknown Customer"}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {b.service} · {b.time}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {isWalkIn && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-500/20 text-blue-400 border-blue-500/30">
                              Walk-in
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle[b.status] || statusStyle.pending}`}
                          >
                            {statusLabel[b.status] || b.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-4">
                        {[
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
                              <span className="text-gray-400 truncate">
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

                      {b.reschedule_request_reason &&
                        (b.reschedule_status == null ||
                          b.reschedule_status === "none") && (
                          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2.5 flex items-start gap-2">
                            <svg
                              className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <p className="text-amber-400 text-xs font-bold mb-0.5">
                                ⚠ Customer Requested Reschedule
                              </p>
                              <p className="text-amber-300/80 text-xs">
                                {b.reschedule_request_reason}
                              </p>
                            </div>
                          </div>
                        )}

                      {(b.status === "pending" || b.status === "confirmed") && (
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                          {(() => {
                            const isAssignmentLocked =
                              b.status === "confirmed" &&
                              Boolean(b.assigned_employee_id);
                            return (
                              <>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    {isAssignmentLocked
                                      ? "Assigned Employee (Locked)"
                                      : "Assign Employee"}
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
                                <div className="flex items-end">
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
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* FIX 1: Status action footer handles all 4 statuses */}
                      {b.status === "pending" && (
                        <div className="flex gap-2 pt-3 border-t border-white/5">
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
                            onClick={() => handleReschedule(b)}
                            disabled={actionLoading === b.id}
                            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-600/40 text-indigo-300 hover:text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
                          >
                            Reschedule
                          </button>
                        </div>
                      )}
                      {b.status === "rescheduled" && (
                        <div className="pt-3 border-t border-white/5 space-y-2">
                          <div className="flex items-center gap-2 text-indigo-400 text-sm">
                            <svg
                              className="w-4 h-4 shrink-0"
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
                            Awaiting customer response — no action needed
                          </div>
                          {b.reschedule_note && (
                            <div className="bg-indigo-600/8 border border-indigo-600/20 rounded-lg px-3 py-2">
                              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
                                Reason Sent to Customer
                              </p>
                              <p className="text-indigo-300 text-xs">
                                {b.reschedule_note}
                              </p>
                            </div>
                          )}
                          {b.reschedule_options?.length > 0 && (
                            <div className="bg-indigo-600/8 border border-indigo-600/20 rounded-lg px-3 py-2 space-y-1">
                              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                Proposed Options
                              </p>
                              {b.reschedule_options.map((opt, i) => (
                                <p key={i} className="text-indigo-300 text-xs">
                                  {typeof opt === "object"
                                    ? `${opt.date} @ ${opt.time}`
                                    : String(opt)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {b.status === "confirmed" && (
                        <div className="pt-3 border-t border-white/5 space-y-2">
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
                            Confirmed
                          </div>
                          <button
                            onClick={() => handleReschedule(b)}
                            disabled={actionLoading === b.id}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-600/40 text-indigo-300 hover:text-white text-xs font-semibold py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                          >
                            Propose Reschedule
                          </button>
                        </div>
                      )}
                      {/* FIX 1: "done" status footer */}
                      {b.status === "done" && (
                        <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-blue-400 text-sm">
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
                              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                            />
                          </svg>
                          Service Completed
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}

export default StaffAppointments;