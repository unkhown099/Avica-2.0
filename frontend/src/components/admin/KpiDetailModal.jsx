import React, { useEffect, useState } from "react";

export default function KpiDetailModal({
  kpi,
  onClose,
  onNavigate,
  data = {},
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const {
    title = "",
    value = "—",
    sub = "",
    accentBg = "bg-red-500/10",
    accentText = "text-red-500 dark:text-red-400",
    border = "border-red-500/20",
    icon,
  } = kpi || {};

  const {
    stats = {},
    transactions = [],
    filteredRevenueByBranch = [],
    filteredCustomers = [],
    tierRows = [],
    serviceDistribution = [],
    topServiceCards = [],
    highestDemandBranch = null,
    branchForecastRows = [],
    highestRatedEmployee = null,
    employeeRatingsRows = [],
    filteredEmployeeWorkloadRows = [],
    appointments = [],
    queueHistory = [],
    assignedTasks = [],
    inventoryItems = [],
    inventoryForecast = {},
    lowStockCount = 0,
    criticalStockCount = 0,
    inventoryTrendLabel = "Stable",
    analytics = {},
  } = data;

  const lowerTitle = title.toLowerCase();

  // Employee modal states and data processing
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState("completed"); // "completed" | "pending"

  const tasksList = (assignedTasks && assignedTasks.length > 0) ? assignedTasks : (queueHistory || []);

  const totalTasksCount = tasksList.length > 0
    ? tasksList.length
    : filteredEmployeeWorkloadRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);

  const completedTasksCount = tasksList.length > 0
    ? tasksList.filter((t) => {
        const s = String(t?.status || "").toLowerCase();
        return s === "done" || s === "completed";
      }).length
    : filteredEmployeeWorkloadRows.reduce((sum, row) => sum + Number(row.completed ?? 0), 0);

  const activeTasksCount = tasksList.length > 0
    ? tasksList.filter((t) => {
        const s = String(t?.status || "").toLowerCase();
        return s === "in_progress" || s === "waiting" || s === "pending" || s === "in_service";
      }).length
    : Math.max(0, totalTasksCount - completedTasksCount);

  const assignedStaffCount = filteredEmployeeWorkloadRows.length > 0
    ? filteredEmployeeWorkloadRows.length
    : new Set(
        tasksList
          .map((t) => t.assigned_employee?.full_name || t.assigned_employee_name)
          .filter(Boolean)
      ).size;

  const completionPct =
    totalTasksCount > 0
      ? ((completedTasksCount / totalTasksCount) * 100).toFixed(1)
      : "0.0";

  const filteredTasks = tasksList.filter((task) => {
    const status = String(task?.status || "").toLowerCase();
    if (taskStatusFilter === "completed" && status !== "done" && status !== "completed") return false;
    if (taskStatusFilter === "active" && status !== "in_progress" && status !== "waiting" && status !== "pending" && status !== "in_service") return false;
    if (taskStatusFilter === "skipped" && status !== "skipped" && status !== "cancelled") return false;

    if (!taskSearch.trim()) return true;
    const q = taskSearch.toLowerCase();
    const staffName = (task.assigned_employee?.full_name || task.assigned_employee_name || (typeof task.assigned_employee === "string" ? task.assigned_employee : "")).toLowerCase();
    const custName = (task.customer_name || task.customer?.full_name || "").toLowerCase();
    const svcName = (task.service || task.service_name || "").toLowerCase();
    const plate = (task.plate_number || task.vehicle || "").toLowerCase();
    const branchName = (task.branch?.name || task.branch_name || (typeof task.branch === 'string' ? task.branch : "")).toLowerCase();
    return (
      staffName.includes(q) ||
      custName.includes(q) ||
      svcName.includes(q) ||
      plate.includes(q) ||
      branchName.includes(q)
    );
  });

  const formatTaskDate = (dateVal) => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  // 1. Inventory & Stock detection (Check this FIRST so "stockout risk" or "overstock risk" isn't misidentified as customer risk!)
  const isInventory =
    lowerTitle.includes("stock") ||
    lowerTitle.includes("inventory") ||
    lowerTitle.includes("sku") ||
    lowerTitle.includes("reorder") ||
    lowerTitle.includes("replenish") ||
    lowerTitle.includes("item") ||
    lowerTitle.includes("product") ||
    lowerTitle.includes("stockout") ||
    lowerTitle.includes("overstock") ||
    lowerTitle.includes("usage");

  // 2. Revenue & Financial
  const isRevenue =
    !isInventory &&
    (lowerTitle.includes("revenue") ||
      lowerTitle.includes("sales") ||
      lowerTitle.includes("earning") ||
      lowerTitle.includes("transaction"));

  // 3. Customer & Retention (Exclude inventory keywords!)
  const isCustomer =
    !isInventory &&
    !isRevenue &&
    (lowerTitle.includes("customer") ||
      lowerTitle.includes("client") ||
      lowerTitle.includes("churn") ||
      lowerTitle.includes("at risk") ||
      lowerTitle.includes("reactivat") ||
      lowerTitle.includes("campaign"));

  // 4. Services & Demand
  const isService =
    !isInventory &&
    !isRevenue &&
    !isCustomer &&
    ((lowerTitle.includes("service") && !lowerTitle.includes("period")) ||
      lowerTitle.includes("demand record") ||
      lowerTitle.includes("category demand"));

  // 5. Satisfaction & Ratings
  const isSatisfaction =
    !isInventory &&
    !isRevenue &&
    !isCustomer &&
    !isService &&
    (lowerTitle.includes("satisfaction") ||
      (lowerTitle.includes("rating") && !lowerTitle.includes("employee")));

  // 6. Branch Operations
  const isBranch =
    !isInventory &&
    !isRevenue &&
    !isCustomer &&
    !isService &&
    !isSatisfaction &&
    (lowerTitle.includes("branch") || lowerTitle.includes("highest demand"));

  // 7. Employee Performance & Tasks
  const isEmployee =
    !isInventory &&
    !isRevenue &&
    !isCustomer &&
    !isService &&
    !isSatisfaction &&
    !isBranch &&
    (lowerTitle.includes("employee") ||
      lowerTitle.includes("staff") ||
      lowerTitle.includes("workload") ||
      lowerTitle.includes("task") ||
      lowerTitle.includes("assigned") ||
      (lowerTitle.includes("completion") && sub?.toLowerCase().includes("task")));

  // Distinct sub-views for Employee KPIs:
  const isHighestDemandCard =
    isEmployee && lowerTitle.includes("highest demand");

  const isHighestRatedCard =
    isEmployee &&
    (lowerTitle.includes("highest rated") ||
      (lowerTitle.includes("rating") && lowerTitle.includes("employee")));

  const isCompletionCard =
    isEmployee &&
    !isHighestDemandCard &&
    !isHighestRatedCard &&
    lowerTitle.includes("completion");

  const isTasksCard =
    isEmployee &&
    !isHighestDemandCard &&
    !isHighestRatedCard &&
    !isCompletionCard &&
    (lowerTitle.includes("task") || lowerTitle.includes("total assigned"));

  const isStaffListCard =
    isEmployee &&
    !isHighestDemandCard &&
    !isHighestRatedCard &&
    !isCompletionCard &&
    !isTasksCard;

  // 8. Appointments & Bookings
  const isAppointment =
    !isInventory &&
    !isRevenue &&
    !isCustomer &&
    !isService &&
    !isSatisfaction &&
    !isBranch &&
    !isEmployee &&
    (lowerTitle.includes("booking") ||
      lowerTitle.includes("appointment") ||
      lowerTitle.includes("completion"));

  if (!kpi) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kpi-modal-title"
        className="relative w-full max-w-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/15 rounded-2xl shadow-2xl shadow-gray-950/20 dark:shadow-black/80 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh] transition-colors"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50/90 dark:bg-gray-950/60 flex items-start justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shrink-0 ${accentBg} ${accentText} border ${border}`}
            >
              {icon || (
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="kpi-modal-title"
                  className="text-base sm:text-xl font-black text-gray-900 dark:text-white tracking-tight truncate"
                >
                  {title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                  KPI Breakdown
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white">
                  {value ?? "—"}
                </span>
                {sub && (
                  <span className={`text-xs sm:text-sm font-medium ${accentText}`}>
                    {sub}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors shrink-0"
            aria-label="Close modal"
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

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-gray-900 dark:text-gray-100">
          {/* ═══════════════════ REVENUE BREAKDOWN ═══════════════════ */}
          {isRevenue && (
            <>
              {/* Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Total Transactions
                  </p>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-1">
                    {transactions.length || 0}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Recorded events</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Top Earning Branch
                  </p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                    {filteredRevenueByBranch[0]?.branch || "Central Branch"}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    ₱{Number(filteredRevenueByBranch[0]?.revenue ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Payment Coverage
                  </p>
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
                    {analytics?.payment_rate != null
                      ? `${Number(analytics.payment_rate).toFixed(1)}%`
                      : "100%"}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Paid queue entries</p>
                </div>
              </div>

              {/* Branch Contribution */}
              {filteredRevenueByBranch.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-3">
                    Branch Revenue Distribution
                  </h4>
                  <div className="space-y-2.5">
                    {filteredRevenueByBranch.map((item, idx) => {
                      const total = filteredRevenueByBranch.reduce(
                        (sum, b) => sum + Number(b.revenue ?? 0),
                        0
                      );
                      const pct =
                        total > 0
                          ? ((Number(item.revenue ?? 0) / total) * 100).toFixed(1)
                          : 0;
                      return (
                        <div
                          key={idx}
                          className="bg-gray-50/80 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl p-3 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                            <span className="text-gray-900 dark:text-white font-semibold">
                              {item.branch}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              ₱{Number(item.revenue ?? 0).toLocaleString()} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-red-500 to-rose-400 h-2 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Transactions List */}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-3">
                  Recent Recorded Transactions
                </h4>
                {transactions.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    No recent transaction records available.
                  </p>
                ) : (
                  <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5 shadow-sm dark:shadow-none">
                    {transactions.slice(0, 5).map((tx, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-gray-950/40 hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {tx.customer_name || "Guest Customer"}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                            {tx.service || "Salon Service"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            ₱{Number(tx.amount ?? 0).toLocaleString()}
                          </p>
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-medium">
                            {tx.status || "Paid"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════════ CUSTOMERS BREAKDOWN ═══════════════════ */}
          {isCustomer && (
            <>
              {/* Segmentation stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {tierRows.map((tier, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tier.color }}
                      />
                      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        {tier.tier}
                      </span>
                    </div>
                    <p className="text-lg font-black text-gray-900 dark:text-white">
                      {tier.count.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Customers Directory */}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-3">
                  Customer Directory Sample
                </h4>
                {filteredCustomers.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    No customers found in current filter.
                  </p>
                ) : (
                  <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5 shadow-sm dark:shadow-none">
                    {filteredCustomers.slice(0, 6).map((c, idx) => {
                      const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.name || "Customer";
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-white dark:bg-gray-950/40 hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                              {c.visits ?? 0} visits · {c.phone || c.email || "Verified client"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">
                              ₱{Number(c.total_spent ?? 0).toLocaleString()}
                            </p>
                            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 font-medium">
                              {c.segment || "Regular"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════════ SERVICES BREAKDOWN ═══════════════════ */}
          {isService && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Total Completed
                  </p>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-1">
                    {stats?.services_completed ?? value ?? 0}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Service operations</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Active Catalog
                  </p>
                  <p className="text-lg font-black text-purple-600 dark:text-purple-400 mt-1">
                    {serviceDistribution.length || topServiceCards.length || 0}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Featured services</p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Top Demanded
                  </p>
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1 truncate">
                    {topServiceCards[0]?.service || serviceDistribution[0]?.label || "Haircut"}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Leading request</p>
                </div>
              </div>

              {/* Service Distribution List */}
              {serviceDistribution.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-3">
                    Service Popularity & Share
                  </h4>
                  <div className="space-y-2.5">
                    {serviceDistribution.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50/80 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl p-3 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                          <span className="text-gray-900 dark:text-white font-semibold">
                            {item.label}
                          </span>
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            {item.count} completed ({Number(item.pct ?? 0).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(5, Number(item.pct ?? 0)))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════════════════ SATISFACTION BREAKDOWN ═══════════════════ */}
          {isSatisfaction && (
            <>
              {/* Big Score Card */}
              <div className="bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-400 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <h4 className="text-lg font-black text-gray-900 dark:text-white">
                    Customer Satisfaction Score: {value}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Calculated from authenticated client ratings across completed appointments.
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 text-xs font-bold shrink-0">
                  Tier: High Satisfaction
                </div>
              </div>

              {/* Staff Ratings Leaderboard */}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-3">
                  Staff Feedback & Rating Leaderboard
                </h4>
                {employeeRatingsRows.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    No individual staff ratings submitted yet.
                  </p>
                ) : (
                  <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5 shadow-sm dark:shadow-none">
                    {employeeRatingsRows.map((emp, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-gray-950/40 hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {emp.employee_name}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                              {emp.total_ratings} ratings received
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-amber-500 dark:text-amber-400">
                          <span>{Number(emp.avg_rating ?? 0).toFixed(2)}</span>
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════════ BRANCH DEMAND BREAKDOWN ═══════════════════ */}
          {isBranch && (
            <>
              {/* Highlight */}
              <div className="bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Market Leader
                    </span>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                      {highestDemandBranch?.branch || value || "Top Branch"}
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-300">
                      {highestDemandBranch
                        ? Number(highestDemandBranch.total_demand ?? 0).toLocaleString()
                        : "—"}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Total Demand Volume</p>
                  </div>
                </div>
              </div>

              {/* Branch comparison table */}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-3">
                  All Branches Demand & Forecast
                </h4>
                {branchForecastRows.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    No branch demand forecast records available.
                  </p>
                ) : (
                  <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5 shadow-sm dark:shadow-none">
                    {branchForecastRows.map((row, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-gray-950/40 hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {row.branch}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {Number(row.total_demand ?? 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Current Demand</p>
                          </div>
                          <div>
                            <p className="font-bold text-indigo-600 dark:text-indigo-400">
                              {Number(row.predicted_next_demand ?? 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Next Forecast</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════════ EMPLOYEE PERFORMANCE: DISTINCT KPI SUB-VIEWS ═══════════════════ */}
          
          {/* ── 7A. ASSIGNED EMPLOYEES / SPECIALISTS DIRECTORY ── */}
          {isStaffListCard && (
            <>
              {/* Staffing Capacity Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Assigned Specialists</p>
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">{assignedStaffCount}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">On-duty staff</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Assigned Load</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{totalTasksCount}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Jobs allocated</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Avg Tasks / Staff</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {(totalTasksCount / Math.max(1, assignedStaffCount)).toFixed(1)}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Per specialist</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Team Completion</p>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">{completionPct}%</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Overall success</p>
                </div>
              </div>

              {/* Staff Specialists Roster */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                      Assigned Specialists & Workload Allocation
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Staff members currently handling active jobs and assignments
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                    {assignedStaffCount} Active Specialist{assignedStaffCount === 1 ? "" : "s"}
                  </span>
                </div>

                {filteredEmployeeWorkloadRows.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">No assigned employee records for this period.</p>
                ) : (
                  <div className="space-y-3">
                    {filteredEmployeeWorkloadRows.map((staff, idx) => {
                      const staffTasks = tasksList.filter((t) => {
                        const name = t.assigned_employee?.full_name || t.assigned_employee_name || (typeof t.assigned_employee === "string" ? t.assigned_employee : "");
                        return name === staff.employee || name === staff.employee_name;
                      });
                      const compPct = staff.total > 0 ? ((Number(staff.completed || 0) / Number(staff.total || 1)) * 100).toFixed(0) : 0;

                      return (
                        <div
                          key={idx}
                          className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-base flex items-center justify-center shrink-0">
                                {(staff.employee || staff.employee_name || "S").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h5 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                                  {staff.employee || staff.employee_name}
                                </h5>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  📍 {staff.branch || "Central Branch"} · Service Specialist
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap sm:justify-end">
                              <div className="text-left sm:text-right">
                                <p className="text-xs font-bold text-gray-900 dark:text-white">
                                  {staff.completed} of {staff.total} tasks completed
                                </p>
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  {compPct}% completion rate
                                </span>
                              </div>
                              <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400">
                                {Number(staff.share || 0).toFixed(1)}% Share
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(5, compPct))}%` }}
                            />
                          </div>

                          {/* Recent tasks preview assigned to this specialist */}
                          {staffTasks.length > 0 && (
                            <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                Tasks Handled by {staff.employee || staff.employee_name} ({staffTasks.length})
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {staffTasks.slice(0, 4).map((t, tIdx) => (
                                  <div
                                    key={tIdx}
                                    className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/60 dark:border-white/5 flex items-center justify-between text-xs"
                                  >
                                    <div className="truncate mr-2">
                                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                                        {t.service || t.service_name || "Service Job"}
                                      </p>
                                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                        {t.customer_name || "Customer"} {t.plate_number ? `(${t.plate_number})` : ""}
                                      </p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                      String(t.status).toLowerCase() === "done" || String(t.status).toLowerCase() === "completed"
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                                    }`}>
                                      {t.status || "Completed"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── 7B. TOTAL ASSIGNED TASKS QUEUE LOG ── */}
          {isTasksCard && (
            <>
              {/* Task Volume Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{totalTasksCount}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Recorded volume</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{completedTasksCount}</p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold">{completionPct}% finished</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Active / Queue</p>
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">{activeTasksCount}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">In service</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Gross Value</p>
                  <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                    ₱{tasksList.reduce((sum, t) => sum + Number(t.price || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Total price</p>
                </div>
              </div>

              {/* Search & Filter Bar + Tasks List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search task, specialist, customer, plate..."
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                    <svg
                      className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { id: "all", label: `All (${totalTasksCount})` },
                      { id: "completed", label: `Completed (${completedTasksCount})` },
                      { id: "active", label: `Active (${activeTasksCount})` },
                      { id: "skipped", label: "Skipped" },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setTaskStatusFilter(filter.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap ${
                          taskStatusFilter === filter.id
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredTasks.length === 0 ? (
                  <div className="p-8 border border-dashed border-gray-300 dark:border-white/10 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">No assigned tasks found</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Try adjusting your search query or filter</p>
                  </div>
                ) : (
                  <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                    {filteredTasks.map((task, idx) => {
                      const statusNorm = String(task?.status || "").toLowerCase();
                      const staffName =
                        task.assigned_employee?.full_name ||
                        task.assigned_employee_name ||
                        (typeof task.assigned_employee === "string" ? task.assigned_employee : "Unassigned Specialist");
                      const dateFormatted = formatTaskDate(task.completed_at || task.queued_at || task.created_at);

                      return (
                        <div
                          key={task.id || idx}
                          className="p-3 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                                  {task.service || task.service_name || "Assigned Service Job"}
                                </p>
                                {task.id && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                    #{task.id}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[11px] text-gray-500 dark:text-gray-400">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  👤 {task.customer_name || task.customer?.full_name || "Customer"}
                                </span>
                                {(task.plate_number || task.vehicle) && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono bg-gray-100 dark:bg-white/5 px-1 py-0.5 rounded border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 text-[10px]">
                                      🚗 {task.plate_number || task.vehicle}
                                    </span>
                                  </>
                                )}
                                <span>•</span>
                                <span>📍 {task.branch?.name || task.branch_name || (typeof task.branch === "string" ? task.branch : "Main Branch")}</span>
                              </div>
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                  <span>Specialist: {staffName}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-gray-100 dark:border-white/5 pt-2 sm:pt-0 shrink-0 gap-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                statusNorm === "done" || statusNorm === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                                  : statusNorm === "in_progress" || statusNorm === "in_service"
                                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
                                  : statusNorm === "waiting" || statusNorm === "pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                                  : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10"
                              }`}
                            >
                              {task.status || "Completed"}
                            </span>
                            {task.price != null && Number(task.price) > 0 && (
                              <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                                ₱{Number(task.price).toLocaleString()}
                              </span>
                            )}
                            {dateFormatted && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                {dateFormatted}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── 7C. COMPLETION RATE ANALYTICS ── */}
          {isCompletionCard && (
            <>
              {/* Hero Completion Gauge Banner */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-500/20 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Task Execution & Delivery Performance
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
                      {completionPct}%
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {completedTasksCount} tasks successfully completed out of {totalTasksCount} assigned
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-500/30 text-center">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Remaining</span>
                      <p className="text-base font-black text-blue-600 dark:text-blue-400">{activeTasksCount}</p>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-500/30 text-center">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Success</span>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{completedTasksCount}</p>
                    </div>
                  </div>
                </div>

                {/* Visual Multi-segment Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400">Completed ({completionPct}%)</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      Active / In Queue ({totalTasksCount > 0 ? ((activeTasksCount / totalTasksCount) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-3 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, Number(completionPct)))}%` }}
                      title={`Completed: ${completionPct}%`}
                    />
                    <div
                      className="bg-blue-500 h-3 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, totalTasksCount > 0 ? (activeTasksCount / totalTasksCount) * 100 : 0)
                        )}%`,
                      }}
                      title={`Active / Queue: ${activeTasksCount}`}
                    />
                  </div>
                </div>
              </div>

              {/* Dedicated Tasks Inspection Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCompletionFilter("completed")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        completionFilter === "completed"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                      }`}
                    >
                      <span>✓ Completed Tasks</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                        {completedTasksCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCompletionFilter("pending")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        completionFilter === "pending"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                      }`}
                    >
                      <span>⏳ In Progress / Pending</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                        {activeTasksCount}
                      </span>
                    </button>
                  </div>

                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {completionFilter === "completed" ? "Finished assignments" : "Awaiting completion"}
                  </span>
                </div>

                {/* Task listing for selected tab */}
                {(() => {
                  const filteredByCompletion = tasksList.filter((t) => {
                    const s = String(t.status || "").toLowerCase();
                    if (completionFilter === "completed") {
                      return s === "done" || s === "completed";
                    }
                    return s !== "done" && s !== "completed";
                  });

                  if (filteredByCompletion.length === 0) {
                    return (
                      <div className="p-6 border border-dashed border-gray-300 dark:border-white/10 rounded-2xl text-center">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {completionFilter === "completed"
                            ? "No completed tasks yet."
                            : "All tasks have been successfully completed! 🎉"}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                      {filteredByCompletion.map((task, idx) => (
                        <div
                          key={task.id || idx}
                          className="p-3 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-white text-sm">
                                {task.service || task.service_name || "Service Task"}
                              </span>
                              {task.id && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 dark:bg-white/10 text-gray-500">
                                  #{task.id}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                              👤 {task.customer_name || "Customer"} · Specialist: {task.assigned_employee?.full_name || task.assigned_employee_name || "Specialist"} · 📍 {task.branch?.name || task.branch_name || "Branch"}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                completionFilter === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
                              }`}
                            >
                              {task.status || (completionFilter === "completed" ? "Done" : "Pending")}
                            </span>
                            {task.price != null && Number(task.price) > 0 && (
                              <p className="font-bold text-gray-900 dark:text-white mt-1">
                                ₱{Number(task.price).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {/* ── 7D. HIGHEST DEMAND SPECIALIST SPOTLIGHT ── */}
          {isHighestDemandCard && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Highest Workload Specialist
                </span>
                <h4 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                  {value}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  {sub || "Most assigned jobs across the service queue"}
                </p>
              </div>

              <div>
                <h5 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-2">
                  Workload Distribution by Specialist
                </h5>
                <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5">
                  {filteredEmployeeWorkloadRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-white/[0.02] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{row.employee}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{row.branch}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-indigo-600 dark:text-indigo-400">{row.total} jobs</span>
                        <p className="text-[10px] text-gray-500">{Number(row.share || 0).toFixed(1)}% of total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 7E. HIGHEST RATED SPECIALIST & REVIEWS ── */}
          {isHighestRatedCard && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Top Rated Specialist Feedback
                </span>
                <div className="flex items-center justify-between gap-2 mt-1 flex-wrap">
                  <div>
                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">
                      {highestRatedEmployee?.employee_name || value}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {highestRatedEmployee ? `${highestRatedEmployee.total_ratings} verified customer reviews` : (sub || "Customer feedback score")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black text-xl border border-amber-300 dark:border-amber-500/30">
                    <span>{highestRatedEmployee ? Number(highestRatedEmployee.avg_rating ?? 5.0).toFixed(2) : "5.00"}</span>
                    <span>★</span>
                  </div>
                </div>
              </div>

              {employeeRatingsRows.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-2">
                    Specialist Ratings Leaderboard
                  </h5>
                  <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5">
                    {employeeRatingsRows.map((emp, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-white/[0.02] flex items-center justify-between gap-3 text-xs">
                        <span className="font-bold text-gray-900 dark:text-white">{emp.employee_name}</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          ★ {Number(emp.avg_rating ?? 0).toFixed(2)} ({emp.total_ratings} ratings)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════ APPOINTMENTS BREAKDOWN ═══════════════════ */}
          {isAppointment && !isRevenue && !isCustomer && !isService && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Bookings</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{appointments.length}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {analytics?.completion_rate != null ? `${Number(analytics.completion_rate).toFixed(1)}%` : "—"}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Bookings Today</p>
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
                    {analytics?.bookings_today ?? 0}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-3">
                  Recent Appointments
                </h4>
                <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5 shadow-sm dark:shadow-none">
                  {appointments.slice(0, 5).map((a, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-gray-950/40 hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{a.customer_name || "Customer"}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-[11px]">{a.service || "Appointment"} · {a.date || "Scheduled"}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white">
                        {a.status || "Confirmed"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════ INVENTORY BREAKDOWN ═══════════════════ */}
          {isInventory && (() => {
            const isStockoutRisk =
              lowerTitle.includes("stockout") ||
              lowerTitle.includes("reorder") ||
              lowerTitle.includes("replenish");
            const isOverstockRisk = lowerTitle.includes("overstock");
            const isUsageForecast =
              lowerTitle.includes("usage") || lowerTitle.includes("period");

            const atRiskItems = inventoryItems.filter(
              (i) =>
                i.status === "Low Stock" ||
                i.status === "Out of Stock" ||
                Number(i.quantity ?? 0) <= Number(i.minimum_qty ?? 5)
            );

            const displayList = isStockoutRisk && atRiskItems.length > 0
              ? atRiskItems
              : inventoryItems;

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Products / SKUs</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{inventoryItems.length}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Active catalog items</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Below Reorder Level</p>
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                      {lowStockCount ?? atRiskItems.filter((i) => i.quantity > 0).length}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Low stock warning</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3">
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Out of Stock</p>
                    <p className="text-lg font-black text-red-600 dark:text-red-400 mt-1">
                      {criticalStockCount ?? inventoryItems.filter((i) => Number(i.quantity ?? 0) <= 0).length}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Immediate reorder</p>
                  </div>
                </div>

                {isUsageForecast && (
                  <div className="bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Linear Regression Forecast</p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400">Usage Trend: <span className="font-semibold text-blue-600 dark:text-blue-400">{inventoryTrendLabel}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                        {Number(inventoryForecast.linear_regression?.next_period_prediction ?? 0).toLocaleString()} units
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Next period estimate</p>
                    </div>
                  </div>
                )}

                {isStockoutRisk && atRiskItems.length === 0 && (
                  <div className="p-4 bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Zero Stockout Risk Detected</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      All products across branches are currently stocked above their minimum reorder safety thresholds.
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-3">
                    {isStockoutRisk && atRiskItems.length > 0
                      ? "Items At Stockout Risk (Below Reorder Threshold)"
                      : isStockoutRisk
                      ? "Current Stock Levels (All Healthy)"
                      : isOverstockRisk
                      ? "Overstock Risk & Stock Volume"
                      : "Inventory Stock Snapshot"}
                  </h4>
                  {displayList.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">No inventory products found.</p>
                  ) : (
                    <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-white/5 shadow-sm dark:shadow-none">
                      {displayList.slice(0, 8).map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white dark:bg-gray-950/40 hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-[11px]">{item.branch_name || "Central"} · Reorder at: {item.minimum_qty ?? 5} {item.unit || "pcs"}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">{item.quantity} {item.unit || "in stock"}</p>
                            <span className={`text-[10px] font-medium ${item.quantity <= (item.minimum_qty ?? 5) ? (item.quantity <= 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400") : "text-emerald-600 dark:text-emerald-400"}`}>
                              {item.quantity <= 0 ? "Out of Stock" : item.quantity <= (item.minimum_qty ?? 5) ? "Low Stock" : "In Stock"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* ═══════════════════ FALLBACK ═══════════════════ */}
          {!isRevenue &&
            !isCustomer &&
            !isService &&
            !isSatisfaction &&
            !isBranch &&
            !isEmployee &&
            !isAppointment &&
            !isInventory && (
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-5 text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Metric Summary</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub || "Detailed metric data view"}</p>
              </div>
            )}
        </div>

        {/* Footer with Navigation Button */}
        <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50/90 dark:bg-gray-950/80 flex items-center justify-between gap-3 transition-colors">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
          >
            Close
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => {
                let targetView = "overview";
                if (isRevenue) targetView = "revenue";
                else if (isCustomer) targetView = "customers";
                else if (isService) targetView = "services";
                else if (isSatisfaction || isEmployee) targetView = "employees";
                else if (isBranch) targetView = "revenue";
                else if (isAppointment) targetView = "appointment";
                else if (isInventory) targetView = "inventory";

                onNavigate(targetView);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>
                {isRevenue
                  ? "Explore Full Revenue"
                  : isCustomer
                  ? "Open Customer Directory"
                  : isService
                  ? "Open Service Analytics"
                  : isSatisfaction || isEmployee
                  ? "Open Employees View"
                  : isBranch
                  ? "View Branch Analytics"
                  : isAppointment
                  ? "Go to Appointments"
                  : isInventory
                  ? "Go to Inventory"
                  : "View Details"}
              </span>
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
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
