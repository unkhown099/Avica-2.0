import React, { useState, useEffect, useCallback } from "react";
import InventoryLayout from "./InventoryLayout";
import { useAuth, API_BASE } from "../../hooks/useAuth.js";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

// ── Severity helpers ──────────────────────────────────────────────────────────
function deriveSeverity(item) {
  const s = String(item.status ?? "").toLowerCase();
  const quantity = Number(item.quantity ?? 0);
  const minimum = Number(item.minimum_qty ?? 0);

  // Critical only when there is no stock left.
  if (s.includes("out") || quantity <= 0) return "critical";

  // Warning when stock is low but still available.
  if (s.includes("low")) return "warning";
  if (minimum > 0 && quantity <= minimum) return "warning";
  if (minimum > 0 && quantity <= minimum * 1.5) return "warning";

  return "warning"; // anything surfaced by the API is at least a warning
}

const SEVERITY_STYLES = {
  critical: {
    badge: "bg-red-500/15 text-red-400 border-red-500/25",
    dot: "bg-red-500",
    bar: "#ef4444",
    label: "Critical",
  },
  warning: {
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    dot: "bg-amber-500",
    bar: "#f59e0b",
    label: "Warning",
  },
};

const CATEGORY_STYLES = {
  Parts: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  Consumables: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
  Accessories: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  Default: {
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    border: "border-gray-500/20",
  },
};

