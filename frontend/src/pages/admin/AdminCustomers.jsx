import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

const getToken = () =>
  localStorage.getItem("access_token") ??
  sessionStorage.getItem("access_token");

// ── Segment config ───────────────────────────────────────────────────────────
const SEGMENT_STYLE = {
  "High Value": "bg-red-500/20 text-red-400 border-red-500/30",
  Regular: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  New: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "At Risk": "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const SEGMENT_COLOR = {
  "High Value": "#ef4444",
  Regular: "#6b7280",
  New: "#3b82f6",
  "At Risk": "#f59e0b",
};

const SEGMENTS = ["High Value", "Regular", "New", "At Risk"];

// ── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 animate-pulse items-center">
      <div className="col-span-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-800 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 bg-gray-800 rounded" />
          <div className="h-3 w-36 bg-gray-800 rounded" />
        </div>
      </div>
      <div className="col-span-2 h-3.5 w-24 bg-gray-800 rounded" />
      <div className="col-span-1 h-3.5 w-6 bg-gray-800 rounded mx-auto" />
      <div className="col-span-2 h-3.5 w-20 bg-gray-800 rounded" />
      <div className="col-span-1 h-3.5 w-6 bg-gray-800 rounded mx-auto" />
      <div className="col-span-1 h-6 w-16 bg-gray-800 rounded-full" />
      <div className="col-span-1 h-3.5 w-10 bg-gray-800 rounded mx-auto" />
      <div className="col-span-1" />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("All");

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/customers/`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setCustomers(res.data);
      } catch (err) {
        setError(
          err.response?.status === 401
            ? "Unauthorized — please log in again."
            : "Failed to load customers. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────
  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const name = `${c.first_name} ${c.last_name}`.toLowerCase();
    const matchSearch =
      name.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      String(c.id).includes(q);
    const matchSeg = segmentFilter === "All" || c.segment === segmentFilter;
    return matchSearch && matchSeg;
  });

  const segmentCounts = SEGMENTS.reduce((acc, s) => {
    acc[s] = customers.filter((c) => c.segment === s).length;
    return acc;
  }, {});

  const totalCustomers = customers.length;

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Customers
          </h1>
          <p className="text-gray-400 mt-1">
            Manage customer profiles and relationships
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
              onClick={() => window.location.reload()}
              className="ml-auto text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Segment Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {SEGMENTS.map((seg) => (
            <button
              key={seg}
              onClick={() =>
                setSegmentFilter(segmentFilter === seg ? "All" : seg)
              }
              className={`bg-gray-900/60 border rounded-2xl p-4 backdrop-blur-sm transition-all text-left ${
                segmentFilter === seg
                  ? "border-white/20"
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              <div className="text-2xl font-black text-white mb-1">
                {loading ? (
                  <div className="h-7 w-8 bg-gray-800 rounded animate-pulse" />
                ) : (
                  (segmentCounts[seg] ?? 0)
                )}
              </div>
              <div className="text-xs text-gray-400 font-medium">{seg}</div>
              <div className="text-xs text-gray-600 mt-0.5">
                {loading || totalCustomers === 0
                  ? "—"
                  : `${Math.round(((segmentCounts[seg] ?? 0) / totalCustomers) * 100)}% of total`}
              </div>
              <div className="mt-2 h-1 rounded-full bg-gray-800">
                <div
                  className="h-1 rounded-full transition-all duration-700"
                  style={{
                    width: totalCustomers
                      ? `${((segmentCounts[seg] ?? 0) / totalCustomers) * 100}%`
                      : "0%",
                    backgroundColor: SEGMENT_COLOR[seg],
                  }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
          />
          {segmentFilter !== "All" && (
            <button
              onClick={() => setSegmentFilter("All")}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full hover:bg-red-500/20 transition-all"
            >
              {segmentFilter} ✕
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-1 text-center">Points</div>
            <div className="col-span-2">Total Spent</div>
            <div className="col-span-1 text-center">Visits</div>
            <div className="col-span-1">Segment</div>
            <div className="col-span-1 text-center">Rating</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Body */}
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg">No customers found</p>
              <p className="text-gray-600 text-sm mt-1">
                Try adjusting your search or segment filter
              </p>
            </div>
          ) : (
            filtered.map((customer) => {
              const fullName = `${customer.first_name} ${customer.last_name}`;
              const color = SEGMENT_COLOR[customer.segment] ?? "#6b7280";
              return (
                <div
                  key={customer.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group"
                >
                  {/* Name + email */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ backgroundColor: color + "22", color }}
                      >
                        {customer.first_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">
                          {fullName}
                        </div>
                        <div className="text-gray-500 text-xs truncate max-w-[140px]">
                          {customer.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="col-span-2 text-gray-400 text-sm">
                    {customer.phone || <span className="text-gray-700">—</span>}
                  </div>

                  {/* Loyalty points */}
                  <div className="col-span-1 text-center text-gray-400 text-sm">
                    {customer.loyalty_points ?? 0}
                  </div>

                  {/* Total spent */}
                  <div className="col-span-2 text-white font-bold text-sm">
                    {customer.total_spent > 0 ? (
                      `₱${Number(customer.total_spent).toLocaleString()}`
                    ) : (
                      <span className="text-gray-600 font-normal">₱0</span>
                    )}
                  </div>

                  {/* Visits */}
                  <div className="col-span-1 text-center text-gray-400 text-sm">
                    {customer.visits ?? 0}
                  </div>

                  {/* Segment */}
                  <div className="col-span-1">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${SEGMENT_STYLE[customer.segment] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                    >
                      {customer.segment}
                    </span>
                  </div>

                  {/* Avg rating */}
                  <div className="col-span-1 text-center">
                    {customer.avg_rating != null ? (
                      <div className="flex items-center justify-center gap-1">
                        <svg
                          className="w-3.5 h-3.5 text-amber-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-bold text-white">
                          {customer.avg_rating}/5
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-700 text-xs">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end">
                    <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
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
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {filtered.length}
                </span>{" "}
                of{" "}
                <span className="text-white font-semibold">
                  {customers.length}
                </span>{" "}
                customers
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminCustomers;