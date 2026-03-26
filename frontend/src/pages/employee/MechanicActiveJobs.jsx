import React, { useState, useEffect, useCallback } from "react";
import MechanicLayout from "./MechanicLayout";

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

function getMe() {
  try {
    const raw =
      localStorage.getItem("user") ||
      localStorage.getItem("me") ||
      sessionStorage.getItem("user") ||
      sessionStorage.getItem("me");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Check if a job is older than 24 hours
function isJobOlderThan24Hours(completedAt) {
  if (!completedAt) return false;
  const completedDate = new Date(completedAt);
  const now = new Date();
  const hoursDiff = (now - completedDate) / (1000 * 60 * 60);
  return hoursDiff >= 24;
}

// Check if job was completed today
function isCompletedToday(completedAt) {
  if (!completedAt) return false;
  const completedDate = new Date(completedAt);
  const today = new Date();
  return (
    completedDate.getDate() === today.getDate() &&
    completedDate.getMonth() === today.getMonth() &&
    completedDate.getFullYear() === today.getFullYear()
  );
}

// Filter out jobs that are older than 24 hours
function filterRecentDoneJobs(entries) {
  return entries.filter(entry => {
    if (entry.status === "done") {
      // If completed_at exists and is older than 24 hours, remove it
      if (entry.completed_at && isJobOlderThan24Hours(entry.completed_at)) {
        return false;
      }
      // Also remove if completed_at doesn't exist but it's been more than a day since created
      if (!entry.completed_at && entry.completed_at === null) {
        const createdDate = new Date(entry.queued_at);
        const now = new Date();
        const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
        if (hoursDiff >= 24) return false;
      }
    }
    return true;
  });
}

const API = import.meta.env.VITE_API_BASE_URL;

// ─── Confirmation Modal Component ────────────────────────────────────────────

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-white font-black text-lg mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-semibold rounded-xl transition-all text-sm disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Spinner /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Column config ─────────────────────────────────────────────────────────

const COLUMNS = [
  {
    id: "waiting",
    label: "Waiting",
    emptyText: "No jobs waiting",
    headerBg: "bg-amber-500/10 border-amber-500/25",
    dotColor: "bg-amber-400",
    dotPulse: false,
    countBg: "bg-amber-500/20 text-amber-300",
    cardBorder: "border-amber-500/15",
    cardSelectedBorder: "border-amber-400/60",
    cardSelectedBg: "bg-amber-500/8",
    timerColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    statusBadge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
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
    cardBorder: "border-emerald-500/15",
    cardSelectedBorder: "border-emerald-400/60",
    cardSelectedBg: "bg-emerald-500/8",
    timerColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    statusBadge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
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
    cardBorder: "border-white/8",
    cardSelectedBorder: "border-white/30",
    cardSelectedBg: "bg-white/5",
    timerColor: "text-gray-400 bg-white/5 border-white/10",
    statusBadge: "bg-white/10 text-gray-400 border-white/10",
    dropActiveBg: "bg-white/5 border-white/25",
  },
];

// ─── Elapsed ticker ────────────────────────────────────────────────────────

function elapsedSince(dateStr) {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

function Ticker({ dateStr }) {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{elapsedSince(dateStr)}</span>;
}

function Spinner({ className = "w-4 h-4" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
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
  );
}

// ─── Job Card ──────────────────────────────────────────────────────────────

function JobCard({
  entry,
  col,
  isDragging,
  isSelected,
  onDragStart,
  onDragEnd,
  onClick,
}) {
  return (
    <div
      draggable={entry.status !== "done"} // Make done jobs non-draggable
      onDragStart={(e) => {
        if (entry.status !== "done") onDragStart(e, entry);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onClick(entry)}
      className={`
        relative rounded-xl border p-4 ${entry.status !== "done" ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
        transition-all duration-200 select-none group
        ${isDragging ? "opacity-25 scale-95 rotate-1 shadow-2xl" : entry.status !== "done" ? "hover:-translate-y-0.5 hover:shadow-lg" : ""}
        ${
          isSelected
            ? `${col.cardSelectedBorder} ${col.cardSelectedBg} shadow-md`
            : `${col.cardBorder} bg-gray-900/70 ${entry.status !== "done" ? "hover:bg-gray-800/60 hover:border-white/15" : ""}`
        }
      `}
    >
      {/* Drag grip dots - hide for done jobs */}
      {entry.status !== "done" && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-25 transition-opacity flex flex-col gap-[3px] pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-[3px]">
              <div className="w-[3px] h-[3px] rounded-full bg-white" />
              <div className="w-[3px] h-[3px] rounded-full bg-white" />
            </div>
          ))}
        </div>
      )}

      {/* Queue number + customer name */}
      <div className="flex items-center gap-3 mb-3 pr-8">
        <div className="w-10 h-10 rounded-lg bg-gray-800 border border-white/10 flex items-center justify-center font-black text-white text-sm shrink-0">
          #{entry.position}
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight">
            {entry.customer_name}
          </p>
          {entry.phone && (
            <p className="text-gray-500 text-xs mt-0.5 truncate">
              {entry.phone}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-white/5 mb-3" />

      {/* Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-start gap-2">
          <svg
            className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-gray-300 text-xs font-medium leading-snug">
            {entry.service}
          </span>
        </div>

        <div className="flex items-center gap-2">
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
            />
          </svg>
          <span className="text-gray-400 text-xs">
            {entry.vehicle || "No vehicle info"}
          </span>
        </div>

        {entry.plate_number && (
          <div className="flex items-center gap-2">
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
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <span className="text-gray-400 text-xs font-mono">
              {entry.plate_number}
            </span>
          </div>
        )}
      </div>

      {/* Timer for in_service */}
      {entry.status === "in_service" && entry.service_started_at && (
        <div
          className={`flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 mb-3 border ${col.timerColor}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          Service time: <Ticker dateStr={entry.service_started_at} />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${col.statusBadge}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${col.dotColor} ${col.dotPulse ? "animate-pulse" : ""}`}
          />
          {col.label}
        </span>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border
          ${
            entry.source === "walk_in"
              ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
              : "bg-violet-500/15 text-violet-300 border-violet-500/30"
          }`}
        >
          {entry.source === "walk_in" ? "Walk-in" : "Booking"}
        </span>
      </div>
      
      {/* Show completed time for done jobs */}
      {entry.status === "done" && entry.completed_at && (
        <div className="mt-3 pt-2 border-t border-white/5">
          <p className="text-gray-500 text-xs">
            Completed: {new Date(entry.completed_at).toLocaleString()}
          </p>
          {isJobOlderThan24Hours(entry.completed_at) && (
            <p className="text-red-400 text-xs mt-1">
              ⏰ Will be removed in {Math.ceil(24 - (Date.now() - new Date(entry.completed_at)) / (1000 * 60 * 60))} hours
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Kanban Column ─────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  entries,
  draggingId,
  isOver,
  selectedId,
  onDragOver,
  onDrop,
  onDragLeave,
  onCardDragStart,
  onCardDragEnd,
  onCardClick,
}) {
  return (
    <div className="flex flex-col">
      {/* Header */}
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

      {/* Drop zone - disable dropping on done column */}
      <div
        onDragOver={col.id !== "done" ? (e) => onDragOver(e, col.id) : undefined}
        onDrop={col.id !== "done" ? (e) => onDrop(e, col.id) : undefined}
        onDragLeave={col.id !== "done" ? onDragLeave : undefined}
        style={{ minHeight: 260 }}
        className={`
          flex-1 rounded-xl border-2 border-dashed p-3 transition-all duration-200
          ${isOver && col.id !== "done" ? `${col.dropActiveBg} scale-[1.015]` : "border-white/6 bg-transparent"}
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
            {col.id !== "done" && (
              <p className="text-gray-700 text-xs">← Drop here</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <JobCard
                key={entry.id}
                entry={entry}
                col={col}
                isDragging={draggingId === entry.id}
                isSelected={selectedId === entry.id}
                onDragStart={onCardDragStart}
                onDragEnd={onCardDragEnd}
                onClick={onCardClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────

function DetailPanel({ entry, onClose, actionLoading, onActionClick }) {
  if (!entry) return null;
  const col = COLUMNS.find((c) => c.id === entry.status) || COLUMNS[0];
  const isLoading = actionLoading === entry.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 sticky top-0 bg-gray-900 z-10">
          <p className="text-white font-black text-sm uppercase tracking-wider">
            Job Details
          </p>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
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

        <div className="p-5 space-y-5">
          {/* Customer */}
          <div className="pb-4 border-b border-white/6">
            <p className="text-white font-black text-2xl leading-tight">
              {entry.customer_name}
            </p>
            {entry.phone && (
              <p className="text-gray-500 text-sm mt-1">{entry.phone}</p>
            )}
          </div>

          {/* Status */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${col.statusBadge}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${col.dotColor} ${col.dotPulse ? "animate-pulse" : ""}`}
            />
            {col.label}
            {entry.status === "in_service" && entry.service_started_at && (
              <span className="ml-1 font-mono text-xs opacity-70">
                · <Ticker dateStr={entry.service_started_at} />
              </span>
            )}
          </div>

          {/* Completion time for done jobs */}
          {entry.status === "done" && entry.completed_at && (
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-gray-400 text-sm">Completed at:</p>
              <p className="text-white font-semibold text-sm">
                {new Date(entry.completed_at).toLocaleString()}
              </p>
              {isJobOlderThan24Hours(entry.completed_at) && (
                <p className="text-red-400 text-xs mt-2">
                  This job will be removed in {Math.ceil(24 - (Date.now() - new Date(entry.completed_at)) / (1000 * 60 * 60))} hours
                </p>
              )}
            </div>
          )}

          {/* Info rows */}
          <div className="rounded-xl overflow-hidden border border-white/8 divide-y divide-white/5">
            {[
              {
                icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
                label: "Service",
                value: entry.service,
              },
              {
                icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5",
                label: "Vehicle",
                value: entry.vehicle || "—",
              },
              {
                icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
                label: "Plate",
                value: entry.plate_number || "—",
              },
              {
                icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
                label: "Branch",
                value: entry.branch || "—",
              },
              {
                icon: "M7 20l4-16m2 16l4-16M6 9h14M4 15h14",
                label: "Queue #",
                value: `#${entry.position}`,
              },
            ].map(({ icon, label, value }) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 px-4 py-3 bg-white/2"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <svg
                    className="w-3.5 h-3.5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={icon}
                    />
                  </svg>
                  <span className="text-gray-500 text-xs">{label}</span>
                </div>
                <span className="text-gray-200 text-sm font-semibold text-right leading-snug">
                  {value}
                </span>
              </div>
            ))}
            {entry.assigned_employee && (
              <div className="flex items-start justify-between gap-4 px-4 py-3 bg-white/2">
                <div className="flex items-center gap-2 shrink-0">
                  <svg
                    className="w-3.5 h-3.5 text-gray-600"
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
                  <span className="text-gray-500 text-xs">Mechanic</span>
                </div>
                <span className="text-gray-200 text-sm font-semibold">
                  {entry.assigned_employee.full_name}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {entry.notes && (
            <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-gray-400 text-sm leading-relaxed">
              📝 {entry.notes}
            </div>
          )}

          {/* Actions - hide for done jobs */}
          {entry.status !== "done" && (
            <div className="space-y-2.5">
              {entry.status === "waiting" && (
                <button
                  onClick={() =>
                    onActionClick(entry.id, "in_service", "Start Service")
                  }
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-400 hover:text-white font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <Spinner />
                  ) : (
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
                  Start Service
                </button>
              )}

              {entry.status === "in_service" && (
                <button
                  onClick={() => onActionClick(entry.id, "done", "Mark as Done")}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  {isLoading ? (
                    <Spinner />
                  ) : (
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  Mark as Done
                </button>
              )}

              {(entry.status === "waiting" || entry.status === "in_service") && (
                <button
                  onClick={() => onActionClick(entry.id, "skipped", "Skip Job")}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-gray-500 hover:text-gray-300 font-semibold py-2.5 rounded-xl transition-all text-sm disabled:opacity-50"
                >
                  Skip this job
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

export default function MechanicActiveJobs() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [draggingEntry, setDraggingEntry] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  const [staffId, setStaffId] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    entryId: null,
    newStatus: null,
    actionName: "",
  });

  useEffect(() => {
    const me = getMe();
    if (me?.staff_profile?.id) {
      setStaffId(me.staff_profile.id);
      return;
    }
    fetch(`${API}/me/`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.staff_profile?.id) setStaffId(d.staff_profile.id);
      })
      .catch(() => {});
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [qRes, hRes] = await Promise.all([
        fetch(`${API}/api/queue/`, { headers: authHeaders() }),
        fetch(`${API}/api/queue/history/`, { headers: authHeaders() }),
      ]);
      if (!qRes.ok) throw new Error(`Error ${qRes.status}`);
      const [qData, hData] = await Promise.all([qRes.json(), hRes.json()]);
      let allEntries = [
        ...(Array.isArray(qData) ? qData : (qData.results ?? [])),
        ...(Array.isArray(hData) ? hData : (hData.results ?? [])),
      ];
      // Filter out old done jobs
      allEntries = filterRecentDoneJobs(allEntries);
      setEntries(allEntries);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Auto-refresh every 30 seconds to clean up old done jobs
  useEffect(() => {
    const id = setInterval(fetchEntries, 30000);
    return () => clearInterval(id);
  }, [fetchEntries]);

  const myEntries = staffId
    ? entries.filter((e) => e.assigned_employee?.id === staffId)
    : entries;

  const byCol = (id) => myEntries.filter((e) => e.status === id);

  const onDragStart = (e, entry) => {
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

  const onDrop = (e, colId) => {
    e.preventDefault();
    setOverColumn(null);
    if (!draggingEntry || draggingEntry.status === colId) return;

    const actionName =
      colId === "in_service"
        ? "Start Service"
        : colId === "done"
          ? "Mark as Done"
          : colId === "skipped"
            ? "Skip Job"
            : "Move Job";

    setConfirmModal({
      isOpen: true,
      entryId: draggingEntry.id,
      newStatus: colId,
      actionName,
    });
  };

  const handleActionClick = (entryId, newStatus, actionName) => {
    setConfirmModal({
      isOpen: true,
      entryId,
      newStatus,
      actionName,
    });
  };

  const executeAction = async () => {
    const { entryId, newStatus } = confirmModal;
    setActionLoading(entryId);
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    try {
      const res = await fetch(`${API}/api/queue/${entryId}/action/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      
      // If marking as done, add completed_at timestamp
      if (newStatus === "done" && !updated.completed_at) {
        updated.completed_at = new Date().toISOString();
      }
      
      setEntries((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e)),
      );
      setSelectedEntry((prev) => (prev?.id === updated.id ? updated : prev));
      
      // Immediately refresh to remove any old done jobs
      setTimeout(() => fetchEntries(), 100);
    } catch {
      alert("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
      setConfirmModal({
        isOpen: false,
        entryId: null,
        newStatus: null,
        actionName: "",
      });
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      entryId: null,
      newStatus: null,
      actionName: "",
    });
    setDraggingEntry(null);
  };

  const totalActive = myEntries.filter(
    (e) => e.status === "waiting" || e.status === "in_service",
  ).length;
  const totalDone = myEntries.filter((e) => e.status === "done").length;

  const confirmEntry = confirmModal.entryId
    ? myEntries.find((e) => e.id === confirmModal.entryId)
    : null;

  return (
    <MechanicLayout>
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={executeAction}
        title={`${confirmModal.actionName}?`}
        message={`Are you sure you want to ${confirmModal.actionName.toLowerCase()} for ${confirmEntry?.customer_name || "this job"}?`}
        confirmText="Yes, proceed"
        cancelText="Cancel"
        isLoading={actionLoading === confirmModal.entryId}
      />

      {/* Detail Modal */}
      {selectedEntry && (
        <DetailPanel
          entry={
            myEntries.find((e) => e.id === selectedEntry.id) ?? selectedEntry
          }
          onClose={() => setSelectedEntry(null)}
          onActionClick={handleActionClick}
          actionLoading={actionLoading}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              My Jobs
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Drag cards between columns · click a card to see details
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="bg-gray-900/80 border border-amber-500/20 rounded-xl px-5 py-2.5 text-center">
                <p className="text-2xl font-black text-white leading-none">
                  {totalActive}
                </p>
                <p className="text-xs text-gray-500 mt-1">Active</p>
              </div>
              <div className="bg-gray-900/80 border border-white/8 rounded-xl px-5 py-2.5 text-center">
                <p className="text-2xl font-black text-white leading-none">
                  {totalDone}
                </p>
                <p className="text-xs text-gray-500 mt-1">Done (24h)</p>
              </div>
            </div>
            <button
              onClick={fetchEntries}
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
          </div>
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

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <Spinner className="w-5 h-5 mr-3" /> Loading your jobs…
          </div>
        ) : myEntries.length === 0 ? (
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl py-24 text-center">
            <div className="w-16 h-16 bg-gray-800/80 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <p className="text-white font-bold text-lg">No jobs assigned yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Jobs assigned to you by staff will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                col={col}
                entries={byCol(col.id)}
                draggingId={draggingEntry?.id}
                isOver={overColumn === col.id}
                selectedId={selectedEntry?.id}
                onDragOver={(e) => onDragOver(e, col.id)}
                onDrop={(e) => onDrop(e, col.id)}
                onDragLeave={onDragLeave}
                onCardDragStart={onDragStart}
                onCardDragEnd={onDragEnd}
                onCardClick={(entry) =>
                  setSelectedEntry((prev) =>
                    prev?.id === entry.id ? null : entry,
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </MechanicLayout>
  );
}