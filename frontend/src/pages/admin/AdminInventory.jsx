import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth, API_BASE } from "../../hooks/useAuth.js";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

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
  "w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all text-sm";
const DARK_SWAL = { background: "#111827", color: "#f9fafb" };
const ALL_BRANCHES = "All Branches";
const CENTRAL_BRANCH = "Central";

const getItemBranchLabel = (item) =>
  item?.branch_name && String(item.branch_name).trim()
    ? item.branch_name
    : CENTRAL_BRANCH;

const getBranchBadgeClass = (branchLabel) =>
  branchLabel === CENTRAL_BRANCH
    ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
    : "bg-amber-500/20 text-amber-300 border-amber-500/30";

const getInventoryStatusKey = (item) => {
  const quantity = Number(item?.quantity ?? 0);
  const minimum = Number(item?.minimum_qty ?? 0);
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
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ui.className}`}
    >
      {ui.label}
    </span>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-400 mb-2">
      {label}
    </label>
    {children}
  </div>
);

const SkeletonRow = () => (
  <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 animate-pulse items-center">
    <div className="col-span-2 h-3.5 bg-gray-800 rounded" />
    <div className="col-span-1 h-3 bg-gray-800 rounded" />
    <div className="col-span-1 h-3 bg-gray-800 rounded" />
    <div className="col-span-1 h-3 bg-gray-800 rounded" />
    <div className="col-span-1 h-3 bg-gray-800 rounded" />
    <div className="col-span-2 h-3 bg-gray-800 rounded" />
    <div className="col-span-2 h-3 bg-gray-800 rounded" />
    <div className="col-span-1 h-6 bg-gray-800 rounded-full ml-auto" />
    <div className="col-span-1 h-6 bg-gray-800 rounded" />
  </div>
);

const SkeletonCard = () => (
  <div className="md:hidden bg-gray-900/60 border border-white/5 rounded-2xl p-4 animate-pulse">
    <div className="flex justify-between mb-3">
      <div className="h-4 w-32 bg-gray-800 rounded" />
      <div className="h-6 w-20 bg-gray-800 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 bg-gray-800 rounded-xl" />
      ))}
    </div>
  </div>
);

// Mobile item card
function InventoryCard({ item, onEdit, onToggleActive, archiveFilter }) {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm truncate">
            {item.name}
          </div>
          <div className="text-gray-500 text-xs mt-0.5 font-mono">
            {item.sku} · {item.category}
          </div>
        </div>
        <StatusBadge item={item} />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/5 rounded-xl py-2 text-center">
          <div className="text-white font-bold text-sm">{item.quantity}</div>
          <div className="text-gray-500 text-[10px]">{item.unit}</div>
        </div>
        <div className="bg-white/5 rounded-xl py-2 text-center">
          <div className="text-white font-bold text-sm">
            ₱{Number(item.price).toLocaleString()}
          </div>
          <div className="text-gray-500 text-[10px]">Price</div>
        </div>
        <div className="bg-white/5 rounded-xl py-2 text-center">
          <div
            className={`text-xs font-semibold px-1 py-0.5 rounded-full border inline-block ${getBranchBadgeClass(getItemBranchLabel(item))}`}
          >
            {getItemBranchLabel(item)}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-xs">{item.supplier || "—"}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onToggleActive(item, archiveFilter === "archived")}
            className={`p-1.5 rounded-lg transition-all ${archiveFilter === "archived" ? "text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10" : "text-gray-500 hover:text-amber-400 hover:bg-amber-500/10"}`}
          >
            <svg
              className="w-4 h-4"
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
  );
}

function ItemModal({ onClose, onSaved, editItem, authHeaders }) {
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
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (isEdit) return;
    axios
      .get(`${API_BASE}/inventory/`, { headers: authHeaders })
      .then((r) => setItemsSnapshot(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItemsSnapshot([]));
  }, [isEdit, authHeaders]);

  const generatedSku = React.useMemo(() => {
    if (isEdit) return form.sku;
    const prefix = SKU_PREFIX[form.category] ?? "ITM";
    const categoryItems = itemsSnapshot.filter(
      (i) => i.category === form.category,
    );
    const existing = new Set(categoryItems.map((i) => i.sku));
    let next = categoryItems.length + 1;
    while (existing.has(`${prefix}-${String(next).padStart(4, "0")}`)) next++;
    return `${prefix}-${String(next).padStart(4, "0")}`;
  }, [form.category, form.sku, isEdit, itemsSnapshot]);

  const submit = async () => {
    if (!form.name) {
      Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Name is required.",
        ...DARK_SWAL,
      });
      return;
    }
    try {
      setSaving(true);
      const payload = { ...form };
      if (!isEdit) payload.sku = generatedSku;
      if (isEdit)
        await axios.patch(`${API_BASE}/inventory/${editItem.id}/`, payload, {
          headers: authHeaders,
        });
      else
        await axios.post(`${API_BASE}/inventory/`, payload, {
          headers: authHeaders,
        });
      onSaved();
      onClose();
      Swal.fire({
        icon: "success",
        title: isEdit ? "Item updated" : "Item added",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
        ...DARK_SWAL,
      });
    } catch (err) {
      const msg =
        err.response?.data?.sku?.[0] ??
        err.response?.data?.detail ??
        JSON.stringify(err.response?.data) ??
        "Failed to save";
      Swal.fire({ icon: "error", title: "Error", text: msg, ...DARK_SWAL });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {isEdit ? "Edit Item" : "Add Inventory Item"}
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
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
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <Field label={isEdit ? "SKU" : "SKU (Auto)"}>
              <input
                className={inputCls}
                value={isEdit ? form.sku : generatedSku}
                disabled
              />
            </Field>
            <Field label="Unit">
              <input
                className={inputCls}
                placeholder="e.g. Liters, Pieces"
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Quantity">
              <input
                type="number"
                className={inputCls}
                placeholder="0"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </Field>
            <Field label="Min Qty">
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
          <Field label="Supplier">
            <input
              className={inputCls}
              placeholder="e.g. Shell Philippines"
              value={form.supplier}
              onChange={(e) => set("supplier", e.target.value)}
            />
          </Field>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-white/10 text-gray-400 hover:text-white px-4 py-3 rounded-xl transition-all font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-all font-semibold text-sm shadow-lg shadow-red-600/30"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StockTransferModal({
  onClose,
  onTransferred,
  items,
  branches,
  authHeaders,
}) {
  const [form, setForm] = useState({
    source_item_id: "",
    target_branch_id: "",
    quantity: "",
    note: "",
  });
  const [sending, setSending] = useState(false);
  const selectedItem = items.find(
    (i) => String(i.id) === String(form.source_item_id),
  );

  const submit = async () => {
    if (!form.source_item_id || !form.target_branch_id || !form.quantity) {
      await Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please select item, branch, and quantity.",
        ...DARK_SWAL,
      });
      return;
    }
    try {
      setSending(true);
      await axios.post(
        `${API_BASE}/inventory/transfer/`,
        {
          source_item_id: Number(form.source_item_id),
          target_branch_id: Number(form.target_branch_id),
          quantity: Number(form.quantity),
          note: form.note,
        },
        { headers: authHeaders },
      );
      await Swal.fire({
        icon: "success",
        title: "Stock sent",
        timer: 1200,
        showConfirmButton: false,
        ...DARK_SWAL,
      });
      onTransferred();
      onClose();
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Transfer failed",
        text:
          err.response?.data?.detail ??
          err.response?.data?.message ??
          "Could not send stock.",
        ...DARK_SWAL,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl p-4 sm:p-6 space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-white">
          Send Stock to Branch
        </h2>
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
              max={selectedItem?.quantity}
              value={form.quantity}
              onChange={(e) =>
                setForm((p) => ({ ...p, quantity: e.target.value }))
              }
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
            className="flex-1 border border-white/10 text-gray-400 hover:text-white px-4 py-3 rounded-xl transition-all font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={sending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-all font-semibold text-sm"
          >
            {sending ? "Sending..." : "Send Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminInventory({
  LayoutComponent = AdminLayout,
  title = "Inventory",
  subtitle = "Track and manage parts and supplies",
  showTransactionsTab = true,
}) {
  const { headers: authHeaders, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [branchFilter, setBranchFilter] = useState(CENTRAL_BRANCH);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("inventory");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      const [invRes, branchRes, rrRes, txRes] = await Promise.all([
        axios.get(
          `${API_BASE}/inventory/?archived=${archiveFilter === "archived" ? "true" : "false"}`,
          { headers: authHeaders },
        ),
        axios.get(`${API_BASE}/branches/`, { headers: authHeaders }),
        axios.get(`${API_BASE}/inventory/restock-requests/`, {
          headers: authHeaders,
        }),
        axios.get(`${API_BASE}/inventory/transactions/?limit=20`, {
          headers: authHeaders,
        }),
      ]);
      setItems(Array.isArray(invRes.data) ? invRes.data : []);
      setBranches(branchRes.data?.results ?? branchRes.data ?? []);
      setRestockRequests(Array.isArray(rrRes.data) ? rrRes.data : []);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
    } catch {
      setError("Failed to load inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [archiveFilter, isAuthenticated, authHeaders]);

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
      ...DARK_SWAL,
    });
    if (!result.isConfirmed) return;
    try {
      await axios.patch(
        `${API_BASE}/inventory/${item.id}/`,
        { is_active: nextActive },
        { headers: authHeaders },
      );
      await fetchData();
      Swal.fire({
        icon: "success",
        title: nextActive ? "Item restored" : "Item archived",
        timer: 1200,
        showConfirmButton: false,
        ...DARK_SWAL,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not update item status.",
        ...DARK_SWAL,
      });
    }
  };

  const reviewRestock = async (req, action) => {
    const confirm = await Swal.fire({
      title: `${action === "approve" ? "Approve" : "Reject"} request?`,
      html: `<b>${req.inventory_item_name}</b><br/>Branch: ${req.branch_name ?? "—"} · Qty: ${req.quantity_requested}`,
      input: "text",
      inputPlaceholder: "Reviewer note (optional)",
      showCancelButton: true,
      confirmButtonText: action === "approve" ? "Approve" : "Reject",
      confirmButtonColor: action === "approve" ? "#10b981" : "#ef4444",
      ...DARK_SWAL,
    });
    if (!confirm.isConfirmed) return;
    try {
      await axios.patch(
        `${API_BASE}/inventory/restock-requests/${req.id}/action/`,
        { action, reviewer_note: confirm.value || "" },
        { headers: authHeaders },
      );
      await fetchData();
      Swal.fire({
        icon: "success",
        title:
          action === "approve"
            ? "Request approved — awaiting inventory receipt"
            : "Request rejected",
        timer: 2000,
        showConfirmButton: false,
        ...DARK_SWAL,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.detail || "Could not update request.",
        ...DARK_SWAL,
      });
    }
  };

  const branchOptions = React.useMemo(() => {
    const namesFromItems = items.map(getItemBranchLabel);
    const namesFromBranches = (branches || [])
      .map((b) => b.name)
      .filter(Boolean);
    return [
      ALL_BRANCHES,
      CENTRAL_BRANCH,
      ...Array.from(
        new Set(
          [...namesFromItems, ...namesFromBranches].filter(
            (n) => n && n !== CENTRAL_BRANCH,
          ),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    ];
  }, [items, branches]);

  const branchScopedItems = items.filter((item) =>
    branchFilter === ALL_BRANCHES
      ? true
      : getItemBranchLabel(item) === branchFilter,
  );

  const filtered = branchScopedItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.name?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q);
    const matchCat =
      categoryFilter === "All Categories" || item.category === categoryFilter;
    const matchStatus =
      statusFilter === "all" || getInventoryStatusKey(item) === statusFilter;
    return matchSearch && matchCat && matchStatus;
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
    resetDeps: [
      searchQuery,
      categoryFilter,
      branchFilter,
      statusFilter,
      archiveFilter,
      activeTab,
      items.length,
    ],
  });

  const lowStock = branchScopedItems.filter((i) => {
    const key = getInventoryStatusKey(i);
    return (
      key === "running_low" || key === "reorder_now" || key === "out_of_stock"
    );
  });
  const pendingRestock = restockRequests.filter((r) => r.status === "pending");
  const totalValue = branchScopedItems.reduce(
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

  return (
    <LayoutComponent title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {title}
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Tabs + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          {showTransactionsTab && (
            <div className="flex gap-1 bg-gray-900/60 p-1 rounded-xl border border-white/5 w-full sm:w-fit overflow-x-auto">
              {[
                { key: "inventory", label: "Inventory" },
                { key: "transactions", label: "Transactions" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${activeTab === tab.key ? "bg-red-500 text-white shadow-lg shadow-red-500/25" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                >
                  {tab.label}
                  {tab.key === "inventory" &&
                    pendingRestock.length > 0 &&
                    activeTab !== "inventory" && (
                      <span className="ml-1.5 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {pendingRestock.length}
                      </span>
                    )}
                </button>
              ))}
            </div>
          )}
          {(!showTransactionsTab || activeTab === "inventory") && (
            <div className="flex gap-2 sm:ml-auto">
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 text-sm"
              >
                Send Stock
              </button>
              <button
                onClick={openCreate}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/30 text-sm"
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
                Add Item
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
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
              className="ml-auto text-xs font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {activeTab === "inventory" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {[
                {
                  label: "Total Items",
                  sub:
                    branchFilter === ALL_BRANCHES
                      ? "All inventory"
                      : `In ${branchFilter}`,
                  value: loading ? null : branchScopedItems.length,
                  color: "#ef4444",
                  iconPath:
                    "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
                },
                {
                  label: "Inventory Value",
                  sub: "Total stock value",
                  value: loading ? null : `₱${totalValue.toLocaleString()}`,
                  color: "#a855f7",
                  iconPath:
                    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                  label: "Low Stock Alert",
                  sub: "Items need reordering",
                  value: loading ? null : lowStock.length,
                  color: "#f59e0b",
                  iconPath:
                    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-5 backdrop-blur-sm hover:border-white/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="p-2.5 sm:p-3 rounded-xl"
                      style={{ backgroundColor: stat.color + "22" }}
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        style={{ color: stat.color }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={stat.iconPath}
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white mb-1">
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
            {!loading && lowStock.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
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
                    {lowStock.length} items
                  </span>
                </div>
                <div className="space-y-2.5">
                  {lowStock.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-900/60 border border-white/5 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                    >
                      <div>
                        <div className="text-white font-semibold text-sm">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-2">
                          <span>
                            Current:{" "}
                            <span className="text-red-400 font-bold">
                              {item.quantity} {item.unit}
                            </span>
                          </span>
                          <span>
                            Min:{" "}
                            <span className="text-gray-300">
                              {item.minimum_qty} {item.unit}
                            </span>
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getBranchBadgeClass(getItemBranchLabel(item))}`}
                          >
                            {getItemBranchLabel(item)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => openEdit(item)}
                        className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all"
                      >
                        Update Stock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restock Requests */}
            {!loading && pendingRestock.length > 0 && (
              <div className="bg-gray-900/60 border border-amber-500/20 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
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
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                      Pending Restock
                    </h2>
                  </div>
                  <span className="text-xs text-gray-500">
                    {pendingRestock.length} pending
                  </span>
                </div>
                <div className="space-y-2.5">
                  {pendingRestock.map((req) => (
                    <div
                      key={req.id}
                      className="bg-gray-950/60 border border-white/5 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                    >
                      <div>
                        <div className="text-white font-semibold text-sm">
                          {req.inventory_item_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Branch:{" "}
                          <span className="text-gray-300">
                            {req.branch_name ?? "—"}
                          </span>
                          {" · "}Qty:{" "}
                          <span className="text-amber-400 font-bold">
                            {req.quantity_requested}
                          </span>
                          {" · "}
                          {req.requested_by_name ?? "Unknown"}
                        </div>
                        {req.notes && (
                          <p className="text-xs text-gray-400 mt-1 italic">
                            "{req.notes}"
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => reviewRestock(req, "approve")}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => reviewRestock(req, "reject")}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-all"
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
            <div className="flex flex-col gap-3 mb-6">
              <div className="relative">
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
                  className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all text-sm"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    value: categoryFilter,
                    onChange: setCategoryFilter,
                    options: ["All Categories", ...CATEGORIES],
                  },
                  {
                    value: branchFilter,
                    onChange: setBranchFilter,
                    options: branchOptions,
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
                    className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500/50 transition-all cursor-pointer text-sm"
                  >
                    {sel.options.map((o) => (
                      <option
                        key={typeof o === "string" ? o : o.value}
                        value={typeof o === "string" ? o : o.value}
                      >
                        {typeof o === "string" ? o : o.label}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 mb-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
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
                  <p className="text-gray-500">No items found</p>
                </div>
              ) : (
                paginatedItems.map((item) => (
                  <InventoryCard
                    key={item.id}
                    item={item}
                    onEdit={openEdit}
                    onToggleActive={toggleItemActive}
                    archiveFilter={archiveFilter}
                  />
                ))
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-2">Name</div>
                <div className="col-span-1">Category</div>
                <div className="col-span-1">SKU</div>
                <div className="col-span-1">Qty</div>
                <div className="col-span-1">Price</div>
                <div className="col-span-2">Branch</div>
                <div className="col-span-1">Supplier</div>
                <div className="col-span-2 text-right">Status</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-gray-500 text-lg">No items found</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                paginatedItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <div className="col-span-2 text-white font-semibold text-sm truncate">
                      {item.name}
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
                      {getItemBranchLabel(item)}
                    </div>
                    <div className="col-span-1 text-gray-400 text-sm truncate">
                      {item.supplier || (
                        <span className="text-gray-700">—</span>
                      )}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <StatusBadge item={item} />
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        title="Edit"
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
                        className={`p-1.5 rounded-lg transition-all ${archiveFilter === "archived" ? "text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10" : "text-gray-500 hover:text-amber-400 hover:bg-amber-500/10"}`}
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
                ))
              )}

              {!loading && filtered.length > 0 && (
                <div className="px-6 py-4">
                  <p className="text-gray-500 text-sm">
                    Showing{" "}
                    <span className="text-white font-semibold">
                      {startItem}-{endItem}
                    </span>{" "}
                    of{" "}
                    <span className="text-white font-semibold">
                      {filtered.length}
                    </span>{" "}
                    items
                  </p>
                </div>
              )}
              {!loading && (
                <Pagination
                  current={currentPage}
                  total={totalPages}
                  onChange={setCurrentPage}
                  className="px-6 pb-6"
                />
              )}
            </div>

            {/* Mobile pagination */}
            {!loading && filtered.length > 0 && (
              <div className="md:hidden mt-2">
                <p className="text-gray-500 text-sm mb-3">
                  Showing{" "}
                  <span className="text-white font-semibold">
                    {startItem}-{endItem}
                  </span>{" "}
                  of{" "}
                  <span className="text-white font-semibold">
                    {filtered.length}
                  </span>
                </p>
                <Pagination
                  current={currentPage}
                  total={totalPages}
                  onChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        {activeTab === "transactions" && (
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Transaction History
              </h2>
              <span className="text-xs text-gray-500">
                Latest {transactions.length} records
              </span>
            </div>
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-gray-950/60 border border-white/5 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                  >
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {tx.item_name} {tx.item_sku ? `(${tx.item_sku})` : ""}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {tx.action_type?.replaceAll("_", " ")} · Qty:{" "}
                        <span className="text-gray-200">
                          {tx.quantity_changed}
                        </span>
                        {" · "}
                        {tx.branch_name || "Central"}
                        {tx.target_branch_name
                          ? ` → ${tx.target_branch_name}`
                          : ""}
                      </div>
                      {tx.notes && (
                        <p className="text-xs text-gray-400 mt-1">
                          Note: {tx.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-xs text-gray-300">
                        {tx.performed_by_name || "System"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleString("en-PH")}
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
          authHeaders={authHeaders}
        />
      )}
      {showTransferModal && (
        <StockTransferModal
          onClose={() => setShowTransferModal(false)}
          onTransferred={fetchData}
          items={centralItems}
          branches={branches}
          authHeaders={authHeaders}
        />
      )}
    </LayoutComponent>
  );
}

export default AdminInventory;
