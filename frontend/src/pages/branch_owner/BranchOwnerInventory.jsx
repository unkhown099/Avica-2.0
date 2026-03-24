import React, { useState, useEffect } from "react";
import BranchOwnerLayout from "./BranchOwnerLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";
import { API_BASE } from "../../hooks/useAuth.js";
import { getUserFromSession } from "../../utils/getUser.js";

function BranchOwnerInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [inventoryItems, setInventoryItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [headers, setHeaders] = useState({});

  // Stats
  const [totalItems, setTotalItems] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Check authentication and get headers
  useEffect(() => {
    const user = getUserFromSession();
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    if (user && token) {
      setIsAuthenticated(true);
      setHeaders({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Fetch inventory data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query params
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (categoryFilter !== "All Categories")
          params.append("category", categoryFilter);
        if (branchFilter !== "All Branches")
          params.append("branch", branchFilter);
        if (statusFilter !== "All Status") {
          // Map status filter to API expected values
          const statusMap = {
            "In Stock": "",
            "Low Stock": "low",
            "Out of Stock": "out",
          };
          params.append("status", statusMap[statusFilter] || "");
        }

        const response = await fetch(
          `${API_BASE}/owner/inventory/?${params.toString()}`,
          { headers, credentials: "include" },
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("user");
            setIsAuthenticated(false);
            throw new Error("Session expired. Please login again.");
          }
          throw new Error("Failed to fetch inventory");
        }

        const data = await response.json();
        setInventoryItems(data);

        // Calculate stats
        const totalQty = data.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0,
        );
        const totalVal = data.reduce((sum, item) => {
          const price = parseFloat(item.price) || 0;
          return sum + price * (item.quantity || 0);
        }, 0);
        const lowStock = data.filter(
          (item) =>
            item.status === "Low Stock" || item.status === "Out of Stock",
        ).length;

        setTotalItems(totalQty);
        setTotalValue(totalVal);
        setLowStockCount(lowStock);

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(data.map((item) => item.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [
    isAuthenticated,
    headers,
    searchQuery,
    categoryFilter,
    branchFilter,
    statusFilter,
  ]);

  // Fetch branches for filter dropdown
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchBranches = async () => {
      try {
        const response = await fetch(`${API_BASE}/owner/branches/`, {
          headers,
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setBranches(data.map((b) => ({ id: b.id, name: b.name })));
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };

    fetchBranches();
  }, [isAuthenticated, headers]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      "In Stock": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "Low Stock": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "Out of Stock": "bg-red-500/20 text-red-400 border-red-500/30",
    };
    const badgeClass =
      statusConfig[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
      >
        {status}
      </span>
    );
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "₱0";
    return `₱${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatQuantity = (quantity, unit) => {
    if (!quantity && quantity !== 0) return "0";
    return `${quantity}${unit ? ` ${unit}` : ""}`;
  };

  const filteredItems = inventoryItems; // Already filtered by API
  const lowStockItems = inventoryItems.filter(
    (item) => item.status === "Low Stock" || item.status === "Out of Stock",
  );

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
  } = usePagination({
    items: filteredItems,
    pageSize: 10,
    resetDeps: [
      searchQuery,
      categoryFilter,
      branchFilter,
      statusFilter,
      inventoryItems,
    ],
  });

  // If not authenticated, show message
  if (!isAuthenticated && !loading) {
    return (
      <BranchOwnerLayout title="" subtitle="">
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-red-400 text-xl mb-4">
                ⚠️ Authentication Required
              </div>
              <p className="text-gray-400">Please login to access inventory.</p>
            </div>
          </div>
        </div>
      </BranchOwnerLayout>
    );
  }

  return (
    <BranchOwnerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Inventory
          </h1>
          <p className="text-gray-400 mt-1">
            Track and monitor inventory across all branches
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Items",
              value: loading ? "..." : totalItems.toLocaleString(),
              sub: "Units across all branches",
              color: "#ef4444",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              ),
            },
            {
              label: "Inventory Value",
              value: loading ? "..." : formatPrice(totalValue),
              sub: "Total stock value",
              color: "#3b82f6",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ),
            },
            {
              label: "Low Stock Alert",
              value: loading ? "..." : lowStockCount,
              sub: "Items need reordering",
              color: "#f59e0b",
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              ),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: stat.color + "22" }}
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: stat.color }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {stat.icon}
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-black text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className="text-xs text-gray-600 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        {!loading && lowStockItems.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-8 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-4 h-4 text-amber-400"
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
              <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                Low Stock Alert
              </h2>
              <span className="ml-auto text-xs text-gray-500">
                {lowStockItems.length} items
              </span>
            </div>
            <div className="space-y-2.5">
              {lowStockItems.slice(0, 5).map((item, i) => (
                <div
                  key={i}
                  className="bg-gray-900/60 border border-white/5 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Current:{" "}
                      <span className="text-amber-400 font-bold">
                        {formatQuantity(item.quantity, item.unit)}
                      </span>
                      {item.minimum_qty && (
                        <>
                          <span className="mx-2 text-gray-700">·</span>
                          Min:{" "}
                          <span className="text-gray-300">
                            {item.minimum_qty} {item.unit}
                          </span>
                        </>
                      )}
                      <span className="mx-2 text-gray-700">·</span>
                      {item.branch_name || "Central"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
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
              placeholder="Search by name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
          >
            <option value="All Categories">All Categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
          >
            <option value="All Branches">All Branches</option>
            {branches.map((b) => (
              <option key={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
          >
            <option value="All Status">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">Name</div>
            <div className="col-span-1">Category</div>
            <div className="col-span-2">SKU</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-1">Price</div>
            <div className="col-span-2">Branch</div>
            <div className="col-span-2">Supplier</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Loading inventory...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center">
              <svg
                className="w-12 h-12 text-gray-700 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-gray-500 text-lg">No items found</p>
              <p className="text-gray-600 text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            paginatedItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group"
              >
                <div
                  className="col-span-2 text-white font-semibold text-sm truncate"
                  title={item.name}
                >
                  {item.name}
                </div>
                <div
                  className="col-span-1 text-gray-400 text-sm truncate"
                  title={item.category}
                >
                  {item.category || "—"}
                </div>
                <div
                  className="col-span-2 text-gray-500 text-xs font-mono truncate"
                  title={item.sku}
                >
                  {item.sku || "—"}
                </div>
                <div className="col-span-1 text-gray-300 text-sm font-semibold">
                  {formatQuantity(item.quantity, item.unit)}
                </div>
                <div className="col-span-1 text-white font-bold text-sm">
                  {formatPrice(item.price)}
                </div>
                <div
                  className="col-span-2 text-gray-400 text-sm truncate"
                  title={item.branch_name}
                >
                  {item.branch_name || "Central"}
                </div>
                <div
                  className="col-span-2 text-gray-400 text-sm truncate"
                  title={item.supplier}
                >
                  {item.supplier || "—"}
                </div>
                <div className="col-span-1 flex justify-end">
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))
          )}

          {!loading && filteredItems.length > 0 && (
            <div className="px-6 py-4 border-t border-white/5">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {startItem}-{endItem}
                </span>{" "}
                of{" "}
                <span className="text-white font-semibold">
                  {filteredItems.length}
                </span>{" "}
                items
              </p>
            </div>
          )}

          {!loading && filteredItems.length > 0 && (
            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
              className="px-6 pb-6"
            />
          )}
        </div>
      </div>
    </BranchOwnerLayout>
  );
}

export default BranchOwnerInventory;