function categoryStyle(cat) {
  return CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.Default;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

// ── Restock Modal ─────────────────────────────────────────────────────────────
function RestockModal({ alert, headers, onClose, onSuccess }) {
  const [qty, setQty] = useState(
    Math.max((alert.minimum_qty ?? 10) * 2 - alert.quantity, 1),
  );
  const [supplier, setSupplier] = useState(alert.supplier_name ?? "");
  const [priority, setPriority] = useState("urgent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/inventory/restock-requests/`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          inventory_item: alert.id,
          quantity_requested: Number(qty),
          priority,
          notes: supplier ? `Supplier: ${supplier}` : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? `Error ${res.status}`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sev = SEVERITY_STYLES[alert.severity];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-black text-white">
            Create Restock Order
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Alert summary */}
          <div
            className={`rounded-xl p-3 border ${alert.severity === "critical" ? "bg-red-500/5 border-red-500/20" : "bg-amber-500/5 border-amber-500/20"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${sev.dot}`} />
              <span
                className={`text-xs font-bold uppercase ${alert.severity === "critical" ? "text-red-400" : "text-amber-400"}`}
              >
                {sev.label}
              </span>
            </div>
            <p className="text-white font-bold text-sm">{alert.name}</p>
            <p className="text-gray-500 text-xs">
              {alert.branch_name ?? "—"} · Current: {alert.quantity} / Min:{" "}
              {alert.minimum_qty ?? "—"}
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-xs font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Quantity to Request
            </label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Supplier (optional note)
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. AutoParts PH"
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
            >
              <option value="urgent">Urgent (1–2 days)</option>
              <option value="standard">Standard (3–5 days)</option>
              <option value="economy">Economy (1–2 weeks)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-600/20"
            >
              {loading ? "Submitting…" : "Create Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReorderAlerts() {
  const { isAuthenticated, isAdmin, headers } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [filterBranch, setFilterBranch] = useState("All Branches");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [dismissed, setDismissed] = useState([]);
  const [orderingAll, setOrderingAll] = useState(false);
  const [orderAllError, setOrderAllError] = useState(null);
  const [orderAllSuccess, setOrderAllSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [cancelingRequestId, setCancelingRequestId] = useState(null);

  // ── Fetch low-stock items ─────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);

      // The backend returns only items at/below minimum_qty, already branch-scoped for non-admins.
      // Pass status filter so we only pull items that need attention.
      const params = new URLSearchParams({ status: "low,out" });
      const res = await fetch(`${API_BASE}/inventory/?${params}`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to load alerts: ${res.status}`);
      const data = await res.json();

      const mapped = (data ?? []).map((item) => ({
        ...item,
        severity: deriveSeverity(item),
      }));
      setAlerts(mapped);

      // Build unique branch list for the filter dropdown (admin only)
      if (isAdmin) {
        const unique = [
          ...new Set(mapped.map((i) => i.branch_name).filter(Boolean)),
        ].sort();
        setBranches(unique);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, headers]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const fetchPendingRequests = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_BASE}/inventory/restock-requests/`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        setPendingRequests([]);
        return;
      }
      const data = await res.json();
      const pendingOnly = (Array.isArray(data) ? data : []).filter(
        (req) => String(req?.status).toLowerCase() === "pending",
      );
      setPendingRequests(pendingOnly);
    } catch {
      setPendingRequests([]);
    }
  }, [isAuthenticated, headers]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  // ── Derived lists ─────────────────────────────────────────────────────────
  const active = alerts.filter((a) => !dismissed.includes(a.id));
  const pendingItemIds = new Set(
    pendingRequests.map((req) => req.inventory_item).filter(Boolean),
  );
  const pendingFiltered = pendingRequests.filter((req) => {
    if (filterBranch !== "All Branches" && req.branch_name !== filterBranch)
      return false;
    return true;
  });
  const activeWithoutPending = active.filter((a) => !pendingItemIds.has(a.id));

  const filtered = activeWithoutPending.filter((a) => {
    if (filterSeverity !== "All" && a.severity !== filterSeverity.toLowerCase())
      return false;
    if (filterBranch !== "All Branches" && a.branch_name !== filterBranch)
      return false;
    return true;
  });

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
  } = usePagination({
    items: filtered,
    pageSize: 10,
    resetDeps: [filterSeverity, filterBranch, alerts.length, dismissed.length],
  });

  const criticalActive = activeWithoutPending.filter(
    (a) => a.severity === "critical",
  );
  const warningActive = activeWithoutPending.filter(
    (a) => a.severity === "warning",
  );

  const handleCancelRequest = async (requestRow) => {
    const requestId = requestRow?.id;
    if (!requestId) return;
    try {
      setCancelingRequestId(requestId);
      const res = await fetch(
        `${API_BASE}/inventory/restock-requests/${requestId}/action/`,
        {
          method: "PATCH",
          headers,
          credentials: "include",
          body: JSON.stringify({ action: "cancel" }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || `Failed to cancel request (${res.status})`);
      }
      await fetchAlerts();
      await fetchPendingRequests();
    } catch (err) {
      setError(err.message || "Failed to cancel request.");
    } finally {
      setCancelingRequestId(null);
    }
  };

  // ── Order All Critical ────────────────────────────────────────────────────
  const handleOrderAllCritical = async () => {
    try {
      setOrderingAll(true);
      setOrderAllError(null);
      setOrderAllSuccess(false);

      await Promise.all(
        criticalActive.map((item) =>
          fetch(`${API_BASE}/inventory/restock-requests/`, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify({
              inventory_item: item.id,
              quantity_requested: Math.max(
                (item.minimum_qty ?? 10) * 2 - item.quantity,
                1,
              ),
              priority: "urgent",
            }),
          }),
        ),
      );
      setOrderAllSuccess(true);
      await fetchAlerts();
      await fetchPendingRequests();
    } catch (err) {
      setOrderAllError(err.message);
    } finally {
      setOrderingAll(false);
    }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExport = () => {
    setExporting(true);
    try {
      const rows = [
        [
          "Item",
          "Category",
          "Branch",
          "Severity",
          "Current Qty",
          "Min Qty",
          "Last Updated",
        ],
        ...filtered.map((a) => [
          a.name,
          a.category ?? "—",
          a.branch_name ?? "—",
          a.severity,
          a.quantity,
          a.minimum_qty ?? "—",
          formatDate(a.updated_at ?? a.created_at),
        ]),
      ];
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reorder-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  function SkeletonRow() {
    return (
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-gray-800 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 bg-gray-800 rounded" />
          <div className="h-3 w-24 bg-gray-800 rounded" />
        </div>
        <div className="h-6 w-16 bg-gray-800 rounded-full" />
        <div className="h-6 w-20 bg-gray-800 rounded-lg" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <InventoryLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Reorder Alerts
            </h1>
            <p className="text-gray-400 mt-1">
              {loading
                ? "Loading alerts…"
                : `${active.length} item${active.length !== 1 ? "s" : ""} require${active.length === 1 ? "s" : ""} replenishment`}
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || filtered.length === 0}
            className="mt-10 flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition-all w-fit"
          >
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold">
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
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Order-all success banner */}
        {orderAllSuccess && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-semibold">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            Critical restock requests submitted successfully.
          </div>
        )}

        {/* Critical Alert Banner */}
        {!loading && criticalActive.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5 text-red-400"
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
              </div>
              <div className="flex-1">
                <p className="text-red-400 font-bold">
                  {criticalActive.length} Critical Alert
                  {criticalActive.length > 1 ? "s" : ""} — Immediate Action
                  Required
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  These items are critically low and may cause service
                  disruptions. Create restock orders immediately.
                </p>
                {orderAllError && (
                  <p className="text-red-400 text-xs mt-2 font-semibold">
                    {orderAllError}
                  </p>
                )}
              </div>
                <button
                  onClick={handleOrderAllCritical}
                  disabled={orderingAll || criticalActive.length === 0}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-600/20 flex-shrink-0"
                >
                  {orderingAll ? "Submitting…" : "Order All Critical"}
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Severity:</span>
            {["All", "Critical", "Warning"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterSeverity === s
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {s}
                {s === "Critical" && criticalActive.length > 0 && (
                  <span className="ml-1.5 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {criticalActive.length}
                  </span>
                )}
                {s === "Warning" && warningActive.length > 0 && (
                  <span className="ml-1.5 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {warningActive.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Branch filter: admins only (non-admins are already scoped by backend) */}
          {isAdmin && branches.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-gray-500 text-sm">Branch:</span>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500 transition-colors"
              >
                <option>All Branches</option>
                {branches.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Pending Restock Section (separate from table) */}
        {!loading && pendingFiltered.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/25 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-amber-300 uppercase tracking-wider">
                Pending Restock
              </h3>
              <span className="text-sm text-gray-400">
                {pendingFiltered.length} pending
              </span>
            </div>

            <div className="space-y-3">
              {pendingFiltered.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-950/60 border border-white/5 rounded-xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">
                      {req.inventory_item_name}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Branch: {req.branch_name || "—"} · Qty:{" "}
                      <span className="text-amber-300 font-bold">
                        {req.quantity_requested}
                      </span>
                    </p>
                    {req.notes && (
                      <p className="text-gray-500 text-xs italic mt-0.5 truncate">
                        "{req.notes}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleCancelRequest(req)}
                    disabled={cancelingRequestId === req.id}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600/15 hover:bg-red-600 border border-red-500/30 text-red-300 hover:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {cancelingRequestId === req.id ? "Canceling..." : "Cancel Request"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h3 className="text-lg font-black text-white">Active Alerts</h3>
              <p className="text-gray-500 text-sm mt-0.5">
                {loading
                  ? "Loading…"
                  : `${startItem}-${endItem} of ${filtered.length} item${filtered.length !== 1 ? "s" : ""} require${filtered.length === 1 ? "s" : ""} attention`}
              </p>
            </div>
          </div>

          {/* Table header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5 bg-gray-900/40">
            <div className="col-span-3">Item</div>
            <div className="col-span-1">Category</div>
            {isAdmin && <div className="col-span-2">Branch</div>}
            <div
              className={`${isAdmin ? "col-span-1" : "col-span-2"} text-center`}
            >
              Severity
            </div>
            <div className="col-span-2">Stock Level</div>
            <div className="col-span-2">Last Updated</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-emerald-400"
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
              <p className="text-white font-bold text-lg">All Clear!</p>
              <p className="text-gray-500 text-sm mt-1">
                No reorder alerts for the selected filters.
              </p>
            </div>
          ) : (
            paginatedItems.map((alert) => {
              const sev = SEVERITY_STYLES[alert.severity];
              const cat = categoryStyle(alert.category);
              const pct = alert.minimum_qty
                ? Math.min((alert.quantity / alert.minimum_qty) * 100, 100)
                : 50;

              return (
                <div
                  key={alert.id}
                  className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                >
                  {/* ── Mobile layout ── */}
                  <div className="lg:hidden flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${sev.dot}`} />
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sev.badge}`}
                        >
                          {sev.label}
                        </span>
                        {alert.category && (
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}
                          >
                            {alert.category}
                          </span>
                        )}
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {alert.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {alert.branch_name ?? "—"} · SKU: {alert.sku ?? "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="px-3 py-1.5 bg-red-600/15 hover:bg-red-600 border border-red-500/25 text-red-400 hover:text-white rounded-lg text-xs font-semibold transition-all"
                    >
                      Restock
                    </button>
                  </div>
                  <div className="lg:hidden">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>
                        Stock:{" "}
                        <span
                          className={`font-bold ${alert.severity === "critical" ? "text-red-400" : "text-amber-400"}`}
                        >
                          {alert.quantity}
                        </span>
                        {alert.minimum_qty ? ` / min ${alert.minimum_qty}` : ""}
                      </span>
                      <span>
                        Updated:{" "}
                        {formatDate(alert.updated_at ?? alert.created_at)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: sev.bar }}
                      />
                    </div>
                  </div>

                  {/* ── Desktop layout ── */}
                  <div className="hidden lg:block col-span-3">
                    <p className="text-white font-semibold text-sm">
                      {alert.name}
                    </p>
                    <p className="text-gray-600 text-xs">
                      SKU: {alert.sku ?? "—"}
                    </p>
                  </div>

                  <div className="hidden lg:flex col-span-1 items-center">
                    {alert.category ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}
                      >
                        {alert.category}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="hidden lg:flex col-span-2 items-center">
                      <span className="text-gray-400 text-sm">
                        {alert.branch_name ?? "—"}
                      </span>
                    </div>
                  )}

                  <div
                    className={`hidden lg:flex ${isAdmin ? "col-span-1" : "col-span-2"} items-center justify-center`}
                  >
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold border ${sev.badge}`}
                    >
                      {sev.label}
                    </span>
                  </div>

                  <div className="hidden lg:flex col-span-2 items-center">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold ${alert.severity === "critical" ? "text-red-400" : "text-amber-400"}`}
                        >
                          {alert.quantity}
                          {alert.minimum_qty ? ` / ${alert.minimum_qty}` : ""}
                          {alert.unit ? ` ${alert.unit}` : ""}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: sev.bar }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:flex col-span-2 items-center">
                    <span className="text-gray-500 text-xs">
                      {formatDate(alert.updated_at ?? alert.created_at)}
                    </span>
                  </div>

                  <div className="hidden lg:flex col-span-1 items-center justify-end gap-1">
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="px-3 py-1.5 bg-red-600/15 hover:bg-red-600 border border-red-500/25 text-red-400 hover:text-white rounded-lg text-xs font-semibold transition-all"
                    >
                      Restock
                    </button>
                    <button
                      onClick={() => setDismissed((d) => [...d, alert.id])}
                      className="opacity-100 p-1.5 text-gray-600 hover:text-gray-400 hover:bg-gray-800 rounded-lg transition-all"
                      title="Dismiss"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {!loading && filtered.length > 0 && (
            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
              className="px-6 py-4"
            />
          )}
        </div>
      </div>

      {selectedAlert && (
        <RestockModal
          alert={selectedAlert}
          headers={headers}
          onClose={() => setSelectedAlert(null)}
          onSuccess={async () => {
            await fetchAlerts();
            await fetchPendingRequests();
          }}
        />
      )}
    </InventoryLayout>
  );
}
