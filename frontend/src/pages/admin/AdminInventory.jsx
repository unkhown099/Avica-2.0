import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import Swal from "sweetalert2";

const API = import.meta.env.VITE_API_BASE_URL;

const getToken = () => {
  const tokenKeys = [
    "access_token",
    "accessToken",
    "token",
    "jwt",
    "access",
    "authToken",
    "Authorization",
  ];

  for (const key of tokenKeys) {
    const local = localStorage.getItem(key);
    if (local) return local;
    const session = sessionStorage.getItem(key);
    if (session) return session;
  }

  try {
    const userRaw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userRaw) {
      const user = JSON.parse(userRaw);
      for (const key of ["access_token", "accessToken", "token", "jwt", "access"]) {
        if (user?.[key]) return user[key];
      }
    }
  } catch {}

  try {
    const authRaw = localStorage.getItem("auth") || sessionStorage.getItem("auth");
    if (authRaw) {
      const auth = JSON.parse(authRaw);
      for (const key of ["access_token", "accessToken", "token", "jwt", "access"]) {
        if (auth?.[key]) return auth[key];
      }
    }
  } catch {}

  return null;
};

const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

// ── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Lubricants",
  "Brakes",
  "Filters",
  "Batteries",
  "Tires",
  "Ignition",
  "Other",
];

const SKU_PREFIX = {
  Lubricants: "LUB",
  Brakes: "BRK",
  Filters: "FIL",
  Batteries: "BAT",
  Tires: "TIR",
  Ignition: "IGN",
  Other: "OTH",
};

const inputCls =
  "w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all";

// ── Status badge ─────────────────────────────────────────────────────────────
const getInventoryStatusKey = (item) => {
  const quantity = Number(item?.quantity ?? 0);
  const minimum = Number(item?.minimum_qty ?? item?.minimum ?? 0);
  const raw = String(item?.status ?? "")
    .trim()
    .toLowerCase();

  if (quantity <= 0 || raw.includes("out of stock")) return "out_of_stock";
  if (minimum > 0 && quantity <= minimum) return "reorder_now";
  if (minimum > 0 && quantity <= Math.ceil(minimum * 1.5)) return "running_low";
  if (raw.includes("critical") || raw.includes("reorder")) return "reorder_now";
  if (raw.includes("low")) return "running_low";
  return "available";
};

