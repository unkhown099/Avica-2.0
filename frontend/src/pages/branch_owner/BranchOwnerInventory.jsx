import React, { useState } from "react";
import BranchOwnerLayout from "./BranchOwnerLayout";

function BranchOwnerInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [statusFilter, setStatusFilter] = useState("All Status");

  // Inventory stats
  const stats = [
    {
      label: "Total Items",
      value: "40",
      subtitle: "Across all branches",
      icon: (
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
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      iconColor: "text-red-500",
      iconBg: "bg-red-50",
      cardBg: "bg-gradient-to-br from-red-50 to-pink-50",
      borderColor: "border-red-100",
    },
    {
      label: "Inventory Value",
      value: "₱645,400",
      subtitle: "Total stock value",
      icon: (
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50",
      cardBg: "bg-gradient-to-br from-blue-50 to-indigo-50",
      borderColor: "border-blue-100",
    },
    {
      label: "Low Stock Alert",
      value: "8",
      subtitle: "Items need reordering",
      icon: (
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      iconColor: "text-yellow-500",
      iconBg: "bg-yellow-50",
      cardBg: "bg-gradient-to-br from-yellow-50 to-amber-50",
      borderColor: "border-yellow-100",
    },
  ];

  // Low stock items with branches
  const lowStockItems = [
    {
      name: "Brake Pads Set",
      current: 12,
      minimum: 15,
      unit: "Sets",
      branch: "San Mateo Rizal",
    },
    {
      name: "Air Filter",
      current: 8,
      minimum: 10,
      unit: "Pieces",
      branch: "North Caloocan",
    },
    {
      name: "Battery 12V 60Ah",
      current: 5,
      minimum: 8,
      unit: "Pieces",
      branch: "Quezon City",
    },
    {
      name: "Coolant Fluid",
      current: 18,
      minimum: 20,
      unit: "Liters",
      branch: "South Caloocan",
    },
    {
      name: "Spark Plugs Set",
      current: 9,
      minimum: 12,
      unit: "Sets",
      branch: "Camarin",
    },
    {
      name: "Transmission Oil",
      current: 14,
      minimum: 18,
      unit: "Liters",
      branch: "San Mateo Rizal",
    },
    {
      name: "Wiper Blades",
      current: 7,
      minimum: 10,
      unit: "Pairs",
      branch: "North Caloocan",
    },
    {
      name: "Cabin Filter",
      current: 6,
      minimum: 8,
      unit: "Pieces",
      branch: "Quezon City",
    },
  ];

  // Inventory items with branch information
  const inventoryItems = [
    {
      id: "INV-001",
      name: "Engine Oil 5W-30",
      category: "Lubricants",
      sku: "EO-5W30-001",
      quantity: 180,
      unit: "Liters",
      price: "₱450",
      supplier: "Shell Philippines",
      status: "In Stock",
      branch: "San Mateo Rizal",
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
      branch: "San Mateo Rizal",
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
      branch: "North Caloocan",
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
      branch: "Quezon City",
    },
    {
      id: "INV-005",
      name: "Tire 195/65R15",
      category: "Tires",
      sku: "TR-195-005",
      quantity: 96,
      unit: "Pieces",
      price: "₱3,500",
      supplier: "Bridgestone",
      status: "In Stock",
      branch: "South Caloocan",
    },
    {
      id: "INV-006",
      name: "Engine Oil 10W-40",
      category: "Lubricants",
      sku: "EO-10W40-006",
      quantity: 128,
      unit: "Liters",
      price: "₱420",
      supplier: "Castrol",
      status: "In Stock",
      branch: "North Caloocan",
    },
    {
      id: "INV-007",
      name: "Spark Plugs Set",
      category: "Ignition",
      sku: "SP-SET-007",
      quantity: 9,
      unit: "Sets",
      price: "₱800",
      supplier: "NGK",
      status: "Low Stock",
      branch: "Camarin",
    },
    {
      id: "INV-008",
      name: "Coolant Fluid",
      category: "Lubricants",
      sku: "CF-STD-008",
      quantity: 18,
      unit: "Liters",
      price: "₱350",
      supplier: "Prestone",
      status: "Low Stock",
      branch: "South Caloocan",
    },
  ];

  const getStatusBadge = (status) => {
    if (status === "In Stock") {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
          In Stock
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-200">
        Low Stock
      </span>
    );
  };

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "All Categories" || item.category === categoryFilter;
    const matchesBranch =
      branchFilter === "All Branches" || item.branch === branchFilter;
    const matchesStatus =
      statusFilter === "All Status" || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesBranch && matchesStatus;
  });

  const filteredLowStock = lowStockItems.filter((item) => {
    return branchFilter === "All Branches" || item.branch === branchFilter;
  });

  return (
    <BranchOwnerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 -m-8 p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Inventory</h1>
          <p className="text-slate-300">
            Track and monitor inventory across all branches
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.cardBg} rounded-xl p-6 shadow-lg border-2 ${stat.borderColor}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{stat.subtitle}</p>
                </div>
                <div
                  className={`${stat.iconBg} ${stat.iconColor} p-3 rounded-lg`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-red-600"
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
            <h2 className="text-lg font-bold text-gray-900">Low Stock Alert</h2>
            <span className="ml-auto text-sm text-gray-600">
              {filteredLowStock.length}{" "}
              {filteredLowStock.length === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="space-y-3">
            {filteredLowStock.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-gray-600">
                      Current:{" "}
                      <span className="font-medium text-red-600">
                        {item.current} {item.unit}
                      </span>{" "}
                      | Min:{" "}
                      <span className="font-medium">
                        {item.minimum} {item.unit}
                      </span>
                    </p>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {item.branch}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLowStock.length === 0 && (
            <div className="bg-white rounded-lg p-8 text-center">
              <svg
                className="w-12 h-12 text-green-500 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-600">
                No low stock items in selected branch
              </p>
            </div>
          )}
        </div>

        {/* Inventory Items */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Inventory Items
            </h2>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
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
                </div>
                <input
                  type="text"
                  placeholder="Search by name, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="relative w-full md:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 w-full md:w-48 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
                >
                  <option>All Categories</option>
                  <option>Lubricants</option>
                  <option>Brakes</option>
                  <option>Filters</option>
                  <option>Batteries</option>
                  <option>Tires</option>
                  <option>Ignition</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <div className="relative w-full md:w-auto">
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 w-full md:w-48 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
                >
                  <option>All Branches</option>
                  <option>San Mateo Rizal</option>
                  <option>South Caloocan</option>
                  <option>North Caloocan</option>
                  <option>Quezon City</option>
                  <option>Camarin</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <div className="relative w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 w-full md:w-40 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
                >
                  <option>All Status</option>
                  <option>In Stock</option>
                  <option>Low Stock</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Unit Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Branch
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Supplier
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {item.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.branch}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.supplier}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4">
                      <button className="text-gray-600 hover:text-red-600 transition-colors duration-200">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No items found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {filteredItems.length > 0 && (
          <div className="mt-4 text-sm text-slate-300">
            Showing {filteredItems.length} of {inventoryItems.length} inventory
            items
          </div>
        )}
      </div>
    </BranchOwnerLayout>
  );
}

export default BranchOwnerInventory;