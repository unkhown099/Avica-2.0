import React, { useEffect, useState } from "react";
import BranchOwnerLayout from "./BranchOwnerLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import { API_BASE } from "../../hooks/useAuth.js";
import { getUserFromSession } from "../../utils/getUser.js";

const roleBadge = {
  Admin: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "Business Owner": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Branch Manager": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Staff: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Employee: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Inventory: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const roleColors = {
  Admin: "#6366f1",
  "Business Owner": "#a855f7",
  "Branch Manager": "#a855f7",
  Staff: "#06b6d4",
  Employee: "#3b82f6",
  Inventory: "#f97316",
};

const roles = [
  "Admin",
  "Business Owner",
  "Branch Manager",
  "Staff",
  "Employee",
  "Inventory",
];

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
    } else setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);
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
            throw new Error("Session expired.");
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

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_BASE}/owner/branches/`, { headers, credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) =>
        setBranches(data.map((b) => ({ id: b.id, name: b.name }))),
      )
      .catch(() => {});
  }, [isAuthenticated, headers]);

  const roleCounts = roles.reduce((acc, r) => {
    acc[r] = staffAccounts.filter((s) => s.role === r).length;
    return acc;
  }, {});
  const formatStaffName = (staff) => {
    if (staff.first_name && staff.last_name)
      return `${staff.first_name} ${staff.last_name}`;
    if (staff.first_name) return staff.first_name;
    if (staff.last_name) return staff.last_name;
    return staff.email?.split("@")[0] || "Unknown";
  };

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
  } = usePagination({
    items: staffAccounts,
    pageSize: 10,
    resetDeps: [
      searchQuery,
      roleFilter,
      branchFilter,
      statusFilter,
      staffAccounts.length,
    ],
  });

  if (!isAuthenticated && !loading) {
    return (
      <BranchOwnerLayout title="" subtitle="">
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">
              ⚠️ Authentication Required
            </div>
            <p className="text-gray-400">
              Please login to access staff accounts.
            </p>
          </div>
        </div>
      </BranchOwnerLayout>
    );
  }

  return (
    <BranchOwnerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Account Management
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            View staff accounts across all branches
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 sm:px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold">
            <svg
              className="w-5 h-5 shrink-0"
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

        {/* Role stats - horizontal scroll on mobile */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6 sm:mb-8 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible">
          {roles.map((role) => (
            <div
              key={role}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-3 sm:p-4 backdrop-blur-sm hover:border-white/10 transition-all cursor-pointer shrink-0 min-w-[110px] sm:min-w-0"
              onClick={() => setRoleFilter(role)}
            >
              <div className="text-xl sm:text-2xl font-black text-white mb-1">
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
        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
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
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all text-sm"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500/50 transition-all cursor-pointer text-sm"
            >
              <option value="All Roles">All Roles</option>
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500/50 transition-all cursor-pointer text-sm"
            >
              <option value="All Branches">All Branches</option>
              {branches.map((b) => (
                <option key={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="col-span-2 sm:col-span-1 bg-gray-900/60 border border-white/10 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500/50 transition-all cursor-pointer text-sm"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Mobile staff cards */}
        <div className="md:hidden space-y-3 mb-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-800 shrink-0" />
                  <div className="space-y-2">
                    <div className="h-3.5 w-28 bg-gray-800 rounded" />
                    <div className="h-3 w-36 bg-gray-800 rounded" />
                  </div>
                  <div className="ml-auto h-6 w-20 bg-gray-800 rounded-full" />
                </div>
              </div>
            ))
          ) : staffAccounts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-500">No staff found</p>
            </div>
          ) : (
            paginatedItems.map((staff) => {
              const staffName = formatStaffName(staff);
              const staffRole = staff.role || "Staff";
              return (
                <div
                  key={staff.id}
                  className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
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
                        <div className="text-white font-semibold text-sm">
                          {staffName}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {staff.email || "—"}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadge[staffRole] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                    >
                      {staffRole}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {staff.branch_name || staff.branch || "Unassigned"}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${(staff.status || "Active") === "Active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                    >
                      {staff.status || "Active"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Phone</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Branch</div>
                <div className="col-span-2">Status</div>
              </div>
              {loading ? (
                <div className="py-20 text-center">
                  <div className="inline-block w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                  <p className="text-gray-500 mt-4">
                    Loading staff accounts...
                  </p>
                </div>
              ) : staffAccounts.length === 0 ? (
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
                      className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                    >
                      <div className="col-span-4">
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
                              className="text-white font-semibold text-sm truncate max-w-[200px]"
                              title={staffName}
                            >
                              {staffName}
                            </div>
                            <div className="text-gray-500 text-xs truncate max-w-[200px]">
                              {staff.email || "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 text-gray-400 text-sm">
                        {staff.phone || "—"}
                      </div>
                      <div className="col-span-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadge[staffRole] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                        >
                          {staffRole}
                        </span>
                      </div>
                      <div className="col-span-2 text-gray-400 text-sm truncate">
                        {branchName}
                      </div>
                      <div className="col-span-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${status === "Active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {!loading && staffAccounts.length > 0 && (
                <div className="px-6 py-4 border-t border-white/5">
                  <p className="text-gray-500 text-sm">
                    Showing{" "}
                    <span className="text-white font-semibold">
                      {startItem}-{endItem}
                    </span>{" "}
                    of{" "}
                    <span className="text-white font-semibold">
                      {staffAccounts.length}
                    </span>{" "}
                    staff accounts
                  </p>
                </div>
              )}
              {!loading && staffAccounts.length > 0 && (
                <Pagination
                  current={currentPage}
                  total={totalPages}
                  onChange={setCurrentPage}
                  className="px-6 pb-6"
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile pagination */}
        {!loading && staffAccounts.length > 0 && (
          <div className="md:hidden mt-2">
            <p className="text-gray-500 text-sm mb-3">
              Showing{" "}
              <span className="text-white font-semibold">
                {startItem}-{endItem}
              </span>{" "}
              of{" "}
              <span className="text-white font-semibold">
                {staffAccounts.length}
              </span>
            </p>
            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </BranchOwnerLayout>
  );
}

export default BranchOwnerAccountManagement;