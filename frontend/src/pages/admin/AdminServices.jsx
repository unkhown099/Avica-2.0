import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { API_BASE } from "../../hooks/useAuth.js";
import Swal from "sweetalert2";

const API = API_BASE;

const getToken = () =>
  localStorage.getItem("access_token") ??
  sessionStorage.getItem("access_token");

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

const FALLBACK_CATEGORIES = [
  "Maintenance",
  "Repair",
  "Diagnostic",
  "Cosmetic",
  "Premium Carwash",
  "Engine Steamed Wash",
  "Under Wash",
  "Premium Hand Wax",
  "Buffing",
  "Headlight Restoration",
  "Interior Detailing",
  "Exterior Detailing",
  "Acid Rain Removal (Glass)",
  "All Shine",
  "Ceramic Coating"
];

const PRICE_TIERS = [
  { key: "motor", label: "Motorcycle", desc: "Two-wheeled vehicles" },
  { key: "small", label: "Small", desc: "Sedan / Hatchback / Small Cars" },
  { key: "medium", label: "Medium", desc: "Crossover / CUV / MPV" },
  { key: "large", label: "Large", desc: "SUV / Van / Pickup" },
  { key: "xl", label: "Extra Large", desc: "Commercial / Bus / Large Trucks" },
];

const CATEGORY_COLORS = {
  Maintenance: {
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    accent: "#ef4444",
  },
  Repair: {
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    accent: "#f59e0b",
  },
  Diagnostic: {
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    accent: "#a855f7",
  },
  Cosmetic: {
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    accent: "#3b82f6",
  },
  "Premium Carwash": {
    badge: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    accent: "#0ea5e9",
  },
  "Engine Steamed Wash": {
    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    accent: "#06b6d4",
  },
  "Under Wash": {
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    accent: "#3b82f6",
  },
  "Premium Hand Wax": {
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    accent: "#10b981",
  },
  Buffing: {
    badge: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    accent: "#14b8a6",
  },
  "Headlight Restoration": {
    badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    accent: "#f43f5e",
  },
  "Interior Detailing": {
    badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    accent: "#6366f1",
  },
  "Exterior Detailing": {
    badge: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    accent: "#8b5cf6",
  },
  "Acid Rain Removal (Glass)": {
    badge: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
    accent: "#d946ef",
  },
  "All Shine": {
    badge: "bg-lime-500/20 text-lime-400 border-lime-500/30",
    accent: "#84cc16",
  },
  "Ceramic Coating": {
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    accent: "#f97316",
  },
};

const CategoryBadge = ({ category }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[category]?.badge ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
  >
    {category}
  </span>
);

const StatusBadge = ({ active }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
  >
    {active ? "Active" : "Inactive"}
  </span>
);

