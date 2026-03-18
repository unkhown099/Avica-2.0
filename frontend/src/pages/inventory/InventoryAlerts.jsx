import React, { useState } from "react";
import InventoryLayout from "./InventoryLayout";

const ALERTS = [
  {
    id: 1,
    item: "Oil Filter",
    category: "Parts",
    branch: "Makati",
    current: 5,
    reorder: 15,
    lastRestocked: "Jun 01",
    supplier: "AutoParts PH",
    severity: "critical",
  },
  {
    id: 2,
    item: "Coolant (Pre-mixed)",
    category: "Consumables",
    branch: "Makati",
    current: 2,
    reorder: 10,
    lastRestocked: "May 28",
    supplier: "ChemTech Supply",
    severity: "critical",
  },
  {
    id: 3,
    item: "Power Steering Fluid",
    category: "Consumables",
    branch: "Makati",
    current: 1,
    reorder: 8,
    lastRestocked: "May 20",
    supplier: "ChemTech Supply",
    severity: "critical",
  },
  {
    id: 4,
    item: "Brake Pads (Front)",
    category: "Parts",
    branch: "Quezon City",
    current: 6,
    reorder: 8,
    lastRestocked: "Jun 05",
    supplier: "BrakePro Inc",
    severity: "warning",
  },
  {
    id: 5,
    item: "Brake Pads (Front)",
    category: "Parts",
    branch: "Mandaluyong",
    current: 4,
    reorder: 8,
    lastRestocked: "May 30",
    supplier: "BrakePro Inc",
    severity: "warning",
  },
  {
    id: 6,
    item: "Windshield Wiper (21in)",
    category: "Accessories",
    branch: "Makati",
    current: 7,
    reorder: 10,
    lastRestocked: "Jun 08",
    supplier: "AutoParts PH",
    severity: "warning",
  },
  {
    id: 7,
    item: "Engine Oil (5W-30)",
    category: "Consumables",
    branch: "Quezon City",
    current: 18,
    reorder: 20,
    lastRestocked: "Jun 10",
    supplier: "OilEx Corp",
    severity: "warning",
  },
];

