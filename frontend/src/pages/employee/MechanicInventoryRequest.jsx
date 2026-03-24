import React, { useState } from "react";
import MechanicLayout from "./MechanicLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

function MechanicInventoryRequests() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  // Request form state
  const [requestForm, setRequestForm] = useState({
    itemName: "",
    category: "",
    quantity: "",
    unit: "",
    urgency: "Normal",
    reason: "",
    notes: "",
  });

  // Previous requests
  const requests = [
    {
      id: "REQ-001",
      date: "2026-02-20",
      item: "Brake Pads Set",
      category: "Brakes",
      quantity: "2 Sets",
      status: "Approved",
      approvedBy: "Parts Manager",
      deliveredDate: "2026-02-20",
    },
    {
      id: "REQ-002",
      date: "2026-02-19",
      item: "Engine Oil 5W-30",
      category: "Lubricants",
      quantity: "5 Liters",
      status: "Delivered",
      approvedBy: "Parts Manager",
      deliveredDate: "2026-02-19",
    },
    {
      id: "REQ-003",
      date: "2026-02-19",
      item: "Air Filter",
      category: "Filters",
      quantity: "3 Pieces",
      status: "Pending",
      approvedBy: "-",
      deliveredDate: "-",
    },
    {
      id: "REQ-004",
      date: "2026-02-18",
      item: "Battery 12V 60Ah",
      category: "Batteries",
      quantity: "1 Piece",
      status: "Delivered",
      approvedBy: "Parts Manager",
      deliveredDate: "2026-02-18",
    },
    {
      id: "REQ-005",
      date: "2026-02-18",
      item: "Spark Plugs Set",
      category: "Ignition",
      quantity: "2 Sets",
      status: "Rejected",
      approvedBy: "Parts Manager",
      deliveredDate: "-",
    },
    {
      id: "REQ-006",
      date: "2026-02-17",
      item: "Coolant Fluid",
      category: "Lubricants",
      quantity: "4 Liters",
      status: "Delivered",
      approvedBy: "Parts Manager",
      deliveredDate: "2026-02-17",
    },
    {
      id: "REQ-007",
      date: "2026-02-17",
      item: "Tire 195/65R15",
      category: "Tires",
      quantity: "4 Pieces",
      status: "Approved",
      approvedBy: "Parts Manager",
      deliveredDate: "-",
    },
    {
      id: "REQ-008",
      date: "2026-02-16",
      item: "Brake Fluid",
      category: "Brakes",
      quantity: "2 Liters",
      status: "Delivered",
      approvedBy: "Parts Manager",
      deliveredDate: "2026-02-16",
    },
  ];

  const getStatusStyle = (status) => {
    const styles = {
      Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      Approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Delivered: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      Rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return styles[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All Status" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
  } = usePagination({
    items: filteredRequests,
    pageSize: 10,
    resetDeps: [searchQuery, statusFilter],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRequestForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    console.log("Request submitted:", requestForm);
    // Reset form
    setRequestForm({
      itemName: "",
      category: "",
      quantity: "",
      unit: "",
      urgency: "Normal",
      reason: "",
      notes: "",
    });
    setShowRequestForm(false);
    alert("Inventory request submitted successfully!");
  };

  // Calculate stats
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "Pending").length;
  const deliveredRequests = requests.filter(
    (r) => r.status === "Delivered",
  ).length;

  return (
    <MechanicLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Inventory Requests
            </h1>
            <p className="text-gray-400 mt-1">
              Request parts and tools for your jobs
            </p>
          </div>
          <button
            onClick={() => setShowRequestForm(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-red-600/30 flex items-center gap-2 self-start"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            New Request
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Requests Card */}
          <div className="bg-gray-900/60 border border-red-500/20 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/10 p-3 rounded-xl">
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-2xl font-black text-white">
                  {totalRequests}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Requests Card */}
          <div className="bg-gray-900/60 border border-yellow-500/20 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/10 p-3 rounded-xl">
                <svg
                  className="w-6 h-6 text-yellow-400"
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
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-black text-white">
                  {pendingRequests}
                </p>
              </div>
            </div>
          </div>

          {/* Delivered Requests Card */}
          <div className="bg-gray-900/60 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-3 rounded-xl">
                <svg
                  className="w-6 h-6 text-emerald-400"
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
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivered</p>
                <p className="text-2xl font-black text-white">
                  {deliveredRequests}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-black text-white mb-4">My Requests</h2>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-600"
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
                  placeholder="Search by item name, request ID, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-white/5 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 text-white placeholder-gray-500"
                />
              </div>

              <div className="relative w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none w-full md:w-40 bg-gray-800/60 border border-white/5 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 text-white cursor-pointer"
                >
                  <option className="bg-gray-900">All Status</option>
                  <option className="bg-gray-900">Pending</option>
                  <option className="bg-gray-900">Approved</option>
                  <option className="bg-gray-900">Delivered</option>
                  <option className="bg-gray-900">Rejected</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-500"
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
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Request ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Item
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Approved By
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Delivered
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedItems.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-white/[0.02] transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {request.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {request.date}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {request.item}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {request.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {request.quantity}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {request.approvedBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {request.deliveredDate}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-gray-500 hover:text-red-400 transition-colors duration-200">
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
          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-600 mx-auto mb-4"
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
              <h3 className="text-lg font-semibold text-white mb-2">
                No requests found
              </h3>
              <p className="text-gray-400">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {filteredRequests.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 space-y-4">
            <div>
              Showing {startItem}-{endItem} of {filteredRequests.length} requests
            </div>
            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}

        {/* Request Form Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/5 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-gray-900">
                <h2 className="text-2xl font-black text-white">
                  New Inventory Request
                </h2>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
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

              <form onSubmit={handleSubmitRequest} className="p-6">
                {/* Item Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Item Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        name="itemName"
                        value={requestForm.itemName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-800/60 border border-white/5 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 text-white placeholder-gray-600"
                        placeholder="e.g., Brake Pads Set"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={requestForm.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-800/60 border border-white/5 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 text-white"
                      >
                        <option className="bg-gray-900" value="">
                          Select category
                        </option>
                        <option className="bg-gray-900" value="Lubricants">
                          Lubricants
                        </option>
                        <option className="bg-gray-900" value="Brakes">
                          Brakes
                        </option>
                        <option className="bg-gray-900" value="Filters">
                          Filters
                        </option>
                        <option className="bg-gray-900" value="Batteries">
                          Batteries
                        </option>
                        <option className="bg-gray-900" value="Tires">
                          Tires
                        </option>
                        <option className="bg-gray-900" value="Ignition">
                          Ignition
                        </option>
                        <option className="bg-gray-900" value="Tools">
                          Tools
                        </option>
                        <option className="bg-gray-900" value="Other">
                          Other
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Urgency *
                      </label>
                      <select
                        name="urgency"
                        value={requestForm.urgency}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-800/60 border border-white/5 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 text-white"
                      >
                        <option className="bg-gray-900" value="Normal">
                          Normal
                        </option>
                        <option className="bg-gray-900" value="Urgent">
                          Urgent
                        </option>
                        <option className="bg-gray-900" value="Critical">
                          Critical
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={requestForm.quantity}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full px-4 py-2 bg-gray-800/60 border border-white/5 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 text-white"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Unit *
                      </label>
                      <select
                        name="unit"
                        value={requestForm.unit}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-800/60 border border-white/5 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 text-white"
                      >
                        <option className="bg-gray-900" value="">
                          Select unit
                        </option>
                        <option className="bg-gray-900" value="Pieces">
                          Pieces
                        </option>
                        <option className="bg-gray-900" value="Sets">
                          Sets
                        </option>
                        <option className="bg-gray-900" value="Liters">
                          Liters
                        </option>
                        <option className="bg-gray-900" value="Bottles">
                          Bottles
                        </option>
                        <option className="bg-gray-900" value="Boxes">
                          Boxes
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Request Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Reason for Request *
                      </label>
                      <input
                        type="text"
                        name="reason"
                        value={requestForm.reason}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 bg-gray-800/60 border border-white/5 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 text-white placeholder-gray-600"
                        placeholder="e.g., For customer job #123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        name="notes"
                        value={requestForm.notes}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-2 bg-gray-800/60 border border-white/5 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 text-white placeholder-gray-600"
                        placeholder="Any additional information..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors border border-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-red-600/30"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MechanicLayout>
  );
}

export default MechanicInventoryRequests;
