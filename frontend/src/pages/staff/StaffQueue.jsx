import React, { useState, useEffect, useCallback, useRef } from "react";
import StaffLayout from "./StaffLayout";
import Swal from "sweetalert2";
import { API_BASE } from "../../hooks/useAuth.js";
import ServiceChatModal from "../../components/ServiceChatModal.jsx";

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
  { name: "Exterior Detailing", price: 0 },
  { name: "Interior Detailing", price: 0 },
  { name: "Full Detailing", price: 0 },
  { name: "Ceramic Coating", price: 0 },
  { name: "Paint Correction", price: 0 },
  { name: "Engine Bay Cleaning", price: 0 },
  { name: "Other", price: 0 },
];

function todayDateValue() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toDateValue(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseEntryScheduleDate(entry) {
  if (
    entry?.source === "booking" &&
    entry?.appointment_date &&
    entry?.appointment_time
  ) {
    const dt = new Date(`${entry.appointment_date}T${entry.appointment_time}`);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  if (entry?.source === "booking" && entry?.appointment_date) {
    const dt = new Date(`${entry.appointment_date}T00:00:00`);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  const fallbackRaw =
    entry?.queued_at ||
    entry?.created_at ||
    entry?.service_started_at ||
    entry?.completed_at;
  if (!fallbackRaw) return null;

  const fallback = new Date(fallbackRaw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date) {
  return date.toLocaleDateString([], {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getEntryScheduleDisplay(entry) {
  if (entry?.source === "booking") {
    const timeText = entry?.appointment_time
      ? entry.appointment_time.slice(0, 5)
      : "No time";
    return {
      time: timeText,
      compact: timeText,
    };
  }

  const dt = parseEntryScheduleDate(entry);
  if (!dt) {
    return {
      time: "No time",
      compact: "No time",
    };
  }

  const timeText = formatTime(dt);
  return {
    time: timeText,
    compact: `Queued: ${timeText}`,
  };
}

function sortEntriesBySchedule(entries) {
  return [...entries].sort((a, b) => {
    const aDate = parseEntryScheduleDate(a);
    const bDate = parseEntryScheduleDate(b);
    const aTs = aDate ? aDate.getTime() : Number.MAX_SAFE_INTEGER;
    const bTs = bDate ? bDate.getTime() : Number.MAX_SAFE_INTEGER;
    if (aTs !== bTs) return aTs - bTs;
    return (a?.position ?? 0) - (b?.position ?? 0);
  });
}

function isEntryForDate(entry, dateValue) {
  if (!entry) return false;
  if (entry.source === "booking" && entry.appointment_date) {
    return entry.appointment_date === dateValue;
  }
  const dt = parseEntryScheduleDate(entry);
  if (!dt) return false;
  return toDateValue(dt) === dateValue;
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
    dot: "bg-gray-400",
    badge: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    glow: "",
  },
  skipped: {
    label: "No Show",
    dot: "bg-red-400",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    glow: "",
  },
};

const KANBAN_COLUMNS = [
  {
    id: "waiting",
    label: "Waiting",
    emptyText: "No jobs waiting",
    headerBg: "bg-amber-500/10 border-amber-500/25",
    dotColor: "bg-amber-400",
    dotPulse: false,
    countBg: "bg-amber-500/20 text-amber-300",
    dropActiveBg: "bg-amber-500/6 border-amber-400/50",
  },
  {
    id: "in_service",
    label: "In Progress",
    emptyText: "No jobs in progress",
    headerBg: "bg-emerald-500/10 border-emerald-500/25",
    dotColor: "bg-emerald-400",
    dotPulse: true,
    countBg: "bg-emerald-500/20 text-emerald-300",
    dropActiveBg: "bg-emerald-500/6 border-emerald-400/50",
  },
  {
    id: "done",
    label: "Done",
    emptyText: "No completed jobs",
    headerBg: "bg-white/5 border-white/10",
    dotColor: "bg-gray-500",
    dotPulse: false,
    countBg: "bg-white/10 text-gray-400",
    dropActiveBg: "bg-white/5 border-white/25",
  },
];

function normalizePHPhone(value = "") {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("63")) return `+${digits}`;
  if (digits.startsWith("0")) return `+63${digits.slice(1)}`;
  return `+63${digits}`;
}

function isValidPHPhone(value = "") {
  return /^\+63\d{10}$/.test(String(value).trim());
}

function normalizeWalkInPhoneInput(value = "") {
  const digitsOnly = String(value).replace(/\D/g, "");
  let local = digitsOnly;
  if (local.startsWith("63")) local = local.slice(2);
  local = local.slice(0, 11);
  if (local.startsWith("0")) local = local.slice(1);
  return `+63${local}`;
}

function sanitizeWalkInName(value = "") {
  return String(value)
    .replace(/[^A-Za-z\s]/g, "")
    .replace(/\s{2,}/g, " ");
}

function isValidWalkInName(value = "") {
  const clean = String(value).trim();
  return clean.length >= 2 && /^[A-Za-z\s]+$/.test(clean);
}

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
          {current ? current.full_name : "Assign Employee"}
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
              No employees available
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
  onOpenDetails,
}) {
  const meta = STATUS_META[entry.status] || STATUS_META.waiting;
  const schedule = getEntryScheduleDisplay(entry);

  const sourceColor =
    entry.source === "walk_in"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-purple-500/15 text-purple-400 border-purple-500/30";

  return (
    <div
      onClick={() => onOpenDetails(entry)}
      className={`bg-gray-900/70 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all shadow-lg cursor-pointer ${meta.glow}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-800 border border-white/8 flex items-center justify-center text-sm font-black text-white shrink-0">
            {entry.position}
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm leading-tight truncate max-w-[180px]">
              {entry.customer_name}
            </div>
            <div className="text-gray-500 text-xs mt-0.5 truncate max-w-[180px]">
              {entry.service}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sourceColor}`}
          >
            {entry.source === "walk_in" ? "Walk-in" : "Booking"}
          </span>
          {entry.status !== "waiting" && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.badge}`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot} mr-1.5`}
              />
              {meta.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400 truncate">
          {schedule.compact}
        </p>
        <span className="text-[10px] text-gray-600">Tap for details</span>
      </div>

      {entry.status === "in_service" && entry.service_started_at && (
        <div className="mt-2 flex items-center gap-2 text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
          <svg
            className="w-3 h-3 animate-pulse"
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
    </div>
  );
}

function QueueDetailModal({
  entry,
  onClose,
  employees,
  onAction,
  onAssign,
  onMessageCustomer,
  actionLoading,
  assignLoading,
}) {
  if (!entry) return null;

  const isActive = actionLoading === entry.id;
  const isAssigning = assignLoading === entry.id;
  const meta = STATUS_META[entry.status] || STATUS_META.waiting;
  const schedule = getEntryScheduleDisplay(entry);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 sticky top-0 bg-gray-900">
          <h3 className="text-white font-black text-sm uppercase tracking-wider">Queue Details</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-white font-black text-xl leading-tight">{entry.customer_name}</p>
              <p className="text-gray-500 text-sm mt-1">Queue #{entry.position}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.badge}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot} mr-1.5`} />
              {meta.label}
            </span>
          </div>

          <div className="rounded-xl border border-white/8 divide-y divide-white/5 overflow-hidden">
            {[
              ["Phone", entry.phone || "-"],
              ["Service", entry.service || "-"],
              ["Appointment Time", schedule.time],
              ["Plate", entry.plate_number || "-"],
              ["Source", entry.source === "walk_in" ? "Walk-in" : "Booking"],
              ["Branch", entry.branch || "-"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 px-4 py-3 bg-white/2">
                <span className="text-gray-500 text-xs">{label}</span>
                <span className="text-gray-200 text-sm font-semibold text-right leading-snug">{value}</span>
              </div>
            ))}
          </div>

          {entry.notes && (
            <div className="bg-white/3 border border-white/5 rounded-lg px-3 py-2 text-gray-500 text-xs">
              📝 {entry.notes}
            </div>
          )}

          {(entry.status === "waiting" || entry.status === "in_service") && (
            <div>
              <AssignDropdown
                entry={entry}
                employees={employees}
                onAssign={onAssign}
                assigning={isAssigning}
              />
            </div>
          )}

          <div className="pt-1 flex gap-2">
            {entry.status === "waiting" && (
              <button
                onClick={() => onAction(entry.id, "in_service")}
                disabled={isActive || !entry.assigned_employee}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-600/40 text-emerald-400 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!entry.assigned_employee ? "Assign a employee first" : ""}
              >
                {entry.assigned_employee ? "Start Service" : "Assign Employee First"}
              </button>
            )}
            {entry.status === "in_service" && (
              <button
                onClick={() => onAction(entry.id, "done")}
                disabled={isActive}
                className="flex-1 flex items-center justify-center gap-1.5 bg-red-600/20 hover:bg-red-600 border border-red-600/40 text-red-400 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                Mark as Done
              </button>
            )}
          </div>

          <div className="pt-2">
            {/* Message Customer button removed - Restricted to Employee role only */}
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueKanbanColumn({
  col,
  entries,
  draggingId,
  isOver,
  onDragOver,
  onDrop,
  onDragLeave,
  onCardDragStart,
  onCardDragEnd,
  onOpenDetails,
}) {
  return (
    <div className="flex flex-col">
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-xl mb-3 border ${col.headerBg}`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2 h-2 rounded-full ${col.dotColor} ${col.dotPulse ? "animate-pulse" : ""}`}
          />
          <span className="text-white font-black text-sm tracking-tight">
            {col.label}
          </span>
        </div>
        <span
          className={`min-w-[26px] h-6 px-2 rounded-full flex items-center justify-center text-xs font-black ${col.countBg}`}
        >
          {entries.length}
        </span>
      </div>

      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragLeave={onDragLeave}
        style={{ minHeight: 260 }}
        className={`
          flex-1 rounded-xl border-2 border-dashed p-3 transition-all duration-200
          ${isOver ? `${col.dropActiveBg} scale-[1.015]` : "border-white/6 bg-transparent"}
        `}
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-25 py-12">
            <svg
              className="w-9 h-9 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-gray-600 text-xs font-medium">{col.emptyText}</p>
            <p className="text-gray-700 text-xs">Drop here</p>
          </div>
        ) : (
          <div
            className={`space-y-3 ${entries.length >= 5 ? "max-h-[520px] overflow-y-auto pr-1" : ""}`}
          >
            {entries.map((entry) => (
              <div
                key={entry.id}
                draggable={entry.status !== "done"}
                onDragStart={(e) => onCardDragStart(e, entry)}
                onDragEnd={onCardDragEnd}
                className={`${draggingId === entry.id ? "opacity-30 scale-95" : ""}`}
              >
                <QueueCard
                  entry={entry}
                  onOpenDetails={onOpenDetails}
                />
              </div>
            ))}
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
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

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
          .filter((s) => s?.is_active !== false && s?.name)
          .map((s) => ({
            name: s.name,
            price: Number(s.price ?? 0),
          }));
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

  const selectedService = serviceOptions.find((s) => s.name === form.service);
  const selectedServicePrice = Number(selectedService?.price ?? 0);

  const selectCustomer = (customer) => {
    const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
    setForm((prev) => ({
      ...prev,
      customerName: sanitizeWalkInName(fullName || prev.customerName),
      phone: normalizePHPhone(customer.phone || prev.phone),
    }));
    setSelectedCustomerId(customer.id);
    setShowCustomerResults(false);
  };

  const handleSubmit = async () => {
    const nextErrors = {
      customerName: !isValidWalkInName(form.customerName),
      phone: !isValidPHPhone(normalizePHPhone(form.phone)),
      vehicle: !form.vehicle.trim() || form.vehicle.trim().length < 2,
      service: !form.service,
      plateNumber: form.plateNumber.trim() && form.plateNumber.trim().length < 3,
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setError("Please correct the highlighted fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const normalizedPhone = normalizePHPhone(form.phone);
      const res = await fetch(`${API}/api/queue/walk-in/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          customer_name: form.customerName,
          phone: normalizedPhone,
          vehicle: form.vehicle,
          plate_number: form.plateNumber,
          service: form.service,
          price: selectedServicePrice,
          notes: form.notes,
          source: "walk_in",
          customer_id: selectedCustomerId,
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
                  set("customerName", sanitizeWalkInName(e.target.value));
                  setSelectedCustomerId(null);
                  setShowCustomerResults(true);
                  if (fieldErrors.customerName) {
                    setFieldErrors((prev) => ({ ...prev, customerName: false }));
                  }
                }}
                onFocus={() => setShowCustomerResults(true)}
                onBlur={() => setTimeout(() => setShowCustomerResults(false), 180)}
                placeholder="Type customer name"
                className={`w-full bg-gray-800 border text-white placeholder-gray-600 rounded-xl px-4 py-2.5 focus:outline-none transition-all text-sm ${fieldErrors.customerName ? "border-red-500/70 focus:border-red-500" : "border-white/10 focus:border-red-500/60"
                  }`}
              />
              {fieldErrors.customerName && (
                <p className="text-[11px] text-red-400 mt-1">Name must use letters and spaces only.</p>
              )}

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
                placeholder: "+63XXXXXXXXXX",
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
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (key === "phone") {
                      set(key, normalizeWalkInPhoneInput(raw));
                    } else if (key === "plateNumber") {
                      set(key, raw.toUpperCase().slice(0, 8));
                    } else {
                      set(key, raw);
                    }
                    if (fieldErrors[key]) {
                      setFieldErrors((prev) => ({ ...prev, [key]: false }));
                    }
                  }}
                  placeholder={placeholder}
                  className={`w-full bg-gray-800 border text-white placeholder-gray-600 rounded-xl px-4 py-2.5 focus:outline-none transition-all text-sm ${fieldErrors[key] ? "border-red-500/70 focus:border-red-500" : "border-white/10 focus:border-red-500/60"
                    }`}
                />
                {key === "phone" && (
                  <p className="text-[11px] text-gray-500 mt-1">Format: +63 + numbers only (max 11 digits)</p>
                )}
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Service *
              </label>
              <select
                value={form.service}
                onChange={(e) => {
                  set("service", e.target.value);
                  if (fieldErrors.service) {
                    setFieldErrors((prev) => ({ ...prev, service: false }));
                  }
                }}
                className={`w-full bg-gray-800 border text-white rounded-xl px-4 py-2.5 focus:outline-none transition-all text-sm cursor-pointer ${fieldErrors.service ? "border-red-500/70 focus:border-red-500" : "border-white/10 focus:border-red-500/60"
                  }`}
              >
                <option value="">
                  {loadingServices ? "Loading services..." : "Select a service"}
                </option>
                {serviceOptions.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                    {Number.isFinite(Number(s.price))
                      ? ` - PHP ${Number(s.price).toFixed(2)}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            {form.service && (
              <p className="text-xs text-emerald-400/90 font-semibold">
                Service price: PHP {selectedServicePrice.toFixed(2)}
              </p>
            )}
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
  const [chatQueueId, setChatQueueId] = useState(null);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [draggingEntry, setDraggingEntry] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const todayOnly = todayDateValue();

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      qs.set("date", todayOnly);
      const [qRes, hRes] = await Promise.all([
        authFetch(`${API}/api/queue/`),
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
  }, [todayOnly]);

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
    const current = queue.find((q) => q.id === id);
    if (newStatus === "done" && current?.status !== "in_service") {
      await Swal.fire({
        icon: "warning",
        title: "Invalid status flow",
        text: "Queue entries must be moved to In Progress before marking as Done.",
        ...DARK_SWAL,
      });
      return;
    }

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
        if (selectedEntry?.id === id) {
          setSelectedEntry(updated);
        }
      } else {
        setQueue((prev) =>
          prev.map((q) => (q.id === updated.id ? updated : q)),
        );
        if (selectedEntry?.id === id) {
          setSelectedEntry(updated);
        }
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to assign employee.");
      }
      const updated = await res.json();
      setQueue((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      if (selectedEntry?.id === id) {
        setSelectedEntry(updated);
      }
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Assignment failed",
        text: e.message || "Failed to assign employee.",
        ...DARK_SWAL,
      });
    } finally {
      setAssignLoading(null);
    }
  };

  const waiting = sortEntriesBySchedule(
    queue.filter((q) => q.status === "waiting" && isEntryForDate(q, todayOnly)),
  );
  const inService = sortEntriesBySchedule(
    queue.filter((q) => q.status === "in_service"),
  );
  const doneRows = sortEntriesBySchedule(
    history.filter(
      (h) => h.status === "done" && String(h.payment_status || "").toLowerCase() !== "paid",
    ),
  );
  const doneToday = history.filter(
    (h) => h.status === "done" && String(h.payment_status || "").toLowerCase() !== "paid",
  ).length;
  const unassigned = queue.filter(
    (q) =>
      !q.assigned_employee && q.status !== "done" && q.status !== "skipped",
  ).length;

  const entriesByColumn = {
    waiting,
    in_service: inService,
    done: doneRows,
  };

  const onDragStart = (e, entry) => {
    if (entry.status === "done") return;
    setDraggingEntry(entry);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(entry.id));
  };

  const onDragEnd = () => {
    setDraggingEntry(null);
    setOverColumn(null);
  };

  const onDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverColumn(colId);
  };

  const onDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setOverColumn(null);
  };

  const onDrop = async (e, colId) => {
    e.preventDefault();
    setOverColumn(null);
    if (!draggingEntry || draggingEntry.status === colId) return;

    if (draggingEntry.status === "waiting" && colId === "in_service" && !draggingEntry.assigned_employee) {
      await Swal.fire({
        icon: "warning",
        title: "Assign a employee first",
        text: "You need to assign a employee before starting service.",
        ...DARK_SWAL,
      });
      return;
    }

    if (colId === "done" && draggingEntry.status !== "in_service") {
      await Swal.fire({
        icon: "warning",
        title: "Invalid status flow",
        text: "Queue entries must be moved to In Progress before marking as Done.",
        ...DARK_SWAL,
      });
      return;
    }

    const actionName =
      colId === "in_service"
        ? "Start service"
        : colId === "done"
          ? "Mark as done"
          : "Move to waiting";

    const confirmed = await Swal.fire({
      icon: "question",
      title: `${actionName}?`,
      text: `Apply this action for ${draggingEntry.customer_name}?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
      ...DARK_SWAL,
    });

    if (confirmed.isConfirmed) {
      await handleAction(draggingEntry.id, colId);
    }
  };

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
              Showing today's queue only · auto-refreshes every 30s
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap md:mt-12">
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

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* ── Active Queue ─────────────────────────────────── */}
          <div className="xl:col-span-3 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-white">Active Queue</h2>
                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center">
                  {waiting.length + inService.length}
                </span>
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

            {!loading && queue.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {KANBAN_COLUMNS.map((col) => (
                  <QueueKanbanColumn
                    key={col.id}
                    col={col}
                    entries={entriesByColumn[col.id] ?? []}
                    draggingId={draggingEntry?.id ?? null}
                    isOver={overColumn === col.id}
                    onDragOver={(e) => onDragOver(e, col.id)}
                    onDrop={(e) => onDrop(e, col.id)}
                    onDragLeave={onDragLeave}
                    onCardDragStart={onDragStart}
                    onCardDragEnd={onDragEnd}
                    onOpenDetails={(entry) => setSelectedEntry(entry)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Right sidebar ─────────────────────────────────── */}
          <div className="space-y-5 xl:max-w-[320px] w-full xl:justify-self-end">
            {/* Employees overview */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-black text-white">Employees</h3>
                <span className="w-5 h-5 rounded-full bg-indigo-600/40 text-indigo-300 text-xs font-black flex items-center justify-center">
                  {employees.length}
                </span>
              </div>

              {employees.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">
                  No employees found
                </p>
              ) : (
                <div className="space-y-2">
                  {employees.map((emp) => {
                    const currentlyServing = queue.find(
                      (q) =>
                        q.assigned_employee?.id === emp.id &&
                        q.status === "in_service",
                    );
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
                            {currentlyServing
                              ? `Serving: ${currentlyServing.customer_name}`
                              : emp.branch}
                          </div>
                        </div>
                        {currentlyServing ? (
                          <span className="text-xs font-black px-2 py-0.5 rounded-lg text-center min-w-[88px] bg-emerald-500/20 text-emerald-400">
                            In Progress
                          </span>
                        ) : (
                          <span className="min-w-[88px]" />
                        )}
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

      {selectedEntry && (
        <QueueDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          employees={employees}
          onAction={handleAction}
          onAssign={handleAssign}
          actionLoading={actionLoading}
          assignLoading={assignLoading}
        />
      )}
    </StaffLayout>
  );
}

export default StaffQueue;
