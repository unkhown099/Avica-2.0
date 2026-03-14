import React, { useState } from "react";
import AdminLayout from "./AdminLayout";

function AdminServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [branchFilter, setBranchFilter] = useState("All Branches");

  const [services] = useState([
    {
      id: "SRV-001",
      name: "Oil Change",
      category: "Maintenance",
      description: "Complete engine oil and filter replacement",
      duration: "30-45 mins",
      price: "₱1,500 - ₱2,500",
      status: "Active",
      branches: [
        "San Mateo Rizal",
        "South Caloocan",
        "North Caloocan",
        "Quezon City",
      ],
    },
    {
      id: "SRV-002",
      name: "Brake Repair",
      category: "Repair",
      description: "Brake pad replacement and system inspection",
      duration: "1-2 hours",
      price: "₱3,500 - ₱8,500",
      status: "Active",
      branches: ["San Mateo Rizal", "North Caloocan", "Quezon City"],
    },
    {
      id: "SRV-003",
      name: "Engine Diagnostic",
      category: "Diagnostic",
      description: "Complete engine system diagnostic check",
      duration: "45-60 mins",
      price: "₱2,000 - ₱3,500",
      status: "Active",
      branches: ["San Mateo Rizal", "South Caloocan", "Quezon City"],
    },
    {
      id: "SRV-004",
      name: "Tire Replacement",
      category: "Maintenance",
      description: "Tire installation, balancing, and alignment",
      duration: "1-1.5 hours",
      price: "₱8,000 - ₱15,000",
      status: "Active",
      branches: [
        "San Mateo Rizal",
        "South Caloocan",
        "North Caloocan",
        "Quezon City",
      ],
    },
    {
      id: "SRV-005",
      name: "AC Service",
      category: "Maintenance",
      description: "Air conditioning system cleaning and recharge",
      duration: "1-2 hours",
      price: "₱2,500 - ₱5,000",
      status: "Active",
      branches: ["South Caloocan", "Quezon City"],
    },
    {
      id: "SRV-006",
      name: "Transmission Repair",
      category: "Repair",
      description: "Transmission system inspection and repair",
      duration: "3-5 hours",
      price: "₱15,000 - ₱35,000",
      status: "Inactive",
      branches: ["San Mateo Rizal"],
    },
    {
      id: "SRV-007",
      name: "Battery Replacement",
      category: "Maintenance",
      description: "Battery testing and replacement service",
      duration: "20-30 mins",
      price: "₱3,000 - ₱8,000",
      status: "Active",
      branches: [
        "San Mateo Rizal",
        "South Caloocan",
        "North Caloocan",
        "Quezon City",
      ],
    },
    {
      id: "SRV-008",
      name: "Body Work & Paint",
      category: "Cosmetic",
      description: "Dent removal, painting, and detailing",
      duration: "1-3 days",
      price: "₱10,000 - ₱50,000",
      status: "Active",
      branches: ["San Mateo Rizal", "North Caloocan"],
    },
  ]);

  const categoryColors = {
    Maintenance: {
      badge: "bg-red-500/20 text-red-400 border-red-500/30",
      accent: "#ef4444",
    },
    Repair: {
      badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      accent: "#f59e0b",
    },
    Diagnostic: {
      badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      accent: "#a855f7",
    },
    Cosmetic: {
      badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      accent: "#3b82f6",
    },
  };

  const getStatusBadge = (status) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${status === "Active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
    >
      {status}
    </span>
  );

  const getCategoryBadge = (category) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColors[category]?.badge || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
    >
      {category}
    </span>
  );

  const filteredServices = services.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)) &&
      (categoryFilter === "All Categories" || s.category === categoryFilter) &&
      (branchFilter === "All Branches" || s.branches.includes(branchFilter))
    );
  });

  const categoryCounts = [
    "Maintenance",
    "Repair",
    "Diagnostic",
    "Cosmetic",
  ].reduce((acc, c) => {
    acc[c] = services.filter((s) => s.category === c).length;
    return acc;
  }, {});

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Services
            </h1>
            <p className="text-gray-400 mt-1">
              Manage services available at your shop
            </p>
          </div>
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 self-start md:self-auto">
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Maintenance", color: "#ef4444" },
            { label: "Repair", color: "#f59e0b" },
            { label: "Diagnostic", color: "#a855f7" },
            { label: "Cosmetic", color: "#3b82f6" },
          ].map(({ label, color }) => (
            <div
              key={label}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm hover:border-white/10 transition-all"
            >
              <div className="text-2xl font-black text-white mb-1">
                {categoryCounts[label] || 0}
              </div>
              <div className="text-xs text-gray-400 font-medium">{label}</div>
              <div className="mt-2 h-1 rounded-full bg-gray-800">
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: services.length
                      ? `${((categoryCounts[label] || 0) / services.length) * 100}%`
                      : "0%",
                    backgroundColor: color,
                  }}
                />
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
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[160px]"
          >
            <option value="All Categories">All Categories</option>
            {["Maintenance", "Repair", "Diagnostic", "Cosmetic"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[160px]"
          >
            <option value="All Branches">All Branches</option>
            {[
              "San Mateo Rizal",
              "South Caloocan",
              "North Caloocan",
              "Quezon City",
            ].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl py-20 text-center backdrop-blur-sm">
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <p className="text-gray-500 text-lg">No services found</p>
            <p className="text-gray-600 text-sm mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((service) => {
              const accent =
                categoryColors[service.category]?.accent || "#6b7280";
              return (
                <div
                  key={service.id}
                  className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm hover:border-white/10 transition-all group flex flex-col"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCategoryBadge(service.category)}
                      {getStatusBadge(service.status)}
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
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

                  {/* Title */}
                  <div className="mb-3">
                    <div className="flex items-center gap-3 mb-1">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: accent + "22" }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                      </div>
                      <h3 className="text-lg font-black text-white">
                        {service.name}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 font-mono ml-11">
                      {service.id}
                    </p>
                  </div>

                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-gray-600 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-500">
                        Duration:{" "}
                        <span className="text-gray-300 font-semibold">
                          {service.duration}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-gray-600 shrink-0"
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
                      <span className="text-gray-500">
                        Price:{" "}
                        <span className="text-white font-bold">
                          {service.price}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Branches */}
                  <div className="mb-5">
                    <p className="text-xs text-gray-600 mb-2">Available at:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {service.branches.map((b, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-400 text-xs rounded-lg"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
                      Deactivate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredServices.length > 0 && (
          <div className="mt-6 text-sm text-gray-500">
            Showing{" "}
            <span className="text-white font-semibold">
              {filteredServices.length}
            </span>{" "}
            of{" "}
            <span className="text-white font-semibold">{services.length}</span>{" "}
            services
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminServices;