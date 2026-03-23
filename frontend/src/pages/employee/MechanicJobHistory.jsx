import React, { useState } from "react";
import MechanicLayout from "./MechanicLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

function MechanicJobHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [serviceFilter, setServiceFilter] = useState("All Services");

  // Job history data
  const jobHistory = [
    {
      id: "JOB-001",
      date: "2026-02-20",
      customer: "John Doe",
      vehicle: "Toyota Corolla 2020",
      service: "Oil Change",
      duration: "45 mins",
      rating: 5,
      completed: "09:45 AM",
    },
    {
      id: "JOB-002",
      date: "2026-02-19",
      customer: "Jane Smith",
      vehicle: "Honda Civic 2019",
      service: "Brake Inspection",
      duration: "1 hour",
      rating: 5,
      completed: "02:30 PM",
    },
    {
      id: "JOB-003",
      date: "2026-02-19",
      customer: "Robert Wilson",
      vehicle: "Ford Ranger 2021",
      service: "Engine Diagnostic",
      duration: "1.5 hours",
      rating: 4,
      completed: "11:00 AM",
    },
    {
      id: "JOB-004",
      date: "2026-02-18",
      customer: "Emily Brown",
      vehicle: "Nissan Altima 2022",
      service: "Tire Replacement",
      duration: "1 hour",
      rating: 5,
      completed: "03:15 PM",
    },
    {
      id: "JOB-005",
      date: "2026-02-18",
      customer: "Michael Chen",
      vehicle: "Mazda 3 2020",
      service: "Full Service",
      duration: "2 hours",
      rating: 5,
      completed: "10:30 AM",
    },
    {
      id: "JOB-006",
      date: "2026-02-17",
      customer: "Sarah Johnson",
      vehicle: "Hyundai Tucson 2021",
      service: "AC Service",
      duration: "1.5 hours",
      rating: 4,
      completed: "01:45 PM",
    },
    {
      id: "JOB-007",
      date: "2026-02-17",
      customer: "David Martinez",
      vehicle: "Kia Sportage 2022",
      service: "Battery Replacement",
      duration: "30 mins",
      rating: 5,
      completed: "04:00 PM",
    },
    {
      id: "JOB-008",
      date: "2026-02-16",
      customer: "Patricia Lee",
      vehicle: "Toyota Vios 2021",
      service: "Brake Repair",
      duration: "2 hours",
      rating: 5,
      completed: "09:30 AM",
    },
    {
      id: "JOB-009",
      date: "2026-02-16",
      customer: "James Wilson",
      vehicle: "Honda CR-V 2020",
      service: "Oil Change",
      duration: "40 mins",
      rating: 4,
      completed: "12:00 PM",
    },
    {
      id: "JOB-010",
      date: "2026-02-15",
      customer: "Linda Garcia",
      vehicle: "Nissan Navara 2022",
      service: "Engine Repair",
      duration: "3 hours",
      rating: 5,
      completed: "02:15 PM",
    },
    {
      id: "JOB-011",
      date: "2026-02-15",
      customer: "Kevin Moore",
      vehicle: "Mazda CX-5 2021",
      service: "Transmission Service",
      duration: "2.5 hours",
      rating: 4,
      completed: "10:45 AM",
    },
    {
      id: "JOB-012",
      date: "2026-02-14",
      customer: "Susan Taylor",
      vehicle: "Ford Everest 2020",
      service: "Tire Rotation",
      duration: "45 mins",
      rating: 5,
      completed: "03:30 PM",
    },
  ];

  const filteredJobs = jobHistory.filter((job) => {
    const matchesSearch =
      job.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesService =
      serviceFilter === "All Services" || job.service === serviceFilter;

    return matchesSearch && matchesService;
  });

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
  } = usePagination({
    items: filteredJobs,
    pageSize: 10,
    resetDeps: [searchQuery, serviceFilter, dateFilter],
  });

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, index) => (
          <svg
            key={index}
            className={`w-4 h-4 ${index < rating ? "text-yellow-400" : "text-gray-600"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  // Calculate stats
  const totalJobs = jobHistory.length;
  const averageRating = (
    jobHistory.reduce((sum, job) => sum + job.rating, 0) / totalJobs
  ).toFixed(1);
  const totalHoursWorked = jobHistory
    .reduce((sum, job) => {
      const hours = parseFloat(job.duration.replace(/[^\d.]/g, ""));
      return sum + (job.duration.includes("hour") ? hours : hours / 60);
    }, 0)
    .toFixed(1);

  return (
    <MechanicLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Job History
          </h1>
          <p className="text-gray-400 mt-1">
            View your completed jobs and performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Jobs Card */}
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-black text-white">{totalJobs}</p>
              </div>
            </div>
          </div>

          {/* Hours Worked Card */}
          <div className="bg-gray-900/60 border border-blue-500/20 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-3 rounded-xl">
                <svg
                  className="w-6 h-6 text-blue-400"
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
                <p className="text-sm text-gray-500">Hours Worked</p>
                <p className="text-2xl font-black text-white">
                  {totalHoursWorked}
                </p>
              </div>
            </div>
          </div>

          {/* Average Rating Card */}
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
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Rating</p>
                <p className="text-2xl font-black text-white">
                  {averageRating}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Job History Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-black text-white mb-4">
              Completed Jobs
            </h2>

            {/* Search and Filters */}
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
                  placeholder="Search by customer, vehicle, or job ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-white/5 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 text-white placeholder-gray-500"
                />
              </div>

              <div className="relative w-full md:w-auto">
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="appearance-none w-full md:w-48 bg-gray-800/60 border border-white/5 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 text-white cursor-pointer"
                >
                  <option className="bg-gray-900">All Services</option>
                  <option className="bg-gray-900">Oil Change</option>
                  <option className="bg-gray-900">Brake Inspection</option>
                  <option className="bg-gray-900">Engine Diagnostic</option>
                  <option className="bg-gray-900">Tire Replacement</option>
                  <option className="bg-gray-900">Full Service</option>
                  <option className="bg-gray-900">AC Service</option>
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

              <div className="relative w-full md:w-auto">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none w-full md:w-40 bg-gray-800/60 border border-white/5 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 text-white cursor-pointer"
                >
                  <option className="bg-gray-900">All Time</option>
                  <option className="bg-gray-900">Today</option>
                  <option className="bg-gray-900">This Week</option>
                  <option className="bg-gray-900">This Month</option>
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
                    Job ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Vehicle
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Completed
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedItems.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-white/[0.02] transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {job.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {job.date}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {job.customer}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {job.vehicle}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {job.service}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {job.duration}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {job.completed}
                    </td>
                    <td className="px-6 py-4">{renderStars(job.rating)}</td>
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
          {filteredJobs.length === 0 && (
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-2">
                No jobs found
              </h3>
              <p className="text-gray-400">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {filteredJobs.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 space-y-4">
            <div>
              Showing {startItem}-{endItem} of {filteredJobs.length} completed jobs
            </div>
            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </MechanicLayout>
  );
}

export default MechanicJobHistory;