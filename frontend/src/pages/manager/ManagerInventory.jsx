import React, { useState } from "react";
import ManagerLayout from "./ManagerLayout";

function ManagerInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const lowStockItems = [
    { name: "Brake Pads Set", current: 12, minimum: 15, unit: "Sets" },
    { name: "Air Filter", current: 8, minimum: 10, unit: "Pieces" },
    { name: "Battery 12V 60Ah", current: 5, minimum: 8, unit: "Pieces" },
  ];

  const inventoryItems = [
    {
      id: "INV-001",
      name: "Engine Oil 5W-30",
      category: "Lubricants",
      sku: "EO-5W30-001",
      quantity: 45,
      unit: "Liters",
      price: "₱450",
      supplier: "Shell Philippines",
      status: "In Stock",
    },
    {
      id: "INV-002",
      name: "Brake Pads Set",
      category: "Brakes",
      sku: "BP-SET-002",
      quantity: 12,
      unit: "Sets",
      price: "₱2,500",
      supplier: "Brembo",
      status: "Low Stock",
    },
    {
      id: "INV-003",
      name: "Air Filter",
      category: "Filters",
      sku: "AF-STD-003",
      quantity: 8,
      unit: "Pieces",
      price: "₱350",
      supplier: "Mann Filter",
      status: "Low Stock",
    },
    {
      id: "INV-004",
      name: "Battery 12V 60Ah",
      category: "Batteries",
      sku: "BAT-12V-004",
      quantity: 5,
      unit: "Pieces",
      price: "₱4,200",
      supplier: "Motolite",
      status: "Low Stock",
    },
    {
      id: "INV-005",
      name: "Tire 195/65R15",
      category: "Tires",
      sku: "TR-195-005",
      quantity: 24,
      unit: "Pieces",
      price: "₱3,500",
      supplier: "Bridgestone",
      status: "In Stock",
    },
    {
      id: "INV-006",
      name: "Engine Oil 10W-40",
      category: "Lubricants",
      sku: "EO-10W40-006",
      quantity: 32,
      unit: "Liters",
      price: "₱420",
      supplier: "Castrol",
      status: "In Stock",
    },
    {
      id: "INV-007",
      name: "Spark Plugs Set",
      category: "Ignition",
      sku: "SP-SET-007",
      quantity: 18,
      unit: "Sets",
      price: "₱800",
      supplier: "NGK",
      status: "In Stock",
    },
    {
      id: "INV-008",
      name: "Coolant Fluid",
      category: "Lubricants",
      sku: "CF-STD-008",
      quantity: 28,
      unit: "Liters",
      price: "₱350",
      supplier: "Prestone",
      status: "In Stock",
    },
  ];

  const getStatusBadge = (status) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${status === "In Stock" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
    >
      {status}
    </span>
  );

  const filteredItems = inventoryItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)) &&
      (categoryFilter === "All Categories" ||
        item.category === categoryFilter) &&
      (statusFilter === "All Status" || item.status === statusFilter)
    );
  });

  return (
    <ManagerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Inventory
          </h1>
          <p className="text-gray-400 mt-1">
            Track and manage inventory for San Mateo Rizal branch
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Items",
              value: "8",
              sub: "In this branch",
              color: "#ef4444",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              ),
            },
            {
              label: "Inventory Value",
              value: "₱161,550",
              sub: "Total stock value",
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
              label: "Low Stock Alert",
              value: lowStockItems.length,
              sub: "Items need reordering",
              color: "#f59e0b",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              ),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm hover:border-white/10 transition-all"
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
              <div className="text-2xl font-black text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className="text-xs text-gray-600 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-4 h-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-sm font-black text-red-400 uppercase tracking-wider">
              Low Stock Alert
            </h2>
            <span className="ml-auto text-xs text-gray-500">
              {lowStockItems.length} items
            </span>
          </div>
          <div className="space-y-2.5">
            {lowStockItems.map((item, i) => (
              <div
                key={i}
                className="bg-gray-900/60 border border-white/5 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-white font-semibold text-sm">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Current:{" "}
                    <span className="text-red-400 font-bold">
                      {item.current} {item.unit}
                    </span>
                    <span className="mx-2 text-gray-700">·</span>
                    Min:{" "}
                    <span className="text-gray-300">
                      {item.minimum} {item.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              placeholder="Search by name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </div>
          {[
            {
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                "All Categories",
                "Lubricants",
                "Brakes",
                "Filters",
                "Batteries",
                "Tires",
                "Ignition",
              ],
            },
            {
              value: statusFilter,
              onChange: setStatusFilter,
              options: ["All Status", "In Stock", "Low Stock"],
            },
          ].map((sel, i) => (
            <select
              key={i}
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
            >
              {sel.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ))}
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">SKU</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-1">Price</div>
            <div className="col-span-2">Supplier</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          {filteredItems.length === 0 ? (
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-gray-500 text-lg">No items found</p>
              <p className="text-gray-600 text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group"
              >
                <div className="col-span-2 text-white font-semibold text-sm">
                  {item.name}
                </div>
                <div className="col-span-2 text-gray-400 text-sm">
                  {item.category}
                </div>
                <div className="col-span-2 text-gray-500 text-xs font-mono">
                  {item.sku}
                </div>
                <div className="col-span-2 text-gray-300 text-sm font-semibold">
                  {item.quantity}{" "}
                  <span className="text-gray-600 font-normal text-xs">
                    {item.unit}
                  </span>
                </div>
                <div className="col-span-1 text-white font-bold text-sm">
                  {item.price}
                </div>
                <div className="col-span-2 text-gray-400 text-sm">
                  {item.supplier}
                </div>
                <div className="col-span-1 flex justify-end">
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))
          )}

          {filteredItems.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {filteredItems.length}
                </span>{" "}
                of{" "}
                <span className="text-white font-semibold">
                  {inventoryItems.length}
                </span>{" "}
                items
              </p>
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}

export default ManagerInventory;