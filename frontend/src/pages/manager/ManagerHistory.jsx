import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { API_BASE } from "../../hooks/useAuth.js";
import ManagerLayout from "./ManagerLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import MovementLog from "../inventory/InventoryMovementLog.jsx";

const HISTORY_SECTION_KEYS = ["service-history", "inventory-transaction"];

function ManagerHistory() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All Services");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [serviceHistory, setServiceHistory] = useState([]);
  const [activeSection, setActiveSection] = useState("service-history");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (HISTORY_SECTION_KEYS.includes(hash)) {
      setActiveSection(hash);
      return;
    }
    setActiveSection("service-history");
  }, [location.hash]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token =
          localStorage.getItem("access_token") ||
          sessionStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const serviceRes = await axios.get(`${API_BASE}/api/queue/history/`, { headers });
        const mapped = (
          Array.isArray(serviceRes.data) ? serviceRes.data : []
        ).map((row) => ({
          id: `SH-${String(row.id).padStart(3, "0")}`,
          date: row.completed_at || row.queued_at || "",
          customer: row.customer_name || "Unknown",
          vehicle: row.vehicle || "—",
          service: row.service || "—",
          employee: row.assigned_employee?.full_name || "Unassigned",
          duration: "—",
          amount: Number(row.price || 0),
          status: row.status === "done" ? "Completed" : "Skipped",
        }));
        setServiceHistory(mapped);
      } catch (error) {
        console.error("Failed to load manager history:", error);
        setServiceHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const totalRevenue = serviceHistory.reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0,
  );
  const serviceOptions = Array.from(
    new Set(serviceHistory.map((r) => r.service).filter(Boolean)),
  ).sort();
  const filteredHistory = serviceHistory.filter(
    (r) =>
      (r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (serviceFilter === "All Services" || r.service === serviceFilter) &&
      (statusFilter === "All Status" || r.status === statusFilter),
  );
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
  } = usePagination({
    items: filteredHistory,
    pageSize: 10,
    resetDeps: [
      searchQuery,
      serviceFilter,
      statusFilter,
      serviceHistory.length,
    ],
  });
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
            History
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Service and inventory activity for your branch
          </p>
        </div>

        {activeSection === "service-history" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {[
                {
                  label: "Total Services",
                  value: serviceHistory.length,
                  color: "#ef4444",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  ),
                },
                {
                  label: "Total Revenue",
                  value: `₱${totalRevenue.toLocaleString()}`,
                  color: "#3b82f6",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ),
                },
                {
                  label: "Completed",
                  value: serviceHistory.filter((s) => s.status === "Completed")
                    .length,
                  color: "#10b981",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-5 backdrop-blur-sm hover:border-white/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: stat.color + "22" }}
                    >
                      <svg
                        className="w-5 h-5"
                        style={{ color: stat.color }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {stat.icon}
                      </svg>
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
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
                  placeholder="Search by customer, vehicle, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
                />
              </div>
              {[
                {
                  value: serviceFilter,
                  onChange: setServiceFilter,
                  options: ["All Services", ...serviceOptions],
                },
                {
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: ["All Status", "Completed", "Skipped"],
                },
              ].map((sel, i) => (
                <select
                  key={i}
                  value={sel.value}
                  onChange={(e) => sel.onChange(e.target.value)}
                  className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 cursor-pointer min-w-[150px]"
                >
                  {sel.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ))}
            </div>

            <section id="service-history" className="mb-8 scroll-mt-24">
              <div className="mb-4">
                <h2 className="text-xl font-black text-white">
                  Service History
                </h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  Completed and skipped queue entries
                </p>
              </div>
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                {/* Desktop header */}
                <div className="hidden sm:grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-1">Date</div>
                  <div className="col-span-2">Customer</div>
                  <div className="col-span-2">Vehicle</div>
                  <div className="col-span-2">Service</div>
                  <div className="col-span-1">Employee</div>
                  <div className="col-span-1">Amount</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1 text-right">Act.</div>
                </div>

                {filteredHistory.length === 0 ? (
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="text-gray-500 text-lg">No records found</p>
                    <p className="text-gray-600 text-sm mt-1">
                      Try adjusting your search or filters
                    </p>
                  </div>
                ) : (
                  paginatedItems.map((record) => (
                    <div
                      key={record.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Desktop */}
                      <div className="hidden sm:grid grid-cols-12 gap-3 px-6 py-4 items-center">
                        <div className="col-span-1 text-gray-500 text-xs">
                          {record.date ? String(record.date).slice(5, 10) : "—"}
                        </div>
                        <div className="col-span-2 text-white font-semibold text-sm">
                          {record.customer}
                        </div>
                        <div className="col-span-2 text-gray-400 text-sm truncate">
                          {record.vehicle}
                        </div>
                        <div className="col-span-2 text-gray-400 text-sm">
                          {record.service}
                        </div>
                        <div className="col-span-1 text-gray-500 text-xs">
                          {record.employee.split(" ")[0]}
                        </div>

                        <div className="col-span-1 text-white font-bold text-sm">
                          ₱{Number(record.amount || 0).toLocaleString()}
                        </div>
                        <div className="col-span-1">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${record.status === "Completed" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}
                          >
                            {record.status}
                          </span>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {/* Mobile card */}
                      <div className="sm:hidden px-4 py-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-white font-semibold text-sm">
                            {record.customer}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${record.status === "Completed" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}
                          >
                            {record.status}
                          </span>
                        </div>
                        <div className="text-gray-400 text-xs mb-1">
                          {record.service} · {record.vehicle}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>
                            {record.date
                              ? String(record.date).slice(5, 10)
                              : "—"}
                          </span>
                          <span>· {record.employee.split(" ")[0]}</span>
                          <span className="text-white font-bold ml-auto">
                            ₱{Number(record.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {filteredHistory.length > 0 && (
                  <div className="px-4 sm:px-6 py-4">
                    <p className="text-gray-500 text-sm">
                      Showing{" "}
                      <span className="text-white font-semibold">
                        {startItem}-{endItem}
                      </span>{" "}
                      of{" "}
                      <span className="text-white font-semibold">
                        {filteredHistory.length}
                      </span>{" "}
                      records
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
            </section>
          </>
        )}

        {activeSection === "inventory-transaction" && (
          <section id="inventory-transaction" className="scroll-mt-24">
            <MovementLog
              LayoutComponent={({ children }) => <>{children}</>}
              pageTitle="Inventory Transaction"
              subtitle="Stock movements and adjustments"
            />
          </section>
        )}
      </div>
    </ManagerLayout>
  );
}

export default ManagerHistory;
