import React, { useCallback, useEffect, useMemo, useState } from "react";
import StaffLayout from "./StaffLayout";
import { API_BASE } from "../../hooks/useAuth.js";

function getAuthHeaders() {
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    sessionStorage.getItem("access") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toStatusBadge(status) {
  const key = String(status || "").toLowerCase();
  if (key === "done") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (key === "confirmed") return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  if (key === "pending") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (key === "cancelled") return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  return "bg-gray-500/15 text-gray-300 border-gray-500/30";
}

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/api/staff/dashboard/`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to load staff dashboard (${res.status})`);
      }

      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard.");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard?.stats || {};
  const cards = useMemo(
    () => [
      {
        label: "My Assigned Jobs",
        value: stats.my_assigned_jobs ?? 0,
        hint: `${stats.my_active_jobs ?? 0} active right now`,
        tone: "from-red-500/15 to-red-900/10 border-red-500/20",
      },
      {
        label: "My Completed Jobs",
        value: stats.my_completed_jobs ?? 0,
        hint: `${stats.my_paid_jobs ?? 0} marked as paid`,
        tone: "from-emerald-500/15 to-emerald-900/10 border-emerald-500/20",
      },
      {
        label: "Upcoming Bookings",
        value: stats.my_upcoming_bookings ?? 0,
        hint: `${stats.my_bookings_today ?? 0} scheduled today`,
        tone: "from-blue-500/15 to-blue-900/10 border-blue-500/20",
      },
      {
        label: "My Notifications",
        value: stats.my_unread_notifications ?? 0,
        hint: `${stats.my_notifications_today ?? 0} received today`,
        tone: "from-amber-500/15 to-amber-900/10 border-amber-500/20",
      },
    ],
    [stats],
  );

  return (
    <StaffLayout>
      <div className="min-h-screen -m-8 p-8 bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30">
        <div>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Staff Dashboard</h1>
              <p className="mt-2 text-sm text-gray-300 max-w-2xl">
                Personal staff snapshot for {dashboard?.staff?.name || "your account"}
                {dashboard?.staff?.branch_name ? ` · ${dashboard.staff.branch_name}` : ""}
              </p>
            </div>
            <button
              onClick={loadDashboard}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((k) => (
                <div key={k} className="h-28 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="mb-8 rounded-2xl border border-rose-500/40 bg-rose-900/25 px-4 py-3 text-rose-200 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {cards.map((card) => (
                  <div
                    key={card.label}
                    className={`rounded-2xl border bg-gradient-to-br ${card.tone} p-5 shadow-lg shadow-black/20`}
                  >
                    <p className="text-xs uppercase tracking-wide text-gray-300">{card.label}</p>
                    <p className="mt-2 text-3xl font-black text-white">{card.value}</p>
                    <p className="mt-2 text-sm text-gray-300">{card.hint}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-black/25 backdrop-blur-sm p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">Recent Assigned Jobs</h2>
                      <span className="text-xs text-gray-400">Staff-scoped records</span>
                    </div>
                  </div>

                  {Array.isArray(dashboard?.recent_jobs) && dashboard.recent_jobs.length > 0 ? (
                    <>
                      <div className="space-y-3 block sm:hidden">
                        {dashboard.recent_jobs.map((row) => (
                          <div key={row.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{row.customer_name || "Unknown customer"}</p>
                                <p className="mt-1 text-xs text-gray-400 truncate">{row.service || "No service"}</p>
                              </div>
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toStatusBadge(row.status)}`}>
                                {row.status || "Unknown"}
                              </span>
                            </div>
                            <div className="mt-3 text-xs text-gray-300 flex flex-col gap-1">
                              <span>{row.date ? `${row.date}${row.time ? ` · ${row.time}` : ""}` : "-"}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-400 border-b border-white/10">
                              <th className="py-2 pr-3 font-medium">Customer</th>
                              <th className="py-2 pr-3 font-medium">Service</th>
                              <th className="py-2 pr-3 font-medium">Date</th>
                              <th className="py-2 pr-3 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboard.recent_jobs.map((row) => (
                              <tr key={row.id} className="border-b border-white/5 last:border-b-0">
                                <td className="py-3 pr-3 text-gray-100">{row.customer_name || "-"}</td>
                                <td className="py-3 pr-3 text-gray-300 truncate">{row.service || "-"}</td>
                                <td className="py-3 pr-3 text-gray-300">
                                  {row.date ? `${row.date}${row.time ? ` · ${row.time}` : ""}` : "-"}
                                </td>
                                <td className="py-3 pr-3">
                                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toStatusBadge(row.status)}`}>
                                    {row.status || "Unknown"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">No assigned jobs yet for this staff account.</p>
                  )}
                </section>

                <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/25 backdrop-blur-sm p-5">
                  <h2 className="text-lg font-bold text-white mb-4">Recent Notifications</h2>
                  {Array.isArray(dashboard?.recent_notifications) && dashboard.recent_notifications.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.recent_notifications.map((notice) => (
                        <div key={notice.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-white line-clamp-1">{notice.title}</p>
                            {!notice.is_read && (
                              <span className="text-[10px] uppercase tracking-wide text-amber-300">Unread</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-300 line-clamp-2">{notice.message}</p>
                          <p className="mt-2 text-[11px] text-gray-400">{formatDateTime(notice.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No notifications yet.</p>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
