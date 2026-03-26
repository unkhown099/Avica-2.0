import React, { useState, useEffect, useCallback, useRef } from "react";
import StaffLayout from "./StaffLayout";
import Swal from "sweetalert2";
import { API_BASE } from "../../hooks/useAuth.js";

// ─── Utilities ────────────────────────────────────────────────────────────────

function authHeaders() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("access") ||
    sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getTokenStorage() {
  if (localStorage.getItem("access_token") || localStorage.getItem("refresh_token")) {
    return localStorage;
  }
  if (sessionStorage.getItem("access_token") || sessionStorage.getItem("refresh_token")) {
    return sessionStorage;
  }
  return localStorage;
}

async function refreshAccessToken() {
  const storage = getTokenStorage();
  const refresh = storage.getItem("refresh_token");
  if (!refresh) return null;

  const res = await fetch(`${API}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  if (!data?.access) return null;

  storage.setItem("access_token", data.access);
  return data.access;
}

async function authFetch(url, options = {}) {
  const merged = {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  };

  let res = await fetch(url, merged);
  if (res.status !== 401) return res;

  const newAccess = await refreshAccessToken();
  if (!newAccess) return res;

  const retry = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${newAccess}`,
      ...(options.headers || {}),
    },
  };
  res = await fetch(url, retry);
  return res;
}

const API = API_BASE;
const DARK_SWAL = {
  background: "#111827",
  color: "#f9fafb",
  confirmButtonColor: "#dc2626",
};

const SERVICES = [
  "Exterior Detailing",
  "Interior Detailing",
  "Full Detailing",
  "Ceramic Coating",
  "Paint Correction",
  "Engine Bay Cleaning",
  "Other",
];

function todayDateValue() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const STATUS_META = {
  waiting: {
    label: "Waiting",
    dot: "bg-amber-400",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    glow: "",
  },
  in_service: {
    label: "In Service",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    glow: "shadow-emerald-500/20",
  },
  done: {
    label: "Done",
    dot: "bg-blue-400",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    glow: "",
  },
  skipped: {
    label: "No Show",
    dot: "bg-red-400",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    glow: "",
  },
};