const SkeletonCard = () => (
  <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-5 animate-pulse flex flex-col gap-3">
    <div className="flex gap-2">
      <div className="h-6 w-20 bg-gray-800 rounded-full" />
      <div className="h-6 w-14 bg-gray-800 rounded-full" />
    </div>
    <div className="h-5 w-32 bg-gray-800 rounded" />
    <div className="h-3 w-full bg-gray-800 rounded" />
    <div className="h-3 w-3/4 bg-gray-800 rounded" />
    <div className="flex gap-2 mt-auto pt-3 border-t border-white/5">
      <div className="flex-1 h-9 bg-gray-800 rounded-xl" />
      <div className="flex-1 h-9 bg-gray-800 rounded-xl" />
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-400 mb-2">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full bg-gray-800/50 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all text-sm block";

const priceInputStyle = `
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
`;

function ServiceModal({ isOpen, onClose, onSaved, editService, branches, categories }) {
  const isEdit = !!editService;
  const editPriceList =
    editService?.price_list && typeof editService.price_list === "object"
      ? editService.price_list
      : {};
  const [form, setForm] = useState({
    name: editService?.name ?? "",
    category: editService?.category ?? categories?.[0]?.name ?? "",
    description: editService?.description ?? "",
    duration: editService?.duration ?? "",
    price: editService?.price ?? "",
    use_price_list: Object.keys(editPriceList).length > 0,
    price_list: {
      motor: editPriceList?.motor ?? "",
      small: editPriceList?.small ?? "",
      medium: editPriceList?.medium ?? "",
      large: editPriceList?.large ?? "",
      xl: editPriceList?.xl ?? "",
    },
    branch_ids: editService?.branches?.map((b) => b.id) ?? (branches?.map(b => b.id) || []),
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(editService?.image ? (editService.image.startsWith('http') ? editService.image : `${API_BASE}${editService.image}`) : null);
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!form.category && categories?.length > 0)
      set("category", categories[0].name);
  }, [categories]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleBranch = (id) =>
    set(
      "branch_ids",
      form.branch_ids.includes(id)
        ? form.branch_ids.filter((b) => b !== id)
        : [...form.branch_ids, id],
    );
  const setTierPrice = (tier, value) =>
    set("price_list", { ...form.price_list, [tier]: value });

  const buildPriceListPayload = () => {
    const payload = {};
    for (const tier of PRICE_TIERS) {
      const raw = form.price_list[tier.key];
      if (raw === "" || raw == null) continue;
      const num = Number(raw);
      if (Number.isNaN(num) || num < 0) continue;
      payload[tier.key] = num;
    }
    return payload;
  };

  const submit = async () => {
    if (!form.name || !form.category) {
      Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Name and category are required.",
        background: "#111827",
        color: "#f9fafb",
      });
      return;
    }
    if (form.branch_ids.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Branch Selected",
        text: "Please select at least one branch so customers can see and book this service.",
        background: "#111827",
        color: "#f9fafb",
      });
      return;
    }
    try {
      setSaving(true);
      const payload = { ...form };
      if (form.use_price_list) {
        const listPayload = buildPriceListPayload();
        if (Object.keys(listPayload).length === 0) {
          Swal.fire({
            icon: "warning",
            title: "Missing tier prices",
            text: "Add at least one price in the price list.",
            background: "#111827",
            color: "#f9fafb",
          });
          setSaving(false);
          return;
        }
        payload.price_list = listPayload;
        const values = Object.values(listPayload);
        if (values.length > 0) payload.price = Math.min(...values);
      } else {
        payload.price_list = {};
        const singlePrice = Number(form.price);
        payload.price = Number.isNaN(singlePrice) ? 0 : singlePrice;
      }
      delete payload.use_price_list;

      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (key === 'price_list') {
          formData.append(key, JSON.stringify(payload[key]));
        } else if (key === 'branch_ids') {
          payload[key].forEach(id => formData.append('branch_ids', id));
        } else {
          formData.append(key, payload[key]);
        }
      });
      if (image) {
        formData.append('image', image);
      }

      const headers = {
        ...authHeaders(),
        'Content-Type': 'multipart/form-data',
      };

      if (isEdit) {
        await axios.patch(`${API_BASE}/services/${editService.id}/`, formData, {
          headers
        });
      } else {
        await axios.post(`${API}/services/`, formData, {
          headers
        });
      }
      onSaved();
      onClose();
      Swal.fire({
        icon: "success",
        title: isEdit ? "Service updated" : "Service created",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
        background: "#111827",
        color: "#f9fafb",
      });
    } catch (err) {
      const msg =
        err.response?.data?.detail ??
        JSON.stringify(err.response?.data) ??
        "Failed to save service";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {isEdit ? "Edit Service" : "Add New Service"}
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              {isEdit
                ? "Update service details"
                : "Fill in details to create a new service"}
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
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row gap-6 mb-2">
            <div className="w-full sm:w-48 shrink-0">
              <label className="block text-sm font-semibold text-gray-400 mb-2">Service Image</label>
              <div className="relative group aspect-square rounded-2xl bg-gray-800 border-2 border-dashed border-white/10 hover:border-red-500/30 transition-all overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-bold">Recommended: 1:1</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full border border-white/20">Change Photo</span>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Service Name">
                  <input
                    className={inputCls}
                    placeholder="e.g. Oil Change"
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
                    {(categories?.length > 0
                      ? categories
                      : FALLBACK_CATEGORIES.map((name) => ({ name }))
                    ).map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={2}
                  placeholder="Brief description of the service"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration">
              <select
                className={inputCls}
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
              >
                <option value="">Select duration</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="1 hour">1 hour</option>
              </select>
            </Field>
            <Field label="Price (₱)">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors font-bold pointer-events-none">
                  ₱
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`${inputCls} pl-8 font-mono`}
                  placeholder="0.00"
                  disabled={form.use_price_list}
                  value={form.price}
                  onKeyDown={(e) => {
                    if (
                      !/[0-9]/.test(e.key) &&
                      ![
                        "Backspace",
                        "Delete",
                        "ArrowLeft",
                        "ArrowRight",
                        "Tab",
                        "Enter",
                      ].includes(e.key)
                    ) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    set("price", val);
                  }}
                />
              </div>
            </Field>
          </div>
          <style dangerouslySetInnerHTML={{ __html: priceInputStyle }} />
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white tracking-tight uppercase">
                  Tiered Price List
                </p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                  Dynamic pricing based on vehicle size
                </p>
              </div>
              <button
                type="button"
                onClick={() => set("use_price_list", !form.use_price_list)}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none ${form.use_price_list ? "bg-red-600 shadow-[0_0_15px_-3px_rgba(220,38,38,0.5)]" : "bg-gray-800 border border-white/5"}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${form.use_price_list ? "left-8" : "left-1"}`}
                />
              </button>
            </div>
            {form.use_price_list && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                {PRICE_TIERS.map((tier) => (
                  <div key={tier.key}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {tier.label}
                      </label>
                      <div className="group/info relative">
                        <button type="button" className="text-gray-600 hover:text-red-500 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-gray-800 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-20 pointer-events-none">
                          <p className="text-[9px] font-bold text-white uppercase tracking-wider mb-1">Examples:</p>
                          <p className="text-[10px] text-gray-400 leading-tight">{tier.desc}</p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
                        </div>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-500 text-[10px] font-bold pointer-events-none transition-colors">
                        ₱
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`${inputCls} pl-7 py-2.5 text-xs font-mono`}
                        placeholder="0"
                        value={form.price_list[tier.key]}
                        onKeyDown={(e) => {
                          if (
                            !/[0-9]/.test(e.key) &&
                            ![
                              "Backspace",
                              "Delete",
                              "ArrowLeft",
                              "ArrowRight",
                              "Tab",
                              "Enter",
                            ].includes(e.key)
                          ) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setTierPrice(tier.key, val);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Field label="Available Branches">
            <div className="flex flex-wrap gap-2 mt-1">
              {branches.map((b) => {
                const selected = form.branch_ids.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBranch(b.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${selected ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}
                  >
                    {b.name}
                  </button>
                );
              })}
              {branches.length === 0 && (
                <p className="text-gray-600 text-sm">No branches found.</p>
              )}
            </div>
          </Field>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 px-4 py-3 rounded-xl transition-all font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-all font-semibold text-sm shadow-lg shadow-red-600/30"
            >
              {saving
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Service"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      setSaving(true);
      const res = await axios.post(
        `${API}/services/categories/`,
        { name: trimmed },
        { headers: authHeaders() },
      );
      onCreated?.(res.data);
      onClose();
      Swal.fire({
        icon: "success",
        title: "Category added",
        timer: 1200,
        showConfirmButton: false,
        background: "#111827",
        color: "#f9fafb",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text:
          err.response?.data?.name?.[0] ??
          err.response?.data?.detail ??
          "Could not add category.",
        background: "#111827",
        color: "#f9fafb",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-black text-white">Add Category</h2>
            <p className="text-gray-500 text-xs mt-1">
              Create a configurable service category
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
          <Field label="Category Name">
            <input
              className={inputCls}
              placeholder="e.g. Electrical"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <div className="flex gap-3">
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
              disabled={saving || !name.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-all font-semibold text-sm"
            >
              {saving ? "Saving..." : "Add Category"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editService, setEditService] = useState(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [svcRes, branchRes, catRes] = await Promise.all([
        axios.get(`${API}/services/`, { headers: authHeaders() }),
        axios.get(`${API}/branches/`, { headers: authHeaders() }),
        axios.get(`${API}/services/categories/`, { headers: authHeaders() }),
      ]);
      setServices(svcRes.data);
      setBranches(branchRes.data);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
    } catch {
      setError("Failed to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const toggleActive = async (service) => {
    const action = service.is_active ? "deactivate" : "activate";
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} "${service.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: action.charAt(0).toUpperCase() + action.slice(1),
      confirmButtonColor: service.is_active ? "#ef4444" : "#10b981",
      background: "#111827",
      color: "#f9fafb",
    });
    if (!result.isConfirmed) return;
    try {
      await axios.patch(
        `${API}/services/${service.id}/`,
        { is_active: !service.is_active },
        { headers: authHeaders() },
      );
      setServices((prev) =>
        prev.map((s) =>
          s.id === service.id ? { ...s, is_active: !s.is_active } : s,
        ),
      );
    } catch {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not update service status.",
        background: "#111827",
        color: "#f9fafb",
      });
    }
  };

  const deleteService = async (service) => {
    const result = await Swal.fire({
      title: `Delete "${service.name}"?`,
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#ef4444",
      background: "#111827",
      color: "#f9fafb",
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${API}/services/${service.id}/`, {
        headers: authHeaders(),
      });
      setServices((prev) => prev.filter((s) => s.id !== service.id));
    } catch {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not delete service.",
        background: "#111827",
        color: "#f9fafb",
      });
    }
  };

  const filtered = services.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      String(s.id).includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q);
    const matchCat =
      categoryFilter === "All Categories" || s.category === categoryFilter;
    const matchBranch =
      branchFilter === "All Branches" ||
      s.branches?.some((b) => b.name === branchFilter);
    return matchSearch && matchCat && matchBranch;
  });

  const categoryNamesFromDb = categories.map((c) => c.name);
  const categoryNamesFromServices = Array.from(new Set(services.map((s) => s.category).filter(Boolean)));

  // Merge fallback categories with both DB categories and categories found in existing services
  const visibleCategoryNames = Array.from(new Set([
    ...FALLBACK_CATEGORIES,
    ...categoryNamesFromDb,
    ...categoryNamesFromServices
  ])).sort((a, b) => a.localeCompare(b));

  const handleCategoryCreated = (category) => {
    if (!category?.name) return;
    setCategories((prev) => {
      if (prev.some((c) => c.name === category.name)) return prev;
      return [...prev, category].sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const dynamicCategoryCounts = visibleCategoryNames.reduce((acc, c) => {
    acc[c] = services.filter((s) => s.category === c).length;
    return acc;
  }, {});

  const openCreate = () => {
    setEditService(null);
    setShowModal(true);
  };
  const openEdit = (s) => {
    setEditService(s);
    setShowModal(true);
  };

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        {/* ── Header: title left, button right ── */}
        <div className="mb-6 sm:mb-8 flex justify-between items-start">
          {/* LEFT SIDE */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Services
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Manage services available at your shop
            </p>
          </div>

          {/* RIGHT SIDE */}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/30 text-sm"
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
            Add New Service
          </button>
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
              onClick={fetchServices}
              className="ml-auto text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {visibleCategoryNames.map((label) => (
            <div
              key={label}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-3 sm:p-4 backdrop-blur-sm hover:border-white/10 transition-all"
            >
              <div className="text-xl sm:text-2xl font-black text-white mb-1">
                {loading ? (
                  <div className="h-7 w-8 bg-gray-800 rounded animate-pulse" />
                ) : (
                  (dynamicCategoryCounts[label] ?? 0)
                )}
              </div>
              <div className="text-xs text-gray-400 font-medium">{label}</div>
              <div className="mt-2 h-1 rounded-full bg-gray-800">
                <div
                  className="h-1 rounded-full transition-all duration-700"
                  style={{
                    width: services.length
                      ? `${((dynamicCategoryCounts[label] ?? 0) / services.length) * 100}%`
                      : "0%",
                    backgroundColor: CATEGORY_COLORS[label]?.accent,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

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
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__add_category__") {
                  setShowCategoryModal(true);
                  return;
                }
                setCategoryFilter(v);
              }}
              className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500/50 transition-all cursor-pointer text-sm"
            >
              <option value="All Categories">All Categories</option>
              {visibleCategoryNames.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__add_category__">+ Add Category...</option>
            </select>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500/50 transition-all cursor-pointer text-sm"
            >
              <option value="All Branches">All Branches</option>
              {branches.map((b) => (
                <option key={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl py-16 sm:py-20 text-center">
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <p className="text-gray-500 text-lg">No services found</p>
            <p className="text-gray-600 text-sm mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((service) => {
              const accent =
                CATEGORY_COLORS[service.category]?.accent ?? "#6b7280";
              return (
                <div
                  key={service.id}
                  className="group bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-white/10 transition-all flex flex-col"
                >
                  <div className="relative aspect-video w-full bg-gray-800 overflow-hidden">
                    {service.image ? (
                      <img
                        src={service.image.startsWith('http') ? service.image : `${API_BASE}${service.image}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        alt={service.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                      <CategoryBadge category={service.category} />
                      <StatusBadge active={service.is_active} />
                      {(!service.branches || service.branches.length === 0) && (
                        <span className="bg-yellow-500/90 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          No Branch
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: accent + "22" }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                        {service.name}
                      </h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed flex-1">
                      {service.description || (
                        <span className="italic text-gray-600">
                          No description
                        </span>
                      )}
                    </p>
                    <div className="space-y-2 mb-4">
                      {service.duration && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg
                            className="w-4 h-4 text-gray-600 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-gray-500">
                            Duration:{" "}
                            <span className="text-gray-300 font-semibold">
                              {service.duration}
                            </span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <svg
                          className="w-4 h-4 text-gray-600 shrink-0"
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
                        <span className="text-gray-500">
                          Price:{" "}
                          <span className="text-white font-bold">
                            {service.price_display}
                          </span>
                        </span>
                      </div>
                      {service.price_list &&
                        Object.keys(service.price_list).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {PRICE_TIERS.map((tier) => {
                              const value = service.price_list?.[tier.key];
                              if (value == null || value === "") return null;
                              return (
                                <span
                                  key={tier.key}
                                  className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] rounded-md"
                                >
                                  {tier.label}: ₱{Number(value).toLocaleString()}
                                </span>
                              );
                            })}
                          </div>
                        )}
                    </div>
                    {service.branches?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-2">
                          Available at:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {service.branches.map((b) => (
                            <span
                              key={b.id}
                              className="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-400 text-xs rounded-lg"
                            >
                              {b.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
                      <button
                        onClick={() => openEdit(service)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-sm px-3 py-2.5 rounded-xl transition-all"
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
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(service)}
                        className={`flex-1 flex items-center justify-center gap-2 font-semibold text-sm px-3 py-2.5 rounded-xl transition-all border ${service.is_active ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400" : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"}`}
                      >
                        {service.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="mt-6 text-sm text-gray-500">
            Showing{" "}
            <span className="text-white font-semibold">{filtered.length}</span>{" "}
            of{" "}
            <span className="text-white font-semibold">{services.length}</span>{" "}
            services
          </div>
        )}
      </div>

      <ServiceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSaved={fetchServices}
        editService={editService}
        branches={branches}
        categories={visibleCategoryNames.map((name) => ({ name }))}
      />
      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onCreated={handleCategoryCreated}
        />
      )}
    </AdminLayout>
  );
}

export default AdminServices;
