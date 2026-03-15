import React from "react";
import InventoryLayout from "./InventoryLayout";

const STATS = [
  {
    title: "Total SKUs",
    value: "48",
    change: "Across all branches",
    icon: (
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
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
    accentBg: "bg-blue-500/10",
    accentText: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    title: "Low Stock Items",
    value: "9",
    change: "3 critical alerts",
    icon: (
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
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    accentBg: "bg-amber-500/10",
    accentText: "text-amber-400",
    border: "border-amber-500/20",
  },
  {
    title: "Reorder Alerts",
    value: "5",
    change: "Requires immediate action",
    icon: (
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
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
    accentBg: "bg-red-500/10",
    accentText: "text-red-400",
    border: "border-red-500/20",
  },
  {
    title: "Total Stock Value",
    value: "₱284k",
    change: "+5.2% from last month",
    icon: (
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
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    accentBg: "bg-emerald-500/10",
    accentText: "text-emerald-400",
    border: "border-emerald-500/20",
  },
];

const RECENT_ALERTS = [
  {
    item: "Oil Filter",
    branch: "Makati",
    current: 5,
    reorder: 15,
    severity: "critical",
  },
  {
    item: "Coolant (Pre-mixed)",
    branch: "Makati",
    current: 2,
    reorder: 10,
    severity: "critical",
  },
  {
    item: "Power Steering Fluid",
    branch: "Makati",
    current: 1,
    reorder: 8,
    severity: "critical",
  },
  {
    item: "Brake Pads (Front)",
    branch: "Quezon City",
    current: 6,
    reorder: 8,
    severity: "warning",
  },
  {
    item: "Brake Pads (Front)",
    branch: "Mandaluyong",
    current: 4,
    reorder: 8,
    severity: "warning",
  },
];

const RECENT_MOVEMENT = [
  {
    item: "Engine Oil (5W-30)",
    branch: "Quezon City",
    type: "Used",
    qty: -8,
    date: "Jun 15",
  },
  {
    item: "Oil Filter",
    branch: "Makati",
    type: "Restocked",
    qty: +20,
    date: "Jun 15",
  },
  {
    item: "Brake Pads (Front)",
    branch: "Pasig",
    type: "Transfer",
    qty: -3,
    date: "Jun 14",
  },
  {
    item: "Transmission Fluid",
    branch: "QC",
    type: "Used",
    qty: -5,
    date: "Jun 14",
  },
  {
    item: "Coolant (Pre-mixed)",
    branch: "Makati",
    type: "Alert",
    qty: 0,
    date: "Jun 13",
  },
];

const BRANCH_SUMMARY = [
  {
    name: "Quezon City",
    code: "QC",
    items: 48,
    low: 2,
    value: "₱82k",
    health: 85,
  },
  { name: "Makati", code: "MK", items: 48, low: 5, value: "₱61k", health: 52 },
  { name: "Pasig", code: "PS", items: 48, low: 1, value: "₱79k", health: 92 },
  {
    name: "Mandaluyong",
    code: "MN",
    items: 48,
    low: 1,
    value: "₱62k",
    health: 88,
  },
];

const CATEGORY_BREAKDOWN = [
  { label: "Parts", pct: 42, color: "#3b82f6", count: 20 },
  { label: "Consumables", pct: 35, color: "#a855f7", count: 17 },
  { label: "Accessories", pct: 23, color: "#f59e0b", count: 11 },
];

function InventoryDashboard() {
  return (
    <InventoryLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Inventory Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time stock overview across all branches.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {STATS.map((s, i) => (
            <div
              key={i}
              className={`bg-gray-900/60 border ${s.border} rounded-2xl p-5 backdrop-blur-sm`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${s.accentBg} ${s.accentText} p-3 rounded-xl`}>
                  {s.icon}
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-semibold ${s.accentText} ${s.accentBg} px-2 py-1 rounded-full`}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-black text-white mb-1">
                {s.value}
              </div>
              <div className="text-sm text-gray-500 mb-2">{s.title}</div>
              <div className={`text-xs font-semibold ${s.accentText}`}>
                {s.change}
              </div>
            </div>
          ))}
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Branch Health */}
          <div className="xl:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-white">
                  Branch Stock Health
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  Overall inventory health per branch
                </p>
              </div>
            </div>
            <div className="space-y-5">
              {BRANCH_SUMMARY.map((b) => (
                <div key={b.code}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <span className="text-red-400 text-xs font-black">
                          {b.code}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {b.name}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {b.low} items low · {b.value} value
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-black ${b.health >= 80 ? "text-emerald-400" : b.health >= 60 ? "text-amber-400" : "text-red-400"}`}
                    >
                      {b.health}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${b.health}%`,
                        backgroundColor:
                          b.health >= 80
                            ? "#10b981"
                            : b.health >= 60
                              ? "#f59e0b"
                              : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-6">
              <h3 className="text-lg font-black text-white">
                Category Breakdown
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">By item type</p>
            </div>
            <div className="space-y-5">
              {CATEGORY_BREAKDOWN.map((cat) => (
                <div key={cat.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-gray-300 text-sm font-semibold">
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">
                        {cat.count} SKUs
                      </span>
                      <span className="text-white font-bold text-sm">
                        {cat.pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${cat.pct}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total unique SKUs</span>
                <span className="text-white font-bold">48</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Active branches</span>
                <span className="text-white font-bold">4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recent Alerts */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-black text-white">Active Alerts</h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  Items below reorder threshold
                </p>
              </div>
              <a
                href="/inventory/alerts"
                className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors"
              >
                View all →
              </a>
            </div>
            {RECENT_ALERTS.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${a.severity === "critical" ? "bg-red-500" : "bg-amber-500"}`}
                  />
                  <div>
                    <p className="text-white text-sm font-semibold">{a.item}</p>
                    <p className="text-gray-500 text-xs">{a.branch}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${a.severity === "critical" ? "text-red-400" : "text-amber-400"}`}
                    >
                      {a.current} left
                    </p>
                    <p className="text-gray-600 text-xs">min {a.reorder}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold border ${a.severity === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}
                  >
                    {a.severity === "critical" ? "Critical" : "Warning"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Movement */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-black text-white">
                  Recent Movement
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  Latest stock changes
                </p>
              </div>
              <a
                href="/inventory/movement"
                className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors"
              >
                View all →
              </a>
            </div>
            {RECENT_MOVEMENT.map((m, i) => {
              const typeColors = {
                Used: "text-red-400 bg-red-500/10",
                Restocked: "text-emerald-400 bg-emerald-500/10",
                Transfer: "text-blue-400 bg-blue-500/10",
                Alert: "text-amber-400 bg-amber-500/10",
              };
              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${typeColors[m.type]}`}
                    >
                      {m.qty > 0 ? "+" : m.qty < 0 ? "−" : "!"}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {m.item}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {m.branch} · {m.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-black ${m.qty > 0 ? "text-emerald-400" : m.qty < 0 ? "text-red-400" : "text-gray-500"}`}
                    >
                      {m.qty > 0 ? `+${m.qty}` : m.qty < 0 ? m.qty : "—"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${typeColors[m.type]}`}
                    >
                      {m.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </InventoryLayout>
  );
}

export default InventoryDashboard;