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

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
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
        accentBg: "bg-red-500/10",
        accentText: "text-red-400",
        border: "border-red-500/20",
        icon: (
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
      },
      {
        label: "My Completed Jobs",
        value: stats.my_completed_jobs ?? 0,
        hint: `${stats.my_paid_jobs ?? 0} marked as paid`,
        accentBg: "bg-emerald-500/10",
        accentText: "text-emerald-400",
        border: "border-emerald-500/20",
        icon: (
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      },
      {
        label: "Upcoming Bookings",
        value: stats.my_upcoming_bookings ?? 0,
        hint: `${stats.my_bookings_today ?? 0} scheduled today`,
        accentBg: "bg-red-500/10",
        accentText: "text-red-400",
        border: "border-red-500/20",
        icon: (
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        label: "My Notifications",
        value: stats.my_unread_notifications ?? 0,
        hint: `${stats.my_notifications_today ?? 0} received today`,
        accentBg: "bg-amber-500/10",
        accentText: "text-amber-400",
        border: "border-amber-500/20",
        icon: (
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
      },
    ],
    [stats],
  );

  const analytics = dashboard?.analytics || {};
  const recentNotifications = Array.isArray(dashboard?.recent_notifications) ? dashboard.recent_notifications : [];
  const earningsPerHour = useMemo(() => {
    const rows = Array.isArray(analytics?.earnings_per_hour) ? analytics.earnings_per_hour : [];
    const normalized = rows.map((row) => {
      const hourLabel = String(row?.hour || "00:00");
      const hour = Number(hourLabel.split(":")[0] || 0);
      const value = Number(row?.value ?? 0);
      return {
        hour,
        hourLabel,
        shortLabel: `${String(hour).padStart(2, "0")}:00`,
        value,
      };
    });

    const nonZero = normalized.filter((row) => row.value > 0);
    if (nonZero.length === 0) return normalized.slice(8, 18); // default visible window
    return nonZero;
  }, [analytics?.earnings_per_hour]);

  const earningsHourMax = useMemo(
    () => Math.max(1, ...earningsPerHour.map((row) => row.value)),
    [earningsPerHour],
  );

  const dailyRevenueTrend = useMemo(() => {
    const rows = Array.isArray(analytics?.daily_revenue_trend) ? analytics.daily_revenue_trend : [];
    return rows.map((row) => ({
      date: row?.date,
      label: String(row?.label || "-"),
      value: Number(row?.value ?? 0),
    }));
  }, [analytics?.daily_revenue_trend]);

  const dailyRevenueMax = useMemo(
    () => Math.max(1, ...dailyRevenueTrend.map((row) => row.value)),
    [dailyRevenueTrend],
  );

  const dailyRevenuePoints = useMemo(() => {
    if (!dailyRevenueTrend.length) return [];
    const maxVal = Math.max(1, ...dailyRevenueTrend.map((row) => row.value));
    return dailyRevenueTrend.map((row, index) => {
      const x = dailyRevenueTrend.length === 1 ? 50 : (index / (dailyRevenueTrend.length - 1)) * 100;
      const y = 100 - (row.value / maxVal) * 100;
      return { ...row, x, y };
    });
  }, [dailyRevenueTrend]);

  const dailyRevenuePolyline = useMemo(
    () => dailyRevenuePoints.map((point) => `${point.x},${point.y}`).join(" "),
    [dailyRevenuePoints],
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
                <div key={k} className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-5 animate-pulse">
                  <div className="flex justify-between mb-2 sm:mb-4">
                    <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gray-800" />
                  </div>
                  <div className="h-5 sm:h-7 w-16 sm:w-24 bg-gray-800 rounded mb-1 sm:mb-2" />
                  <div className="h-2 sm:h-4 w-20 sm:w-32 bg-gray-800 rounded" />
                </div>
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
                    className={`bg-gray-900/60 border ${card.border} rounded-xl sm:rounded-2xl p-3 sm:p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}
                  >
                    <div className="flex items-start justify-between mb-2 sm:mb-4">
                      <div className={`${card.accentBg} ${card.accentText} p-1.5 sm:p-3 rounded-lg sm:rounded-xl`}>{card.icon}</div>
                    </div>
                    <div className="text-lg sm:text-2xl font-black text-white mb-0.5 sm:mb-1 truncate">{card.value ?? "-"}</div>
                    <div className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1 truncate">{card.label}</div>
                    <div className={`text-[10px] sm:text-xs font-semibold ${card.accentText} truncate`}>{card.hint}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-black/25 backdrop-blur-sm p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">Performance Graphs</h2>
                      <span className="text-xs text-gray-400">Revenue analytics for your assigned jobs</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">Earnings per Hour</h3>
                        <span className="text-[11px] text-emerald-300">Peak P{formatMoney(earningsHourMax)}</span>
                      </div>
                      {earningsPerHour.some((row) => row.value > 0) ? (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {earningsPerHour.map((row) => (
                            <div key={row.hourLabel}>
                              <div className="mb-1 flex items-center justify-between text-[11px]">
                                <span className="text-gray-300">{row.shortLabel}</span>
                                <span className="text-emerald-300">P{formatMoney(row.value)}</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                                  style={{ width: `${Math.max(4, Math.round((row.value / earningsHourMax) * 100))}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center text-xs text-gray-500">
                          No paid transactions yet for hourly earnings.
                        </div>
                      )}
                    </article>

                    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">Daily Revenue Trend</h3>
                        <span className="text-[11px] text-red-300">Max P{formatMoney(dailyRevenueMax)}</span>
                      </div>
                      {dailyRevenueTrend.length > 0 ? (
                        <>
                          <div className="h-40 rounded-lg bg-gray-900/70 border border-white/5 p-2">
                            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none" role="img" aria-label="Daily revenue trend graph">
                              <polyline
                                points={dailyRevenuePolyline}
                                fill="none"
                                stroke="rgb(220 38 38)"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                              />
                              {dailyRevenuePoints.map((point) => (
                                <circle key={point.date || point.label} cx={point.x} cy={point.y} r="2.2" fill="rgb(248 113 113)" />
                              ))}
                            </svg>
                          </div>
                          <div className="mt-3 grid grid-cols-7 gap-1 text-[10px]">
                            {dailyRevenueTrend.map((row) => (
                              <div key={row.date || row.label} className="text-center">
                                <p className="text-gray-500 truncate">{row.label}</p>
                                <p className="text-red-300 font-semibold truncate">P{formatMoney(row.value)}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="h-40 flex items-center justify-center text-xs text-gray-500">
                          No revenue trend data available.
                        </div>
                      )}
                    </article>
                  </div>
                </section>

                <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/25 backdrop-blur-sm p-5">
                  <h2 className="text-lg font-bold text-white mb-4">Recent Notifications</h2>
                  {recentNotifications.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {recentNotifications.map((notice) => (
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

      {/* ServiceChatModal removed - Restricted to Employee role only */}
    </StaffLayout>
  );
}
