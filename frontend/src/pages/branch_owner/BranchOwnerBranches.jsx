import React, { useEffect, useState } from "react";
import BranchOwnerLayout from "./BranchOwnerLayout";
import { API_BASE } from "../../hooks/useAuth.js";
import { getUserFromSession } from "../../utils/getUser.js";

function BranchOwnerBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [headers, setHeaders] = useState({});

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

  // Fetch branches data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/owner/branches/`, {
          headers,
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("user");
            setIsAuthenticated(false);
            throw new Error("Session expired. Please login again.");
          }
          throw new Error("Failed to fetch branches");
        }

        const data = await response.json();
        setBranches(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [isAuthenticated, headers]);

  // Calculate summary stats
  const totalBranches = branches.length;
  const totalStaff = branches.reduce((sum, b) => sum + (b.staff_count || 0), 0);
  const totalRevenue = branches.reduce(
    (sum, b) => sum + (b.monthly_revenue || 0),
    0,
  );

  const formatRevenue = (amount) => {
    if (!amount && amount !== 0) return "₱0";
    return `₱${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const bayColor = (p) =>
    p >= 80 ? "#10b981" : p >= 60 ? "#f59e0b" : "#ef4444";

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    }
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const handleViewDetails = (branch) => {
    import("sweetalert2").then((m) => {
      const Swal = m.default;
      Swal.fire({
        title: `<span class="text-2xl font-black text-white">${branch.name}</span>`,
        html: `
          <div class="text-left space-y-4 mt-4">
            <div class="bg-gray-800/50 p-4 rounded-xl border border-white/5">
              <h4 class="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">General Information</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-[11px] text-gray-500 uppercase">Address</span>
                  <p class="text-sm text-white font-medium">${branch.address || "N/A"}</p>
                </div>
                <div>
                  <span class="text-[11px] text-gray-500 uppercase">Operating Hours</span>
                  <p class="text-sm text-white font-medium">${branch.hours || "N/A"}</p>
                </div>
                <div>
                  <span class="text-[11px] text-gray-500 uppercase">Status</span>
                  <p class="text-sm ${branch.is_active ? "text-emerald-400" : "text-gray-400"} font-medium">
                    ${branch.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                <div>
                  <span class="text-[11px] text-gray-500 uppercase">Service Bays (Slots)</span>
                  <p class="text-sm text-white font-medium">${branch.slots || 0}</p>
                </div>
              </div>
            </div>
  
            <div class="bg-gray-800/50 p-4 rounded-xl border border-white/5">
              <h4 class="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Personnel</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-[11px] text-gray-500 uppercase">Branch Manager</span>
                  <p class="text-sm text-white font-medium">${branch.manager_name || "Unassigned"}</p>
                </div>
                <div class="flex items-center gap-6">
                  <div>
                    <span class="text-[11px] text-gray-500 uppercase">Staff</span>
                    <p class="text-sm text-white font-medium">${branch.staff_count || 0}</p>
                  </div>
                  <div>
                    <span class="text-[11px] text-gray-500 uppercase">Mechanics</span>
                    <p class="text-sm text-white font-medium">${branch.mechanic_count || 0}</p>
                  </div>
                </div>
              </div>
            </div>
  
            <div class="bg-gray-800/50 p-4 rounded-xl border border-white/5">
              <h4 class="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Performance Overview</h4>
              <div class="grid grid-cols-2 flex-wrap gap-4">
                <div>
                  <span class="text-[11px] text-gray-500 uppercase">Services Completed</span>
                  <p class="text-sm text-white font-medium">${branch.services_completed || 0}</p>
                </div>
                <div>
                  <span class="text-[11px] text-gray-500 uppercase">Monthly Revenue</span>
                  <p class="text-sm text-emerald-400 font-bold">${formatRevenue(branch.monthly_revenue)}</p>
                </div>
                <div>
                  <span class="text-[11px] text-gray-500 uppercase">Bay Utilization</span>
                  <p class="text-sm text-white font-medium">${branch.bay_utilization || 0}%</p>
                </div>
                <div>
                  <span class="text-[11px] text-gray-500 uppercase">Satisfaction</span>
                  <p class="text-sm text-amber-400 font-medium">${branch.satisfaction_pct ? branch.satisfaction_pct + "%" : "No ratings yet"}</p>
                </div>
              </div>
            </div>
          </div>
        `,
        background: "linear-gradient(to bottom right, #1f2937, #111827)",
        color: "#fff",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Close",
        width: '500px',
      });
    });
  };

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
              <p className="text-gray-400">
                Please login to access branch information.
              </p>
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
            Branches
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor and compare performance across all branches
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Branches",
              value: loading ? "..." : totalBranches,
              color: "#ef4444",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              ),
            },
            {
              label: "Total Staff",
              value: loading ? "..." : totalStaff,
              color: "#3b82f6",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              ),
            },
            {
              label: "Total Revenue",
              value: loading ? "..." : formatRevenue(totalRevenue),
              color: "#10b981",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
            </div>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm animate-pulse"
              >
                <div className="h-6 bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2 mb-4"></div>
                <div className="h-16 bg-gray-800 rounded mb-4"></div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="h-20 bg-gray-800 rounded"></div>
                  <div className="h-20 bg-gray-800 rounded"></div>
                </div>
                <div className="h-10 bg-gray-800 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Branch Cards */}
        {!loading && branches.length === 0 ? (
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="text-gray-500 text-lg">No branches found</p>
            <p className="text-gray-600 text-sm mt-1">
              No active branches available
            </p>
          </div>
        ) : (
          !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm hover:border-white/10 transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-black text-white">
                        {branch.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <svg
                          className="w-3.5 h-3.5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {branch.address}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(branch.is_active)}`}
                    >
                      {branch.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-black shrink-0">
                      {branch.manager_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">
                        Branch Manager
                      </div>
                      <div className="text-white font-semibold text-sm">
                        {branch.manager_name}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                      <div className="text-2xl font-black text-white">
                        {branch.staff_count || 0}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">Staff</div>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                      <div className="text-2xl font-black text-white">
                        {branch.mechanic_count || 0}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Mechanics
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 font-semibold">
                        Bay Utilization
                      </span>
                      <span
                        className="text-xs font-black"
                        style={{ color: bayColor(branch.bay_utilization || 0) }}
                      >
                        {branch.bay_utilization || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${branch.bay_utilization || 0}%`,
                          backgroundColor: bayColor(
                            branch.bay_utilization || 0,
                          ),
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-4 space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Services Completed (This Month)
                      </span>
                      <span className="text-white font-bold">
                        {branch.services_completed || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Monthly Revenue</span>
                      <span className="text-emerald-400 font-bold">
                        {formatRevenue(branch.monthly_revenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Satisfaction</span>
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5 text-amber-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-white font-bold text-sm">
                          {branch.satisfaction_pct !== null
                            ? `${branch.satisfaction_pct}%`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewDetails(branch)}
                    className="mt-auto w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/20"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </BranchOwnerLayout>
  );
}

export default BranchOwnerBranches;