const STATUS_UI = {
  available: {
    label: "Available 🟢",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  running_low: {
    label: "Running Low 🟡",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  reorder_now: {
    label: "Reorder Now 🔴",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  out_of_stock: {
    label: "Out of Stock ⚫",
    className: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  },
};

const StatusBadge = ({ item }) => {
  const key = getInventoryStatusKey(item);
  const ui = STATUS_UI[key] ?? STATUS_UI.available;
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${ui.className}`}
    >
      {ui.label}
    </span>
  );
};

// ── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 animate-pulse items-center">
    <div className="col-span-1 h-3 w-10 bg-gray-800 rounded" />
    <div className="col-span-2 h-3.5 w-28 bg-gray-800 rounded" />
    <div className="col-span-1 h-3 w-16 bg-gray-800 rounded" />
    <div className="col-span-1 h-3 w-20 bg-gray-800 rounded font-mono" />
    <div className="col-span-1 h-3 w-12 bg-gray-800 rounded" />
    <div className="col-span-1 h-3 w-14 bg-gray-800 rounded" />
    <div className="col-span-2 h-3 w-24 bg-gray-800 rounded" />
    <div className="col-span-2 h-3 w-24 bg-gray-800 rounded" />
    <div className="col-span-1 h-6 w-16 bg-gray-800 rounded-full ml-auto" />
  </div>
);

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-400 mb-2">
      {label}
    </label>
    {children}
  </div>
);

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function ItemModal({ onClose, onSaved, editItem, branches }) {
  const isEdit = !!editItem;
  const [itemsSnapshot, setItemsSnapshot] = useState([]);
  const [form, setForm] = useState({
    name: editItem?.name ?? "",
    category: editItem?.category ?? CATEGORIES[0],
    sku: editItem?.sku ?? "",
    quantity: editItem?.quantity ?? "",
    minimum_qty: editItem?.minimum_qty ?? "",
    unit: editItem?.unit ?? "Pieces",
    price: editItem?.price ?? "",
    supplier: editItem?.supplier ?? "",
    branch: editItem?.branch ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (isEdit) return;
    const loadItems = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/inventory/`, {
          headers: authHeaders(),
        });
        setItemsSnapshot(Array.isArray(res.data) ? res.data : []);
      } catch {
        setItemsSnapshot([]);
      }
    };
    loadItems();
  }, [isEdit]);

  const generatedSku = React.useMemo(() => {
    if (isEdit) return form.sku;
    const prefix = SKU_PREFIX[form.category] ?? "ITM";
    const categoryItems = itemsSnapshot.filter((i) => i.category === form.category);
    const existing = new Set(categoryItems.map((i) => i.sku));
    let next = categoryItems.length + 1;
    while (existing.has(`${prefix}-${String(next).padStart(4, "0")}`)) {
      next += 1;
    }
    return `${prefix}-${String(next).padStart(4, "0")}`;
  }, [form.category, form.sku, isEdit, itemsSnapshot]);

  const submit = async () => {
    if (!form.name) {
      Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Name is required.",
        background: "#111827",
        color: "#f9fafb",
      });
      return;
    }
    try {
      setSaving(true);
      const payload = { ...form };
      if (!isEdit) {
        payload.sku = generatedSku;
      }
      if (!isEdit) {
        delete payload.branch;
      }
      if (isEdit) {
        await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/inventory/${editItem.id}/`, payload, {
          headers: authHeaders(),
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/inventory/`, payload, {
          headers: authHeaders(),
        });
      }
      onSaved();
      onClose();
      Swal.fire({
        icon: "success",
        title: isEdit ? "Item updated" : "Item added",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
        background: "#111827",
        color: "#f9fafb",
      });
    } catch (err) {
      const msg =
        err.response?.data?.sku?.[0] ??
        err.response?.data?.detail ??
        JSON.stringify(err.response?.data) ??
        "Failed to save";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        background: "#111827",
        color: "#f9fafb",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-white">
              {isEdit ? "Edit Item" : "Add Inventory Item"}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {isEdit ? "Update item details" : "Add a new item to inventory"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all"
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

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Item Name">
              <input
                className={inputCls}
                placeholder="e.g. Engine Oil 5W-30"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="Category">
              <select
                className={inputCls}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isEdit && (
              <Field label="SKU (Auto-generated)">
                <input
                  className={inputCls}
                  value={generatedSku}
                  disabled
                />
              </Field>
            )}
            {isEdit && (
              <Field label="SKU">
                <input className={inputCls} value={form.sku} disabled />
              </Field>
            )}
            <Field label="Unit">
              <input
                className={inputCls}
                placeholder="e.g. Liters, Pieces, Sets"
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Quantity">
              <input
                type="number"
                className={inputCls}
                placeholder="0"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </Field>
            <Field label="Min Qty (Alert)">
              <input
                type="number"
                className={inputCls}
                placeholder="0"
                value={form.minimum_qty}
                onChange={(e) => set("minimum_qty", e.target.value)}
              />
            </Field>
            <Field label="Price (₱)">
              <input
                type="number"
                className={inputCls}
                placeholder="0.00"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Field label="Supplier">
              <input
                className={inputCls}
                placeholder="e.g. Shell Philippines"
                value={form.supplier}
                onChange={(e) => set("supplier", e.target.value)}
              />
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 px-6 py-3 rounded-xl transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-red-600/30"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
function AdminInventory() {
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("inventory");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
        const [invRes, branchRes] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/inventory/?archived=${archiveFilter === "archived" ? "true" : "false"}`,
            { headers: authHeaders() },
          ),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/branches/`, { headers: authHeaders() }),
      ]);
      const [rrRes, txRes] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/inventory/restock-requests/`,
          { headers: authHeaders() },
        ),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/inventory/transactions/?limit=20`, {
          headers: authHeaders(),
        }),
      ]);
      const centralOnlyItems = Array.isArray(invRes.data)
        ? invRes.data.filter((item) => item.branch == null && item.branch_name == null)
        : [];
      setItems(centralOnlyItems);
      setBranches(branchRes.data);
      setRestockRequests(rrRes.data);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
    } catch (err) {
      setError("Failed to load inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [archiveFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleItemActive = async (item, nextActive) => {
    const result = await Swal.fire({
      title: nextActive ? `Restore "${item.name}"?` : `Archive "${item.name}"?`,
      text: nextActive
        ? "This item will return to active inventory."
        : "This item will be moved to Archived.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: nextActive ? "Restore" : "Archive",
      confirmButtonColor: nextActive ? "#10b981" : "#ef4444",
      background: "#111827",
      color: "#f9fafb",
    });
    if (!result.isConfirmed) return;
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/inventory/${item.id}/`,
        { is_active: nextActive },
        { headers: authHeaders() },
      );
      await fetchData();
      Swal.fire({
        icon: "success",
        title: nextActive ? "Item restored" : "Item archived",
        timer: 1200,
        showConfirmButton: false,
        background: "#111827",
        color: "#f9fafb",
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not update item status.",
        background: "#111827",
        color: "#f9fafb",
      });
    }
  };

  // ── Delete (disabled) ──────────────────────────────────────────────────────
  const deleteItem = async (item) => {
    const result = await Swal.fire({
      title: `Delete "${item.name}"?`,
      text: "Delete is disabled. Use Archive instead.",
      icon: "warning",
      showCancelButton: false,
      confirmButtonText: "OK",
      confirmButtonColor: "#ef4444",
      background: "#111827",
      color: "#f9fafb",
    });
    if (!result.isConfirmed) return;
  };

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    const matchCat =
      categoryFilter === "All Categories" || item.category === categoryFilter;
    const matchStatus =
      statusFilter === "all" || getInventoryStatusKey(item) === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const lowStock = items.filter((i) => {
    const key = getInventoryStatusKey(i);
    return key === "running_low" || key === "reorder_now" || key === "out_of_stock";
  });
  const filteredLowStock = lowStock;

  const totalValue = items.reduce(
    (sum, i) => sum + (parseFloat(i.price) || 0) * (i.quantity || 0),
    0,
  );

  const openCreate = () => {
    setEditItem(null);
    setShowModal(true);
  };
  const openEdit = (i) => {
    setEditItem(i);
    setShowModal(true);
  };

  const centralItems = items.filter((i) => i.branch_name == null);

  const reviewRestock = async (requestItem, action) => {
    const confirm = await Swal.fire({
      title: `${action === "approve" ? "Approve" : "Reject"} request?`,
      text: `${requestItem.inventory_item_name} • Qty ${requestItem.quantity_requested}`,
      input: "text",
      inputPlaceholder: "Reviewer note (optional)",
      showCancelButton: true,
      confirmButtonText: action === "approve" ? "Approve" : "Reject",
      confirmButtonColor: action === "approve" ? "#10b981" : "#ef4444",
      background: "#111827",
      color: "#f9fafb",
    });
    if (!confirm.isConfirmed) return;

    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/inventory/restock-requests/${requestItem.id}/action/`,
        {
          action,
          reviewer_note: confirm.value || "",
        },
        { headers: authHeaders() },
      );
      await fetchData();
      Swal.fire({
        icon: "success",
        title: action === "approve" ? "Request approved" : "Request rejected",
        timer: 1200,
        showConfirmButton: false,
        background: "#111827",
        color: "#f9fafb",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.detail || "Could not update request.",
        background: "#111827",
        color: "#f9fafb",
      });
    }
  };

  const pendingRestock = restockRequests.filter((r) => r.status === "pending");

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Inventory
            </h1>
            <p className="text-gray-400 mt-1">
              Track and manage parts and supplies inventory
            </p>
          </div>
          {activeTab === "inventory" && (
            <div className="flex gap-2 self-start md:self-auto">
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50"
              >
                Send Stock
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Item
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-6 bg-gray-900/60 p-1 rounded-xl border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === "inventory"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === "transactions"
                ? "bg-gray-700 text-white shadow-lg shadow-gray-700/25"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Transaction History
          </button>
        </div>

        {/* Error */}
        {error && (
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
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={fetchData}
              className="ml-auto text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {activeTab === "inventory" && (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Items",
              sub: "Central inventory",
              value: loading ? null : items.length,
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
              sub: "Total stock value",
              value: loading ? null : `₱${totalValue.toLocaleString()}`,
              color: "#a855f7",
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
              sub: "Items need reordering",
              value: loading ? null : filteredLowStock.length,
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
                {loading ? (
                  <div className="h-7 w-16 bg-gray-800 rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className="text-xs text-gray-600 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        {!loading && filteredLowStock.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-8 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-4 h-4 text-red-400"
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
              <h2 className="text-sm font-black text-red-400 uppercase tracking-wider">
                Low Stock Alert
              </h2>
              <span className="ml-auto text-xs text-gray-500">
                {filteredLowStock.length} items
              </span>
            </div>
            <div className="space-y-2.5">
              {filteredLowStock.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-900/60 border border-white/5 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Current:{" "}
                      <span className="text-red-400 font-bold">
                        {item.quantity} {item.unit}
                      </span>
                      <span className="mx-2 text-gray-700">·</span>
                      Min:{" "}
                      <span className="text-gray-300">
                        {item.minimum_qty} {item.unit}
                      </span>
                      <span className="mx-2 text-gray-700">·</span>
                      {item.branch_name ?? "No branch"}
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(item)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-red-600/20"
                  >
                    Update Stock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && pendingRestock.length > 0 && (
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 mb-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Pending Restock Requests
              </h2>
              <span className="text-xs text-gray-500">{pendingRestock.length} pending</span>
            </div>
            <div className="space-y-2.5">
              {pendingRestock.map((req) => (
                <div
                  key={req.id}
                  className="bg-gray-950/60 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between"
                >
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {req.inventory_item_name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Branch: {req.branch_name} · Qty:{" "}
                      <span className="text-gray-200">{req.quantity_requested}</span> · By{" "}
                      {req.requested_by_name || "Unknown"}
                    </div>
                    {req.notes && (
                      <p className="text-xs text-gray-400 mt-1">Note: {req.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewRestock(req, "approve")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reviewRestock(req, "reject")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-all"
                    >
                      Reject
                    </button>
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
          {[
            {
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: ["All Categories", ...CATEGORIES],
            },
            {
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "All Status" },
                { value: "available", label: "Available 🟢" },
                { value: "running_low", label: "Running Low 🟡" },
                { value: "reorder_now", label: "Reorder Now 🔴" },
                { value: "out_of_stock", label: "Out of Stock ⚫" },
              ],
            },
            {
              value: archiveFilter,
              onChange: setArchiveFilter,
              options: [
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
              ],
            },
          ].map((sel, i) => (
            <select
              key={i}
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
            >
              {sel.options.map((o) => (
                <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
                  {typeof o === "string" ? o : o.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Name</div>
            <div className="col-span-1">Category</div>
            <div className="col-span-1">SKU</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-1">Price</div>
            <div className="col-span-2">Branch</div>
            <div className="col-span-1">Supplier</div>
            <div className="col-span-1 text-right">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
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
            filtered.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group"
              >
                <div className="col-span-3">
                  <div className="text-white font-semibold text-sm">
                    {item.name}
                  </div>
                </div>
                <div className="col-span-1 text-gray-400 text-sm">
                  {item.category}
                </div>
                <div className="col-span-1 text-gray-500 text-xs font-mono">
                  {item.sku}
                </div>
                <div className="col-span-1 text-gray-300 text-sm font-semibold">
                  {item.quantity}{" "}
                  <span className="text-gray-600 font-normal text-xs">
                    {item.unit}
                  </span>
                </div>
                <div className="col-span-1 text-white font-bold text-sm">
                  ₱{Number(item.price).toLocaleString()}
                </div>
                <div className="col-span-2 text-gray-400 text-sm">
                  {item.branch_name ?? <span className="text-gray-700">—</span>}
                </div>
                <div className="col-span-1 text-gray-400 text-sm">
                  {item.supplier || <span className="text-gray-700">—</span>}
                </div>
                <div className="col-span-1 flex justify-end">
                  <StatusBadge item={item} />
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        toggleItemActive(item, archiveFilter === "archived")
                      }
                      className={`p-1.5 rounded-lg transition-all ${
                        archiveFilter === "archived"
                          ? "text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                          : "text-gray-500 hover:text-amber-400 hover:bg-amber-500/10"
                      }`}
                      title={archiveFilter === "archived" ? "Restore" : "Archive"}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {archiveFilter === "archived" ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 13h6m2 7H7a2 2 0 01-2-2V7h14v11a2 2 0 01-2 2zM9 4h6l1 3H8l1-3z"
                          />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {!loading && filtered.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {filtered.length}
                </span>{" "}
                of{" "}
                <span className="text-white font-semibold">{items.length}</span>{" "}
                items
              </p>
            </div>
          )}
        </div>
          </>
        )}

        {activeTab === "transactions" && (
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 mb-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Inventory Transaction History
            </h2>
            <span className="text-xs text-gray-500">Latest {transactions.length} records</span>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500">No transactions yet.</p>
          ) : (
            <div className="space-y-2.5">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-gray-950/60 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between"
                >
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {tx.item_name} {tx.item_sku ? `(${tx.item_sku})` : ""}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {tx.action_type.replaceAll("_", " ")} · Qty:{" "}
                      <span className="text-gray-200">{tx.quantity_changed}</span> ·{" "}
                      {tx.branch_name || "Central"}
                      {tx.target_branch_name ? ` → ${tx.target_branch_name}` : ""}
                    </div>
                    {tx.notes && <p className="text-xs text-gray-400 mt-1">Note: {tx.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-300">{tx.performed_by_name || "System"}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {showModal && (
        <ItemModal
          onClose={() => setShowModal(false)}
          onSaved={fetchData}
          editItem={editItem}
          branches={branches}
        />
      )}

      {showTransferModal && (
        <StockTransferModal
          onClose={() => setShowTransferModal(false)}
          onTransferred={fetchData}
          items={centralItems}
          branches={branches}
        />
      )}
    </AdminLayout>
  );
}

function StockTransferModal({ onClose, onTransferred, items, branches }) {
  const [form, setForm] = useState({
    source_item_id: "",
    target_branch_id: "",
    quantity: "",
    note: "",
  });
  const [sending, setSending] = useState(false);

  const selectedItem = items.find((i) => String(i.id) === String(form.source_item_id));

  const submit = async () => {
    if (!form.source_item_id || !form.target_branch_id || !form.quantity) {
      await Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please select item, branch, and quantity.",
        background: "#111827",
        color: "#f9fafb",
      });
      return;
    }

    try {
      setSending(true);
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/inventory/transfer/`,
        {
          source_item_id: Number(form.source_item_id),
          target_branch_id: Number(form.target_branch_id),
          quantity: Number(form.quantity),
          note: form.note,
        },
        { headers: authHeaders() },
      );
      await Swal.fire({
        icon: "success",
        title: "Stock sent",
        timer: 1200,
        showConfirmButton: false,
        background: "#111827",
        color: "#f9fafb",
      });
      onTransferred();
      onClose();
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Transfer failed",
        text:
          err.response?.data?.detail ||
          err.response?.data?.message ||
          JSON.stringify(err.response?.data) ||
          "Could not send stock.",
        background: "#111827",
        color: "#f9fafb",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4">
        <h2 className="text-xl font-black text-white">Send Stock to Branch</h2>
        <div className="space-y-4">
          <Field label="Central Item (SKU)">
            <select
              className={inputCls}
              value={form.source_item_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, source_item_id: e.target.value }))
              }
            >
              <option value="">Select item</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} · {i.sku} · available {i.quantity}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Target Branch">
            <select
              className={inputCls}
              value={form.target_branch_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, target_branch_id: e.target.value }))
              }
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity">
            <input
              type="number"
              className={inputCls}
              min={1}
              max={selectedItem?.quantity ?? undefined}
              value={form.quantity}
              onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
            />
          </Field>
          <Field label="Note (Optional)">
            <input
              className={inputCls}
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            />
          </Field>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 px-6 py-3 rounded-xl transition-all font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={sending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-all font-semibold"
          >
            {sending ? "Sending..." : "Send Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminInventory;
