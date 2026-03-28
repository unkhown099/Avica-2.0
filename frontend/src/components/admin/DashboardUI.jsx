// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({
  title,
  value,
  icon,
  accentBg,
  accentText,
  border,
  sub,
}) {
  return (
    <div
      className={`bg-gray-900/60 border ${border} rounded-2xl p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${accentBg} ${accentText} p-3 rounded-xl`}>{icon}</div>
      </div>
      <div className="text-2xl font-black text-white mb-1">{value ?? "—"}</div>
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      {sub && (
        <div className={`text-xs font-semibold ${accentText}`}>{sub}</div>
      )}
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-800" />
      </div>
      <div className="h-7 w-24 bg-gray-800 rounded mb-2" />
      <div className="h-4 w-32 bg-gray-800 rounded" />
    </div>
  );
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────
export function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 animate-pulse items-center">
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-800 shrink-0" />
        <div className="h-4 w-28 bg-gray-800 rounded" />
      </div>
      <div className="col-span-3 h-4 w-20 bg-gray-800 rounded" />
      <div className="col-span-2 h-4 w-14 bg-gray-800 rounded" />
      <div className="col-span-2 h-6 w-20 bg-gray-800 rounded-full" />
      <div className="col-span-1" />
    </div>
  );
}

// ── Error Banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message, onRetry }) {
  const text = String(message ?? "").trim();
  if (!text) return null;

  return (
    <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4">
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
      <span className="text-sm font-medium">{text}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-auto text-xs font-semibold underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ message = "No data found." }) {
  return (
    <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
      <svg
        className="w-10 h-10 text-gray-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  done: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};
const STATUS_LABEL = {
  completed: "Completed",
  in_progress: "In Progress",
  pending: "Pending",
  cancelled: "Cancelled",
  confirmed: "Confirmed",
  done: "Done",
};

export function StatusBadge({ status = "" }) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[key] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
    >
      {STATUS_LABEL[key] ?? status}
    </span>
  );
}

// ── Inventory Status Badge ────────────────────────────────────────────────────
const INV_STYLE = {
  "In Stock": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Low Stock": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Out of Stock": "bg-red-500/20 text-red-400 border-red-500/30",
};

export function InventoryBadge({ status }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold border ${INV_STYLE[status] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
    >
      {status}
    </span>
  );
}

// ── Tier Badge ────────────────────────────────────────────────────────────────
const TIER_STYLE = {
  Platinum: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Gold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Silver: "bg-gray-400/20 text-gray-300 border-gray-400/30",
  Bronze: "bg-orange-700/20 text-orange-400 border-orange-700/30",
};

export function TierBadge({ tier }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold border ${TIER_STYLE[tier] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
    >
      {tier}
    </span>
  );
}

// ── Avatar Initial ────────────────────────────────────────────────────────────
export function AvatarInitial({
  name = "",
  colorClass = "bg-red-500/10 text-red-400",
}) {
  return (
    <div
      className={`w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center text-sm font-bold shrink-0`}
    >
      {name.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

// ── CSV Export ────────────────────────────────────────────────────────────────
export function exportToCSV(rows, headers, filename) {
  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Shared Chart theme ────────────────────────────────────────────────────────
export const CHART_BASE = {
  tooltip: {
    backgroundColor: "#111827",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    titleColor: "#f9fafb",
    bodyColor: "#9ca3af",
  },
  grid: { color: "rgba(255,255,255,0.04)" },
  ticks: { color: "#6b7280" },
};
