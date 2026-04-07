import React, { useState, useEffect, useCallback } from "react";
import InventoryLayout from "./InventoryLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import { useAuth, API_BASE } from "../../hooks/useAuth.js";

const TYPE_STYLES = {
  create: {
    label: "Created",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/20",
    icon: "+",
  },
  update: {
    label: "Updated",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/20",
    icon: "~",
  },
  archive: {
    label: "Archived",
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    border: "border-gray-500/20",
    icon: "−",
  },
  restore: {
    label: "Restored",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: "+",
  },
  transfer_out: {
    label: "Transfer Out",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    icon: "−",
  },
  transfer_in: {
    label: "Transfer In",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: "+",
  },
  restock_request: {
    label: "Restock Request",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    icon: "~",
  },
  restock_approved: {
    label: "Restock Approved",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    icon: "~",
  },
  restock_received: {
    label: "Restock Received",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    icon: "+",
  },
  restock_rejected: {
    label: "Restock Rejected",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
    icon: "x",
  },
};

const DEFAULT_TYPE_STYLE = {
  label: "Movement",
  bg: "bg-gray-500/10",
  text: "text-gray-400",
  border: "border-gray-500/20",
  icon: "~",
};

const formatActionLabel = (actionType) => {
  const style = TYPE_STYLES[actionType];
  if (style?.label) return style.label;
  return String(actionType || "movement")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

function MovementLog({
  LayoutComponent = InventoryLayout,
  pageTitle = "Movement Log",
  subtitle = "Track all inventory changes, transfers, and usage patterns.",
}) {
  const { headers, isAuthenticated } = useAuth();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchMovements = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ limit: "200" });
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const res = await fetch(`${API_BASE}/inventory/transactions/?${params.toString()}`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || `Failed to load movement log (${res.status})`);
      }
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : []).map((tx) => {
        const dt = tx.created_at ? new Date(tx.created_at) : null;
        const date = dt
          ? dt.toLocaleDateString("en-CA")
          : "";
        const time = dt
          ? dt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
          : "";
        return {
          id: tx.id,
          item: tx.item_name || "Unknown Item",
          sku: tx.item_sku || "—",
          branch: tx.branch_name || "Central",
          type: tx.action_type || "",
          typeLabel: formatActionLabel(tx.action_type),
          qty: Number(tx.quantity_changed || 0),
          date,
          time,
          by: tx.performed_by_name || "System",
          notes: tx.notes || "",
          createdAtRaw: tx.created_at || "",
        };
      });
      setMovements(mapped);
    } catch (err) {
      setError(err.message || "Failed to load movement log.");
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, [headers, isAuthenticated, dateFrom, dateTo]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const allTypeOptions = [
    { value: "all", label: "All Types" },
    ...Array.from(new Set(movements.map((m) => m.type).filter(Boolean))).map((type) => ({
      value: type,
      label: formatActionLabel(type),
    })),
  ];

  const allBranchOptions = [
    "all",
    ...Array.from(new Set(movements.map((m) => m.branch).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
  ];

  const filtered = movements.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      m.item.toLowerCase().includes(q) ||
      m.sku.toLowerCase().includes(q) ||
      m.by.toLowerCase().includes(q);
    const matchType = typeFilter === "all" || m.type === typeFilter;
    const matchBranch = branchFilter === "all" || m.branch === branchFilter;
    const matchFrom = !dateFrom || m.date >= dateFrom;
    const matchTo = !dateTo || m.date <= dateTo;
    return matchSearch && matchType && matchBranch && matchFrom && matchTo;
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
    resetDeps: [search, typeFilter, branchFilter, dateFrom, dateTo],
  });

  // Summary counts
  const usedCount = movements
    .filter((m) => m.qty < 0)
    .reduce((acc, m) => acc + Math.abs(m.qty), 0);
  const restockedCount = movements
    .filter((m) => m.qty > 0)
    .reduce((acc, m) => acc + m.qty, 0);
  const transferCount = movements.filter(
    (m) => m.type === "transfer_in" || m.type === "transfer_out",
  ).length;

  return (
    <LayoutComponent>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-gray-400 mt-1">
              {subtitle}
            </p>
          </div>
          <button className="mt-10 flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition-all w-fit">
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export CSV
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold">
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
            {error}
            <button
              onClick={fetchMovements}
              className="ml-auto text-xs font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Units Consumed",
              value: usedCount,
              color: "text-red-400",
              bg: "bg-red-500/10",
              border: "border-red-500/20",
            },
            {
              label: "Units Restocked",
              value: `+${restockedCount}`,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              border: "border-emerald-500/20",
            },
            {
              label: "Transfers Made",
              value: transferCount,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`bg-gray-900/60 border ${s.border} rounded-2xl p-4 backdrop-blur-sm`}
            >
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
              <p className="text-gray-600 text-xs mt-0.5">This period</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
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
                placeholder="Search item, SKU, or staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
            >
              {allTypeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
            >
              {allBranchOptions.map((b) => (
                <option key={b} value={b}>
                  {b === "all" ? "All Branches" : b}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
              />
              <span className="text-gray-600 text-sm">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Log Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h3 className="text-lg font-black text-white">All Movements</h3>
              <p className="text-gray-500 text-sm mt-0.5">
                Showing {startItem}-{endItem} of {filtered.length} records
              </p>
            </div>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5 bg-gray-900/40">
            <div className="col-span-3">Item</div>
            <div className="col-span-2">Branch</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2">Date & Time</div>
            <div className="col-span-2">By / Notes</div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-gray-500 text-sm">Loading movement records...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-gray-500 text-sm">
                No records match your filters.
              </p>
            </div>
          ) : (
            paginatedItems.map((m, index) => {
              const t = TYPE_STYLES[m.type] || DEFAULT_TYPE_STYLE;
              return (
                <div
                  key={m.id}
                  className="flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Mobile */}
                  <div className="lg:hidden flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-gray-500 mb-1">#{startItem + index}</p>
                      <p className="text-white font-semibold text-sm">
                        {m.item}
                      </p>
                      <p className="text-gray-600 text-xs">{m.sku}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${t.bg} ${t.text} ${t.border}`}
                        >
                          {m.typeLabel}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {m.branch}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-lg font-black ${m.qty > 0 ? "text-emerald-400" : m.qty < 0 ? "text-red-400" : "text-gray-500"}`}
                      >
                        {m.qty > 0 ? `+${m.qty}` : m.qty < 0 ? m.qty : "—"}
                      </span>
                      <p className="text-gray-500 text-xs">{m.date}</p>
                    </div>
                  </div>
                  <div className="lg:hidden text-xs text-gray-600 mt-1">
                    By {m.by} · {m.notes}
                  </div>

                  {/* Desktop */}
                  <div className="hidden lg:flex col-span-3 items-center gap-3">
                    <span className="text-xs text-gray-500 w-8 shrink-0">#{startItem + index}</span>
                    <div>
                    <p className="text-white font-semibold text-sm">{m.item}</p>
                    <span className="text-gray-600 text-xs">{m.sku}</span>
                    </div>
                  </div>
                  <div className="hidden lg:flex col-span-2 items-center">
                    <span className="text-gray-400 text-sm">{m.branch}</span>
                  </div>
                  <div className="hidden lg:flex col-span-2 items-center">
                    <div
                      className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${t.bg} ${t.border}`}
                    >
                      <span
                        className={`text-xs font-black w-3 text-center ${t.text}`}
                      >
                        {t.icon}
                      </span>
                      <span className={`text-xs font-semibold ${t.text}`}>
                        {m.typeLabel}
                      </span>
                    </div>
                  </div>
                  <div className="hidden lg:flex col-span-1 items-center justify-center">
                    <span
                      className={`text-sm font-black ${m.qty > 0 ? "text-emerald-400" : m.qty < 0 ? "text-red-400" : "text-gray-500"}`}
                    >
                      {m.qty > 0 ? `+${m.qty}` : m.qty < 0 ? m.qty : "—"}
                    </span>
                  </div>
                  <div className="hidden lg:flex col-span-2 items-center">
                    <div>
                      <p className="text-gray-300 text-sm">{m.date}</p>
                      <p className="text-gray-600 text-xs">{m.time}</p>
                  </div>
                  </div>
                  <div className="hidden lg:flex col-span-2 items-center">
                    <div>
                      <p className="text-gray-300 text-sm">{m.by}</p>
                      <p
                        className="text-gray-600 text-xs truncate max-w-[180px]"
                        title={m.notes}
                      >
                        {m.notes}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <Pagination
            current={currentPage}
            total={totalPages}
            onChange={setCurrentPage}
            className="px-6 py-4"
          />
        </div>
      </div>
    </LayoutComponent>
  );
}

export default MovementLog;
