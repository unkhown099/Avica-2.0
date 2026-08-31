import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import { API_BASE } from "../../hooks/useAuth.js";
import axios from "axios";
import Swal from "sweetalert2";

const API = API_BASE;

const getToken = () =>
  localStorage.getItem("access_token") ??
  sessionStorage.getItem("access_token");
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const bayColor = (pct) =>
  pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";

const inputCls =
  "w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 transition-all";

const EMPTY_FORM = {
  name: "",
  address: "",
  hours: "8:00 AM - 7:00 PM",
  phone: "",
  fb_url: "",
  latitude: "",
  longitude: "",
  slots: 5,
  is_active: true,
};

const TIME_OPTIONS = [];
for (let h = 6; h <= 23; h++) {
  const hh = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  TIME_OPTIONS.push(`${hh}:00 ${ampm}`);
}

function BranchModal({ onClose, onSaved, editBranch }) {
  const isEdit = !!editBranch;
  const [form, setForm] = useState(
    isEdit
      ? {
        name: editBranch.name || "",
        address: editBranch.address || "",
        hours: editBranch.hours || "8:00 AM - 7:00 PM",
        phone: editBranch.phone || "",
        fb_url: editBranch.fb_url || "",
        latitude: editBranch.latitude || "",
        longitude: editBranch.longitude || "",
        slots: editBranch.slots || 5,
        is_active: editBranch.is_active ?? true,
      }
      : EMPTY_FORM,
  );

  const [openTime, setOpenTime] = useState(() => {
    const parts = (form.hours || "").split(" - ");
    return TIME_OPTIONS.includes(parts[0]) ? parts[0] : "8:00 AM";
  });

  const [closeTime, setCloseTime] = useState(() => {
    const parts = (form.hours || "").split(" - ");
    return TIME_OPTIONS.includes(parts[1]) ? parts[1] : "7:00 PM";
  });

  useEffect(() => {
    setForm(prev => ({ ...prev, hours: `${openTime} - ${closeTime}` }));
  }, [openTime, closeTime]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const localPhone = String(form.phone || "")
    .replace(/^\+?63/, "")
    .replace(/^0/, "")
    .replace(/\D/g, "")
    .slice(0, 10);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "name") {
      const clean = value.replace(/[^A-Za-z\s]/g, "").replace(/\s{2,}/g, " ");
      setForm((f) => ({ ...f, name: clean }));
      return;
    }

    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handlePhoneChange = (e) => {
    const digits = String(e.target.value || "")
      .replace(/\D/g, "")
      .replace(/^63/, "")
      .replace(/^0/, "")
      .slice(0, 10);
    setForm((f) => ({ ...f, phone: digits ? `+63${digits}` : "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const cleanName = String(form.name || "").trim();
      if (!/^[A-Za-z\s]+$/.test(cleanName)) {
        throw new Error("Branch name must contain letters and spaces only.");
      }

      const normalizedPhone = form.phone ? String(form.phone).replace(/\s/g, "") : "";
      if (normalizedPhone && !/^\+639\d{9}$/.test(normalizedPhone)) {
        throw new Error("Phone number must be in +63 format (example: +639123456789).");
      }

      const payload = {
        ...form,
        name: cleanName,
        phone: normalizedPhone,
        slots: Number(form.slots),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };
      if (isEdit)
        await axios.patch(`${API}/branches/${editBranch.id}/`, payload, {
          headers: authHeaders(),
        });
      else
        await axios.post(`${API}/branches/`, payload, {
          headers: authHeaders(),
        });
      onSaved();
      onClose();
      Swal.fire({
        icon: "success",
        title: isEdit ? "Branch updated" : "Branch created",
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
        background: "#111827",
        color: "#f9fafb",
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ??
        JSON.stringify(err.response?.data) ??
        err.message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-lg bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-lg font-black text-white">
              {isEdit ? "Edit Branch" : "Create New Branch"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Fill in all details including location for the landing page map
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
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

        <form onSubmit={submit} className="px-4 sm:px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Branch Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handle}
                required
                pattern="[A-Za-z ]+"
                placeholder="e.g. San Mateo Rizal"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Operating Hours</label>
              <div className="flex items-center gap-1.5">
                <select
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className={`${inputCls} !py-2 !px-2 flex-1 min-w-0`}
                >
                  {TIME_OPTIONS.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                </select>
                <span className="text-gray-600 text-[10px] font-black uppercase shrink-0">To</span>
                <select
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className={`${inputCls} !py-2 !px-2 flex-1 min-w-0`}
                >
                  {TIME_OPTIONS.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full Address</label>
            <input name="address" value={form.address} onChange={handle} required placeholder="e.g. 123 Main St, Caloocan, Metro Manila" className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Phone Number</label>
              <div className="flex items-center rounded-xl border border-white/10 bg-white/5 overflow-hidden focus-within:border-red-500/50">
                <span className="px-3 text-sm font-semibold text-gray-300 border-r border-white/10">+63</span>
                <input
                  name="phone"
                  value={localPhone}
                  onChange={handlePhoneChange}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9XXXXXXXXX"
                  className="w-full bg-transparent text-white placeholder-gray-600 px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Facebook URL</label>
              <input name="fb_url" value={form.fb_url} onChange={handle} placeholder="https://facebook.com/..." className={inputCls} />
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
            <h4 className="text-xs font-black text-red-500 uppercase tracking-widest">Map Configuration</h4>

            {/* Mini Map Picker */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 h-48 bg-gray-950">
              <div
                id="modal-map-picker"
                className="w-full h-full z-0 cursor-crosshair"
                ref={(el) => {
                  if (el && !el._leaflet_id) {
                    const lat = parseFloat(form.latitude) || 14.65;
                    const lng = parseFloat(form.longitude) || 121.05;

                    const mmap = window.L.map(el, {
                      center: [lat, lng],
                      zoom: 12,
                      zoomControl: false
                    });

                    window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
                      attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
                      maxZoom: 16
                    }).addTo(mmap);

                    let marker = null;
                    if (form.latitude && form.longitude) {
                      marker = window.L.marker([lat, lng]).addTo(mmap);
                    }

                    mmap.on('click', (e) => {
                      const { lat, lng } = e.latlng;
                      setForm(f => ({ ...f, latitude: lat.toFixed(7), longitude: lng.toFixed(7) }));
                      if (marker) marker.setLatLng(e.latlng);
                      else marker = window.L.marker(e.latlng).addTo(mmap);
                    });

                    // Store map instance if needed, but here simple is better
                    el._map = mmap;
                  }
                }}
              />
              <div className="absolute top-2 left-2 z-10 pointer-events-none bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                Click map to pick location
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Latitude</label>
                <input name="latitude" type="number" step="0.0000001" value={form.latitude} onChange={handle} placeholder="14.752" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Longitude</label>
                <input name="longitude" type="number" step="0.0000001" value={form.longitude} onChange={handle} placeholder="121.023" className={inputCls} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Service Slots</label>
              <input name="slots" type="number" min={1} value={form.slots} onChange={handle} required className={inputCls} />
            </div>
            <div className="flex flex-col justify-end pb-0.5">
              <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"
                onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}>
                <div className="relative shrink-0">
                  <div className={`w-9 h-5 rounded-full transition-all ${form.is_active ? "bg-emerald-500" : "bg-gray-700"}`} />
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? "left-4" : "left-0.5"}`} />
                </div>
                <span className="text-sm text-gray-300 font-medium">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-sm rounded-xl transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-red-600/30">
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 w-36 bg-gray-800 rounded" />
          <div className="h-3 w-48 bg-gray-800 rounded" />
        </div>
        <div className="h-6 w-14 bg-gray-800 rounded-full" />
      </div>
      <div className="h-14 bg-gray-800 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-gray-800 rounded-xl" />
        <div className="h-16 bg-gray-800 rounded-xl" />
      </div>
      <div className="h-4 bg-gray-800 rounded-full" />
      <div className="h-24 bg-gray-800 rounded-xl" />
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-gray-800 rounded-xl" />
        <div className="w-20 h-10 bg-gray-800 rounded-xl" />
      </div>
    </div>
  );
}

function BranchCard({ branch, onEdit, onDelete }) {
  const util = branch.bay_utilization ?? 0;
  const utilColor = bayColor(util);
  const hasSat =
    branch.satisfaction !== null && branch.satisfaction !== undefined;

  return (
    <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Name + badge */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="text-base sm:text-lg font-black text-white leading-tight truncate">
            {branch.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <svg
              className="w-3.5 h-3.5 text-gray-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs text-gray-500 truncate">
              {branch.address}
            </span>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${branch.is_active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
        >
          {branch.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Manager */}
      <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-black shrink-0">
          {branch.manager_name && branch.manager_name !== "Unassigned"
            ? branch.manager_name.charAt(0).toUpperCase()
            : "?"}
        </div>
        <div>
          <p className="text-[11px] text-gray-500 leading-none mb-0.5">
            Branch Manager
          </p>
          <p className="text-sm font-semibold text-white leading-tight">
            {branch.manager_name ?? "Unassigned"}
          </p>
        </div>
      </div>

      {/* Staff / Employees */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Staff", value: branch.staff_count ?? 0 },
          { label: "Employees", value: branch.employee_count ?? 0 },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white/[0.04] border border-white/[0.06] rounded-xl py-3 text-center"
          >
            <p className="text-xl sm:text-2xl font-black text-white leading-none">
              {value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Bay Utilization */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400">
            Bay Utilization
          </span>
          <span className="text-xs font-black" style={{ color: utilColor }}>
            {util}%
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${util}%`, backgroundColor: utilColor }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Services Completed</span>
          <span className="text-white font-bold">
            {branch.services_completed ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Monthly Revenue</span>
          <span className="text-emerald-400 font-bold">
            {branch.monthly_revenue ?? "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Satisfaction</span>
          {hasSat ? (
            <div className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5 text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white font-bold text-sm">
                {branch.satisfaction}%
              </span>
            </div>
          ) : (
            <span className="text-gray-600 text-sm font-medium">
              No ratings yet
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onEdit(branch)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/20"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(branch)}
          className="px-4 sm:px-5 py-2.5 bg-white/[0.06] hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-gray-300 hover:text-red-400 font-semibold text-sm rounded-xl transition-all"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editBranch, setEditBranch] = useState(null);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API}/branches/`, {
        headers: authHeaders(),
      });
      setBranches(res.data);
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const openCreate = () => {
    setEditBranch(null);
    setShowModal(true);
  };
  const openEdit = (b) => {
    setEditBranch(b);
    setShowModal(true);
  };

  const deleteBranch = async (branch) => {
    const result = await Swal.fire({
      title: `Delete "${branch.name}"?`,
      text: "This cannot be undone. All associated data may be affected.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#ef4444",
      background: "#111827",
      color: "#f9fafb",
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${API}/branches/${branch.id}/`, {
        headers: authHeaders(),
      });
      setBranches((prev) => prev.filter((b) => b.id !== branch.id));
    } catch {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not delete branch.",
        background: "#111827",
        color: "#f9fafb",
      });
    }
  };

  const activeBranches = branches.filter((b) => b.is_active).length;
  const totalStaff = branches.reduce((s, b) => s + (b.staff_count ?? 0), 0);
  const totalEmployees = branches.reduce(
    (s, b) => s + (b.employee_count ?? 0),
    0,
  );

  const STATS = [
    {
      label: "Total Branches",
      value: loading ? "—" : branches.length,
      color: "#ef4444",
      d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
    {
      label: "Active Branches",
      value: loading ? "—" : activeBranches,
      color: "#10b981",
      d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Total Staff",
      value: loading ? "—" : totalStaff,
      color: "#a855f7",
      d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      label: "Total Employees",
      value: loading ? "—" : totalEmployees,
      color: "#f59e0b",
      d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
  ];

  return (
    <AdminLayout title="" subtitle="">
      {showModal && (
        <BranchModal
          onClose={() => setShowModal(false)}
          onSaved={fetchBranches}
          editBranch={editBranch}
        />
      )}

      <div className="min-h-screen bg-gray-950 -m-4 sm:-m-8 p-4 sm:p-8">
        {/* ── Header: title + button stacked on the left ── */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Branches
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Monitor and compare performance across all branches
          </p>
          <button
            onClick={openCreate}
            className="mt-4 ml-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/30 text-sm"          >
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
            Create New Branch
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-3 sm:p-5 backdrop-blur-sm hover:border-white/10 transition-all"
            >
              <div
                className="p-2.5 rounded-xl w-fit mb-2 sm:mb-3"
                style={{ backgroundColor: s.color + "22" }}
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  style={{ color: s.color }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={s.d}
                  />
                </svg>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mb-1">
                {loading ? (
                  <div className="h-7 w-8 bg-gray-800 rounded animate-pulse" />
                ) : (
                  s.value
                )}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {!loading && error && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
            <span className="text-sm font-medium">
              Failed to load branches: {error}
            </span>
            <button
              onClick={fetchBranches}
              className="ml-auto text-xs font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && !error && branches.length === 0 && (
          <div className="text-center py-16 sm:py-24 text-gray-600">
            <svg
              className="w-12 h-12 mx-auto mb-4 opacity-40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
              />
            </svg>
            <p className="font-semibold">No branches yet.</p>
            <p className="text-sm mt-1">
              Click "Create New Branch" to add one.
            </p>
          </div>
        )}

        {!loading && !error && branches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {branches.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                onEdit={openEdit}
                onDelete={deleteBranch}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminBranches;