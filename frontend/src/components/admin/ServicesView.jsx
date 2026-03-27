import { useMemo } from "react";
import { StatCard, SkeletonCard, SkeletonRow, EmptyState } from "./DashboardUI";
import { useServices } from "../../hooks/useDashboard";

const SERVICE_COLORS = [
  "#ef4444",
  "#a855f7",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
];

export default function ServicesView() {
  const { data: services, loading, error } = useServices();

  const items = services ?? [];

  // Sort by price descending (proxy for revenue potential)
  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => Number(b.price ?? 0) - Number(a.price ?? 0),
      ),
    [items],
  );

  const totalServices = items.filter((s) => s.is_active !== false).length;

  const totalPrice = items.reduce((a, s) => a + Number(s.price ?? 0), 0);

  const topService = sorted[0] ?? null;

  const statCards = [
    {
      title: "Active Services",
      value: String(totalServices),
      accentBg: "bg-blue-500/10",
      accentText: "text-blue-400",
      border: "border-blue-500/20",
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      title: "Top Service",
      value: topService?.name ?? "—",
      sub: topService
        ? `₱${Number(topService.price).toLocaleString()}`
        : "",
      accentBg: "bg-red-500/10",
      accentText: "text-red-400",
      border: "border-red-500/20",
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
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
    },
    {
      title: "Combined Price",
      value: `₱${totalPrice.toLocaleString()}`,
      accentBg: "bg-emerald-500/10",
      accentText: "text-emerald-400",
      border: "border-emerald-500/20",
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
    },
  ];

  const CATEGORY_BADGE = {
    Maintenance: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Repair: "bg-red-500/20 text-red-400 border-red-500/30",
    Diagnostic: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Cosmetic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-lg font-black text-white">Service Catalog</h3>
          <p className="text-gray-500 text-sm mt-0.5">All service types sorted by price</p>
        </div>
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
          <div className="col-span-4">Service</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-2">Price</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Share</div>
        </div>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : sorted.length === 0 ? (
          <EmptyState message="No services found." />
        ) : (
          sorted.map((s, i) => {
            const pct =
              totalPrice > 0
                ? ((Number(s.price) / totalPrice) * 100).toFixed(1)
                : "0.0";
            const color = SERVICE_COLORS[i % SERVICE_COLORS.length];
            return (
              <div
                key={s.id ?? i}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {s.name}
                    </div>
                    {s.description && (
                      <div className="text-gray-600 text-xs mt-0.5 line-clamp-1">
                        {s.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold border ${CATEGORY_BADGE[s.category] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                  >
                    {s.category}
                  </span>
                </div>
                <div className="col-span-2 text-gray-400 text-sm">
                  {s.duration || "—"}
                </div>
                <div className="col-span-2 text-white font-bold text-sm">
                  ₱{Number(s.price ?? 0).toLocaleString()}
                </div>
                <div className="col-span-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold border ${s.is_active !== false ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                  >
                    {s.is_active !== false ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="text-xs font-bold" style={{ color }}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}