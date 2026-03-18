import React, { useState } from "react";
import InventoryLayout from "./InventoryLayout";

const INVENTORY_ITEMS = [
  {
    id: 1,
    name: "Engine Oil (5W-30)",
    category: "Consumables",
    sku: "EO-5W30-4L",
    unit: "Liters",
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
    unit: "Liters",
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
    unit: "Liters",
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
    unit: "Liters",
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
    unit: "Liters",
    qc: 14,
    mk: 6,
    ps: 20,
    mn: 10,
    reorderLevel: 8,
    cost: 160,
  },
  {
    id: 13,
    name: "Serpentine Belt",
    category: "Parts",
    sku: "SB-UNI-007",
    unit: "pcs",
    qc: 10,
    mk: 4,
    ps: 12,
    mn: 8,
    reorderLevel: 5,
    cost: 650,
  },
  {
    id: 14,
    name: "Fuel Filter",
    category: "Parts",
    sku: "FF-UNI-008",
    unit: "pcs",
    qc: 15,
    mk: 11,
    ps: 18,
    mn: 9,
    reorderLevel: 8,
    cost: 290,
  },
  {
    id: 15,
    name: "WD-40 Lubricant",
    category: "Accessories",
    sku: "WD40-400ML",
    unit: "cans",
    qc: 25,
    mk: 18,
    ps: 30,
    mn: 22,
    reorderLevel: 10,
    cost: 220,
  },
];

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

function StockBadge({ current, reorder }) {
  if (current === 0)
    return (
      <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap">
        Out of Stock
      </span>
    );
  if (current < reorder)
    return (
      <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
        Low Stock
      </span>
    );
  return (
    <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
      In Stock
    </span>
  );
}

function RestockModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-black text-white">Restock Item</h3>
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
          {item && (
            <div className="bg-gray-800/60 rounded-xl p-3 mb-2">
              <p className="text-white font-bold text-sm">{item.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{item.sku}</p>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Branch
            </label>
            <select className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors">
              {["Quezon City", "Makati", "Pasig", "Mandaluyong"].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Quantity to Add
            </label>
            <input
              type="number"
              min="1"
              placeholder="Enter quantity..."
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Supplier / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional..."
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold text-sm transition-all"
            >
              Cancel
            </button>
            <button className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-600/20">
              Confirm Restock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransferModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-black text-white">Transfer Stock</h3>
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
          {item && (
            <div className="bg-gray-800/60 rounded-xl p-3 mb-2">
              <p className="text-white font-bold text-sm">{item.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{item.sku}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                From Branch
              </label>
              <select className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors">
                {["Quezon City", "Makati", "Pasig", "Mandaluyong"].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                To Branch
              </label>
              <select className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors">
                {["Quezon City", "Makati", "Pasig", "Mandaluyong"].map((b) => (
                  <option key={b}>{b}</option>
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

function StockOverview() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [branch, setBranch] = useState("All Branches");
  const [restockItem, setRestockItem] = useState(null);
  const [transferItem, setTransferItem] = useState(null);

  const branchKey = {
    "Quezon City": "qc",
    Makati: "mk",
    Pasig: "ps",
    Mandaluyong: "mn",
  };

  const getStock = (item) =>
    branch === "All Branches"
      ? item.qc + item.mk + item.ps + item.mn
      : (item[branchKey[branch]] ?? 0);

  const getReorder = (item) =>
    branch === "All Branches" ? item.reorderLevel * 4 : item.reorderLevel;

  const filtered = INVENTORY_ITEMS.filter((item) => {
    const q = search.toLowerCase();
    return (
      (item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)) &&
      (category === "All" || item.category === category)
    );
  });

  return (
    <InventoryLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Stock Overview
            </h1>
            <p className="text-gray-400 mt-1">
              Monitor all inventory items across branches.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
            >
              {[
                "All Branches",
                "Quezon City",
                "Makati",
                "Pasig",
                "Mandaluyong",
              ].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            <button
              onClick={() => setRestockItem({})}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-600/20"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Restock
            </button>
            <button
              onClick={() => setTransferItem({})}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition-all"
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
              Transfer
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-white/5">
            <div className="relative w-full sm:w-72">
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
                placeholder="Search item or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600"
              />
            </div>
            <div className="flex items-center gap-2">
              {["All", "Parts", "Consumables", "Accessories"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${category === cat ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Header Row */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5 bg-gray-900/40">
            <div className="col-span-4">Item</div>
            <div className="col-span-1">Category</div>
            <div className="col-span-1 text-center">QC</div>
            <div className="col-span-1 text-center">MK</div>
            <div className="col-span-1 text-center">PS</div>
            <div className="col-span-1 text-center">MN</div>
            <div className="col-span-1 text-center">Total</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {filtered.map((item) => {
            const total = getStock(item);
            const reorder = getReorder(item);
            const cat = CATEGORY_STYLES[item.category];
            return (
              <div
                key={item.id}
                className="flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
              >
                {/* Mobile layout */}
                <div className="lg:hidden flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {item.name}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {item.sku} · {item.unit}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}
                      >
                        {item.category}
                      </span>
                      <StockBadge current={total} reorder={reorder} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-lg">{total}</p>
                    <p className="text-gray-500 text-xs">total units</p>
                  </div>
                </div>
                <div className="lg:hidden flex justify-between text-xs text-gray-500 mt-1">
                  <span>
                    QC: <span className="text-white font-bold">{item.qc}</span>
                  </span>
                  <span>
                    MK: <span className="text-white font-bold">{item.mk}</span>
                  </span>
                  <span>
                    PS: <span className="text-white font-bold">{item.ps}</span>
                  </span>
                  <span>
                    MN: <span className="text-white font-bold">{item.mn}</span>
                  </span>
                </div>

                {/* Desktop layout */}
                <div className="hidden lg:block col-span-4">
                  <p className="text-white font-semibold text-sm">
                    {item.name}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {item.sku} · {item.unit}
                  </p>
                </div>
                <div className="hidden lg:flex col-span-1 items-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}
                  >
                    {item.category}
                  </span>
                </div>
                {["qc", "mk", "ps", "mn"].map((key) => (
                  <div
                    key={key}
                    className="hidden lg:flex col-span-1 items-center justify-center"
                  >
                    <span
                      className={`text-sm font-bold ${item[key] < item.reorderLevel / 2 ? "text-red-400" : item[key] < item.reorderLevel ? "text-amber-400" : "text-white"}`}
                    >
                      {item[key]}
                    </span>
                  </div>
                ))}
                <div className="hidden lg:flex col-span-1 items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {item.qc + item.mk + item.ps + item.mn}
                  </span>
                </div>
                <div className="hidden lg:flex col-span-1 items-center justify-center">
                  <StockBadge current={total} reorder={reorder} />
                </div>
                <div className="hidden lg:flex col-span-1 items-center justify-end gap-1">
                  <button
                    onClick={() => setRestockItem(item)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                    title="Restock"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setTransferItem(item)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                    title="Transfer"
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
                  </button>
                </div>
              </div>
            );
          })}

          <div className="px-6 py-4">
            <p className="text-gray-500 text-sm">
              Showing{" "}
              <span className="text-white font-semibold">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="text-white font-semibold">
                {INVENTORY_ITEMS.length}
              </span>{" "}
              items
            </p>
          </div>
        </div>
      </div>

      {restockItem && (
        <RestockModal item={restockItem} onClose={() => setRestockItem(null)} />
      )}
      {transferItem && (
        <TransferModal
          item={transferItem}
          onClose={() => setTransferItem(null)}
        />
      )}
    </InventoryLayout>
  );
}

export default StockOverview;