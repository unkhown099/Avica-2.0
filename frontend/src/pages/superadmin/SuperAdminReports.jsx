// SuperAdminReports.jsx - Updated to match your backend URLs

import React, { useState, useEffect, useCallback } from "react";
import SuperAdminLayout from "./SuperAdminLayout.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { exportToCSV } from "../../components/admin/DashboardUI.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ─── Icon Components (SVG only, no icon library) ──────────────────────────────

const IconClipboardCheck = ({ className }) => (
  <svg
    className={className}
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
);

const IconClipboard = ({ className }) => (
  <svg
    className={className}
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
);

const IconUser = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const IconRefresh = ({ className }) => (
  <svg
    className={className}
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
);

const IconFilter = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

const IconSearch = ({ className }) => (
  <svg
    className={className}
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
);

const IconClose = ({ className }) => (
  <svg
    className={className}
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
);

const IconSuccess = ({ className }) => (
  <svg
    className={className}
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
);

const IconWarning = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const IconError = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const IconEmptyState = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);

const IconAuth = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
    />
  </svg>
);

const IconSecurity = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const IconData = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const IconAdmin = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

// ─── Action icon resolver ─────────────────────────────────────────────────────
function ActionIcon({ type }) {
  const t = (type || "").toLowerCase();
  if (t.includes("auth") || t.includes("nav"))
    return <IconAuth className="w-5 h-5 text-blue-400" />;
  if (t.includes("sec") || t.includes("security"))
    return <IconSecurity className="w-5 h-5 text-yellow-400" />;
  if (t.includes("sys") || t.includes("system"))
    return <IconClipboard className="w-5 h-5 text-purple-400" />;
  if (t.includes("prof") || t.includes("profile"))
    return <IconUser className="w-5 h-5 text-green-400" />;
  if (
    t.includes("data") ||
    t.includes("booking") ||
    t.includes("queue") ||
    t.includes("payment")
  )
    return <IconData className="w-5 h-5 text-indigo-400" />;
  if (t.includes("admin") || t.includes("staff"))
    return <IconAdmin className="w-5 h-5 text-red-400" />;
  return <IconClipboard className="w-5 h-5 text-gray-400" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SuperAdminReports() {
  const [activeTab, setActiveTab] = useState("audit-logs");
  const [auditLogs, setAuditLogs] = useState([]);
  const [userActions, setUserActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState({ user_id: "", type: "", days: "7" });
  const [users, setUsers] = useState([]);

  const getToken = () =>
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  // ── Fetch users for filter dropdown ───────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/super-admin/users-list/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, []);

  // ── Fetch audit logs ──────────────────────────────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (filters.user_id && filters.user_id !== "")
        params.append("user_id", filters.user_id);
      if (filters.type && filters.type !== "")
        params.append("type", filters.type);
      if (filters.days) params.append("days", filters.days);

      const url = `${API_BASE}/super-admin/audit-logs/${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok)
        throw new Error(
          `Failed to fetch audit logs: ${res.status} ${res.statusText}`,
        );
      const data = await res.json();
      setAuditLogs(data);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError(err.message);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ── Fetch user actions ────────────────────────────────────────────────────
  const fetchUserActions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (filters.user_id && filters.user_id !== "")
        params.append("user_id", filters.user_id);
      if (filters.days) params.append("days", filters.days);

      const url = `${API_BASE}/super-admin/user-actions/${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok)
        throw new Error(
          `Failed to fetch user actions: ${res.status} ${res.statusText}`,
        );
      const data = await res.json();
      setUserActions(data);
    } catch (err) {
      console.error("Error fetching user actions:", err);
      setError(err.message);
      setUserActions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Re-fetch whenever tab or filters change
  useEffect(() => {
    if (activeTab === "audit-logs") {
      fetchAuditLogs();
    } else {
      fetchUserActions();
    }
  }, [activeTab, fetchAuditLogs, fetchUserActions]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setFilterStatus("all");
    setSearchTerm("");
    setSelectedLog(null);
  };

  const handleRefresh = () => {
    if (activeTab === "audit-logs") {
      fetchAuditLogs();
    } else {
      fetchUserActions();
    }
  };

  const handleUserFilterChange = (userId) => {
    setFilters({ ...filters, user_id: userId });
  };

  // ── Status helpers ────────────────────────────────────────────────────────
  const { isDark } = useTheme();

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "success":
        return isDark
          ? "text-green-400 bg-green-400/10 border border-green-400/20"
          : "text-green-700 bg-green-100 border border-green-200";
      case "warning":
        return isDark
          ? "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20"
          : "text-amber-700 bg-amber-100 border border-amber-200";
      case "error":
        return isDark
          ? "text-red-400 bg-red-400/10 border border-red-400/20"
          : "text-red-700 bg-red-100 border border-red-200";
      default:
        return isDark
          ? "text-gray-400 bg-gray-400/10 border border-gray-400/20"
          : "text-gray-600 bg-gray-100 border border-gray-200";
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
  const currentData = activeTab === "audit-logs" ? auditLogs : userActions;

  const filteredData = currentData.filter((item) => {
    const matchesStatus =
      filterStatus === "all" || item.status?.toLowerCase() === filterStatus;
    const matchesSearch =
      searchTerm === "" ||
      (item.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.user?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.message?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.type?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: filteredData.length,
    success: filteredData.filter((i) => i.status?.toLowerCase() === "success")
      .length,
    warning: filteredData.filter((i) => i.status?.toLowerCase() === "warning")
      .length,
    error: filteredData.filter((i) => i.status?.toLowerCase() === "error")
      .length,
  };

  const handleExportCSV = () => {
    if (activeTab === "audit-logs") {
      const headers = ["ID", "Timestamp", "User", "Action", "Module", "IP Address", "Status", "Details"];
      const rows = filteredData.map((log) => [
        log.id ?? "",
        log.timestamp ? new Date(log.timestamp).toLocaleString("en-PH") : "",
        log.user || log.username || "System",
        log.action || "",
        log.module || "",
        log.ip_address || "",
        log.status || "",
        typeof log.details === "object" ? JSON.stringify(log.details) : (log.details || ""),
      ]);
      exportToCSV(rows, headers, `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      const headers = ["ID", "Timestamp", "User", "Action Type", "Target", "IP Address", "Status", "Details"];
      const rows = filteredData.map((action) => [
        action.id ?? "",
        action.timestamp ? new Date(action.timestamp).toLocaleString("en-PH") : "",
        action.user || action.username || "System",
        action.action_type || action.type || "",
        action.target || "",
        action.ip_address || "",
        action.status || "",
        typeof action.details === "object" ? JSON.stringify(action.details) : (action.details || ""),
      ]);
      exportToCSV(rows, headers, `user-actions-${new Date().toISOString().slice(0, 10)}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className={`rounded-3xl border p-6 ${isDark ? "border-white/10 bg-gray-900/80" : "border-gray-200 bg-white shadow-sm"}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-red-400">
                Super Admin
              </div>
              <h1 className={`text-3xl font-black flex items-center gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                <IconClipboardCheck className="w-8 h-8 text-red-400" />
                Reports &amp; Monitoring
              </h1>
              <p className={`max-w-2xl text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Monitor system audit logs and track user actions across the
                platform.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCSV}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 border ${
                  isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-white/5" : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200 shadow-sm"
                }`}
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={handlePrint}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 border ${
                  isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-white/5" : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200 shadow-sm"
                }`}
              >
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={handleRefresh}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white transition-all flex items-center gap-2"
              >
                <IconRefresh className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
          <div className="flex gap-1">
            <button
              onClick={() => handleTabSwitch("audit-logs")}
              className={`px-6 py-3 text-sm font-medium transition-all rounded-t-xl flex items-center gap-2 ${
                activeTab === "audit-logs"
                  ? isDark
                    ? "bg-gray-900/80 text-red-400 border-b-2 border-red-400"
                    : "bg-white text-red-600 border-b-2 border-red-600 shadow-sm"
                  : isDark
                    ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <IconClipboardCheck className="w-4 h-4" />
              Audit Logs
            </button>
            <button
              onClick={() => handleTabSwitch("user-actions")}
              className={`px-6 py-3 text-sm font-medium transition-all rounded-t-xl flex items-center gap-2 ${
                activeTab === "user-actions"
                  ? isDark
                    ? "bg-gray-900/80 text-red-400 border-b-2 border-red-400"
                    : "bg-white text-red-600 border-b-2 border-red-600 shadow-sm"
                  : isDark
                    ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <IconUser className="w-4 h-4" />
              User Actions
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-6 lg:grid-cols-4">
          <div className={`rounded-3xl border p-6 hover:border-blue-500/30 transition-all group ${
            isDark ? "border-white/10 bg-gray-900/80" : "border-gray-200 bg-white shadow-sm"
          }`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm uppercase tracking-[0.25em] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Total Events
              </div>
              <div className="p-2 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-all">
                <IconClipboard className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className={`mt-4 text-3xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
              {stats.total}
            </div>
            <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Total recorded events</p>
          </div>

          <div className={`rounded-3xl border p-6 hover:border-green-500/30 transition-all group ${
            isDark ? "border-white/10 bg-gray-900/80" : "border-gray-200 bg-white shadow-sm"
          }`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm uppercase tracking-[0.25em] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Success
              </div>
              <div className="p-2 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-all">
                <IconSuccess className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className={`mt-4 text-3xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
              {stats.success}
            </div>
            <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Successful operations</p>
          </div>

          <div className={`rounded-3xl border p-6 hover:border-yellow-500/30 transition-all group ${
            isDark ? "border-white/10 bg-gray-900/80" : "border-gray-200 bg-white shadow-sm"
          }`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm uppercase tracking-[0.25em] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Warnings
              </div>
              <div className="p-2 rounded-xl bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-all">
                <IconWarning className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <div className={`mt-4 text-3xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
              {stats.warning}
            </div>
            <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Warning events</p>
          </div>

          <div className={`rounded-3xl border p-6 hover:border-red-500/30 transition-all group ${
            isDark ? "border-white/10 bg-gray-900/80" : "border-gray-200 bg-white shadow-sm"
          }`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm uppercase tracking-[0.25em] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Errors
              </div>
              <div className="p-2 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-all">
                <IconError className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className={`mt-4 text-3xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
              {stats.error}
            </div>
            <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Error events</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-3xl border p-6 ${isDark ? "border-white/10 bg-gray-900/80" : "border-gray-200 bg-white shadow-sm"}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus("all")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                  filterStatus === "all"
                    ? "bg-red-500 text-white"
                    : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <IconFilter className="w-4 h-4" />
                All Events
              </button>
              <button
                onClick={() => setFilterStatus("success")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                  filterStatus === "success"
                    ? "bg-green-500 text-white"
                    : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <IconSuccess className="w-4 h-4" />
                Success
              </button>
              <button
                onClick={() => setFilterStatus("warning")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                  filterStatus === "warning"
                    ? "bg-yellow-500 text-white"
                    : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <IconWarning className="w-4 h-4" />
                Warning
              </button>
              <button
                onClick={() => setFilterStatus("error")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                  filterStatus === "error"
                    ? "bg-red-500 text-white"
                    : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <IconError className="w-4 h-4" />
                Error
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filters.user_id}
                onChange={(e) => handleUserFilterChange(e.target.value)}
                className={`rounded-xl border px-4 py-2 text-sm focus:outline-none focus:border-red-500/50 ${
                  isDark ? "bg-gray-800/50 border-white/10 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                }`}
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email} {user.role !== "user" && `(${user.role})`}
                  </option>
                ))}
              </select>
              <select
                value={filters.days}
                onChange={(e) =>
                  setFilters({ ...filters, days: e.target.value })
                }
                className={`rounded-xl border px-4 py-2 text-sm focus:outline-none focus:border-red-500/50 ${
                  isDark ? "bg-gray-800/50 border-white/10 text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                }`}
              >
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full sm:w-80 rounded-xl border px-4 py-2 pl-10 text-sm focus:outline-none focus:border-red-500/50 ${
                    isDark ? "bg-gray-800/50 border-white/10 text-white placeholder-gray-500" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                />
                <div className="absolute left-3 top-2.5 text-gray-500">
                  <IconSearch className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="flex items-center gap-3">
              <IconError className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-red-400 font-medium">Error loading data</p>
                <p className="text-gray-400 text-sm">{error}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="ml-auto rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className={`rounded-3xl border p-12 ${isDark ? "border-white/10 bg-gray-900/80" : "border-gray-200 bg-white shadow-sm"}`}>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                Loading{" "}
                {activeTab === "audit-logs" ? "audit logs" : "user actions"}...
              </p>
            </div>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && (
          <div className={`rounded-3xl border overflow-hidden ${isDark ? "border-white/10 bg-gray-900/80" : "border-gray-200 bg-white shadow-sm"}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`border-b ${isDark ? "border-white/10 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
                  <tr>
                    {[
                      "Event",
                      "User",
                      "Type",
                      "Timestamp",
                      "Status",
                      "Details",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}>
                  {filteredData.map((log) => (
                    <tr
                      key={log.id}
                      className={`transition-colors cursor-pointer ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                      onClick={() =>
                        setSelectedLog(selectedLog?.id === log.id ? null : log)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ActionIcon type={log.type} />
                          <span className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                            {log.title}
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {log.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold border ${
                            isDark
                              ? "bg-gray-700 text-gray-300 border-gray-600"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(log.status)}`}
                        >
                          {log.status?.toLowerCase() === "success" && (
                            <IconSuccess className="w-3 h-3" />
                          )}
                          {log.status?.toLowerCase() === "warning" && (
                            <IconWarning className="w-3 h-3" />
                          )}
                          {log.status?.toLowerCase() === "error" && (
                            <IconError className="w-3 h-3" />
                          )}
                          {log.status || "info"}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm max-w-md truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <IconEmptyState className="w-24 h-24 mx-auto text-gray-600" />
                <p className="text-gray-400 mt-4">
                  No{" "}
                  {activeTab === "audit-logs" ? "audit logs" : "user actions"}{" "}
                  found
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Try adjusting your filters or refresh the page
                </p>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {selectedLog && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedLog(null)}
          >
            <div
              className="bg-gray-900 rounded-3xl border border-white/10 max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ActionIcon type={selectedLog.type} />
                  <h3 className="text-xl font-bold text-white">
                    Event Details
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <IconClose className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Event", value: selectedLog.title },
                  { label: "User", value: selectedLog.user },
                  { label: "Type", value: selectedLog.type },
                  {
                    label: "IP Address",
                    value: selectedLog.ip_address || "N/A",
                    mono: true,
                  },
                  {
                    label: "Timestamp",
                    value: selectedLog.created_at
                      ? new Date(selectedLog.created_at).toLocaleString()
                      : "N/A",
                  },
                ].map(({ label, value, mono }) => (
                  <div
                    key={label}
                    className="flex justify-between py-2 border-b border-white/10"
                  >
                    <span className="text-gray-400">{label}:</span>
                    <span
                      className={`text-white ${mono ? "font-mono text-sm" : "font-medium"}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">Status:</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedLog.status)}`}
                  >
                    {selectedLog.status?.toLowerCase() === "success" && (
                      <IconSuccess className="w-3 h-3" />
                    )}
                    {selectedLog.status?.toLowerCase() === "warning" && (
                      <IconWarning className="w-3 h-3" />
                    )}
                    {selectedLog.status?.toLowerCase() === "error" && (
                      <IconError className="w-3 h-3" />
                    )}
                    {selectedLog.status || "info"}
                  </span>
                </div>

                <div className="py-2">
                  <span className="text-gray-400 block mb-2">Details:</span>
                  <p className="text-white bg-gray-800 rounded-xl p-3">
                    {selectedLog.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}