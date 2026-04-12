import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../hooks/useAuth.js";
import ManagerLayout from "./ManagerLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

function ManagerCustomerManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("All Segments");
  const [customers, setCustomers] = useState([]);
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
  const [loading, setLoading] = useState(true);

  const segmentBadge = {
    "High Value": "bg-red-500/20 text-red-400 border-red-500/30",
    Regular: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    New: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "At Risk": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };
  const segmentColors = {
    "High Value": "#ef4444",
    Regular: "#6b7280",
    New: "#3b82f6",
    "At Risk": "#f59e0b",
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token =
          localStorage.getItem("access_token") ||
          sessionStorage.getItem("access_token");
        const res = await axios.get(`${API_BASE}/customers/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const mapped = (Array.isArray(res.data) ? res.data : []).map((c) => ({
          id: c.id,
          name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(),
          email: c.email ?? "",
          phone: c.phone ?? "—",
          vehicles: 0,
          totalSpent: Number(c.total_spent ?? 0),
          visits: Number(c.visits ?? 0),
          segment: c.segment ?? "New",
          satisfaction: c.avg_rating != null ? Number(c.avg_rating) * 20 : 0,
        }));
        setCustomers(mapped);
      } catch (error) {
        console.error("Failed to load manager customers:", error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const totalRevenue = customers.reduce(
    (s, c) => s + Number(c.totalSpent || 0),
    0,
  );
  const highValue = customers.filter((c) => c.segment === "High Value").length;
  const avgSat = customers.length
    ? Math.round(
        customers.reduce((s, c) => s + c.satisfaction, 0) / customers.length,
      )
    : 0;

  const filteredCustomers = customers.filter(
    (c) =>
      (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)) &&
      (segmentFilter === "All Segments" || c.segment === segmentFilter),
  );
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
  } = usePagination({
    items: filteredCustomers,
    pageSize: 10,
    resetDeps: [searchQuery, segmentFilter, customers.length],
  });

  const openCustomerHistory = async (customer) => {
    setSelectedCustomer(customer);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");
      const res = await axios.get(
        `${API_BASE}/api/manager/customers/${customer.id}/history/`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
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
    } catch (error) {
      console.error("Failed to load customer history:", error);
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

  if (loading) {
    return (
      <ManagerLayout title="" subtitle="">
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Customer Management
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Manage customers for San Mateo Rizal branch
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            {
              label: "Total Customers",
              value: customers.length,
              color: "#ef4444",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              ),
            },
            {
              label: "High Value",
              value: highValue,
              color: "#f59e0b",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              ),
            },
            {
              label: "Avg. Satisfaction",
              value: `${avgSat}%`,
              color: "#10b981",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ),
            },
            {
              label: "Total Revenue",
              value: `₱${totalRevenue.toLocaleString()}`,
              color: "#a855f7",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-3 sm:p-5 backdrop-blur-sm hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div
                  className="p-2 sm:p-3 rounded-xl"
                  style={{ backgroundColor: stat.color + "22" }}
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    style={{ color: stat.color }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {stat.icon}
                  </svg>
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-white mb-1 truncate">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 leading-snug">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
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
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </div>
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 cursor-pointer min-w-[160px]"
          >
            {["All Segments", "High Value", "Regular", "New", "At Risk"].map(
              (o) => (
                <option key={o}>{o}</option>
              ),
            )}
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Phone</div>

            <div className="col-span-2">Total Spent</div>
            <div className="col-span-1 text-center">Visits</div>
            <div className="col-span-1">Segment</div>
            <div className="col-span-1 text-center">Rating</div>
            <div className="col-span-1 text-right">Act.</div>
          </div>

          {filteredCustomers.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg">No customers found</p>
              <p className="text-gray-600 text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            paginatedItems.map((customer) => (
              <div
                key={customer.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                {/* Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                  <div className="col-span-3 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor:
                          (segmentColors[customer.segment] || "#6b7280") + "22",
                        color: segmentColors[customer.segment] || "#6b7280",
                      }}
                    >
                      {(customer.name || "?").charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {customer.name}
                      </div>
                      <div className="text-gray-500 text-xs truncate max-w-[130px]">
                        {customer.email}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-gray-400 text-sm">
                    {customer.phone}
                  </div>
                  <div className="col-span-2 text-white font-bold text-sm">
                    ₱{Number(customer.totalSpent || 0).toLocaleString()}
                  </div>
                  <div className="col-span-1 text-center text-gray-400 text-sm">
                    {customer.visits}
                  </div>
                  <div className="col-span-1">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${segmentBadge[customer.segment]}`}
                    >
                      {customer.segment}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <svg
                        className="w-3.5 h-3.5 text-amber-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-bold text-white">
                        {customer.satisfaction}%
                      </span>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => openCustomerHistory(customer)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
                {/* Mobile card */}
                <div className="sm:hidden px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          backgroundColor:
                            (segmentColors[customer.segment] || "#6b7280") +
                            "22",
                          color: segmentColors[customer.segment] || "#6b7280",
                        }}
                      >
                        {(customer.name || "?").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-semibold text-sm truncate">
                          {customer.name}
                        </div>
                        <div className="text-gray-500 text-xs truncate">
                          {customer.email}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${segmentBadge[customer.segment]}`}
                    >
                      {customer.segment}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 pl-10">
                    <span>{customer.phone}</span>
                    <span className="text-white font-bold">
                      ₱{Number(customer.totalSpent || 0).toLocaleString()}
                    </span>
                    <span>{customer.visits} visits</span>
                    <button
                      onClick={() => openCustomerHistory(customer)}
                      className="ml-auto p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
              </div>
            ))
          )}

          {filteredCustomers.length > 0 && (
            <div className="px-4 sm:px-6 py-4">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {startItem}-{endItem}
                </span>{" "}
                of{" "}
                <span className="text-white font-semibold">
                  {filteredCustomers.length}
                </span>{" "}
                customers
              </p>
            </div>
          )}
          <Pagination
            current={currentPage}
            total={totalPages}
            onChange={setCurrentPage}
            className="px-4 sm:px-6 pb-6"
          />
        </div>

        {/* Customer History Modal */}
        {historyOpen && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
              <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-black text-white">
                    Customer Transaction History
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">
                    {selectedCustomer?.name ?? "Customer"} · Branch-processed
                    records only
                  </p>
                </div>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="shrink-0 px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm"
                >
                  Close
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {historyLoading ? (
                  <div className="py-20 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : historyError ? (
                  <div className="py-8 text-center text-red-300">
                    {historyError}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        {
                          label: "Services Availed",
                          value: customerHistory.summary.total_services,
                        },
                        {
                          label: "Product Purchases",
                          value:
                            customerHistory.summary.total_product_purchases,
                        },
                        {
                          label: "Service Amount",
                          value: `₱${Number(customerHistory.summary.total_service_amount || 0).toLocaleString()}`,
                        },
                        {
                          label: "Product Amount",
                          value: `₱${Number(customerHistory.summary.total_product_amount || 0).toLocaleString()}`,
                        },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="bg-gray-800/50 border border-white/10 rounded-xl p-3 sm:p-4"
                        >
                          <p className="text-xs uppercase tracking-wider text-gray-500">
                            {label}
                          </p>
                          <p className="text-lg sm:text-2xl font-black text-white mt-1">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Services table — scrollable on mobile */}
                    <div className="bg-gray-800/40 border border-white/10 rounded-2xl overflow-hidden">
                      <div className="px-4 sm:px-5 py-4 border-b border-white/10">
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          Services Availed
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Includes transaction type: walk-in or appointment
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <div className="min-w-[600px]">
                          <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-white/10">
                            <div className="col-span-2">Date</div>
                            <div className="col-span-3">Service</div>
                            <div className="col-span-2">Source</div>
                            <div className="col-span-2">Branch</div>
                            <div className="col-span-1">Status</div>
                            <div className="col-span-2 text-right">Amount</div>
                          </div>
                          {customerHistory.services.length === 0 ? (
                            <div className="px-5 py-8 text-gray-500 text-sm">
                              No service transactions found for this branch.
                            </div>
                          ) : (
                            customerHistory.services.map((row, idx) => (
                              <div
                                key={`${row.queue_entry_id}-${idx}`}
                                className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/5 text-sm items-center"
                              >
                                <div className="col-span-2 text-gray-400 text-xs">
                                  {row.date
                                    ? String(row.date).slice(0, 10)
                                    : "—"}
                                </div>
                                <div className="col-span-3 text-white font-semibold truncate text-xs sm:text-sm">
                                  {row.service || "—"}
                                </div>
                                <div className="col-span-2">
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-blue-500/15 text-blue-300 border-blue-500/30 capitalize">
                                    {row.transaction_type === "booking"
                                      ? "appointment"
                                      : row.transaction_type}
                                  </span>
                                </div>
                                <div className="col-span-2 text-gray-400 truncate text-xs">
                                  {row.branch || "—"}
                                </div>
                                <div className="col-span-1 text-gray-300 capitalize text-xs">
                                  {row.status || "—"}
                                </div>
                                <div className="col-span-2 text-right text-white font-bold text-xs sm:text-sm">
                                  ₱{Number(row.amount || 0).toLocaleString()}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/40 border border-white/10 rounded-2xl overflow-hidden">
                      <div className="px-4 sm:px-5 py-4 border-b border-white/10">
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          Product Purchases
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Extracted from processed queue transaction notes
                        </p>
                      </div>
                      {customerHistory.products.length === 0 ? (
                        <div className="px-5 py-8 text-gray-500 text-sm">
                          No product purchases found for this branch.
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {customerHistory.products.map((row, idx) => (
                            <div
                              key={`${row.queue_entry_id}-product-${idx}`}
                              className="px-4 sm:px-5 py-4"
                            >
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="text-xs sm:text-sm text-gray-300 min-w-0">
                                  <span className="text-white font-semibold">
                                    {row.date
                                      ? String(row.date).slice(0, 10)
                                      : "—"}
                                  </span>
                                  <span className="mx-2 text-gray-600">•</span>
                                  <span className="capitalize">
                                    {row.transaction_type === "booking"
                                      ? "appointment"
                                      : row.transaction_type}
                                  </span>
                                  <span className="mx-2 text-gray-600">•</span>
                                  <span>{row.branch || "—"}</span>
                                </div>
                                <div className="text-sm font-bold text-emerald-300 shrink-0">
                                  ₱{Number(row.amount || 0).toLocaleString()}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(Array.isArray(row.items)
                                  ? row.items
                                  : []
                                ).map((item, itemIdx) => (
                                  <span
                                    key={`${idx}-${itemIdx}`}
                                    className="px-2.5 py-1 rounded-full text-xs border border-white/15 text-gray-200 bg-white/5"
                                  >
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
    </ManagerLayout>
  );
}

export default ManagerCustomerManagement;