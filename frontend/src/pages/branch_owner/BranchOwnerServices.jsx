import React, { useState, useEffect } from "react";
import BranchOwnerLayout from "./BranchOwnerLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import { API_BASE } from "../../hooks/useAuth.js";
import { getUserFromSession } from "../../utils/getUser.js";

function BranchOwnerServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [branchFilter, setBranchFilter] = useState("All Branches");

  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [headers, setHeaders] = useState({});

  // Category colors mapping
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
    Preventive: {
      badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      accent: "#10b981",
    },
    Electrical: {
      badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      accent: "#f97316",
    },
  };

  // Check authentication and get headers
  useEffect(() => {
    const user = getUserFromSession();
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    if (user && token) {
      setIsAuthenticated(true);
      setHeaders({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Fetch services data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query params
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (categoryFilter !== "All Categories")
          params.append("category", categoryFilter);
        if (branchFilter !== "All Branches")
          params.append("branch", branchFilter);

        const response = await fetch(
          `${API_BASE}/owner/services/?${params.toString()}`,
          { headers, credentials: "include" },
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("user");
            setIsAuthenticated(false);
            throw new Error("Session expired. Please login again.");
          }
          throw new Error("Failed to fetch services");
        }

        const data = await response.json();
        setServices(data);

        // Extract unique categories from services
        const uniqueCategories = [
          ...new Set(data.map((s) => s.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [isAuthenticated, headers, searchQuery, categoryFilter, branchFilter]);

  // Fetch branches for filter dropdown
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchBranches = async () => {
      try {
        const response = await fetch(`${API_BASE}/owner/branches/`, {
          headers,
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setBranches(data.map((b) => ({ id: b.id, name: b.name })));
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };

    fetchBranches();
  }, [isAuthenticated, headers]);

  // Calculate category counts
  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = services.filter((s) => s.category === category).length;
    return acc;
  }, {});

  const filteredServices = services; // Already filtered by API

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
  } = usePagination({
    items: filteredServices,
    pageSize: 9, // Changed to 9 for 3x3 grid
    resetDeps: [searchQuery, categoryFilter, branchFilter, services],
  });

  // If not authenticated, show message
  if (!isAuthenticated && !loading) {
    return (
      <BranchOwnerLayout title="" subtitle="">
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-red-400 text-xl mb-4">
                ⚠️ Authentication Required
              </div>
              <p className="text-gray-400">Please login to access services.</p>
            </div>
          </div>
        </div>
      </BranchOwnerLayout>
    );
  }

  return (
    <BranchOwnerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Services
          </h1>
          <p className="text-gray-400 mt-1">
            View and monitor services across all branches
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {!loading && categories.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {categories.slice(0, 6).map((category) => {
              const color = categoryColors[category]?.accent || "#6b7280";
              const count = categoryCounts[category] || 0;
              return (
                <div
                  key={category}
                  className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm hover:border-white/10 transition-all cursor-pointer"
                  onClick={() => setCategoryFilter(category)}
                >
                  <div className="text-2xl font-black text-white mb-1">
                    {count}
                  </div>
                  <div className="text-xs text-gray-400 font-medium truncate">
                    {category}
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-gray-800">
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${(count / services.length) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
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
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[160px]"
          >
            <option value="All Branches">All Branches</option>
            {branches.map((b) => (
              <option key={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm animate-pulse"
              >
                <div className="h-6 bg-gray-800 rounded w-24 mb-4"></div>
                <div className="h-5 bg-gray-800 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-20 mb-3"></div>
                <div className="h-16 bg-gray-800 rounded mb-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-800 rounded w-32"></div>
                  <div className="h-4 bg-gray-800 rounded w-28"></div>
                </div>
                <div className="h-10 bg-gray-800 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Services Grid */}
        {!loading && filteredServices.length === 0 ? (
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
          !loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedItems.map((service) => {
                  const accent =
                    categoryColors[service.category]?.accent || "#6b7280";
                  const badgeClass =
                    categoryColors[service.category]?.badge ||
                    "bg-gray-500/20 text-gray-400 border-gray-500/30";

                  return (
                    <div
                      key={service.id}
                      className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm hover:border-white/10 transition-all flex flex-col"
                    >
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
                        >
                          {service.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-1">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
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

                      <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-2">
                        {service.description}
                      </p>

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
                            {service.duration} mins
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
                          <span className="text-white font-bold">
                            {service.price_range}
                          </span>
                        </div>
                      </div>

                      <div className="mb-5">
                        <p className="text-xs text-gray-600 mb-2">
                          Available at:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {service.branch_names &&
                            service.branch_names.slice(0, 3).map((b, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-400 text-xs rounded-lg"
                              >
                                {b}
                              </span>
                            ))}
                          {service.branch_names &&
                            service.branch_names.length > 3 && (
                              <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-400 text-xs rounded-lg">
                                +{service.branch_names.length - 3} more
                              </span>
                            )}
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-white/5">
                        <button className="w-full text-center text-sm font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl transition-all">
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredServices.length > 0 && (
                <div className="mt-6 text-sm text-gray-500 space-y-4">
                  <p>
                    Showing{" "}
                    <span className="text-white font-semibold">
                      {startItem}-{endItem}
                    </span>{" "}
                    of{" "}
                    <span className="text-white font-semibold">
                      {filteredServices.length}
                    </span>{" "}
                    services
                  </p>
                  <Pagination
                    current={currentPage}
                    total={totalPages}
                    onChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )
        )}
      </div>
    </BranchOwnerLayout>
  );
}

export default BranchOwnerServices;