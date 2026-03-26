import React, { useState, useEffect } from "react";
import MechanicLayout from "./MechanicLayout";
import { useAuth, API_BASE } from "../../hooks/useAuth";

function MechanicDashboard() {
  const { user, token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    mechanic: null,
    stats: null,
    today_schedule: [],
    notifications: [],
  });

  // State for modals
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [jobActionLoading, setJobActionLoading] = useState(false);

  // Form states
  const [partRequest, setPartRequest] = useState({
    inventory_item_id: "",
    quantity: 1,
    notes: "",
  });

  const [jobReport, setJobReport] = useState({
    work_performed: "",
    parts_used: [],
    labor_hours: "",
    additional_notes: "",
  });

  const [availableParts, setAvailableParts] = useState([]);

  const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    return response.json();
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDashboardData();
    }
  }, [isAuthenticated, token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth(`${API_BASE}/api/mechanic/dashboard/`);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableParts = async () => {
    try {
      const branchId = dashboardData.mechanic?.branch || user?.branch_id;
      const url = branchId
        ? `${API_BASE}/api/inventory/?branch=${branchId}`
        : `${API_BASE}/api/inventory/`;
      const data = await fetchWithAuth(url);
      setAvailableParts(data.results || data || []);
    } catch (err) {
      console.error("Error fetching parts:", err);
    }
  };

  const handleJobAction = async (jobId, action) => {
    try {
      setJobActionLoading(true);
      await fetchWithAuth(`${API_BASE}/api/mechanic/jobs/${jobId}/action/`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      await fetchDashboardData();
      alert(`Job ${action}ed successfully!`);
    } catch (err) {
      console.error(`Error ${action} job:`, err);
      alert(`Failed to ${action} job. Please try again.`);
    } finally {
      setJobActionLoading(false);
    }
  };

  const handlePartsRequest = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      await fetchWithAuth(
        `${API_BASE}/api/mechanic/jobs/${selectedJob.id}/request-parts/`,
        {
          method: "POST",
          body: JSON.stringify(partRequest),
        },
      );
      alert("Parts request submitted successfully!");
      setShowPartsModal(false);
      setPartRequest({ inventory_item_id: "", quantity: 1, notes: "" });
    } catch (err) {
      console.error("Error requesting parts:", err);
      alert(err.message || "Failed to request parts. Please try again.");
    }
  };

  const handleJobReport = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      await fetchWithAuth(
        `${API_BASE}/api/mechanic/jobs/${selectedJob.id}/report/`,
        {
          method: "POST",
          body: JSON.stringify(jobReport),
        },
      );
      alert("Job report submitted successfully!");
      setShowReportModal(false);
      setJobReport({
        work_performed: "",
        parts_used: [],
        labor_hours: "",
        additional_notes: "",
      });
      await fetchDashboardData();
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Failed to submit report. Please try again.");
    }
  };

  const updateAvailability = async (status) => {
    try {
      await fetchWithAuth(`${API_BASE}/api/mechanic/availability/`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      await fetchDashboardData();
      alert(`Status updated to ${status}`);
    } catch (err) {
      console.error("Error updating availability:", err);
      alert("Failed to update availability. Please try again.");
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      done: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      in_service: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      waiting: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      skipped: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return styles[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getStatusText = (status) => {
    const texts = {
      done: "Completed",
      in_service: "In Progress",
      waiting: "Waiting",
      skipped: "Skipped",
    };
    return texts[status] || status;
  };

  const getNotificationStyle = (type) => {
    const styles = {
      info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      error: "bg-red-500/10 border-red-500/20 text-red-400",
    };
    return styles[type] || styles.info;
  };

  if (loading) {
    return (
      <MechanicLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </MechanicLayout>
    );
  }

  if (error) {
    return (
      <MechanicLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </MechanicLayout>
    );
  }

  const { mechanic, stats, today_schedule, notifications } = dashboardData;

  return (
    <MechanicLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Mechanic Dashboard
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1">
            <p className="text-gray-400 text-sm sm:text-base">
              Welcome back, {mechanic?.first_name || user?.first_name}{" "}
              {mechanic?.last_name || user?.last_name} —{" "}
              {mechanic?.branch_details?.name || user?.branch_name || "Branch"}
            </p>
            <div className="flex gap-2">
              <select
                value={mechanic?.status || "Active"}
                onChange={(e) => updateAvailability(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="Active">🟢 Active</option>
                <option value="On Break">⏸️ On Break</option>
                <option value="Off Duty">🔴 Off Duty</option>
              </select>
              <button
                onClick={fetchDashboardData}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg p-2 transition-colors"
                title="Refresh"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Today's Jobs */}
            <div className="bg-gray-900/60 border border-red-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-sm hover:border-opacity-60 transition-all">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="bg-red-500/10 text-red-400 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mb-1">
                {stats.today_jobs?.total || 0}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                Today's Jobs
              </div>
              <div className="text-xs font-semibold text-red-400">
                {stats.today_jobs?.completed || 0} completed,{" "}
                {stats.today_jobs?.pending || 0} pending
              </div>
            </div>

            {/* Active Job */}
            <div className="bg-gray-900/60 border border-blue-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-sm hover:border-opacity-60 transition-all">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="bg-blue-500/10 text-blue-400 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
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
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mb-1">
                {stats.active_job ? 1 : 0}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                Active Job
              </div>
              <div className="text-xs font-semibold text-blue-400 truncate">
                {stats.active_job?.service_name || "No active job"}
              </div>
            </div>

            {/* This Week */}
            <div className="bg-gray-900/60 border border-emerald-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-sm hover:border-opacity-60 transition-all">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="bg-emerald-500/10 text-emerald-400 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
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
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mb-1">
                {stats.week_stats?.completed || 0}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                Jobs Completed This Week
              </div>
              <div className="text-xs font-semibold text-emerald-400">
                ₱{stats.week_stats?.total_revenue?.toLocaleString() || 0}{" "}
                revenue
              </div>
            </div>

            {/* Performance Rating */}
            <div className="bg-gray-900/60 border border-purple-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-sm hover:border-opacity-60 transition-all">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="bg-purple-500/10 text-purple-400 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
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
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mb-1">
                {stats.performance_metrics?.avg_rating || "N/A"}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                Avg. Customer Rating
              </div>
              <div className="text-xs font-semibold text-purple-400">
                {stats.performance_metrics?.total_jobs_30d || 0} jobs (30 days)
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Today's Schedule
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                    Your assigned jobs for today
                  </p>
                </div>
                <button className="text-xs sm:text-sm text-red-400 hover:text-red-300 font-semibold transition-colors">
                  View all →
                </button>
              </div>

              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {today_schedule && today_schedule.length > 0 ? (
                  today_schedule.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 sm:p-6 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <span className="text-base sm:text-lg font-black text-white">
                              {new Date(job.assigned_at).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                            <span
                              className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(job.status)}`}
                            >
                              {getStatusText(job.status)}
                            </span>
                          </div>

                          <h4 className="font-bold text-white mb-2 text-sm sm:text-base">
                            {job.customer_name}
                          </h4>

                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                              <svg
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              <span className="truncate">
                                {job.vehicle_info?.vehicle || "N/A"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                              <svg
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600"
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
                              <span>{job.service_name}</span>
                            </div>

                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                              <svg
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600"
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
                              <span>₱{job.price?.toLocaleString() || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col gap-2 sm:ml-4">
                          {job.status === "waiting" && (
                            <button
                              onClick={() => handleJobAction(job.id, "start")}
                              disabled={jobActionLoading}
                              className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-colors disabled:opacity-50"
                            >
                              Start Job
                            </button>
                          )}
                          {job.status === "in_service" && (
                            <button
                              onClick={() => {
                                setSelectedJob(job);
                                setShowReportModal(true);
                              }}
                              disabled={jobActionLoading}
                              className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-colors disabled:opacity-50"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setShowJobModal(true);
                            }}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-semibold text-xs sm:text-sm border border-white/5 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No jobs scheduled for today
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Notifications */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
              <h3 className="text-base sm:text-lg font-black text-white mb-3 sm:mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    setShowPartsModal(true);
                    fetchAvailableParts();
                  }}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
                  Request Parts
                </button>

                <button
                  onClick={() => updateAvailability("On Break")}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
                  Take a Break
                </button>

                <button className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 border border-white/5">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  View Full Schedule
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-gray-900/60 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
              <h3 className="text-base sm:text-lg font-black text-white mb-3 sm:mb-4">
                Notifications
              </h3>
              <div className="space-y-2 sm:space-y-3 max-h-[300px] overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.map((notif, index) => (
                    <div
                      key={index}
                      className={`p-3 sm:p-4 border rounded-lg sm:rounded-xl ${getNotificationStyle(notif.type)}`}
                    >
                      <p className="text-xs sm:text-sm font-semibold">
                        {notif.title}
                      </p>
                      <p className="text-xs opacity-80 mt-1">{notif.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Job Details
              </h2>
              <button
                onClick={() => setShowJobModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
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
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">
                  Customer
                </label>
                <p className="text-white font-semibold mt-1">
                  {selectedJob.customer_name}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">
                  Vehicle
                </label>
                <p className="text-white mt-1">
                  {selectedJob.vehicle_info?.vehicle}
                </p>
                <p className="text-gray-400 text-sm">
                  {selectedJob.vehicle_info?.plate_number}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">
                  Service
                </label>
                <p className="text-white mt-1">{selectedJob.service_name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Notes</label>
                <p className="text-gray-300 mt-1 text-sm">
                  {selectedJob.notes || "No notes"}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Price</label>
                <p className="text-white font-semibold mt-1">
                  ₱{selectedJob.price?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">
                  Payment Status
                </label>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs mt-1 ${selectedJob.payment_status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}
                >
                  {selectedJob.payment_status || "unpaid"}
                </span>
              </div>
              {selectedJob.status === "waiting" && (
                <button
                  onClick={() => {
                    handleJobAction(selectedJob.id, "start");
                    setShowJobModal(false);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Start Job
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Parts Request Modal */}
      {showPartsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Request Parts
              </h2>
              <button
                onClick={() => setShowPartsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
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
            <form
              onSubmit={handlePartsRequest}
              className="p-4 sm:p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Part
                </label>
                <select
                  value={partRequest.inventory_item_id}
                  onChange={(e) =>
                    setPartRequest({
                      ...partRequest,
                      inventory_item_id: e.target.value,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="">Select a part</option>
                  {availableParts.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.name} - Available: {part.quantity}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={partRequest.quantity}
                  onChange={(e) =>
                    setPartRequest({
                      ...partRequest,
                      quantity: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={partRequest.notes}
                  onChange={(e) =>
                    setPartRequest({ ...partRequest, notes: e.target.value })
                  }
                  rows="3"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="Optional notes..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Job Report Modal */}
      {showReportModal && selectedJob && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Complete Job Report
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
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
            <form onSubmit={handleJobReport} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Work Performed
                </label>
                <textarea
                  value={jobReport.work_performed}
                  onChange={(e) =>
                    setJobReport({
                      ...jobReport,
                      work_performed: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  required
                  placeholder="Describe the work performed..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Labor Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={jobReport.labor_hours}
                  onChange={(e) =>
                    setJobReport({ ...jobReport, labor_hours: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={jobReport.additional_notes}
                  onChange={(e) =>
                    setJobReport({
                      ...jobReport,
                      additional_notes: e.target.value,
                    })
                  }
                  rows="2"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="Any additional notes..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
              >
                Submit & Complete Job
              </button>
            </form>
          </div>
        </div>
      )}
    </MechanicLayout>
  );
}

export default MechanicDashboard;
