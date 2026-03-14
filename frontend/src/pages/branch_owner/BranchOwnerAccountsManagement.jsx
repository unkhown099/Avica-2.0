import React, { useState } from "react";
import BranchOwnerLayout from "./BranchOwnerLayout";

function BranchOwnerAccountManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const staffAccounts = [
    {
      id: 1,
      name: "Carl Roy Gamilla",
      email: "carl@otokwikk.com",
      phone: "0917-123-4567",
      role: "Branch Manager",
      branch: "San Mateo Rizal",
      status: "Active",
    },
    {
      id: 2,
      name: "Shawn Cabutin",
      email: "shawn@otokwikk.com",
      phone: "0918-234-5678",
      role: "Branch Manager",
      branch: "South Caloocan",
      status: "Active",
    },
    {
      id: 3,
      name: "John Charles Aguilar",
      email: "john@otokwikk.com",
      phone: "0919-345-6789",
      role: "Branch Manager",
      branch: "Quezon City",
      status: "Active",
    },
    {
      id: 4,
      name: "Jerald Galdiano",
      email: "jerald@otokwikk.com",
      phone: "0920-456-7890",
      role: "Branch Manager",
      branch: "North Caloocan",
      status: "Active",
    },
    {
      id: 5,
      name: "Maria Santos",
      email: "maria@otokwikk.com",
      phone: "0921-567-8901",
      role: "Branch Manager",
      branch: "Camarin",
      status: "Active",
    },
    {
      id: 6,
      name: "Mike Johnson",
      email: "mike.j@otokwikk.com",
      phone: "0922-678-9012",
      role: "Mechanic",
      branch: "San Mateo Rizal",
      status: "Active",
    },
    {
      id: 7,
      name: "Sarah Connor",
      email: "sarah.c@otokwikk.com",
      phone: "0923-789-0123",
      role: "Mechanic",
      branch: "North Caloocan",
      status: "Active",
    },
    {
      id: 8,
      name: "Tom Hardy",
      email: "tom.h@otokwikk.com",
      phone: "0924-890-1234",
      role: "Mechanic",
      branch: "Quezon City",
      status: "Active",
    },
    {
      id: 9,
      name: "Lisa Davis",
      email: "lisa.d@otokwikk.com",
      phone: "0925-901-2345",
      role: "Mechanic",
      branch: "South Caloocan",
      status: "Active",
    },
    {
      id: 10,
      name: "Robert Lee",
      email: "robert.l@otokwikk.com",
      phone: "0926-012-3456",
      role: "Service Advisor",
      branch: "San Mateo Rizal",
      status: "Active",
    },
    {
      id: 11,
      name: "Jennifer White",
      email: "jen.w@otokwikk.com",
      phone: "0927-123-4567",
      role: "Service Advisor",
      branch: "South Caloocan",
      status: "Active",
    },
    {
      id: 12,
      name: "David Brown",
      email: "david.b@otokwikk.com",
      phone: "0928-234-5678",
      role: "Receptionist",
      branch: "Quezon City",
      status: "Active",
    },
    {
      id: 13,
      name: "Emily Garcia",
      email: "emily.g@otokwikk.com",
      phone: "0929-345-6789",
      role: "Receptionist",
      branch: "North Caloocan",
      status: "Active",
    },
    {
      id: 14,
      name: "James Wilson",
      email: "james.w@otokwikk.com",
      phone: "0930-456-7890",
      role: "Parts Manager",
      branch: "San Mateo Rizal",
      status: "Active",
    },
    {
      id: 15,
      name: "Patricia Martinez",
      email: "patricia.m@otokwikk.com",
      phone: "0931-567-8901",
      role: "Parts Manager",
      branch: "South Caloocan",
      status: "Active",
    },
  ];

  const roleBadge = {
    "Branch Manager": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Mechanic: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Service Advisor":
      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Receptionist: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Parts Manager": "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const roleColors = {
    "Branch Manager": "#a855f7",
    Mechanic: "#3b82f6",
    "Service Advisor": "#10b981",
    Receptionist: "#f59e0b",
    "Parts Manager": "#ef4444",
  };

  const roles = [
    "Branch Manager",
    "Mechanic",
    "Service Advisor",
    "Receptionist",
    "Parts Manager",
  ];
  const roleCounts = roles.reduce((acc, r) => {
    acc[r] = staffAccounts.filter((s) => s.role === r).length;
    return acc;
  }, {});

  const filteredStaff = staffAccounts.filter(
    (s) =>
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (roleFilter === "All Roles" || s.role === roleFilter) &&
      (branchFilter === "All Branches" || s.branch === branchFilter) &&
      (statusFilter === "All Status" || s.status === statusFilter),
  );

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

        {/* Role Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {roles.map((role) => (
            <div
              key={role}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm hover:border-white/10 transition-all"
            >
              <div className="text-2xl font-black text-white mb-1">
                {roleCounts[role] || 0}
              </div>
              <div className="text-xs text-gray-400 font-medium">{role}</div>
              <div className="mt-2 h-1 rounded-full bg-gray-800">
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${((roleCounts[role] || 0) / staffAccounts.length) * 100}%`,
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
          {[
            {
              value: roleFilter,
              onChange: setRoleFilter,
              options: ["All Roles", ...roles],
            },
            {
              value: branchFilter,
              onChange: setBranchFilter,
              options: [
                "All Branches",
                "San Mateo Rizal",
                "South Caloocan",
                "North Caloocan",
                "Quezon City",
                "Camarin",
              ],
            },
            {
              value: statusFilter,
              onChange: setStatusFilter,
              options: ["All Status", "Active", "Inactive"],
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
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Branch</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {filteredStaff.length === 0 ? (
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
            filteredStaff.map((staff) => (
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
                          (roleColors[staff.role] || "#6b7280") + "22",
                        color: roleColors[staff.role] || "#6b7280",
                      }}
                    >
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {staff.name}
                      </div>
                      <div className="text-gray-500 text-xs truncate max-w-[150px]">
                        {staff.email}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-gray-400 text-sm">
                  {staff.phone}
                </div>
                <div className="col-span-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadge[staff.role] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                  >
                    {staff.role}
                  </span>
                </div>
                <div className="col-span-2 text-gray-400 text-sm">
                  {staff.branch}
                </div>
                <div className="col-span-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    {staff.status}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
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
              </div>
            ))
          )}

          {filteredStaff.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {filteredStaff.length}
                </span>{" "}
                of{" "}
                <span className="text-white font-semibold">
                  {staffAccounts.length}
                </span>{" "}
                staff accounts
              </p>
            </div>
          )}
        </div>
      </div>
    </BranchOwnerLayout>
  );
}

export default BranchOwnerAccountManagement;