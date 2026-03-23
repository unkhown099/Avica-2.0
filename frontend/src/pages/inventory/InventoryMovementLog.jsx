import React, { useState } from "react";
import InventoryLayout from "./InventoryLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

const MOVEMENT_DATA = [
  {
    id: 1,
    item: "Engine Oil (5W-30)",
    category: "Consumables",
    sku: "EO-5W30-4L",
    branch: "Quezon City",
    type: "Used",
    qty: -8,
    date: "2025-06-15",
    time: "02:45 PM",
    by: "Juan dela Cruz",
    notes: "Oil change service",
  },
  {
    id: 2,
    item: "Oil Filter",
    category: "Parts",
    sku: "OF-UNI-001",
    branch: "Makati",
    type: "Restocked",
    qty: +20,
    date: "2025-06-15",
    time: "10:00 AM",
    by: "System",
    notes: "Supplier delivery — AutoParts PH",
  },
  {
    id: 3,
    item: "Brake Pads (Front)",
    category: "Parts",
    sku: "BP-FRT-003",
    branch: "Pasig",
    type: "Transfer Out",
    qty: -3,
    date: "2025-06-14",
    time: "04:15 PM",
    by: "Pedro Reyes",
    notes: "Transferred to Makati branch",
  },
  {
    id: 4,
    item: "Brake Pads (Front)",
    category: "Parts",
    sku: "BP-FRT-003",
    branch: "Makati",
    type: "Transfer In",
    qty: +3,
    date: "2025-06-14",
    time: "04:20 PM",
    by: "Pedro Reyes",
    notes: "Received from Pasig branch",
  },
  {
    id: 5,
    item: "Transmission Fluid",
    category: "Consumables",
    sku: "TF-ATF-1L",
    branch: "Quezon City",
    type: "Used",
    qty: -5,
    date: "2025-06-14",
    time: "01:30 PM",
    by: "Carlo Mendoza",
    notes: "Transmission flush",
  },
  {
    id: 6,
    item: "Coolant (Pre-mixed)",
    category: "Consumables",
    sku: "CL-PRE-1L",
    branch: "Makati",
    type: "Low Stock Alert",
    qty: 0,
    date: "2025-06-13",
    time: "09:00 AM",
    by: "System",
    notes: "Stock fell below reorder threshold",
  },
  {
    id: 7,
    item: "Air Filter",
    category: "Parts",
    sku: "AF-UNI-002",
    branch: "Mandaluyong",
    type: "Restocked",
    qty: +15,
    date: "2025-06-13",
    time: "08:30 AM",
    by: "System",
    notes: "Supplier delivery — AutoParts PH",
  },
  {
    id: 8,
    item: "Spark Plug (Iridium)",
    category: "Parts",
    sku: "SP-IRD-004",
    branch: "Pasig",
    type: "Used",
    qty: -4,
    date: "2025-06-12",
    time: "03:00 PM",
    by: "Ana Gonzales",
    notes: "Spark plug replacement",
  },
  {
    id: 9,
    item: "Windshield Wiper (21in)",
    category: "Accessories",
    sku: "WW-21-BLK",
    branch: "Quezon City",
    type: "Used",
    qty: -2,
    date: "2025-06-12",
    time: "11:45 AM",
    by: "Maria Santos",
    notes: "Wiper blade replacement",
  },
  {
    id: 10,
    item: "Tire Valve Stem",
    category: "Accessories",
    sku: "TV-STM-005",
    branch: "Pasig",
    type: "Restocked",
    qty: +50,
    date: "2025-06-11",
    time: "09:15 AM",
    by: "System",
    notes: "Monthly stock replenishment",
  },
  {
    id: 11,
    item: "Engine Oil (5W-30)",
    category: "Consumables",
    sku: "EO-5W30-4L",
    branch: "Makati",
    type: "Used",
    qty: -6,
    date: "2025-06-11",
    time: "02:00 PM",
    by: "Jose Reyes",
    notes: "Express oil change",
  },
  {
    id: 12,
    item: "Cabin Air Filter",
    category: "Parts",
    sku: "CA-FLT-006",
    branch: "Mandaluyong",
    type: "Used",
    qty: -1,
    date: "2025-06-10",
    time: "04:30 PM",
    by: "Diego Cruz",
    notes: "AC maintenance service",
  },
];

const TYPE_STYLES = {
  Used: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    icon: "−",
  },
  Restocked: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: "+",
  },
  "Transfer Out": {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    icon: "→",
  },
  "Transfer In": {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    icon: "←",
  },
  "Low Stock Alert": {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    icon: "!",
  },
};

const CATEGORY_STYLES = {
  Parts: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  Consumables: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
  Accessories: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
};

const ALL_TYPES = [
  "All Types",
  "Used",
  "Restocked",
  "Transfer In",
  "Transfer Out",
  "Low Stock Alert",
];
const ALL_BRANCHES = [
  "All Branches",
  "Quezon City",
  "Makati",
  "Pasig",
  "Mandaluyong",
];

function MovementLog() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = MOVEMENT_DATA.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      m.item.toLowerCase().includes(q) ||
      m.sku.toLowerCase().includes(q) ||
      m.by.toLowerCase().includes(q);
    const matchType = typeFilter === "All Types" || m.type === typeFilter;
    const matchBranch =
      branchFilter === "All Branches" || m.branch === branchFilter;
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
  const usedCount = MOVEMENT_DATA.filter((m) => m.type === "Used").reduce(
    (acc, m) => acc + Math.abs(m.qty),
    0,
  );
  const restockedCount = MOVEMENT_DATA.filter(
    (m) => m.type === "Restocked",
  ).reduce((acc, m) => acc + m.qty, 0);
  const transferCount = MOVEMENT_DATA.filter(
    (m) => m.type === "Transfer In" || m.type === "Transfer Out",
  ).length;

  return (
    <InventoryLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Movement Log
            </h1>
            <p className="text-gray-400 mt-1">
              Track all inventory changes, transfers, and usage patterns.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition-all w-fit">
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
              {ALL_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
            >
              {ALL_BRANCHES.map((b) => (
                <option key={b}>{b}</option>
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

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-gray-500 text-sm">
                No records match your filters.
              </p>
            </div>
          ) : (
            paginatedItems.map((m) => {
              const t = TYPE_STYLES[m.type] || TYPE_STYLES.Used;
              const cat = CATEGORY_STYLES[m.category];
              return (
                <div
                  key={m.id}
                  className="flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Mobile */}
                  <div className="lg:hidden flex items-start justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {m.item}
                      </p>
                      <p className="text-gray-600 text-xs">{m.sku}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${t.bg} ${t.text} ${t.border}`}
                        >
                          {m.type}
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
                  <div className="hidden lg:block col-span-3">
                    <p className="text-white font-semibold text-sm">{m.item}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-semibold ${cat.bg} ${cat.text}`}
                      >
                        {m.category}
                      </span>
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
                        {m.type}
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
    </InventoryLayout>
  );
}

export default MovementLog;