function elapsed(startedAt) {
  if (!startedAt) return null;
  const diff = Math.floor((Date.now() - new Date(startedAt)) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

// ─── Ticker ───────────────────────────────────────────────────────────────────

function Ticker({ startedAt }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{elapsed(startedAt)}</span>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }) {
  return (
    <div
      className={`bg-gray-900/70 border rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-1 ${accent}`}
    >
      <span className="text-3xl font-black text-white">{value}</span>
      <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}

// ─── Assign Employee Dropdown ─────────────────────────────────────────────────

function AssignDropdown({ entry, employees, onAssign, assigning }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = entry.assigned_employee;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={assigning}
        className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all w-full
          ${current
            ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25"
            : "bg-gray-700/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
          }`}
      >
        {assigning ? (
          <svg
            className="w-3.5 h-3.5 animate-spin shrink-0"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )}
        <span className="truncate flex-1 text-left">
          {current ? current.full_name : "Assign Mechanic"}
        </span>
        <svg
          className={`w-3 h-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full mb-1 left-0 right-0 bg-gray-800 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
          {employees.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-500">
              No mechanics available
            </div>
          ) : (
            employees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => {
                  onAssign(entry.id, emp.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs transition-all flex items-center gap-2
                  ${current?.id === emp.id
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "text-gray-300 hover:bg-white/5"
                  }`}
              >
                <div className="w-6 h-6 rounded-full bg-gray-700 border border-white/10 flex items-center justify-center text-xs font-black text-gray-300 shrink-0">
                  {emp.full_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{emp.full_name}</div>
                  {emp.branch && (
                    <div className="text-gray-500 truncate">{emp.branch}</div>
                  )}
                </div>
                {current?.id === emp.id && (
                  <svg
                    className="w-3.5 h-3.5 text-indigo-400 ml-auto shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Queue Card ───────────────────────────────────────────────────────────────

function QueueCard({
  entry,
  employees,
  onAction,
  onAssign,
  actionLoading,
  assignLoading,
}) {
  const meta = STATUS_META[entry.status] || STATUS_META.waiting;
  const isActive = actionLoading === entry.id;
  const isAssigning = assignLoading === entry.id;

  const sourceColor =
    entry.source === "walk_in"
      ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
      : "bg-purple-500/15 text-purple-400 border-purple-500/30";

  return (
    <div
      className={`bg-gray-900/70 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all shadow-lg ${meta.glow}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-800 border border-white/8 flex items-center justify-center text-xl font-black text-white shrink-0">
            {entry.position}
          </div>
          <div>
            <div className="text-white font-black text-base leading-tight">
              {entry.customer_name}
            </div>
            <div className="text-gray-500 text-xs mt-0.5">{entry.phone}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${sourceColor}`}
          >
            {entry.source === "walk_in" ? "Walk-in" : "Booking"}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.badge}`}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot} mr-1.5`}
            />
            {meta.label}
          </span>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
        {[
          {
            icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
            text: entry.vehicle || "—",
          },
          {
            icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
            text: entry.service,
          },
          entry.plate_number && {
            icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
            text: entry.plate_number,
          },
          entry.wait_minutes != null && {
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
            text: `~${entry.wait_minutes} min wait`,
          },
          entry.source === "booking" &&
            (entry.appointment_date || entry.appointment_time) && {
              icon: "M8 7V3m8 4V3m-9 8h10m-13 9h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v11a2 2 0 002 2z",
              text: `Appointment: ${entry.appointment_date || "-"} ${entry.appointment_time || ""}`.trim(),
            },
        ]
          .filter(Boolean)
          .map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5 text-gray-600 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={row.icon}
                />
              </svg>
              <span className="text-gray-400 truncate text-xs">{row.text}</span>
            </div>
          ))}
      </div>

      {/* Service timer */}
      {entry.status === "in_service" && entry.service_started_at && (
        <div className="mb-4 flex items-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <svg
            className="w-3.5 h-3.5 animate-pulse"
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
          Service time: <Ticker startedAt={entry.service_started_at} />
        </div>
      )}

      {entry.notes && (
        <div className="mb-4 bg-white/3 border border-white/5 rounded-lg px-3 py-2 text-gray-500 text-xs">
          📝 {entry.notes}
        </div>
      )}

      {/* Assign mechanic — shown for waiting and in_service */}
      {(entry.status === "waiting" || entry.status === "in_service") && (
        <div className="mb-3">
          <AssignDropdown
            entry={entry}
            employees={employees}
            onAssign={onAssign}
            assigning={isAssigning}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="pt-3 border-t border-white/5 flex gap-2">
        {entry.status === "waiting" && (
          <button
            onClick={() => onAction(entry.id, "in_service")}
            disabled={isActive || !entry.assigned_employee}
            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-600/40 text-emerald-400 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!entry.assigned_employee ? "Assign a mechanic first" : ""}
          >
            {isActive ? (
              <svg
                className="w-3.5 h-3.5 animate-spin"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {entry.assigned_employee ? "Start Service" : "Assign Mechanic First"}
          </button>
        )}
        {entry.status === "in_service" && (
          <button
            onClick={() => onAction(entry.id, "done")}
            disabled={isActive}
            className="flex-1 flex items-center justify-center gap-1.5 bg-red-600/20 hover:bg-red-600 border border-red-600/40 text-red-400 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {isActive ? (
              <svg
                className="w-3.5 h-3.5 animate-spin"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            Mark as Done
          </button>
        )}
        {entry.status === "done" && (
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <svg
              className="w-4 h-4 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Completed
            {entry.assigned_employee && (
              <span className="text-gray-600">
                · {entry.assigned_employee.full_name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Walk-in Modal ────────────────────────────────────────────────────────────

function WalkInModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    vehicle: "",
    plateNumber: "",
    service: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let active = true;

    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const res = await fetch(`${API}/services/`, {
          headers: authHeaders(),
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.results ?? []);
        const activeServices = rows
          .filter((s) => s?.is_active !== false)
          .map((s) => s?.name)
          .filter(Boolean);
        if (active) {
          setServices(activeServices.length > 0 ? activeServices : SERVICES);
        }
      } catch {
        if (active) setServices(SERVICES);
      } finally {
        if (active) setLoadingServices(false);
      }
    };

    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const res = await fetch(`${API}/customers/`, {
          headers: authHeaders(),
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.results ?? []);
        if (active) setCustomers(rows);
      } catch {
        if (active) setCustomers([]);
      } finally {
        if (active) setLoadingCustomers(false);
      }
    };

    fetchServices();
    fetchCustomers();
    return () => {
      active = false;
    };
  }, []);

  const filteredCustomers = customers
    .filter((c) => {
      const query = form.customerName.trim().toLowerCase();
      if (!query) return false;
      const fullName = `${c.first_name || ""} ${c.last_name || ""}`
        .trim()
        .toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      return (
        fullName.includes(query) || phone.includes(query) || email.includes(query)
      );
    })
    .slice(0, 8);

  const serviceOptions = services.length > 0 ? services : SERVICES;

  const selectCustomer = (customer) => {
    const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
    setForm((prev) => ({
      ...prev,
      customerName: fullName || prev.customerName,
      phone: customer.phone || prev.phone,
    }));
    setShowCustomerResults(false);
  };

  const handleSubmit = async () => {
    if (!form.customerName || !form.phone || !form.vehicle || !form.service) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/queue/walk-in/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          customer_name: form.customerName,
          phone: form.phone,
          vehicle: form.vehicle,
          plate_number: form.plateNumber,
          service: form.service,
          notes: form.notes,
          source: "walk_in",
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.detail || "Failed to add walk-in.");
      }
      onAdded(await res.json());
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
            <div>
              <h2 className="text-lg font-black text-white">
                Add Walk-in to Queue
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">
                Customer goes straight to the active queue
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
          <div className="p-6 space-y-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Customer Name *
              </label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => {
                  set("customerName", e.target.value);
                  setShowCustomerResults(true);
                }}
                onFocus={() => setShowCustomerResults(true)}
                onBlur={() => setTimeout(() => setShowCustomerResults(false), 180)}
                placeholder="Type customer name / phone / email"
                className="w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500/60 transition-all text-sm"
              />

              {showCustomerResults && form.customerName.trim() && (
                <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                  {loadingCustomers ? (
                    <div className="px-4 py-3 text-xs text-gray-500">Searching customers...</div>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((c) => {
                      const fullName = `${c.first_name || ""} ${c.last_name || ""}`.trim();
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectCustomer(c)}
                          className="w-full text-left px-4 py-2.5 text-xs text-gray-200 hover:bg-white/5 transition-all"
                        >
                          <div className="font-semibold">{fullName || "Unnamed Customer"}</div>
                          <div className="text-gray-500">
                            {c.phone || "No phone"}
                            {c.email ? ` | ${c.email}` : ""}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-500">No existing customer found</div>
                  )}
                </div>
              )}
            </div>

            {[
              {
                label: "Phone *",
                key: "phone",
                type: "tel",
                placeholder: "0917-XXX-XXXX",
              },
              {
                label: "Vehicle *",
                key: "vehicle",
                type: "text",
                placeholder: "Toyota Vios 2021",
              },
              {
                label: "Plate Number",
                key: "plateNumber",
                type: "text",
                placeholder: "ABC 1234",
              },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500/60 transition-all text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Service *
              </label>
              <select
                value={form.service}
                onChange={(e) => set("service", e.target.value)}
                className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500/60 transition-all text-sm cursor-pointer"
              >
                <option value="">
                  {loadingServices ? "Loading services..." : "Select a service"}
                </option>
                {serviceOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Notes
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any additional info..."
                className="w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500/60 transition-all text-sm resize-none"
              />
            </div>
            {error && (
              <div className="bg-red-600/10 border border-red-600/25 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 py-2.5 rounded-xl transition-all font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-xl transition-all font-semibold text-sm shadow-lg shadow-red-600/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Adding…
                  </>
                ) : (
                  "Add to Queue"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function StaffQueue() {
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [assignLoading, setAssignLoading] = useState(null);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeQueueTab, setActiveQueueTab] = useState("waiting");
  const [selectedDate, setSelectedDate] = useState(todayDateValue);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (selectedDate) qs.set("date", selectedDate);
      const [qRes, hRes] = await Promise.all([
        authFetch(`${API}/api/queue/?${qs.toString()}`),
        authFetch(`${API}/api/queue/history/?${qs.toString()}`),
      ]);
      if (!qRes.ok || !hRes.ok) {
        if (qRes.status === 401 || hRes.status === 401) {
          throw new Error("Session expired. Please sign in again.");
        }
        throw new Error(`Error ${qRes.status || hRes.status}`);
      }
      const [qData, hData] = await Promise.all([qRes.json(), hRes.json()]);
      setQueue(Array.isArray(qData) ? qData : (qData.results ?? []));
      setHistory(Array.isArray(hData) ? hData : (hData.results ?? []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await authFetch(`${API}/api/queue/employees/`);
      if (!res.ok) return;
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch { }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchQueue, 30000);
    return () => clearInterval(id);
  }, [fetchQueue]);

  const handleAction = async (id, newStatus) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`${API}/api/queue/${id}/action/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Action failed. Please try again.");
      }
      const updated = await res.json();
      if (newStatus === "done" || newStatus === "skipped") {
        setQueue((prev) => prev.filter((q) => q.id !== id));
        setHistory((prev) => [updated, ...prev]);
      } else {
        setQueue((prev) =>
          prev.map((q) => (q.id === updated.id ? updated : q)),
        );
      }
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Action failed",
        text: e.message || "Action failed. Please try again.",
        ...DARK_SWAL,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssign = async (id, employeeId) => {
    setAssignLoading(id);
    try {
      const res = await authFetch(`${API}/api/queue/${id}/assign/`, {
        method: "PATCH",
        body: JSON.stringify({ employee_id: employeeId }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setQueue((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Assignment failed",
        text: "Failed to assign employee.",
        ...DARK_SWAL,
      });
    } finally {
      setAssignLoading(null);
    }
  };

  const waiting = queue.filter((q) => q.status === "waiting");
  const inService = queue.filter((q) => q.status === "in_service");
  const activeQueueRows = activeQueueTab === "waiting" ? waiting : inService;
  const doneToday = history.filter((h) => h.status === "done").length;
  const unassigned = queue.filter(
    (q) =>
      !q.assigned_employee && q.status !== "done" && q.status !== "skipped",
  ).length;

  return (
    <StaffLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Queue
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Approved appointments are added automatically · auto-refreshes
              every 30s
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap md:mt-12">
            <div className="flex items-center gap-2 bg-gray-900/70 border border-white/10 text-gray-300 rounded-xl px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || todayDateValue())}
                className="bg-transparent text-sm text-white outline-none [color-scheme:dark]"
              />
            </div>
            <button
              onClick={() => setShowHistory((p) => !p)}
              className="flex items-center gap-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-sm"
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {showHistory ? "Hide History" : "Show History"}
            </button>
            <button
              onClick={fetchQueue}
              className="flex items-center gap-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-sm"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setShowWalkIn(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/30 hover:scale-105 text-sm"
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Add Walk-in
            </button>
          </div>
        </div>


        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Waiting"
            value={waiting.length}
            accent="border-amber-500/20"
          />
          <StatCard
            label="In Service"
            value={inService.length}
            accent="border-emerald-500/20"
          />
          <StatCard
            label="Completed"
            value={doneToday}
            accent="border-white/5"
          />
          <StatCard
            label="Unassigned"
            value={unassigned}
            accent={unassigned > 0 ? "border-red-500/30" : "border-white/5"}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-600/10 border border-red-600/25 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
            <svg
              className="w-4 h-4 shrink-0"
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* ── Active Queue ─────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-white">Active Queue</h2>
                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center">
                  {queue.length}
                </span>
              </div>

              <div className="flex items-center gap-2 md:ml-auto">
                <button
                  onClick={() => setActiveQueueTab("waiting")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    activeQueueTab === "waiting"
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-gray-800/60 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  Waiting ({waiting.length})
                </button>
                <button
                  onClick={() => setActiveQueueTab("in_service")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    activeQueueTab === "in_service"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-gray-800/60 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  Now Serving ({inService.length})
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <svg
                  className="w-5 h-5 animate-spin mr-3"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Loading queue…
              </div>
            )}

            {!loading && queue.length === 0 && (
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl py-16 text-center backdrop-blur-sm">
                <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-7 h-7 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-400 font-semibold">Queue is empty</p>
                <p className="text-gray-600 text-sm mt-1">
                  Approve an appointment or add a walk-in
                </p>
              </div>
            )}

            {!loading && queue.length > 0 && activeQueueRows.length === 0 && (
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl py-10 text-center backdrop-blur-sm">
                <p className="text-gray-400 font-semibold">
                  {activeQueueTab === "waiting"
                    ? "No waiting entries"
                    : "No ongoing services"}
                </p>
              </div>
            )}

            {!loading && activeQueueRows.length > 0 && (
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${
                    activeQueueTab === "waiting"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeQueueTab === "waiting"
                        ? "bg-amber-400"
                        : "bg-emerald-400 animate-pulse"
                    }`}
                  />
                  {activeQueueTab === "waiting"
                    ? `Waiting (${waiting.length})`
                    : `Now Serving (${inService.length})`}
                </p>
                <div className="space-y-3">
                  {activeQueueRows.map((e) => (
                    <QueueCard
                      key={e.id}
                      entry={e}
                      employees={employees}
                      onAction={handleAction}
                      onAssign={handleAssign}
                      actionLoading={actionLoading}
                      assignLoading={assignLoading}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right sidebar ─────────────────────────────────── */}
          <div className="space-y-6">
            {/* Mechanics overview */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-black text-white">Mechanics</h3>
                <span className="w-5 h-5 rounded-full bg-indigo-600/40 text-indigo-300 text-xs font-black flex items-center justify-center">
                  {employees.length}
                </span>
              </div>

              {employees.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">
                  No mechanics found
                </p>
              ) : (
                <div className="space-y-2">
                  {employees.map((emp) => {
                    const activeJobs = queue.filter(
                      (q) =>
                        q.assigned_employee?.id === emp.id &&
                        q.status !== "done" &&
                        q.status !== "skipped",
                    ).length;
                    return (
                      <div
                        key={emp.id}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 bg-gray-800/60 border border-white/5 rounded-xl px-3 py-2.5 min-h-[58px]"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-700 border border-white/10 flex items-center justify-center text-sm font-black text-white shrink-0">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-white text-xs font-semibold truncate">
                            {emp.full_name}
                          </div>
                          <div className="text-gray-600 text-xs truncate">
                            {emp.branch}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-lg text-center min-w-[68px] ${activeJobs > 0
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400"
                            }`}
                        >
                          {activeJobs > 0
                            ? `${activeJobs} job${activeJobs > 1 ? "s" : ""}`
                            : "Free"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History */}
            {showHistory && (
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                <h3 className="text-sm font-black text-white mb-4">
                  Today's History
                </h3>
                {history.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">
                    No history yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-3 bg-gray-800/60 border border-white/5 rounded-xl px-3 py-2.5"
                      >
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${STATUS_META[h.status]?.dot || "bg-gray-500"}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-white text-xs font-semibold truncate">
                            {h.customer_name}
                          </div>
                          <div className="text-gray-600 text-xs truncate">
                            {h.service}
                            {h.assigned_employee &&
                              ` · ${h.assigned_employee.full_name}`}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold shrink-0 ${STATUS_META[h.status]?.badge.split(" ")[1] || "text-gray-400"}`}
                        >
                          {STATUS_META[h.status]?.label || h.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showWalkIn && (
        <WalkInModal
          onClose={() => setShowWalkIn(false)}
          onAdded={(entry) => setQueue((prev) => [...prev, entry])}
        />
      )}
    </StaffLayout>
  );
}

export default StaffQueue;