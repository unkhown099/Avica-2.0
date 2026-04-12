import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { API_BASE } from "../../hooks/useAuth.js";
import axios from "axios";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

const getToken = () =>
  localStorage.getItem("access_token") ??
  sessionStorage.getItem("access_token");

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

// ── Mobile customer card ──────────────────────────────────────────────────────
function CustomerCard({ customer, onAction }) {
  const fullName = `${customer.first_name} ${customer.last_name}`;
  const color = SEGMENT_COLOR[customer.segment] ?? "#6b7280";
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: color + "22", color }}
          >
            {customer.first_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{fullName}</div>
            <div className="text-gray-500 text-xs truncate max-w-[160px]">
              {customer.email}
            </div>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${SEGMENT_STYLE[customer.segment] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
        >
          {customer.segment}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/5 rounded-xl py-2">
          <div className="text-white font-bold text-sm">
            {customer.loyalty_points ?? 0}
          </div>

        </div>
        <div className="bg-white/5 rounded-xl py-2">
          <div className="text-white font-bold text-sm">
            {customer.total_spent > 0
              ? `₱${Number(customer.total_spent).toLocaleString()}`
              : "₱0"}
          </div>
          <div className="text-gray-500 text-[10px] mt-0.5">Spent</div>
        </div>
        <div className="bg-white/5 rounded-xl py-2">
          <div className="text-white font-bold text-sm">
            {customer.visits ?? 0}
          </div>
          <div className="text-gray-500 text-[10px] mt-0.5">Visits</div>
        </div>
      </div>
      {customer.avg_rating != null && (
        <div className="flex items-center gap-1 mt-2">
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
      )}
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => onAction?.(customer)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all"
        >
          Action
        </button>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 animate-pulse items-center">
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

function SkeletonCard() {
  return (
    <div className="md:hidden bg-gray-900/60 border border-white/5 rounded-2xl p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-800 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 bg-gray-800 rounded" />
            <div className="h-3 w-36 bg-gray-800 rounded" />
          </div>
        </div>
        <div className="h-6 w-16 bg-gray-800 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("All");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [customerHistory, setCustomerHistory] = useState({
    summary: {
      total_services: 0,
      total_product_purchases: 0,
      total_service_amount: 0,
      total_product_amount: 0,
      total_transactions: 0,
    },
    services: [],
    products: [],
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${API_BASE}/customers/`, {
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

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
  } = usePagination({
    items: filtered,
    pageSize: 10,
    resetDeps: [searchQuery, segmentFilter, customers.length],
  });

  const segmentCounts = SEGMENTS.reduce((acc, s) => {
    acc[s] = customers.filter((c) => c.segment === s).length;
    return acc;
  }, {});

  const openCustomerHistory = async (customer) => {
    setSelectedCustomer(customer);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const res = await axios.get(
        `${API_BASE}/api/admin/customers/${customer.id}/history/`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );

      setCustomerHistory({
        summary: res.data?.summary ?? {
          total_services: 0,
          total_product_purchases: 0,
          total_service_amount: 0,
          total_product_amount: 0,
          total_transactions: 0,
        },
        services: Array.isArray(res.data?.services) ? res.data.services : [],
        products: Array.isArray(res.data?.products) ? res.data.products : [],
      });
    } catch (err) {
      console.error("Failed to load admin customer history:", err);
      setHistoryError("Failed to load customer history.");
      setCustomerHistory({
        summary: {
          total_services: 0,
          total_product_purchases: 0,
          total_service_amount: 0,
          total_product_amount: 0,
          total_transactions: 0,
        },
        services: [],
        products: [],
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const totalCustomers = customers.length;

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Customers
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Manage customer profiles and relationships
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
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
              className="ml-auto text-xs font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Segment Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {SEGMENTS.map((seg) => (
            <button
              key={seg}
              onClick={() =>
                setSegmentFilter(segmentFilter === seg ? "All" : seg)
              }
              className={`bg-gray-900/60 border rounded-2xl p-3 sm:p-4 backdrop-blur-sm transition-all text-left ${segmentFilter === seg ? "border-white/20" : "border-white/5 hover:border-white/10"}`}
            >
              <div className="text-xl sm:text-2xl font-black text-white mb-1">
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
                  : `${Math.round(((segmentCounts[seg] ?? 0) / totalCustomers) * 100)}%`}
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
            className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all text-sm"
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

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3 mb-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-gray-500">No customers found</p>
            </div>
          ) : (
            paginatedItems.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} onAction={openCustomerHistory} />
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Phone</div>
     
            <div className="col-span-2">Total Spent</div>
            <div className="col-span-1 text-center">Visits</div>
            <div className="col-span-1">Segment</div>
            <div className="col-span-1 text-center">Rating</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

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
            paginatedItems.map((customer) => {
              const fullName = `${customer.first_name} ${customer.last_name}`;
              const color = SEGMENT_COLOR[customer.segment] ?? "#6b7280";
              return (
                <div
                  key={customer.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                >
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
                  <div className="col-span-2 text-gray-400 text-sm">
                    {customer.phone || <span className="text-gray-700">—</span>}
                  </div>

                  <div className="col-span-2 text-white font-bold text-sm">
                    {customer.total_spent > 0 ? (
                      `₱${Number(customer.total_spent).toLocaleString()}`
                    ) : (
                      <span className="text-gray-600 font-normal">₱0</span>
                    )}
                  </div>
                  <div className="col-span-1 text-center text-gray-400 text-sm">
                    {customer.visits ?? 0}
                  </div>
                  <div className="col-span-1">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${SEGMENT_STYLE[customer.segment] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                    >
                      {customer.segment}
                    </span>
                  </div>
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
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => openCustomerHistory(customer)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="View complete customer history"
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
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {!loading && filtered.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {startItem}-{endItem}
                </span>{" "}
                of{" "}
                <span className="text-white font-semibold">
                  {filtered.length}
                </span>{" "}
                customers
              </p>
            </div>
          )}
          {!loading && (
            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
              className="px-6 pb-6"
            />
          )}
        </div>

        {/* Mobile pagination */}
        {!loading && filtered.length > 0 && (
          <div className="md:hidden mt-2">
            <p className="text-gray-500 text-sm mb-3">
              Showing{" "}
              <span className="text-white font-semibold">
                {startItem}-{endItem}
              </span>{" "}
              of{" "}
              <span className="text-white font-semibold">
                {filtered.length}
              </span>
            </p>
            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}

        {historyOpen && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
              <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Customer Transaction History</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`.trim() : "Customer"} · All branches
                  </p>
                </div>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  Close
                </button>
              </div>

              <div className="p-6 space-y-6">
                {historyLoading ? (
                  <div className="py-20 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : historyError ? (
                  <div className="py-8 text-center text-red-300">{historyError}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500">Services Availed</p>
                        <p className="text-2xl font-black text-white mt-1">{customerHistory.summary.total_services}</p>
                      </div>
                      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500">Product Purchases</p>
                        <p className="text-2xl font-black text-white mt-1">{customerHistory.summary.total_product_purchases}</p>
                      </div>
                      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500">Service Amount</p>
                        <p className="text-2xl font-black text-white mt-1">₱{Number(customerHistory.summary.total_service_amount || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500">Product Amount</p>
                        <p className="text-2xl font-black text-white mt-1">₱{Number(customerHistory.summary.total_product_amount || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="bg-gray-800/40 border border-white/10 rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-white/10">
                        <h3 className="text-lg font-bold text-white">Services Availed</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Includes transaction type: walk-in or appointment</p>
                      </div>
                      <div className="overflow-x-auto">
                        <div className="min-w-[900px]">
                          <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-white/10">
                            <div className="col-span-2">Date</div>
                            <div className="col-span-3">Service</div>
                            <div className="col-span-2">Source</div>
                            <div className="col-span-2">Branch</div>
                            <div className="col-span-1">Status</div>
                            <div className="col-span-2 text-right">Amount</div>
                          </div>
                          {customerHistory.services.length === 0 ? (
                            <div className="px-5 py-8 text-gray-500 text-sm">No service transactions found.</div>
                          ) : (
                            customerHistory.services.map((row, idx) => (
                              <div key={`${row.queue_entry_id}-${idx}`} className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/5 text-sm items-center">
                                <div className="col-span-2 text-gray-400">{row.date ? String(row.date).slice(0, 10) : "—"}</div>
                                <div className="col-span-3 text-white font-semibold truncate">{row.service || "—"}</div>
                                <div className="col-span-2">
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-blue-500/15 text-blue-300 border-blue-500/30 capitalize">
                                    {row.transaction_type === "booking" ? "appointment" : row.transaction_type}
                                  </span>
                                </div>
                                <div className="col-span-2 text-gray-400 truncate">{row.branch || "—"}</div>
                                <div className="col-span-1 text-gray-300 capitalize">{row.status || "—"}</div>
                                <div className="col-span-2 text-right text-white font-bold">₱{Number(row.amount || 0).toLocaleString()}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/40 border border-white/10 rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-white/10">
                        <h3 className="text-lg font-bold text-white">Product Purchases</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Extracted from processed queue transaction notes</p>
                      </div>
                      {customerHistory.products.length === 0 ? (
                        <div className="px-5 py-8 text-gray-500 text-sm">No product purchases found.</div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {customerHistory.products.map((row, idx) => (
                            <div key={`${row.queue_entry_id}-product-${idx}`} className="px-5 py-4">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="text-sm text-gray-300">
                                  <span className="text-white font-semibold">{row.date ? String(row.date).slice(0, 10) : "—"}</span>
                                  <span className="mx-2 text-gray-600">•</span>
                                  <span className="capitalize">{row.transaction_type === "booking" ? "appointment" : row.transaction_type}</span>
                                  <span className="mx-2 text-gray-600">•</span>
                                  <span>{row.branch || "—"}</span>
                                </div>
                                <div className="text-sm font-bold text-emerald-300">₱{Number(row.amount || 0).toLocaleString()}</div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(Array.isArray(row.items) ? row.items : []).map((item, itemIdx) => (
                                  <span key={`${idx}-${itemIdx}`} className="px-2.5 py-1 rounded-full text-xs border border-white/15 text-gray-200 bg-white/5">
                                    {item.name} x{item.quantity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminCustomers;