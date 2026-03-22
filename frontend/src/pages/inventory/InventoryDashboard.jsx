import React, { useEffect, useState } from "react";
import InventoryLayout from "./InventoryLayout";
import { useAuth, API_BASE } from "../../hooks/useAuth.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeStatus(status) {
  const s = String(status ?? "").toLowerCase();
  if (s.includes("out")) return "out";
  if (s.includes("low")) return "low";
  return "ok";
}

// ── Skeleton components ───────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-800" />
        <div className="w-16 h-6 rounded-full bg-gray-800" />
      </div>
      <div className="h-7 w-20 bg-gray-800 rounded mb-2" />
      <div className="h-4 w-28 bg-gray-800 rounded mb-1" />
      <div className="h-3 w-24 bg-gray-800 rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-gray-800" />
        <div>
          <div className="h-4 w-32 bg-gray-800 rounded mb-1" />
          <div className="h-3 w-20 bg-gray-800 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-4 w-12 bg-gray-800 rounded" />
        <div className="h-6 w-16 bg-gray-800 rounded-full" />
      </div>
    </div>
  );
}

// ── Transaction action config ─────────────────────────────────────────────────
const ACTION_CONFIG = {
  transfer_in:      { label: "Transfer In",  color: "text-emerald-400 bg-emerald-500/10", sign: "+" },
  transfer_out:     { label: "Transfer Out", color: "text-blue-400 bg-blue-500/10",       sign: "−" },
  restock_request:  { label: "Restock Req",  color: "text-amber-400 bg-amber-500/10",     sign: "~" },
  restock_rejected: { label: "Rejected",     color: "text-red-400 bg-red-500/10",         sign: "✕" },
  update:           { label: "Updated",      color: "text-purple-400 bg-purple-500/10",   sign: "~" },
  create:           { label: "Created",      color: "text-cyan-400 bg-cyan-500/10",       sign: "+" },
  archive:          { label: "Archived",     color: "text-gray-400 bg-gray-500/10",       sign: "−" },
  restore:          { label: "Restored",     color: "text-emerald-400 bg-emerald-500/10", sign: "+" },
};

function formatTxDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InventoryDashboard() {
  const { isAuthenticated, isAdmin, headers } = useAuth();

  const [items, setItems]               = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // ── Data fetching ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        // /inventory/ is always branch-scoped on the backend:
        //   • non-admins  → only their branch
        //   • admins      → all branches (or filtered via ?branch_id=)
        const itemsRes = await fetch(`${API_BASE}/inventory/`, {
          headers,
          credentials: "include",
        });
        if (!itemsRes.ok) throw new Error(`Inventory: ${itemsRes.status}`);
        const itemsData = await itemsRes.json();
        setItems(itemsData ?? []);

        if (isAdmin) {
          // Admin: full transaction history across all branches
          const txRes = await fetch(
            `${API_BASE}/inventory/transactions/?limit=10`,
            { headers, credentials: "include" }
          );
          if (txRes.ok) {
            const txData = await txRes.json();
            setTransactions(
              (txData ?? []).map((tx) => ({
                item_name:        tx.inventory_item_name ?? tx.inventory_item?.name ?? "Unknown Item",
                branch_name:      tx.branch_name ?? "Central",
                action_type:      tx.action_type,
                quantity_changed: tx.quantity_changed ?? 0,
                created_at:       tx.created_at,
              }))
            );
          }
        } else {
          // Non-admin: restock requests for their branch (backend filters automatically)
          const rrRes = await fetch(`${API_BASE}/inventory/restock-requests/`, {
            headers,
            credentials: "include",
          });
          if (rrRes.ok) {
            const rrData = await rrRes.json();
            setTransactions(
              (rrData ?? []).slice(0, 10).map((rr) => ({
                item_name:        rr.inventory_item_name ?? rr.inventory_item?.name ?? "Unknown Item",
                branch_name:      rr.branch_name ?? rr.branch?.name ?? "—",
                action_type:
                  rr.status === "approved"
                    ? "transfer_in"
                    : rr.status === "rejected"
                    ? "restock_rejected"
                    : "restock_request",
                quantity_changed: rr.quantity_requested ?? 0,
                created_at:       rr.created_at,
              }))
            );
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load inventory data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isAuthenticated, isAdmin]); // re-run if auth state changes

  // ── Derived stats ───────────────────────────────────────────────────────────
  const totalSKUs      = items.length;
  const lowStockItems  = items.filter((i) => normalizeStatus(i.status) === "low");
  const outOfStockItems= items.filter((i) => normalizeStatus(i.status) === "out");
  const alertItems     = [...outOfStockItems, ...lowStockItems]; // critical first
  const reorderAlerts  = alertItems;
  const okCount        = items.filter((i) => normalizeStatus(i.status) === "ok").length;
  const healthPct      = totalSKUs ? Math.round((okCount / totalSKUs) * 100) : 100;

  const totalStockValue = items.reduce(
    (sum, i) => sum + Number(i.price ?? 0) * Number(i.quantity ?? 0),
    0
  );

  // Branch label: for non-admins, all items belong to the same branch
  const branchName = items[0]?.branch_name ?? "Your Branch";

  // Category breakdown
  const CATEGORY_COLORS = ["#3b82f6", "#a855f7", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];
  const categoryMap = items.reduce((acc, i) => {
    const cat = i.category || "Other";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});
  const categoryBreakdown = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], idx) => ({
      label,
      count,
      pct: totalSKUs ? Math.round((count / totalSKUs) * 100) : 0,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));

  const stats = [
    {
      title:      "Total SKUs",
      value:      String(totalSKUs),
      change:     `In ${branchName}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      accentBg:   "bg-blue-500/10",
      accentText: "text-blue-400",
      border:     "border-blue-500/20",
    },
    {
      title:      "Low Stock Items",
      value:      String(lowStockItems.length),
      change:     `${outOfStockItems.length} out of stock`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      accentBg:   "bg-amber-500/10",
      accentText: "text-amber-400",
      border:     "border-amber-500/20",
    },
    {
      title:      "Reorder Alerts",
      value:      String(reorderAlerts.length),
      change:     "Requires attention",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      accentBg:   "bg-red-500/10",
      accentText: "text-red-400",
      border:     "border-red-500/20",
    },
    {
      title:  "Total Stock Value",
      value:  `₱${totalStockValue >= 1_000_000
        ? `${(totalStockValue / 1_000_000).toFixed(1)}M`
        : totalStockValue >= 1_000
        ? `${(totalStockValue / 1_000).toFixed(1)}k`
        : totalStockValue.toLocaleString()}`,
      change:     `${totalSKUs} active SKUs`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accentBg:   "bg-emerald-500/10",
      accentText: "text-emerald-400",
      border:     "border-emerald-500/20",
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <InventoryLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Inventory Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            {loading
              ? "Loading…"
              : isAdmin
              ? "Stock overview across all branches"
              : `Stock overview for ${branchName}`}
          </p>
        </div>

        {/* Not authenticated */}
        {!isAuthenticated && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold">
            You are not logged in. Please sign in to view inventory data.
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : stats.map((s, i) => (
                <div
                  key={i}
                  className={`bg-gray-900/60 border ${s.border} rounded-2xl p-5 backdrop-blur-sm`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${s.accentBg} ${s.accentText} p-3 rounded-xl`}>
                      {s.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white mb-1">{s.value}</div>
                  <div className="text-sm text-gray-500 mb-1">{s.title}</div>
                  <div className={`text-xs font-semibold ${s.accentText}`}>{s.change}</div>
                </div>
              ))}
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

          {/* Branch Stock Health */}
          <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-6">
              <h3 className="text-lg font-black text-white">Branch Stock Health</h3>
              <p className="text-gray-500 text-sm mt-0.5">
                Overall inventory health for {loading ? "—" : branchName}
              </p>
            </div>

            {loading ? (
              <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 w-32 bg-gray-800 rounded" />
                      <div className="h-4 w-10 bg-gray-800 rounded" />
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall health bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <span className="text-red-400 text-xs font-black">
                          {branchName.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{branchName}</p>
                        <p className="text-gray-500 text-xs">
                          {reorderAlerts.length} items need attention · ₱{totalStockValue.toLocaleString()} value
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-black ${
                        healthPct >= 80 ? "text-emerald-400" : healthPct >= 60 ? "text-amber-400" : "text-red-400"
                      }`}
                    >
                      {healthPct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${healthPct}%`,
                        backgroundColor: healthPct >= 80 ? "#10b981" : healthPct >= 60 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                </div>

                {/* Status breakdown mini bars */}
                {[
                  { label: "In Stock",     count: okCount,                color: "#10b981" },
                  { label: "Low Stock",    count: lowStockItems.length,   color: "#f59e0b" },
                  { label: "Out of Stock", count: outOfStockItems.length, color: "#ef4444" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                        <span className="text-gray-400 text-sm">{row.label}</span>
                      </div>
                      <span className="text-white font-bold text-sm">{row.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${totalSKUs ? (row.count / totalSKUs) * 100 : 0}%`,
                          backgroundColor: row.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-6">
              <h3 className="text-lg font-black text-white">Category Breakdown</h3>
              <p className="text-gray-500 text-sm mt-0.5">By item type</p>
            </div>

            {loading ? (
              <div className="space-y-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 w-24 bg-gray-800 rounded" />
                      <div className="h-4 w-12 bg-gray-800 rounded" />
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full" />
                  </div>
                ))}
              </div>
            ) : categoryBreakdown.length === 0 ? (
              <p className="text-gray-600 text-sm">No items found.</p>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-gray-300 text-sm font-semibold">{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">{cat.count} SKUs</span>
                        <span className="text-white font-bold text-sm">{cat.pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total unique SKUs</span>
                <span className="text-white font-bold">{loading ? "—" : totalSKUs}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Categories</span>
                <span className="text-white font-bold">{loading ? "—" : categoryBreakdown.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Active Alerts */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-black text-white">Active Alerts</h3>
                <p className="text-gray-500 text-sm mt-0.5">Items below reorder threshold</p>
              </div>
              <a
                href="/inventory/items"
                className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors"
              >
                View all →
              </a>
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : alertItems.length === 0 ? (
              <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
                <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-sm">All items are sufficiently stocked.</p>
              </div>
            ) : (
              alertItems.slice(0, 8).map((item, i) => {
                const st = normalizeStatus(item.status);
                const isCritical = st === "out";
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isCritical ? "bg-red-500" : "bg-amber-500"
                        }`}
                      />
                      <div>
                        <p className="text-white text-sm font-semibold">{item.name}</p>
                        <p className="text-gray-500 text-xs">
                          {item.branch_name ?? branchName} · SKU: {item.sku}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${isCritical ? "text-red-400" : "text-amber-400"}`}>
                          {item.quantity} {item.unit}
                        </p>
                        <p className="text-gray-600 text-xs">min {item.minimum_qty}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold border ${
                          isCritical
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {isCritical ? "Out" : "Low"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Recent Movement */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-black text-white">Recent Movement</h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  {isAdmin ? "Latest stock changes across all branches" : "Latest restock requests for your branch"}
                </p>
              </div>
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : transactions.length === 0 ? (
              <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
                <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-sm">No recent transactions available.</p>
              </div>
            ) : (
              transactions.map((tx, i) => {
                const cfg = ACTION_CONFIG[tx.action_type] ?? {
                  label: tx.action_type,
                  color: "text-gray-400 bg-gray-500/10",
                  sign:  "~",
                };
                const qty = tx.quantity_changed ?? 0;
                const displayQty = qty > 0 ? `+${qty}` : qty < 0 ? String(qty) : "—";
                const qtyColor = qty > 0 ? "text-emerald-400" : qty < 0 ? "text-red-400" : "text-gray-500";
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${cfg.color}`}
                      >
                        {cfg.sign}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">
                          {tx.item_name ?? "Unknown Item"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {tx.branch_name || branchName} · {formatTxDate(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black ${qtyColor}`}>{displayQty}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </InventoryLayout>
  );
}