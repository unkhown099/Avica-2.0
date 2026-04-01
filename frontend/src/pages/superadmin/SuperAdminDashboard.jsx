import { useState, useEffect } from "react";
import { API_BASE } from "../../hooks/useAuth.js";
import SuperAdminLayout from "./SuperAdminLayout.jsx";

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, accentBg, accentText, border, sub }) {
  return (
    <div
      className={`bg-gray-900/60 border ${border} rounded-2xl p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${accentBg} ${accentText} p-3 rounded-xl`}>{icon}</div>
      </div>
      <div className="text-2xl font-black text-white mb-1 truncate">{value ?? "—"}</div>
      <div className="text-sm text-gray-500 mb-1 truncate">{title}</div>
      {sub && <div className={`text-xs font-semibold ${accentText} truncate`}>{sub}</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-800" />
      </div>
      <div className="h-7 w-24 bg-gray-800 rounded mb-2" />
      <div className="h-4 w-32 bg-gray-800 rounded" />
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, d2 }) => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d2} />}
  </svg>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const token =
        localStorage.getItem("access_token") ??
        sessionStorage.getItem("access_token");

      const res = await fetch(`${API_BASE}/super-admin/dashboard/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
      setData(await res.json());
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ── Stat card configs ────────────────────────────────────────────────────
  const userCards = [
    {
      title: "Total Users",
      value: data ? Number(data.users.total).toLocaleString() : null,
      accentBg: "bg-red-500/10",
      accentText: "text-red-400",
      border: "border-red-500/20",
      icon: <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    },
    {
      title: "Staff Accounts",
      value: data ? Number(data.users.staff).toLocaleString() : null,
      accentBg: "bg-yellow-500/10",
      accentText: "text-yellow-400",
      border: "border-yellow-500/20",
      icon: <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    },
    {
      title: "Customer Accounts",
      value: data ? Number(data.users.customers).toLocaleString() : null,
      accentBg: "bg-green-500/10",
      accentText: "text-green-400",
      border: "border-green-500/20",
      icon: <Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    },
  ];

  const operationCards = [
    {
      title: "Branches",
      value: data ? Number(data.branches).toLocaleString() : null,
      accentBg: "bg-blue-500/10",
      accentText: "text-blue-400",
      border: "border-blue-500/20",
      icon: <Icon d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />,
    },
    {
      title: "Services",
      value: data ? Number(data.services).toLocaleString() : null,
      accentBg: "bg-purple-500/10",
      accentText: "text-purple-400",
      border: "border-purple-500/20",
      icon: <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    },
    {
      title: "Active Queue",
      value: data ? Number(data.active_queue_entries).toLocaleString() : null,
      accentBg: "bg-orange-500/10",
      accentText: "text-orange-400",
      border: "border-orange-500/20",
      icon: <Icon d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h9l2-2zm0 0l2-5h3l2 5v1h-2m-5 0H9" />,
    },
    {
      title: "Low Stock Items",
      value: data ? Number(data.low_stock_items).toLocaleString() : null,
      sub: "Needs attention",
      accentBg: "bg-red-500/10",
      accentText: "text-red-400",
      border: "border-red-500/20",
      icon: <Icon d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />,
    },
  ];

  const bookingCards = [
    {
      title: "Total Bookings",
      value: data ? Number(data.bookings.total).toLocaleString() : null,
      accentBg: "bg-red-500/10",
      accentText: "text-red-400",
      border: "border-red-500/20",
      icon: <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    },
    {
      title: "Bookings Today",
      value: data ? Number(data.bookings.today).toLocaleString() : null,
      accentBg: "bg-green-500/10",
      accentText: "text-green-400",
      border: "border-green-500/20",
      icon: <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    },
    {
      title: "Bookings This Month",
      value: data ? Number(data.bookings.this_month).toLocaleString() : null,
      accentBg: "bg-yellow-500/10",
      accentText: "text-yellow-400",
      border: "border-yellow-500/20",
      icon: <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    },
  ];

  const revenueCards = [
    {
      title: "Total Revenue",
      value: data ? `₱${Number(data.revenue.total).toLocaleString()}` : null,
      sub: "From completed bookings",
      accentBg: "bg-green-500/10",
      accentText: "text-green-400",
      border: "border-green-500/20",
      icon: <Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    {
      title: "Revenue This Month",
      value: data ? `₱${Number(data.revenue.this_month).toLocaleString()}` : null,
      sub: "From completed bookings",
      accentBg: "bg-green-500/10",
      accentText: "text-green-400",
      border: "border-green-500/20",
      icon: <Icon d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SuperAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-3 sm:p-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              Full system overview — all branches, users, and operations.
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 transition-all text-sm font-semibold w-fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Error Banner ────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4">
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button
              onClick={fetchDashboard}
              className="text-red-400 hover:text-red-300 text-sm font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Users Section ───────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">
            Users
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : userCards.map((card, i) => <StatCard key={i} {...card} />)}
          </div>
        </section>

        {/* ── Operations Section ──────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">
            Operations
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : operationCards.map((card, i) => <StatCard key={i} {...card} />)}
          </div>
        </section>

        {/* ── Bookings Section ────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">
            Bookings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : bookingCards.map((card, i) => <StatCard key={i} {...card} />)}
          </div>
        </section>

        {/* ── Revenue Section ─────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">
            Revenue
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading
              ? Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
              : revenueCards.map((card, i) => <StatCard key={i} {...card} />)}
          </div>
        </section>

        {/* ── Staff by Role Table ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">
            Staff by Role
          </h2>
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            {/* Table header */}
            <div className="grid grid-cols-2 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
              <div>Role</div>
              <div className="text-right">Count</div>
            </div>

            {/* Table rows */}
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-white/5 animate-pulse"
                >
                  <div className="h-4 w-28 bg-gray-800 rounded" />
                  <div className="h-4 w-8 bg-gray-800 rounded ml-auto" />
                </div>
              ))
            ) : !data?.staff_by_role?.length ? (
              <div className="px-6 py-10 text-center text-gray-500 text-sm">
                No staff data available.
              </div>
            ) : (
              data.staff_by_role.map((r) => (
                <div
                  key={r.role}
                  className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="text-white font-semibold text-sm">{r.role}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-red-400 font-bold text-sm">{r.count}</span>
                  </div>
                </div>
              ))
            )}

            {/* Table footer */}
            {!loading && data?.staff_by_role?.length > 0 && (
              <div className="px-6 py-3 flex justify-between items-center">
                <span className="text-gray-500 text-xs">
                  {data.staff_by_role.length} role{data.staff_by_role.length !== 1 ? "s" : ""}
                </span>
                <span className="text-gray-500 text-xs">
                  Total:{" "}
                  <span className="text-white font-bold">
                    {data.staff_by_role.reduce((s, r) => s + r.count, 0)}
                  </span>{" "}
                  staff
                </span>
              </div>
            )}
          </div>
        </section>

      </div>
    </SuperAdminLayout>
  );
}