const SEVERITY_STYLES = {
  critical: {
    badge: "bg-red-500/15 text-red-400 border-red-500/25",
    dot: "bg-red-500",
    label: "Critical",
  },
  warning: {
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    dot: "bg-amber-500",
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
};

function RestockModal({ alert, onClose }) {
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
          <div
            className={`rounded-xl p-3 border ${alert.severity === "critical" ? "bg-red-500/5 border-red-500/20" : "bg-amber-500/5 border-amber-500/20"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-2 h-2 rounded-full ${SEVERITY_STYLES[alert.severity].dot}`}
              />
              <span
                className={`text-xs font-bold uppercase ${alert.severity === "critical" ? "text-red-400" : "text-amber-400"}`}
              >
                {SEVERITY_STYLES[alert.severity].label}
              </span>
            </div>
            <p className="text-white font-bold text-sm">{alert.item}</p>
            <p className="text-gray-500 text-xs">
              {alert.branch} · Current: {alert.current} / Min: {alert.reorder}
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Suggested Quantity
            </label>
            <input
              type="number"
              defaultValue={alert.reorder * 2 - alert.current}
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Supplier
            </label>
            <input
              type="text"
              defaultValue={alert.supplier}
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Priority
            </label>
            <select className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors">
              <option>Urgent (1–2 days)</option>
              <option>Standard (3–5 days)</option>
              <option>Economy (1–2 weeks)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold text-sm transition-all"
            >
              Cancel
            </button>
            <button className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-600/20">
              Create Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReorderAlerts() {
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [filterBranch, setFilterBranch] = useState("All Branches");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [dismissed, setDismissed] = useState([]);

  const critical = ALERTS.filter(
    (a) => a.severity === "critical" && !dismissed.includes(a.id),
  );
  const warning = ALERTS.filter(
    (a) => a.severity === "warning" && !dismissed.includes(a.id),
  );

  const filtered = ALERTS.filter((a) => {
    if (dismissed.includes(a.id)) return false;
    if (filterSeverity !== "All" && a.severity !== filterSeverity.toLowerCase())
      return false;
    if (filterBranch !== "All Branches" && a.branch !== filterBranch)
      return false;
    return true;
  });

  return (
    <InventoryLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Reorder Alerts
            </h1>
            <p className="text-gray-400 mt-1">
              Automated alerts for low-stock items that need replenishment.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition-all w-fit">
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
            Export Report
          </button>
        </div>

        {/* Alert Summary Banner */}
        {critical.length > 0 && (
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
                  {critical.length} Critical Alert
                  {critical.length > 1 ? "s" : ""} — Immediate Action Required
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  These items are critically low and may cause service
                  disruptions. Create restock orders immediately.
                </p>
              </div>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-600/20 flex-shrink-0">
                Order All Critical
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterSeverity === s ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
              >
                {s}
                {s === "Critical" && critical.length > 0 && (
                  <span className="ml-1.5 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {critical.length}
                  </span>
                )}
                {s === "Warning" && warning.length > 0 && (
                  <span className="ml-1.5 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {warning.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-gray-500 text-sm">Branch:</span>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500 transition-colors"
            >
              {[
                "All Branches",
                "Quezon City",
                "Makati",
                "Pasig",
                "Mandaluyong",
              ].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h3 className="text-lg font-black text-white">Active Alerts</h3>
              <p className="text-gray-500 text-sm mt-0.5">
                {filtered.length} items require attention
              </p>
            </div>
          </div>

          {/* Table header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5 bg-gray-900/40">
            <div className="col-span-3">Item</div>
            <div className="col-span-1">Category</div>
            <div className="col-span-2">Branch</div>
            <div className="col-span-1 text-center">Severity</div>
            <div className="col-span-2">Stock Level</div>
            <div className="col-span-1">Supplier</div>
            <div className="col-span-1">Last Restock</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {filtered.length === 0 ? (
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
            filtered.map((alert) => {
              const sev = SEVERITY_STYLES[alert.severity];
              const cat = CATEGORY_STYLES[alert.category];
              const pct = Math.min((alert.current / alert.reorder) * 100, 100);
              return (
                <div
                  key={alert.id}
                  className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Mobile */}
                  <div className="lg:hidden flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${sev.dot}`} />
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sev.badge}`}
                        >
                          {sev.label}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}
                        >
                          {alert.category}
                        </span>
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {alert.item}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {alert.branch} · {alert.supplier}
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
                          {alert.current}
                        </span>{" "}
                        / min {alert.reorder}
                      </span>
                      <span>Last: {alert.lastRestocked}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            alert.severity === "critical"
                              ? "#ef4444"
                              : "#f59e0b",
                        }}
                      />
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden lg:block col-span-3">
                    <p className="text-white font-semibold text-sm">
                      {alert.item}
                    </p>
                  </div>
                  <div className="hidden lg:flex col-span-1 items-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}
                    >
                      {alert.category}
                    </span>
                  </div>
                  <div className="hidden lg:flex col-span-2 items-center">
                    <span className="text-gray-400 text-sm">
                      {alert.branch}
                    </span>
                  </div>
                  <div className="hidden lg:flex col-span-1 items-center justify-center">
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
                          {alert.current} / {alert.reorder}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              alert.severity === "critical"
                                ? "#ef4444"
                                : "#f59e0b",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:flex col-span-1 items-center">
                    <span className="text-gray-500 text-xs">
                      {alert.supplier}
                    </span>
                  </div>
                  <div className="hidden lg:flex col-span-1 items-center">
                    <span className="text-gray-500 text-xs">
                      {alert.lastRestocked}
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
                      onClick={() => setDismissed([...dismissed, alert.id])}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-gray-400 hover:bg-gray-800 rounded-lg transition-all"
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
        </div>
      </div>

      {selectedAlert && (
        <RestockModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </InventoryLayout>
  );
}

export default ReorderAlerts;