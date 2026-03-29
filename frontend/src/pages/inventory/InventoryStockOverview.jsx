import React, { useState, useEffect, useCallback } from "react";
import InventoryLayout from "./InventoryLayout";
import { useAuth, API_BASE } from "../../hooks/useAuth.js";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

const CATEGORY_STYLES = {
  Lubricants: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  Brakes: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
  Filters: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
  Batteries: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  Tires: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
  },
  Ignition: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
  },
  Other: {
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    border: "border-gray-500/20",
  },
};

function StockBadge({ status }) {
  if (status === "Out of Stock")
    return (
      <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap">
        Out of Stock
      </span>
    );
  if (status === "Low Stock")
    return (
      <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
        Low Stock
      </span>
    );
  return (
    <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
      In Stock
    </span>
  );
}

// ── Restock Request Modal ─────────────────────────────────────────────────────
// Sends POST /inventory/restock-requests/ — backend auto-sets branch from the
// requester's staff profile, so we just need inventory_item + quantity_requested.
function RestockModal({ item, headers, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!quantity || Number(quantity) <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/inventory/restock-requests/`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          inventory_item: item.id,
          quantity_requested: Number(quantity),
          notes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Failed to submit restock request.");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-black text-white">Request Restock</h3>
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
          {/* Item summary */}
          <div className="bg-gray-800/60 rounded-xl p-3">
            <p className="text-white font-bold text-sm">{item.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {item.sku} · {item.branch_name || "—"} · Current stock:{" "}
              <span className="text-white font-semibold">
                {item.quantity} {item.unit}
              </span>
            </p>
            {item.minimum_qty != null && (
              <p className="text-gray-600 text-xs mt-0.5">
                Minimum qty: {item.minimum_qty}
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Quantity to Request
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Suggested: ${Math.max((item.minimum_qty ?? 10) * 2 - item.quantity, 1)}`}
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Notes{" "}
              <span className="text-gray-600 normal-case font-normal">
                (optional)
              </span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Urgently needed, preferred supplier..."
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-600/20"
            >
              {loading ? "Submitting..." : "Send Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Transfer Modal (admin only) ───────────────────────────────────────────────
function TransferModal({ item, headers, onClose, onSuccess }) {
  const [targetBranch, setTargetBranch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/branches/`, { headers, credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const all = data.results ?? data;
        const filtered = all.filter((b) => b.name !== item?.branch_name);
        setBranches(filtered);
        if (filtered.length > 0) setTargetBranch(String(filtered[0].id));
      })
      .catch(() => {});
  }, [item, headers]);

  const handleSubmit = async () => {
    if (!quantity || Number(quantity) <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }
    if (!targetBranch) {
      setError("Please select a target branch.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/inventory/transfer/`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          source_item_id: item.id,
          target_branch_id: Number(targetBranch),
          quantity: Number(quantity),
          note: "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Transfer failed.");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-black text-white">Transfer Stock</h3>
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
          <div className="bg-gray-800/60 rounded-xl p-3">
            <p className="text-white font-bold text-sm">{item.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {item.sku} · Available: {item.quantity} {item.unit}
            </p>
          </div>
          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                From
              </label>
              <div className="w-full bg-gray-800 border border-gray-700 text-gray-400 text-sm rounded-xl px-4 py-2.5">
                {item?.branch_name || "Central"}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                To Branch
              </label>
              <select
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              max={item?.quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity..."
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"
            >
              {loading ? "Transferring..." : "Confirm Transfer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 animate-pulse">
      <div className="col-span-4 space-y-2">
        <div className="h-3 bg-gray-800 rounded w-3/4" />
        <div className="h-2 bg-gray-800 rounded w-1/2" />
      </div>
      <div className="col-span-2 flex items-center">
        <div className="h-5 bg-gray-800 rounded-full w-20" />
      </div>
      <div className="col-span-2 flex items-center justify-center">
        <div className="h-3 bg-gray-800 rounded w-24" />
      </div>
      <div className="col-span-1 flex items-center justify-center">
        <div className="h-5 bg-gray-800 rounded w-8" />
      </div>
      <div className="col-span-1 flex items-center justify-center">
        <div className="h-3 bg-gray-800 rounded w-8" />
      </div>
      <div className="col-span-1 flex items-center justify-center">
        <div className="h-5 bg-gray-800 rounded-full w-16" />
      </div>
      <div className="col-span-1" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function StockOverview() {
  const { isAdmin, headers, isAuthenticated } = useAuth();

  const [items, setItems] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [receivingRequestId, setReceivingRequestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState([]); // for admin filter dropdown
  const [restockItem, setRestockItem] = useState(null);
  const [transferItem, setTransferItem] = useState(null);

  // ── Fetch branches (admin only, for filter dropdown) ──────────────────────
  useEffect(() => {
    if (!isAdmin || !isAuthenticated) return;
    fetch(`${API_BASE}/branches/`, { headers, credentials: "include" })
      .then((r) => r.json())
      .then((data) => setBranches(data.results ?? data))
      .catch(() => {});
  }, [isAdmin, isAuthenticated, headers]);

  // ── Fetch inventory ───────────────────────────────────────────────────────
  const fetchInventory = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (branch) params.set("branch", branch);
      if (category !== "All") params.set("category", category);
      if (search) params.set("search", search);

      const res = await fetch(`${API_BASE}/inventory/?${params}`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load inventory.");
      const data = await res.json();
      setItems(data.results ?? data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [branch, category, search, isAuthenticated, headers]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const fetchRestockRequests = useCallback(async () => {
    if (!isAuthenticated || isAdmin) {
      setRestockRequests([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/inventory/restock-requests/`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load restock requests.");
      const data = await res.json();
      setRestockRequests(data ?? []);
    } catch (err) {
      setError(err.message || "Failed to load restock requests.");
    }
  }, [isAuthenticated, isAdmin, headers]);

  useEffect(() => {
    fetchRestockRequests();
  }, [fetchRestockRequests]);

  const markReceived = async (requestId) => {
    try {
      setReceivingRequestId(requestId);
      setError("");
      const res = await fetch(
        `${API_BASE}/inventory/restock-requests/${requestId}/action/`,
        {
          method: "PATCH",
          headers,
          credentials: "include",
          body: JSON.stringify({ action: "receive" }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || `Failed to mark as received (${res.status})`);
      }
      await Promise.all([fetchInventory(), fetchRestockRequests()]);
    } catch (err) {
      setError(err.message || "Failed to mark request as received.");
    } finally {
      setReceivingRequestId(null);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const categories = [
    "All",
    ...Array.from(new Set(items.map((i) => i.category).filter(Boolean))),
  ];

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q);
    const matchCat = category === "All" || item.category === category;
    return matchSearch && matchCat;
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
    resetDeps: [search, category, branch, items.length],
  });

  const quantityColor = (qty, minQty) => {
    if (qty === 0) return "text-red-400";
    if (qty <= minQty) return "text-amber-400";
    return "text-white";
  };

  const approvedRequests = restockRequests.filter((req) => req.status === "approved");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <InventoryLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Stock Overview
            </h1>
            <p className="text-gray-400 mt-1">
              {branch
                ? `Showing inventory for ${branch}.`
                : isAdmin
                  ? "Viewing all branches. Select a branch to filter."
                  : "Showing inventory for your branch."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Admin branch filter — uses real branch list from API */}
            {isAdmin && (
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {/* Transfer — admin only, opens with no pre-selected item */}
            {isAdmin && (
              <button
                onClick={() => setTransferItem({})}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition-all"
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
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Transfer
              </button>
            )}
          </div>
        </div>

        {!isAdmin && approvedRequests.length > 0 && (
          <div className="mb-6 bg-gray-900/60 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-4">
              <h3 className="text-lg font-black text-white">Approved Requests Awaiting Receipt</h3>
              <p className="text-gray-500 text-sm mt-0.5">
                Confirm receipt to finalize stock transfer and notify Admin.
              </p>
            </div>
            <div className="space-y-3">
              {approvedRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-950/60 border border-white/5 rounded-xl p-3"
                >
                  <div>
                    <p className="text-white text-sm font-semibold">{req.inventory_item_name}</p>
                    <p className="text-gray-500 text-xs">
                      Request #{req.id} · Qty {req.quantity_requested} · {req.branch_name || "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => markReceived(req.id)}
                    disabled={receivingRequestId === req.id}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white transition-all"
                  >
                    {receivingRequestId === req.id ? "Receiving..." : "Mark Received"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-white/5">
            <div className="relative w-full sm:w-72">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
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
                placeholder="Search item or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${category === cat ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5 bg-gray-900/40">
            <div className="col-span-4">Item</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2 text-center">Branch</div>
            <div className="col-span-1 text-center">Stock</div>
            <div className="col-span-1 text-center">Min. Qty</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {error && (
            <div className="px-6 py-10 text-center">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={fetchInventory}
                className="mt-3 text-xs text-gray-400 hover:text-white underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading &&
            !error &&
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

          {!loading && !error && filtered.length === 0 && (
            <div className="px-6 py-16 text-center">
              <svg
                className="w-10 h-10 text-gray-700 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
                />
              </svg>
              <p className="text-gray-500 text-sm">No inventory items found.</p>
            </div>
          )}

          {!loading &&
            !error &&
            paginatedItems.map((item) => {
              const cat =
                CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.Other;
              return (
                <div
                  key={item.id}
                  className="flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Mobile */}
                  <div className="lg:hidden flex items-start justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {item.name}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {item.sku} · {item.unit}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}
                        >
                          {item.category}
                        </span>
                        <StockBadge status={item.status} />
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        {item.branch_name || "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-black text-lg ${quantityColor(item.quantity, item.minimum_qty)}`}
                      >
                        {item.quantity}
                      </p>
                      <p className="text-gray-500 text-xs">{item.unit}</p>
                      {/* Mobile restock button — always on a real item */}
                      <button
                        onClick={() => setRestockItem(item)}
                        className="mt-1 px-2 py-1 bg-red-600/15 hover:bg-red-600 border border-red-500/25 text-red-400 hover:text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        Restock
                      </button>
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden lg:block col-span-4">
                    <p className="text-white font-semibold text-sm">
                      {item.name}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {item.sku} · {item.unit}
                    </p>
                  </div>
                  <div className="hidden lg:flex col-span-2 items-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}
                    >
                      {item.category}
                    </span>
                  </div>
                  <div className="hidden lg:flex col-span-2 items-center justify-center">
                    <span className="text-gray-400 text-sm">
                      {item.branch_name || "—"}
                    </span>
                  </div>
                  <div className="hidden lg:flex col-span-1 items-center justify-center">
                    <span
                      className={`text-sm font-bold ${quantityColor(item.quantity, item.minimum_qty)}`}
                    >
                      {item.quantity}
                    </span>
                  </div>
                  <div className="hidden lg:flex col-span-1 items-center justify-center">
                    <span className="text-gray-500 text-sm">
                      {item.minimum_qty}
                    </span>
                  </div>
                  <div className="hidden lg:flex col-span-1 items-center justify-center">
                    <StockBadge status={item.status} />
                  </div>
                  <div className="hidden lg:flex col-span-1 items-center justify-end gap-1">
                    {/* Restock — opens modal pre-filled with THIS item */}
                    <button
                      onClick={() => setRestockItem(item)}
                      className="opacity-100 p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                      title="Request Restock"
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setTransferItem(item)}
                        className="opacity-100 p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        title="Transfer Stock"
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
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {/* Footer */}
          {!loading && !error && (
            <div className="px-6 py-4 flex items-center justify-between">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {startItem}-{endItem}
                </span>{" "}
                of <span className="text-white font-semibold">{filtered.length}</span> item{filtered.length !== 1 ? "s" : ""}
              </p>
              {filtered.some((i) => i.status !== "In Stock") && (
                <p className="text-amber-400 text-xs">
                  {filtered.filter((i) => i.status === "Low Stock").length} low
                  · {filtered.filter((i) => i.status === "Out of Stock").length}{" "}
                  out of stock
                </p>
              )}
            </div>
          )}

          {!loading && !error && (
            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
              className="px-6 pb-6"
            />
          )}
        </div>
      </div>

      {/* Modals — only open when a real item is selected (has an id) */}
      {restockItem?.id && (
        <RestockModal
          item={restockItem}
          headers={headers}
          onClose={() => setRestockItem(null)}
          onSuccess={fetchInventory}
        />
      )}
      {transferItem && isAdmin && (
        <TransferModal
          item={transferItem}
          headers={headers}
          onClose={() => setTransferItem(null)}
          onSuccess={fetchInventory}
        />
      )}
    </InventoryLayout>
  );
}

export default StockOverview;