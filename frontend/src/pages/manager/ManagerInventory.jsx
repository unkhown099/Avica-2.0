import React, { useState } from "react";
import ManagerLayout from "./ManagerLayout";

function ManagerInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [activeTab, setActiveTab] = useState("inventory"); // 'inventory' or 'services'
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    category: "",
    duration: "",
    price: "",
    description: "",
  });

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

  const serviceItems = [
    {
      id: "SVC-001",
      name: "Oil Change Service",
      category: "Maintenance",
      duration: "30 mins",
      price: "₱1,500",
      description: "Complete engine oil change with filter replacement",
      status: "Available",
    },
    {
      id: "SVC-002",
      name: "Brake Pad Replacement",
      category: "Brakes",
      duration: "1 hour",
      price: "₱2,800",
      description: "Front or rear brake pad replacement service",
      status: "Available",
    },
    {
      id: "SVC-003",
      name: "Air Conditioning Service",
      category: "AC",
      duration: "2 hours",
      price: "₱3,500",
      description: "AC cleaning, recharging, and performance check",
      status: "Available",
    },
    {
      id: "SVC-004",
      name: "Engine Tune-up",
      category: "Engine",
      duration: "1.5 hours",
      price: "₱2,200",
      description: "Complete engine diagnostic and tune-up service",
      status: "Available",
    },
    {
      id: "SVC-005",
      name: "Tire Rotation & Balance",
      category: "Tires",
      duration: "45 mins",
      price: "₱800",
      description: "Tire rotation and balancing for all 4 tires",
      status: "Available",
    },
  ];

  const getStatusBadge = (status) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
        status === "In Stock" || status === "Available"
          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          : "bg-red-500/20 text-red-400 border-red-500/30"
      }`}
    >
      {status}
    </span>
  );

  const handleAddService = (e) => {
    e.preventDefault();
    // Here you would typically make an API call to add the service
    console.log("Adding service:", newService);
    setShowAddServiceModal(false);
    setNewService({
      name: "",
      category: "",
      duration: "",
      price: "",
      description: "",
    });
    // Show success message or update state
  };

  const filteredInventory = inventoryItems.filter((item) => {
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

  const filteredServices = serviceItems.filter((service) => {
    const q = searchQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(q) ||
      service.category.toLowerCase().includes(q) ||
      service.description.toLowerCase().includes(q)
    );
  });

  // Helper function to render stats icons
  const renderStatIcon = (color, iconType) => {
    const iconPaths = {
      inventory: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      ),
      value: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      alert: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      ),
      services: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      ),
      categories: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
        />
      ),
      duration: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    };

    return iconPaths[iconType];
  };

  const inventoryStats = [
    {
      label: "Total Items",
      value: "8",
      sub: "In this branch",
      color: "#ef4444",
      iconType: "inventory",
    },
    {
      label: "Inventory Value",
      value: "₱161,550",
      sub: "Total stock value",
      color: "#3b82f6",
      iconType: "value",
    },
    {
      label: "Low Stock Alert",
      value: lowStockItems.length,
      sub: "Items need reordering",
      color: "#f59e0b",
      iconType: "alert",
    },
  ];

  const serviceStats = [
    {
      label: "Total Services",
      value: "5",
      sub: "Active services",
      color: "#10b981",
      iconType: "services",
    },
    {
      label: "Service Categories",
      value: "5",
      sub: "Different types",
      color: "#8b5cf6",
      iconType: "categories",
    },
    {
      label: "Avg. Duration",
      value: "1.2 hrs",
      sub: "Per service",
      color: "#ec4899",
      iconType: "duration",
    },
  ];

  return (
    <ManagerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Inventory & Services
            </h1>
            <p className="text-gray-400 mt-1">
              Track and manage inventory and services for San Mateo Rizal branch
            </p>
          </div>
          {activeTab === "services" && (
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25 flex items-center gap-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add New Service
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-900/60 p-1 rounded-xl border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "inventory"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "services"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Services
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {(activeTab === "inventory" ? inventoryStats : serviceStats).map(
            (stat) => (
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
                      {renderStatIcon(stat.color, stat.iconType)}
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-black text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
                <div className="text-xs text-gray-600 mt-0.5">{stat.sub}</div>
              </div>
            ),
          )}
        </div>

        {/* Low Stock Alert - Only show for inventory */}
        {activeTab === "inventory" && (
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
        )}

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
              placeholder={`Search ${
                activeTab === "inventory"
                  ? "by name, SKU, or category..."
                  : "by service name or category..."
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </div>
          {activeTab === "inventory" ? (
            <>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
              >
                {[
                  "All Categories",
                  "Lubricants",
                  "Brakes",
                  "Filters",
                  "Batteries",
                  "Tires",
                  "Ignition",
                ].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
              >
                {["All Status", "In Stock", "Low Stock"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </>
          ) : (
            <select className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]">
              {[
                "All Categories",
                "Maintenance",
                "Brakes",
                "AC",
                "Engine",
                "Tires",
              ].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          )}
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {activeTab === "inventory" ? (
              <>
                <div className="col-span-2">Name</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">SKU</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-1">Price</div>
                <div className="col-span-2">Supplier</div>
                <div className="col-span-1 text-right">Status</div>
              </>
            ) : (
              <>
                <div className="col-span-3">Service Name</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Description</div>
                <div className="col-span-1 text-right">Status</div>
              </>
            )}
          </div>

          {activeTab === "inventory" ? (
            filteredInventory.length === 0 ? (
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
              filteredInventory.map((item) => (
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
            )
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group"
              >
                <div className="col-span-3 text-white font-semibold text-sm">
                  {service.name}
                </div>
                <div className="col-span-2 text-gray-400 text-sm">
                  {service.category}
                </div>
                <div className="col-span-2 text-gray-400 text-sm">
                  {service.duration}
                </div>
                <div className="col-span-2 text-white font-bold text-sm">
                  {service.price}
                </div>
                <div className="col-span-2 text-gray-400 text-sm truncate">
                  {service.description}
                </div>
                <div className="col-span-1 flex justify-end">
                  {getStatusBadge(service.status)}
                </div>
              </div>
            ))
          )}

          {((activeTab === "inventory" && filteredInventory.length > 0) ||
            (activeTab === "services" && filteredServices.length > 0)) && (
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {activeTab === "inventory"
                    ? filteredInventory.length
                    : filteredServices.length}
                </span>{" "}
                of{" "}
                <span className="text-white font-semibold">
                  {activeTab === "inventory"
                    ? inventoryItems.length
                    : serviceItems.length}
                </span>{" "}
                {activeTab === "inventory" ? "items" : "services"}
              </p>
            </div>
          )}
        </div>

        {/* Add Service Modal */}
        {showAddServiceModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white">
                  Add New Service
                </h2>
                <button
                  onClick={() => setShowAddServiceModal(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
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

              <form onSubmit={handleAddService} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Service Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newService.name}
                    onChange={(e) =>
                      setNewService({ ...newService, name: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    placeholder="e.g., Oil Change Service"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Category
                  </label>
                  <select
                    required
                    value={newService.category}
                    onChange={(e) =>
                      setNewService({ ...newService, category: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                  >
                    <option value="">Select category</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Brakes">Brakes</option>
                    <option value="AC">AC</option>
                    <option value="Engine">Engine</option>
                    <option value="Tires">Tires</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    required
                    value={newService.duration}
                    onChange={(e) =>
                      setNewService({ ...newService, duration: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    placeholder="e.g., 1 hour"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Price
                  </label>
                  <input
                    type="text"
                    required
                    value={newService.price}
                    onChange={(e) =>
                      setNewService({ ...newService, price: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    placeholder="e.g., ₱1,500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    value={newService.description}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        description: e.target.value,
                      })
                    }
                    rows="3"
                    className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    placeholder="Describe the service..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all"
                  >
                    Add Service
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddServiceModal(false)}
                    className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}

export default ManagerInventory;