import React, { useState } from "react";
import InventoryLayout from "./InventoryLayout";

const INVENTORY_ITEMS = [
  {
    id: 1,
    name: "Engine Oil (5W-30)",
    category: "Consumables",
    sku: "EO-5W30-4L",
    unit: "L",
    qc: 45,
    mk: 12,
    ps: 78,
    mn: 30,
    reorderLevel: 20,
    cost: 350,
  },
  {
    id: 2,
    name: "Oil Filter",
    category: "Parts",
    sku: "OF-UNI-001",
    unit: "pcs",
    qc: 8,
    mk: 5,
    ps: 22,
    mn: 11,
    reorderLevel: 15,
    cost: 120,
  },
  {
    id: 3,
    name: "Air Filter",
    category: "Parts",
    sku: "AF-UNI-002",
    unit: "pcs",
    qc: 30,
    mk: 18,
    ps: 14,
    mn: 25,
    reorderLevel: 10,
    cost: 250,
  },
  {
    id: 4,
    name: "Brake Pads (Front)",
    category: "Parts",
    sku: "BP-FRT-003",
    unit: "sets",
    qc: 6,
    mk: 3,
    ps: 9,
    mn: 4,
    reorderLevel: 8,
    cost: 850,
  },
  {
    id: 5,
    name: "Transmission Fluid",
    category: "Consumables",
    sku: "TF-ATF-1L",
    unit: "L",
    qc: 55,
    mk: 40,
    ps: 60,
    mn: 35,
    reorderLevel: 20,
    cost: 280,
  },
  {
    id: 6,
    name: "Windshield Wiper (21in)",
    category: "Accessories",
    sku: "WW-21-BLK",
    unit: "pcs",
    qc: 20,
    mk: 7,
    ps: 15,
    mn: 18,
    reorderLevel: 10,
    cost: 180,
  },
  {
    id: 7,
    name: "Coolant (Pre-mixed)",
    category: "Consumables",
    sku: "CL-PRE-1L",
    unit: "L",
    qc: 4,
    mk: 2,
    ps: 18,
    mn: 9,
    reorderLevel: 10,
    cost: 200,
  },
  {
    id: 8,
    name: "Spark Plug (Iridium)",
    category: "Parts",
    sku: "SP-IRD-004",
    unit: "pcs",
    qc: 32,
    mk: 28,
    ps: 40,
    mn: 16,
    reorderLevel: 12,
    cost: 420,
  },
  {
    id: 9,
    name: "Tire Valve Stem",
    category: "Accessories",
    sku: "TV-STM-005",
    unit: "pcs",
    qc: 80,
    mk: 60,
    ps: 90,
    mn: 70,
    reorderLevel: 30,
    cost: 45,
  },
  {
    id: 10,
    name: "Power Steering Fluid",
    category: "Consumables",
    sku: "PS-FLD-1L",
    unit: "L",
    qc: 3,
    mk: 1,
    ps: 7,
    mn: 5,
    reorderLevel: 8,
    cost: 220,
  },
  {
    id: 11,
    name: "Cabin Air Filter",
    category: "Parts",
    sku: "CA-FLT-006",
    unit: "pcs",
    qc: 18,
    mk: 9,
    ps: 24,
    mn: 12,
    reorderLevel: 8,
    cost: 380,
  },
  {
    id: 12,
    name: "Brake Fluid DOT4",
    category: "Consumables",
    sku: "BF-DOT4-1L",
    unit: "L",
    qc: 14,
    mk: 6,
    ps: 20,
    mn: 10,
    reorderLevel: 8,
    cost: 160,
  },
];

