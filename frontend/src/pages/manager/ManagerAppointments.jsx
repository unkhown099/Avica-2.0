import React, { useState, useEffect, useCallback } from "react";
import ManagerLayout from "./ManagerLayout";

// ─── Utilities ────────────────────────────────────────────────────────────────

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

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

const statusStyle = {
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabel = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
};

// ─── Component ────────────────────────────────────────────────────────────────

function ManagerAppointments() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(now.getDate());

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // booking id being actioned
  const [employees, setEmployees] = useState([]);
  const [assignedByBooking, setAssignedByBooking] = useState({});

  const monthName = new Date(year, month).toLocaleString("en-PH", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  // Fetch ALL bookings for this month
  const fetchBookings = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/staff/bookings/`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data) =>
      {
        const rows = Array.isArray(data) ? data : (data.results ?? []);
        setBookings(rows);
        setAssignedByBooking(
          rows.reduce((acc, row) => {
            acc[row.id] = row.assigned_employee_id ? String(row.assigned_employee_id) : "";
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
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue/employees/`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setEmployees(Array.isArray(data) ? data : (data.results ?? [])))
      .catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Bookings for selected date
  const selectedISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
  const dayBookings = bookings.filter((b) => b.date === selectedISO);

  // Dots per calendar day
  const dotsForDay = (day) => {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return bookings.filter((b) => b.date === iso).map((b) => b.status);
  };

  // Stats
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;

  // Approve / Reject
  const handleAction = async (id, newStatus, assignedEmployeeId = null) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/staff/bookings/${id}/action/`, {
        method: "PATCH",
        headers: authHeaders(),
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
        [id]: updated.assigned_employee_id ? String(updated.assigned_employee_id) : "",
      }));
    } catch (e) {
      alert(e.message || "Action failed. Please try again.");
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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Appointments
          </h1>
          <p className="text-gray-400 mt-1">
            Review and approve customer bookings
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
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
              {/* Empty cells for first week offset */}
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
                              className={`w-1 h-1 rounded-full ${
                                isSelected
                                  ? "bg-white/70"
                                  : s === "confirmed"
                                    ? "bg-emerald-400"
                                    : s === "pending"
                                      ? "bg-amber-400"
                                      : "bg-red-400"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                },
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />{" "}
                Confirmed
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-amber-400" /> Pending
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-red-400" /> Cancelled
              </div>
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

            {/* Error */}
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

            {/* Loading */}
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

            {/* Empty */}
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

            {/* Booking cards */}
            {!loading && !error && dayBookings.length > 0 && (
              <div className="space-y-4">
                {dayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-gray-800/60 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                            b.status === "confirmed"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : b.status === "pending"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
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
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusStyle[b.status] || statusStyle.pending}`}
                      >
                        {statusLabel[b.status] || b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
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
                        <div className="flex items-end">
                          {b.status === "confirmed" && !isAssignmentLocked && (
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

                    {/* Action buttons — only show for pending */}
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
                          disabled={actionLoading === b.id || !(assignedByBooking[b.id] || "").trim()}
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
                      </div>
                    )}

                    {b.status === "confirmed" && (
                      <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-emerald-400 text-sm">
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
                        Approved
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