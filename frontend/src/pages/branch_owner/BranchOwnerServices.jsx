import React, { useState } from "react";
import BranchOwnerLayout from "./BranchOwnerLayout";

function BranchOwnerServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [branchFilter, setBranchFilter] = useState("All Branches");

  const services = [
    {
      id: "SRV-001",
      name: "Oil Change",
      category: "Maintenance",
      description: "Complete engine oil and filter replacement service",
      duration: "30-45 mins",
      priceRange: "₱800 - ₱1,500",
      branches: [
        "San Mateo Rizal",
        "South Caloocan",
        "North Caloocan",
        "Quezon City",
      ],
      status: "Active",
    },
    {
      id: "SRV-002",
      name: "Brake Repair",
      category: "Repair",
      description: "Brake pad replacement and system inspection",
      duration: "1-2 hours",
      priceRange: "₱2,500 - ₱5,000",
      branches: ["San Mateo Rizal", "South Caloocan", "Quezon City"],
      status: "Active",
    },
    {
      id: "SRV-003",
      name: "Engine Diagnostic",
      category: "Diagnostic",
      description: "Computerized engine diagnostics and problem identification",
      duration: "45-60 mins",
      priceRange: "₱1,200 - ₱2,000",
      branches: ["San Mateo Rizal", "North Caloocan", "Quezon City"],
      status: "Active",
    },
    {
      id: "SRV-004",
      name: "Tire Replacement",
      category: "Maintenance",
      description: "Tire replacement, balancing, and alignment",
      duration: "1-1.5 hours",
      priceRange: "₱3,000 - ₱8,000",
      branches: [
        "San Mateo Rizal",
        "South Caloocan",
        "North Caloocan",
        "Quezon City",
        "Camarin",
      ],
      status: "Active",
    },
    {
      id: "SRV-005",
      name: "AC Service",
      category: "Maintenance",
      description: "Air conditioning system cleaning and recharge",
      duration: "1-2 hours",
      priceRange: "₱1,500 - ₱3,500",
      branches: ["San Mateo Rizal", "South Caloocan", "Quezon City", "Camarin"],
      status: "Active",
    },
    {
      id: "SRV-006",
      name: "Transmission Repair",
      category: "Repair",
      description: "Transmission diagnostics and repair services",
      duration: "2-4 hours",
      priceRange: "₱5,000 - ₱15,000",
      branches: ["San Mateo Rizal", "South Caloocan"],
      status: "Active",
    },
    {
      id: "SRV-007",
      name: "Battery Replacement",
      category: "Maintenance",
      description: "Battery testing and replacement service",
      duration: "20-30 mins",
      priceRange: "₱3,500 - ₱6,000",
      branches: [
        "San Mateo Rizal",
        "South Caloocan",
        "North Caloocan",
        "Quezon City",
        "Camarin",
      ],
      status: "Active",
    },
    {
      id: "SRV-008",
      name: "Body Work & Paint",
      category: "Cosmetic",
      description: "Dent repair, painting, and body restoration",
      duration: "1-3 days",
      priceRange: "₱8,000 - ₱50,000",
      branches: ["San Mateo Rizal", "South Caloocan"],
      status: "Active",
    },
  ];

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "All Categories" ||
      service.category === categoryFilter;
    const matchesBranch =
      branchFilter === "All Branches" ||
      service.branches.includes(branchFilter);

    return matchesSearch && matchesCategory && matchesBranch;
  });

  const getCategoryBadge = (category) => {
    const colors = {
      Maintenance: "bg-blue-100 text-blue-700 border-blue-200",
      Repair: "bg-red-100 text-red-700 border-red-200",
      Diagnostic: "bg-purple-100 text-purple-700 border-purple-200",
      Cosmetic: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return colors[category] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <BranchOwnerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 -m-8 p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Services</h1>
          <p className="text-slate-300">
            View and monitor services across all branches
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
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
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="relative w-full md:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
              >
                <option>All Categories</option>
                <option>Maintenance</option>
                <option>Repair</option>
                <option>Diagnostic</option>
                <option>Cosmetic</option>
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

            <div className="relative w-full md:w-48">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
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
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryBadge(service.category)}`}
                    >
                      {service.category}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {service.description}
              </p>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{service.duration}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-semibold text-gray-900">
                    {service.priceRange}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Available at:</p>
                <div className="flex flex-wrap gap-1">
                  {service.branches.map((branch, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                    >
                      {branch}
                    </span>
                  ))}
                </div>
              </div>

              <button className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium border border-gray-300">
                View Details
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-lg text-center">
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No services found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Results Counter */}
        {filteredServices.length > 0 && (
          <div className="mt-6 text-sm text-slate-300">
            Showing {filteredServices.length} of {services.length} services
          </div>
        )}
      </div>
    </BranchOwnerLayout>
  );
}

export default BranchOwnerServices;