const BRANCHES = [
  {
    name: "Quezon City",
    code: "QC",
    key: "qc",
    color: "#ef4444",
    colorBg: "bg-red-500/10",
    colorText: "text-red-400",
    colorBorder: "border-red-500/20",
  },
  {
    name: "Makati",
    code: "MK",
    key: "mk",
    color: "#3b82f6",
    colorBg: "bg-blue-500/10",
    colorText: "text-blue-400",
    colorBorder: "border-blue-500/20",
  },
  {
    name: "Pasig",
    code: "PS",
    key: "ps",
    color: "#10b981",
    colorBg: "bg-emerald-500/10",
    colorText: "text-emerald-400",
    colorBorder: "border-emerald-500/20",
  },
  {
    name: "Mandaluyong",
    code: "MN",
    key: "mn",
    color: "#a855f7",
    colorBg: "bg-purple-500/10",
    colorText: "text-purple-400",
    colorBorder: "border-purple-500/20",
  },
];

function TransferModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-black text-white">
            Transfer Between Branches
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Item
            </label>
            <select className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors">
              {INVENTORY_ITEMS.map((i) => (
                <option key={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                From
              </label>
              <select className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors">
                {BRANCHES.map((b) => (
                  <option key={b.key}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                To
              </label>
              <select className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors">
                {BRANCHES.map((b) => (
                  <option key={b.key}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              placeholder="Enter quantity..."
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold text-sm transition-all"
            >
              Cancel
            </button>
            <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
              Confirm Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BranchDistribution() {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);

  const getBranchValue = (key) =>
    INVENTORY_ITEMS.reduce((acc, i) => acc + i[key] * i.cost, 0);
  const getBranchLow = (key) =>
    INVENTORY_ITEMS.filter((i) => i[key] < i.reorderLevel).length;
  const getBranchHealth = (key) => {
    const healthy = INVENTORY_ITEMS.filter(
      (i) => i[key] >= i.reorderLevel,
    ).length;
    return Math.round((healthy / INVENTORY_ITEMS.length) * 100);
  };
  const getTotalBranch = (key) =>
    INVENTORY_ITEMS.reduce((acc, i) => acc + i[key], 0);

  const focusBranch = selectedBranch
    ? BRANCHES.find((b) => b.key === selectedBranch)
    : null;
  const focusItems = focusBranch
    ? INVENTORY_ITEMS.map((i) => ({ ...i, stock: i[focusBranch.key] })).sort(
        (a, b) => a.stock / a.reorderLevel - b.stock / b.reorderLevel,
      )
    : [];

  return (
    <InventoryLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Branch Distribution
            </h1>
            <p className="text-gray-400 mt-1">
              Monitor stock allocation and balance across all branches.
            </p>
          </div>
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 w-fit"
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
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            New Transfer
          </button>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {BRANCHES.map((b) => {
            const health = getBranchHealth(b.key);
            const low = getBranchLow(b.key);
            const val = getBranchValue(b.key);
            const total = getTotalBranch(b.key);
            const isSelected = selectedBranch === b.key;
            return (
              <button
                key={b.key}
                onClick={() => setSelectedBranch(isSelected ? null : b.key)}
                className={`text-left bg-gray-900/60 border rounded-2xl p-5 backdrop-blur-sm transition-all ${isSelected ? `${b.colorBorder} ring-1 ring-offset-0` : "border-white/5 hover:border-white/10"}`}
                style={isSelected ? { "--tw-ring-color": b.color } : {}}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-10 h-10 ${b.colorBg} rounded-xl flex items-center justify-center`}
                  >
                    <span className={`text-sm font-black ${b.colorText}`}>
                      {b.code}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${health >= 80 ? "bg-emerald-500/10 text-emerald-400" : health >= 60 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}
                  >
                    {health}% healthy
                  </span>
                </div>
                <p className="text-white font-black text-base">{b.name}</p>
                <p className="text-gray-500 text-xs mt-0.5 mb-3">
                  {total} units · ₱{(val / 1000).toFixed(0)}k value
                </p>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${health}%`, backgroundColor: b.color }}
                  />
                </div>
                {low > 0 && (
                  <p className={`text-xs font-semibold ${b.colorText}`}>
                    {low} item{low > 1 ? "s" : ""} below reorder level
                  </p>
                )}
                {low === 0 && (
                  <p className="text-xs text-emerald-400 font-semibold">
                    All items adequately stocked
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h3 className="text-lg font-black text-white">
                Cross-Branch Comparison
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">
                Stock levels for every item across all branches
              </p>
            </div>
            {selectedBranch && (
              <button
                onClick={() => setSelectedBranch(null)}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Clear filter ×
              </button>
            )}
          </div>

          {/* Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5 bg-gray-900/40">
            <div className="col-span-4">Item</div>
            {BRANCHES.map((b) => (
              <div key={b.key} className="col-span-2 text-center">
                <span className={`${b.colorText}`}>{b.name}</span>
              </div>
            ))}
          </div>

          {INVENTORY_ITEMS.map((item) => {
            const highlightKey = focusBranch?.key;
            return (
              <div
                key={item.id}
                className="flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                {/* Mobile */}
                <div className="lg:hidden">
                  <p className="text-white font-semibold text-sm mb-2">
                    {item.name}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {BRANCHES.map((b) => (
                      <div key={b.key} className="text-center">
                        <p className={`text-xs font-bold ${b.colorText}`}>
                          {b.code}
                        </p>
                        <p
                          className={`text-sm font-black ${item[b.key] < item.reorderLevel ? "text-red-400" : "text-white"}`}
                        >
                          {item[b.key]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden lg:block col-span-4">
                  <p className="text-white font-semibold text-sm">
                    {item.name}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {item.sku} · min {item.reorderLevel}
                  </p>
                </div>
                {BRANCHES.map((b) => {
                  const stock = item[b.key];
                  const pct = Math.min(
                    (stock / (item.reorderLevel * 2)) * 100,
                    100,
                  );
                  const isLow = stock < item.reorderLevel;
                  const isHighlighted = !highlightKey || highlightKey === b.key;
                  return (
                    <div
                      key={b.key}
                      className={`hidden lg:flex col-span-2 flex-col items-center justify-center gap-1 transition-opacity ${!isHighlighted ? "opacity-25" : ""}`}
                    >
                      <span
                        className={`text-sm font-black ${isLow ? "text-red-400" : "text-white"}`}
                      >
                        {stock}
                      </span>
                      <div className="w-full max-w-[80px] h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isLow ? "#ef4444" : b.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Focused Branch Detail */}
        {focusBranch && (
          <div
            className={`bg-gray-900/60 border ${focusBranch.colorBorder} rounded-2xl overflow-hidden backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${focusBranch.colorBg} rounded-xl flex items-center justify-center`}
                >
                  <span
                    className={`text-sm font-black ${focusBranch.colorText}`}
                  >
                    {focusBranch.code}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {focusBranch.name} — Detail View
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5">
                    Items sorted by stock health (lowest first)
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {focusItems.map((item) => {
                const pct = Math.min(
                  (item.stock / (item.reorderLevel * 2)) * 100,
                  100,
                );
                const isLow = item.stock < item.reorderLevel;
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border ${isLow ? "bg-red-500/5 border-red-500/15" : "bg-gray-800/40 border-white/5"}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-white text-sm font-semibold leading-tight">
                        {item.name}
                      </p>
                      {isLow && (
                        <span className="text-red-400 text-xs font-bold ml-2 flex-shrink-0">
                          Low
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500 text-xs">
                        min {item.reorderLevel}
                      </span>
                      <span
                        className={`text-sm font-black ${isLow ? "text-red-400" : "text-white"}`}
                      >
                        {item.stock} {item.unit}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isLow
                            ? "#ef4444"
                            : focusBranch.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showTransfer && <TransferModal onClose={() => setShowTransfer(false)} />}
    </InventoryLayout>
  );
}

export default BranchDistribution;