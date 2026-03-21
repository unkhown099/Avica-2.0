import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  StatCard,
  SkeletonCard,
  SkeletonRow,
  EmptyState,
  TierBadge,
  AvatarInitial,
  CHART_BASE,
} from "./DashboardUI";
import { useCustomers, useOverview } from "../../hooks/useDashboard";

// Derive tier from loyalty_points
function getTier(points = 0) {
  if (points >= 1000) return "Platinum";
  if (points >= 500) return "Gold";
  if (points >= 200) return "Silver";
  return "Bronze";
}

const TIER_COLORS = {
  Platinum: "#06b6d4",
  Gold: "#eab308",
  Silver: "#9ca3af",
  Bronze: "#ea580c",
};

export default function CustomersView() {
  const { data: customers, loading, error } = useCustomers();
  const { data: overview } = useOverview();

  const enriched = useMemo(
    () =>
      (customers ?? []).map((c) => ({
        name:
          `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() ||
          c.user?.email ||
          "Unknown",
        phone: c.phone ?? "—",
        loyalty_points: c.loyalty_points ?? 0,
        tier: getTier(c.loyalty_points ?? 0),
      })),
    [customers],
  );

  const totalCustomers = overview?.stats?.total_customers ?? enriched.length;

  const avgLoyalty = enriched.length
    ? Math.round(
        enriched.reduce((a, c) => a + c.loyalty_points, 0) / enriched.length,
      )
    : 0;

  const topSpender = enriched.reduce(
    (best, c) => (c.loyalty_points > (best?.loyalty_points ?? 0) ? c : best),
    null,
  );

  // Tier distribution
  const tierCounts = useMemo(() => {
    const map = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
    enriched.forEach((c) => {
      if (map[c.tier] !== undefined) map[c.tier]++;
    });
    return map;
  }, [enriched]);

  // Top 5 by loyalty points for bar chart
  const top5 = [...enriched]
    .sort((a, b) => b.loyalty_points - a.loyalty_points)
    .slice(0, 5);

  const customerBarData = {
    labels: top5.map((c) => c.name.split(" ")[0]),
    datasets: [
      {
        label: "Loyalty Points",
        data: top5.map((c) => c.loyalty_points),
        backgroundColor: [
          "#a855f7",
          "#7c3aed",
          "#6d28d9",
          "#8b5cf6",
          "#c4b5fd",
        ],
        borderRadius: 8,
      },
    ],
  };
  const customerBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: { legend: { display: false }, tooltip: CHART_BASE.tooltip },
    scales: {
      x: { beginAtZero: true, grid: CHART_BASE.grid, ticks: CHART_BASE.ticks },
      y: { grid: { display: false }, ticks: CHART_BASE.ticks },
    },
  };

  const statCards = [
    {
      title: "Total Customers",
      value: String(totalCustomers),
      accentBg: "bg-purple-500/10",
      accentText: "text-purple-400",
      border: "border-purple-500/20",
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      title: "Avg. Loyalty Points",
      value: String(avgLoyalty),
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      title: "Top Customer",
      value: topSpender ? topSpender.name : "—",
      sub: topSpender ? `${topSpender.loyalty_points} loyalty points` : "",
      accentBg: "bg-yellow-500/10",
      accentText: "text-yellow-400",
      border: "border-yellow-500/20",
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
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Customer loyalty chart */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-black text-white mb-1">Top Customers</h3>
          <p className="text-gray-500 text-sm mb-6">By loyalty points</p>
          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : top5.length === 0 ? (
            <div className="h-56 flex items-center justify-center">
              <EmptyState message="No customer data." />
            </div>
          ) : (
            <div className="h-56">
              <Bar data={customerBarData} options={customerBarOptions} />
            </div>
          )}
        </div>

        {/* Tier distribution */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-black text-white mb-1">
            Tier Distribution
          </h3>
          <p className="text-gray-500 text-sm mb-6">Customer loyalty tiers</p>
          <div className="space-y-4 mt-4">
            {Object.entries(tierCounts).map(([tier, count]) => (
              <div key={tier} className="flex items-center gap-4">
                <span className="text-sm text-gray-400 w-20">{tier}</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width:
                        enriched.length > 0
                          ? `${(count / enriched.length) * 100}%`
                          : "0%",
                      backgroundColor: TIER_COLORS[tier],
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-white w-6 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-lg font-black text-white">Customer List</h3>
          <p className="text-gray-500 text-sm mt-0.5">
            All registered customers
          </p>
        </div>
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
          <div className="col-span-5">Name</div>
          <div className="col-span-3">Phone</div>
          <div className="col-span-2">Points</div>
          <div className="col-span-2">Tier</div>
        </div>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : enriched.length === 0 ? (
          <EmptyState message="No customers found." />
        ) : (
          enriched.map((c, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
            >
              <div className="col-span-5 flex items-center gap-3">
                <AvatarInitial
                  name={c.name}
                  colorClass="bg-purple-500/10 text-purple-400"
                />
                <span className="text-white font-semibold text-sm">
                  {c.name}
                </span>
              </div>
              <div className="col-span-3 text-gray-400 text-sm">{c.phone}</div>
              <div className="col-span-2 text-white font-bold text-sm">
                {c.loyalty_points.toLocaleString()}
              </div>
              <div className="col-span-2">
                <TierBadge tier={c.tier} />
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}