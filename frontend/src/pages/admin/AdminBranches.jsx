import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";

// ── API helper ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

const bayColor = (pct) =>
  pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";

// ── Add Branch Modal ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  address: "",
  hours: "",
  slots: 5,
  is_active: true,
};

function AddBranchModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await apiFetch("/branches/", {
        method: "POST",
        body: JSON.stringify({ ...form, slots: Number(form.slots) }),
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-black text-white">Create New Branch</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Staff, managers &amp; stats populate automatically from records
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

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {[
            {
              label: "Branch Name",
              name: "name",
              placeholder: "e.g. San Mateo Rizal",
            },
            {
              label: "Address",
              name: "address",
              placeholder: "e.g. 123 Main St, San Mateo, Rizal",
            },
            {
              label: "Operating Hours",
              name: "hours",
              placeholder: "e.g. Mon–Sat 8:00 AM – 6:00 PM",
            },
          ].map(({ label, name, placeholder }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                {label}
              </label>
              <input
                name={name}
                value={form[name]}
                onChange={handle}
                required
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 transition-all"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Service Slots
              </label>
              <input
                name="slots"
                type="number"
                min={1}
                value={form.slots}
                onChange={handle}
                required
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 transition-all"
              />
            </div>
            <div className="flex flex-col justify-end pb-0.5">
              <label
                className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"
                onClick={() =>
                  setForm((f) => ({ ...f, is_active: !f.is_active }))
                }
              >
                <div className="relative shrink-0">
                  <div
                    className={`w-9 h-5 rounded-full transition-all ${form.is_active ? "bg-emerald-500" : "bg-gray-700"}`}
                  />
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? "left-4" : "left-0.5"}`}
                  />
                </div>
                <span className="text-sm text-gray-300 font-medium">
                  Active
                </span>
              </label>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex gap-2.5 items-start">
            <svg
              className="w-4 h-4 text-blue-400 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs text-blue-300 leading-relaxed">
              Branch manager, staff counts, services completed, revenue &amp;
              satisfaction are automatically computed from Staff, Booking and
              Rating records.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-sm rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-red-600/30"
            >
              {loading ? "Creating…" : "Create Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Branch Card — matches screenshot exactly ──────────────────────────────────
function BranchCard({ branch }) {
  const util = branch.bay_utilization ?? 0;
  const utilColor = bayColor(util);
  const hasSat =
    branch.satisfaction !== null && branch.satisfaction !== undefined;

  return (
    <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
      {/* ── Row 1: name + badge ── */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-black text-white leading-tight">
            {branch.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <svg
              className="w-3.5 h-3.5 text-gray-500"
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
            <span className="text-xs text-gray-500">{branch.address}</span>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ml-2 ${
            branch.is_active
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : "bg-gray-500/20 text-gray-400 border-gray-500/30"
          }`}
        >
          {branch.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* ── Row 2: Branch Manager ── */}
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

      {/* ── Row 3: Staff / Mechanics ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Staff", value: branch.staff_count ?? 0 },
          { label: "Mechanics", value: branch.mechanic_count ?? 0 },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white/[0.04] border border-white/[0.06] rounded-xl py-3 text-center"
          >
            <p className="text-2xl font-black text-white leading-none">
              {value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Row 4: Bay Utilization ── */}
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

      {/* ── Row 5: Metrics ── */}
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

      {/* ── Row 6: Actions ── */}
      <div className="flex gap-2 mt-auto">
        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/20">
          View Details
        </button>
        <button className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-sm rounded-xl transition-all">
          Edit
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/branches/");
        setBranches(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreated = (b) => setBranches((prev) => [...prev, b]);

  const activeBranches = branches.filter((b) => b.is_active).length;
  const totalStaff = branches.reduce((s, b) => s + (b.staff_count ?? 0), 0);
  const totalMechanics = branches.reduce(
    (s, b) => s + (b.mechanic_count ?? 0),
    0,
  );

  const STATS = [
    {
      label: "Total Branches",
      value: loading ? "—" : branches.length,
      color: "#ef4444",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      ),
    },
    {
      label: "Active Branches",
      value: loading ? "—" : activeBranches,
      color: "#10b981",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      label: "Total Staff",
      value: loading ? "—" : totalStaff,
      color: "#a855f7",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      ),
    },
    {
      label: "Total Mechanics",
      value: loading ? "—" : totalMechanics,
      color: "#f59e0b",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      ),
    },
  ];

  return (
    <AdminLayout title="" subtitle="">
      {showModal && (
        <AddBranchModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Branches
            </h1>
            <p className="text-gray-400 mt-1">
              Monitor and compare performance across all branches
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-600/30 hover:scale-105 self-start md:self-auto"
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
            Create New Branch
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm hover:border-white/10 transition-all"
            >
              <div
                className="p-3 rounded-xl w-fit mb-3"
                style={{ backgroundColor: s.color + "22" }}
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: s.color }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {s.icon}
                </svg>
              </div>
              <div className="text-2xl font-black text-white mb-1">
                {s.value}
              </div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24 flex-col gap-4">
            <svg
              className="w-8 h-8 text-red-500 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span className="text-gray-500 text-sm">Loading branches…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl px-6 py-5 text-sm">
            Failed to load branches: {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && branches.length === 0 && (
          <div className="text-center py-24 text-gray-600">
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

        {/* Cards */}
        {!loading && !error && branches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {branches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminBranches;
