import React, { useState } from "react";
import AdminLayout from "./AdminLayout";

function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState("");

  const segmentationData = [
    {
      label: "High Value",
      count: 145,
      percentage: "12% of total",
      color: "#ef4444",
    },
    {
      label: "Regular",
      count: 523,
      percentage: "42% of total",
      color: "#6b7280",
    },
    { label: "New", count: 379, percentage: "30% of total", color: "#3b82f6" },
    {
      label: "At Risk",
      count: 200,
      percentage: "16% of total",
      color: "#f59e0b",
    },
  ];

  const segmentBadgeStyle = {
    "High Value": "bg-red-500/20 text-red-400 border-red-500/30",
    Regular: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    New: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "At Risk": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  const [customers] = useState([
    {
      id: "CUST-001",
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+63 912 345 6789",
      vehicles: 2,
      totalSpent: "₱45,000",
      visits: 12,
      segment: "High Value",
      satisfaction: "95%",
    },
    {
      id: "CUST-002",
      name: "Jane Smith",
      email: "jane.smith@email.com",
      phone: "+63 923 456 7890",
      vehicles: 1,
      totalSpent: "₱28,000",
      visits: 7,
      segment: "Regular",
      satisfaction: "88%",
    },
    {
      id: "CUST-003",
      name: "Robert Wilson",
      email: "robert.w@email.com",
      phone: "+63 934 567 8901",
      vehicles: 3,
      totalSpent: "₱67,000",
      visits: 18,
      segment: "High Value",
      satisfaction: "92%",
    },
    {
      id: "CUST-004",
      name: "Emily Brown",
      email: "emily.brown@email.com",
      phone: "+63 945 678 9012",
      vehicles: 1,
      totalSpent: "₱12,000",
      visits: 3,
      segment: "New",
      satisfaction: "85%",
    },
    {
      id: "CUST-005",
      name: "Michael Chen",
      email: "michael.chen@email.com",
      phone: "+63 956 789 0123",
      vehicles: 2,
      totalSpent: "₱38,500",
      visits: 9,
      segment: "Regular",
      satisfaction: "90%",
    },
    {
      id: "CUST-006",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+63 967 890 1234",
      vehicles: 1,
      totalSpent: "₱8,500",
      visits: 2,
      segment: "New",
      satisfaction: "82%",
    },
    {
      id: "CUST-007",
      name: "David Martinez",
      email: "david.m@email.com",
      phone: "+63 978 901 2345",
      vehicles: 4,
      totalSpent: "₱89,000",
      visits: 24,
      segment: "High Value",
      satisfaction: "97%",
    },
    {
      id: "CUST-008",
      name: "Lisa Anderson",
      email: "lisa.anderson@email.com",
      phone: "+63 989 012 3456",
      vehicles: 1,
      totalSpent: "₱18,500",
      visits: 5,
      segment: "At Risk",
      satisfaction: "78%",
    },
  ]);

  const segmentColors = {
    "High Value": "#ef4444",
    Regular: "#6b7280",
    New: "#3b82f6",
    "At Risk": "#f59e0b",
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Customers
            </h1>
            <p className="text-gray-400 mt-1">
              Manage customer profiles and relationships
            </p>
          </div>
        </div>

        {/* Segmentation Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {segmentationData.map((seg) => (
            <div
              key={seg.label}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm hover:border-white/10 transition-all"
            >
              <div className="text-2xl font-black text-white mb-1">
                {seg.count}
              </div>
              <div className="text-xs text-gray-400 font-medium">
                {seg.label}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {seg.percentage}
              </div>
              <div className="mt-2 h-1 rounded-full bg-gray-800">
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: `${(seg.count / 1247) * 100}%`,
                    backgroundColor: seg.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
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
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
          />
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-1 text-center">Vehicles</div>
            <div className="col-span-2">Total Spent</div>
            <div className="col-span-1 text-center">Visits</div>
            <div className="col-span-1">Segment</div>
            <div className="col-span-1 text-center">Rating</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Body */}
          {filteredCustomers.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg">No customers found</p>
              <p className="text-gray-600 text-sm mt-1">
                Try adjusting your search
              </p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group"
              >
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor:
                          (segmentColors[customer.segment] || "#6b7280") + "22",
                        color: segmentColors[customer.segment] || "#6b7280",
                      }}
                    >
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {customer.name}
                      </div>
                      <div className="text-gray-500 text-xs truncate max-w-[140px]">
                        {customer.email}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-gray-400 text-sm">
                  {customer.phone}
                </div>
                <div className="col-span-1 text-center text-gray-400 text-sm">
                  {customer.vehicles}
                </div>
                <div className="col-span-2 text-white font-bold text-sm">
                  {customer.totalSpent}
                </div>
                <div className="col-span-1 text-center text-gray-400 text-sm">
                  {customer.visits}
                </div>
                <div className="col-span-1">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${segmentBadgeStyle[customer.segment]}`}
                  >
                    {customer.segment}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <svg
                      className="w-3.5 h-3.5 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs font-bold text-white">
                      {customer.satisfaction}
                    </span>
                  </div>
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

          {filteredCustomers.length > 0 && (
            <div className="px-6 py-4 flex items-center justify-between">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {filteredCustomers.length}
                </span>{" "}
                of{" "}
                <span className="text-white font-semibold">
                  {customers.length}
                </span>{" "}
                customers
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminCustomers;
