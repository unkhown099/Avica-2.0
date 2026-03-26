import React, { useEffect, useState } from "react";
import BranchOwnerLayout from "./BranchOwnerLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import { API_BASE } from "../../hooks/useAuth.js";
import { getUserFromSession } from "../../utils/getUser.js";
import Swal from "sweetalert2";

function BranchOwnerAccountManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [headers, setHeaders] = useState({});

  const roleBadge = {
    "Admin": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Business Owner": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "Branch Manager": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "Staff": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Employee": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Inventory": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };

  const roleColors = {
    "Admin": "#6366f1",
    "Business Owner": "#a855f7",
    "Branch Manager": "#a855f7",
    "Staff": "#06b6d4",
    "Employee": "#3b82f6",
    "Inventory": "#f97316",
  };

  // All roles from your Staff model
  const roles = [
    "Admin",
    "Business Owner",
    "Branch Manager",
    "Staff",
    "Employee",
    "Inventory",
  ];

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

  // Fetch staff accounts
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query params
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (roleFilter !== "All Roles") params.append("role", roleFilter);
        if (branchFilter !== "All Branches")
          params.append("branch", branchFilter);
        if (statusFilter !== "All Status")
          params.append("status", statusFilter);

        const response = await fetch(
          `${API_BASE}/owner/staff/?${params.toString()}`,
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
          throw new Error("Failed to fetch staff accounts");
        }

        const data = await response.json();
        setStaffAccounts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
        setStaffAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [
    isAuthenticated,
    headers,
    searchQuery,
    roleFilter,
    branchFilter,
    statusFilter,
  ]);

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

  const roleCounts = roles.reduce((acc, r) => {
    acc[r] = staffAccounts.filter((s) => s.role === r).length;
    return acc;
  }, {});

  const filteredStaff = staffAccounts; // Already filtered by API

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
  } = usePagination({
    items: filteredStaff,
    pageSize: 10,
    resetDeps: [
      searchQuery,
      roleFilter,
      branchFilter,
      statusFilter,
      staffAccounts.length,
    ],
  });

  // Handle action
  const handleToggleStatus = async (staff) => {
    const newStatus = staff.status === "Active" ? "Inactive" : "Active";
    const result = await Swal.fire({
      title: `Confirm Action`,
      text: `Are you sure you want to ${newStatus === "Active" ? "activate" : "deactivate"} ${staff.first_name || staff.email}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: newStatus === "Active" ? "#10b981" : "#ef4444",
      cancelButtonColor: "#374151",
      confirmButtonText: `Yes, ${newStatus === "Active" ? "activate" : "deactivate"}`,
      background: "linear-gradient(to bottom right, #1f2937, #111827)",
      color: "#fff",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_BASE}/owner/staff/${staff.id}/`, {
          method: "PATCH",
          headers,
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) throw new Error("Failed to update status");

        const updatedStaff = await response.json();

        setStaffAccounts((prev) =>
          prev.map((s) => (s.id === staff.id ? updatedStaff : s))
        );

        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Account has been ${newStatus.toLowerCase()}d.`,
          background: "linear-gradient(to bottom right, #1f2937, #111827)",
          color: "#fff",
          confirmButtonColor: "#ef4444",
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message,
          background: "linear-gradient(to bottom right, #1f2937, #111827)",
          color: "#fff",
          confirmButtonColor: "#ef4444",
        });
      }
    }
  };

  // Format staff name
  const formatStaffName = (staff) => {
    if (staff.first_name && staff.last_name) {
      return `${staff.first_name} ${staff.last_name}`;
    }
    if (staff.first_name) return staff.first_name;
    if (staff.last_name) return staff.last_name;
    return staff.email?.split("@")[0] || "Unknown";
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
                Please login to access staff accounts.
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
            Account Management
          </h1>
          <p className="text-gray-400 mt-1">
            View and monitor staff accounts across all branches
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

        {/* Role Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {roles.map((role) => (
            <div
              key={role}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm hover:border-white/10 transition-all cursor-pointer"
              onClick={() => setRoleFilter(role)}
            >
              <div className="text-2xl font-black text-white mb-1">
                {roleCounts[role] || 0}
              </div>
              <div className="text-xs text-gray-400 font-medium truncate">
                {role}
              </div>
              <div className="mt-2 h-1 rounded-full bg-gray-800">
                <div
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: staffAccounts.length
                      ? `${((roleCounts[role] || 0) / staffAccounts.length) * 100}%`
                      : "0%",
                    backgroundColor: roleColors[role],
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
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
          >
            <option value="All Roles">All Roles</option>
            {roles.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
          >
            <option value="All Branches">All Branches</option>
            {branches.map((b) => (
              <option key={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
          >
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Branch</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Loading staff accounts...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg">No staff found</p>
              <p className="text-gray-600 text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            paginatedItems.map((staff) => {
              const staffName = formatStaffName(staff);
              const staffRole = staff.role || "Staff";
              const branchName =
                staff.branch_name || staff.branch || "Unassigned";
              const status = staff.status || "Active";

              return (
                <div
                  key={staff.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group"
                >
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                        style={{
                          backgroundColor:
                            (roleColors[staffRole] || "#6b7280") + "22",
                          color: roleColors[staffRole] || "#6b7280",
                        }}
                      >
                        {(staffName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div
                          className="text-white font-semibold text-sm truncate max-w-[180px]"
                          title={staffName}
                        >
                          {staffName}
                        </div>
                        <div
                          className="text-gray-500 text-xs truncate max-w-[150px]"
                          title={staff.email}
                        >
                          {staff.email || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="col-span-2 text-gray-400 text-sm truncate"
                    title={staff.phone}
                  >
                    {staff.phone || "—"}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadge[staffRole] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                    >
                      {staffRole}
                    </span>
                  </div>
                  <div
                    className="col-span-2 text-gray-400 text-sm truncate"
                    title={branchName}
                  >
                    {branchName}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${status === "Active"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => handleToggleStatus(staff)}
                      className={`opacity-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${status === "Active"
                          ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
                          : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                        }`}
                      title={status === "Active" ? "Deactivate Account" : "Activate Account"}
                    >
                      {status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {!loading && filteredStaff.length > 0 && (
            <div className="px-6 py-4 border-t border-white/5">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {startItem}-{endItem}
                </span>{" "}
                of{" "}
                <span className="text-white font-semibold">
                  {filteredStaff.length}
                </span>{" "}
                staff accounts
              </p>
            </div>
          )}

          {!loading && filteredStaff.length > 0 && (
            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
              className="px-6 pb-6"
            />
          )}
        </div>
      </div>
    </BranchOwnerLayout>
  );
}

export default BranchOwnerAccountManagement;