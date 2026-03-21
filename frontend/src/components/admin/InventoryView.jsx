import {
  StatCard,
  SkeletonCard,
  SkeletonRow,
  EmptyState,
  InventoryBadge,
} from "./DashboardUI";
import { useInventory } from "../../hooks/useDashboard";

export default function InventoryView() {
  const { data: inventory, loading, error } = useInventory();

  const items = inventory ?? [];

  // Map API model fields to display fields
  // InventoryItem model: name, category, sku, quantity, minimum_qty, unit, price, supplier, status (property)
  const enriched = items.map((item) => {
    let status = "In Stock";
    if (item.quantity <= 0) status = "Out of Stock";
    else if (item.quantity <= item.minimum_qty) status = "Low Stock";
    return { ...item, status };
  });

  const lowCount = enriched.filter((i) => i.status === "Low Stock").length;
  const criticalCount = enriched.filter(
    (i) => i.status === "Out of Stock",
  ).length;

  const statCards = [
    {
      title: "Total SKUs",
      value: String(enriched.length),
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
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    {
      title: "Low Stock Items",
      value: String(lowCount),
      accentBg: "bg-amber-500/10",
      accentText: "text-amber-400",
      border: "border-amber-500/20",
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
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      ),
    },
    {
      title: "Out of Stock",
      value: String(criticalCount),
      sub:
        criticalCount > 0 ? "Needs immediate reorder" : "All items have stock",
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
  ];

  const barColor = (status) =>
    status === "In Stock"
      ? "#10b981"
      : status === "Low Stock"
        ? "#f59e0b"
        : "#ef4444";

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-lg font-black text-white">
            Parts & Supplies Inventory
          </h3>
          <p className="text-gray-500 text-sm mt-0.5">Current stock levels</p>
        </div>
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
          <div className="col-span-4">Item</div>
          <div className="col-span-1">Category</div>
          <div className="col-span-2">Stock</div>
          <div className="col-span-2">Min. Qty</div>
          <div className="col-span-2">Level</div>
          <div className="col-span-1">Status</div>
        </div>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : enriched.length === 0 ? (
          <EmptyState message="No inventory items found." />
        ) : (
          enriched.map((item, i) => {
            const max = Math.max(item.minimum_qty * 3, item.quantity, 1);
            const pct = Math.min(100, Math.round((item.quantity / max) * 100));
            const color = barColor(item.status);
            return (
              <div
                key={i}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
              >
                <div className="col-span-4">
                  <div className="text-white font-semibold text-sm">
                    {item.name}
                  </div>
                  {item.sku && (
                    <div className="text-gray-600 text-xs mt-0.5">
                      SKU: {item.sku}
                    </div>
                  )}
                </div>
                <div className="col-span-1 text-gray-500 text-xs">
                  {item.category}
                </div>
                <div className="col-span-2 text-gray-300 text-sm font-bold">
                  {item.quantity}{" "}
                  <span className="text-gray-600 font-normal">{item.unit}</span>
                </div>
                <div className="col-span-2 text-gray-500 text-sm">
                  {item.minimum_qty}{" "}
                  <span className="text-gray-700">{item.unit}</span>
                </div>
                <div className="col-span-2">
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
                <div className="col-span-1">
                  <InventoryBadge status={item.status} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
