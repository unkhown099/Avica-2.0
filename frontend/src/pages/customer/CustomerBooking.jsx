import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomerLayout from "./CustomerLayout";
import { API_BASE } from "../../hooks/useAuth.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

const STEPS = ["Service", "Branch", "Booking Mode", "Schedule", "Details"];

const statusConfig = {
  confirmed: {
    label: "Confirmed",
    color: "bg-green-600/20 text-green-400 border-green-600/30",
  },
  pending: {
    label: "Pending",
    color: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-600/20 text-red-400 border-red-600/30",
  },
  no_show: {
    label: "No Show",
    color: "bg-red-600/20 text-red-300 border-red-600/30",
  },
  done: {
    label: "Completed",
    color: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  },
  rescheduled: {
    label: "Reschedule Proposed",
    color: "bg-indigo-600/20 text-indigo-300 border-indigo-600/30",
  },
};

const CATEGORY_ICON = {
  Maintenance: "🔧",
  Repair: "🔩",
  Diagnostic: "🔍",
  Cosmetic: "✨",
};
const PAGE_SIZE = 10;

// ─── Utilities ────────────────────────────────────────────────────────────────

function tomorrowISO() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().split("T")[0];
}
function todayISO() {
  return new Date().toISOString().split("T")[0];
}

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

function formatTimeForAPI(timeString) {
  if (!timeString) return "";
  const [time, modifier] = timeString.split(" ");
  let [hours, minutes] = time.split(":");
  if (modifier === "PM" && hours !== "12") hours = parseInt(hours, 10) + 12;
  else if (modifier === "AM" && hours === "12") hours = "00";
  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
}

function toDisplayTime(t) {
  if (!t) return "";
  if (t.includes("AM") || t.includes("PM")) return t;
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const period = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  else if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
}

const PROFANITY_LIST = [
  "fuck",
  "shit",
  "ass",
  "bitch",
  "bastard",
  "damn",
  "crap",
  "dick",
  "piss",
  "cunt",
  "faggot",
  "nigger",
  "whore",
  "slut",
];

function containsProfanity(text) {
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some((w) => lower.includes(w));
}

// Plate number: alphanumeric only, max 8 chars
function sanitizePlate(val) {
  return val
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();
}

// ─── Shared selected badge ────────────────────────────────────────────────────

function SelectedBadge({ size = "md" }) {
  const dim = size === "sm" ? "w-4 h-4" : "w-5 h-5 sm:w-6 sm:h-6";
  const icon = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5 sm:w-3 sm:h-3";
  return (
    <div
      className={`${dim} rounded-full bg-red-600 border-2 border-red-400 flex items-center justify-center shadow-md shadow-red-600/40 flex-shrink-0`}
    >
      <svg
        className={icon}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
  );
}

// ─── Shared close button ──────────────────────────────────────────────────────

function CloseBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 hover:bg-red-600/20 hover:text-red-400 text-gray-500 transition-all duration-200 flex items-center justify-center flex-shrink-0 border border-transparent hover:border-red-600/30"
    >
      <svg
        className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
  );
}

// ─── Slide-in panel wrapper ───────────────────────────────────────────────────

function SlidePanel({ onClose, children }) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xs sm:max-w-sm md:max-w-lg flex flex-col bg-[#0a0a0a] border-l border-white/8 shadow-2xl overflow-hidden">
        {children}
      </div>
    </>
  );
}

// ─── Centered modal wrapper ───────────────────────────────────────────────────

function CenterModal({ onClose, children }) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-md flex flex-col bg-[#0a0a0a] border border-white/8 shadow-2xl rounded-2xl overflow-hidden max-h-[90vh]">
        {children}
      </div>
    </>
  );
}

// ─── Panel header ─────────────────────────────────────────────────────────────

function PanelHeader({ title, accent, subtitle, onClose }) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/8 flex-shrink-0">
      <div className="min-w-0 mr-3">
        <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
          {title.split(accent)[0]}
          <span className="text-red-500">{accent}</span>
          {title.split(accent)[1]}
        </h2>
        {subtitle && (
          <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
      <CloseBtn onClick={onClose} />
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1 mt-6 sm:mt-8 flex-wrap">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-red-500/50 hover:bg-red-600/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
      >
        <svg
          className="w-3 h-3 sm:w-4 sm:h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <div className="flex items-center gap-1 flex-wrap">
        {pages.map((p) => {
          const show = p === 1 || p === total || Math.abs(p - current) <= 1;
          const ellipsisBefore = p === current - 2 && current > 3;
          const ellipsisAfter = p === current + 2 && current < total - 2;
          if (ellipsisBefore || ellipsisAfter)
            return (
              <span
                key={`d-${p}`}
                className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-gray-600 text-xs"
              >
                …
              </span>
            );
          if (!show) return null;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 ${p === current ? "bg-red-600 text-white shadow-lg shadow-red-600/30 border border-red-500" : "border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-red-500/50 hover:bg-red-600/10"}`}
            >
              {p}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-red-500/50 hover:bg-red-600/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
      >
        <svg
          className="w-3 h-3 sm:w-4 sm:h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div className="flex items-center px-3 sm:px-6 py-3 border-b border-white/8 flex-shrink-0 overflow-x-auto no-scrollbar">
      {STEPS.map((label, i) => {
        const done = i < current,
          active = i === current;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[9px] sm:text-xs font-black transition-all duration-300 ${done ? "bg-red-600 text-white shadow-md shadow-red-600/40" : active ? "bg-red-600/20 border-2 border-red-500 text-red-400" : "bg-white/5 border border-white/10 text-gray-600"}`}
              >
                {done ? (
                  <svg
                    className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[7px] sm:text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap ${active ? "text-red-400" : done ? "text-gray-400" : "text-gray-600"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 mx-1 mb-3 sm:mb-4 transition-all duration-500 ${done ? "bg-red-600" : "bg-white/8"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Cancel Booking Modal ─────────────────────────────────────────────────────

function CancelBookingModal({ booking, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [loading, setLoading] = useState(false);

  const cancelReasons = [
    "Change of plans",
    "Found a better service provider",
    "Schedule conflict",
    "Vehicle not available",
    "Emergency",
    "Other",
  ];

  const handleSubmit = async () => {
    const finalReason = reason === "Other" ? otherReason : reason;
    if (!finalReason.trim()) return;
    setLoading(true);
    await onConfirm(finalReason);
    setLoading(false);
  };

  const rawSvc = booking.service;
  const serviceName =
    booking.service_name ||
    booking.service_detail?.name ||
    (typeof rawSvc === "string" && rawSvc.trim() !== "" && isNaN(rawSvc)
      ? rawSvc
      : `Service #${rawSvc}`);

  return (
    <CenterModal onClose={onClose}>
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div className="min-w-0 mr-3">
          <h2 className="text-base sm:text-xl font-black text-white">
            Cancel <span className="text-red-500">Appointment</span>
          </h2>
          <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 truncate max-w-[200px] sm:max-w-xs">
            {serviceName}
          </p>
        </div>
        <CloseBtn onClick={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="bg-red-600/10 rounded-xl border border-red-600/20 px-3 py-2.5 sm:p-4 flex items-start gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-red-600/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-red-500"
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
          </div>
          <div>
            <p className="text-red-400 text-xs sm:text-sm font-semibold mb-0.5">
              This action cannot be undone
            </p>
            <p className="text-gray-400 text-[10px] sm:text-xs">
              Please help us improve by letting us know why you're cancelling.
            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Reason for cancellation <span className="text-red-500">*</span>
          </p>
          <div className="space-y-1.5">
            {cancelReasons.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all duration-200 ${reason === r ? "border-red-500 bg-red-600/10" : "border-white/10 bg-white/3 hover:bg-white/6 hover:border-white/20"}`}
              >
                <input
                  type="radio"
                  name="cancelReason"
                  value={r}
                  checked={reason === r}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 bg-white/5 border-white/20 focus:ring-red-500 focus:ring-offset-0"
                />
                <span className="text-white text-xs sm:text-sm">{r}</span>
              </label>
            ))}
          </div>
        </div>

        {reason === "Other" && (
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              Please specify
            </p>
            <textarea
              rows={3}
              placeholder="Tell us more..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors resize-none"
            />
          </div>
        )}

        <div className="bg-white/4 rounded-xl p-3 sm:p-4 border border-white/8">
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Booking Details
          </p>
          <div className="space-y-1 text-xs sm:text-sm">
            {[
              ["Date", booking.date],
              ["Time", toDisplayTime(booking.time)],
              booking.branch && [
                "Branch",
                typeof booking.branch === "object"
                  ? booking.branch.name
                  : booking.branch,
              ],
            ]
              .filter(Boolean)
              .map(([l, v]) => (
                <div key={l} className="flex justify-between gap-4">
                  <span className="text-gray-500">{l}:</span>
                  <span className="text-white font-semibold text-right">
                    {v}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t border-white/8 flex-shrink-0 bg-[#0a0a0a]">
        <button
          onClick={onClose}
          className="flex-1 px-3 py-2 sm:py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 font-semibold text-xs sm:text-sm transition-all duration-200"
        >
          Keep Booking
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            loading || !reason || (reason === "Other" && !otherReason.trim())
          }
          className="flex-1 py-2 sm:py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/25 transition-all duration-200 flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <>
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 animate-spin"
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
              Cancelling...
            </>
          ) : (
            "Confirm Cancel"
          )}
        </button>
      </div>
    </CenterModal>
  );
}

// ─── Damage Detection Modal ───────────────────────────────────────────────────

function DamageDetectionModal({ onClose, onBack }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [
      ...prev,
      ...files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      })),
    ]);
    setError("");
  };
  const removeImage = (index) => {
    setImages((prev) => {
      const n = [...prev];
      URL.revokeObjectURL(n[index].preview);
      n.splice(index, 1);
      return n;
    });
  };
  const analyzeDamage = async () => {
    if (images.length === 0) {
      setError("Please upload at least one image");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const token =
        localStorage.getItem("access_token") ??
        sessionStorage.getItem("access_token");
      const base64Images = await Promise.all(
        images.map(
          (img) =>
            new Promise((res, rej) => {
              const reader = new FileReader();
              reader.readAsDataURL(img.file);
              reader.onload = () => res(reader.result.split(",")[1]);
              reader.onerror = (err) => rej(err);
            }),
        ),
      );
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/analyze-damage/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ images: base64Images }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      setAnalysisResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SlidePanel onClose={onClose}>
      <PanelHeader
        title="AI Damage Detection"
        accent="AI Damage"
        subtitle="Upload photos for AI analysis"
        onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
        {!analysisResult ? (
          <>
            <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Upload Vehicle Photos
            </p>
            <div
              className="border-2 border-dashed border-white/10 rounded-2xl p-5 sm:p-6 text-center hover:border-red-500/50 hover:bg-red-600/5 transition-all duration-200 cursor-pointer mb-4 sm:mb-6"
              onClick={() => document.getElementById("damage-images").click()}
            >
              <input
                type="file"
                id="damage-images"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-white font-semibold text-xs sm:text-sm mb-1">
                Click to upload photos
              </p>
              <p className="text-gray-600 text-[10px] sm:text-xs">
                JPG, PNG, HEIC — max 10MB each
              </p>
            </div>
            {images.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Uploaded ({images.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img.preview}
                        alt={`Damage ${i + 1}`}
                        className="w-full h-20 sm:h-32 object-cover rounded-xl border border-white/10"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <svg
                          className="w-2.5 h-2.5"
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
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white/4 rounded-xl p-3 sm:p-4 border border-white/8">
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Tips for best results
              </p>
              <ul className="space-y-1.5 text-gray-400">
                {[
                  "Take photos in good lighting",
                  "Capture damages from multiple angles",
                  "Include reference object for scale",
                  "Avoid blurry or dark images",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-1.5">
                    <span className="text-red-500 text-xs">•</span>
                    <span className="text-[10px] sm:text-xs">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 text-green-500"
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
              </div>
              <div>
                <p className="text-white font-bold text-sm sm:text-lg">
                  Analysis Complete
                </p>
                <p className="text-gray-500 text-[10px] sm:text-xs">
                  Confidence: {(analysisResult.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                Detected Damages
              </p>
              {analysisResult.damages.map((d, i) => (
                <div
                  key={i}
                  className="bg-white/4 rounded-xl p-3 border border-white/8"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-semibold text-xs sm:text-sm">
                      {d.type}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${d.severity === "Minor" ? "bg-yellow-600/20 text-yellow-400" : d.severity === "Moderate" ? "bg-orange-600/20 text-orange-400" : "bg-red-600/20 text-red-400"}`}
                    >
                      {d.severity}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[10px] sm:text-xs">
                    Location: {d.location}
                  </p>
                  <p className="text-gray-500 text-[9px] sm:text-[10px]">
                    Confidence: {(d.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Recommendations
              </p>
              <ul className="space-y-1.5">
                {analysisResult.recommendations.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-gray-300"
                  >
                    <span className="text-red-500 text-xs">•</span>
                    <span className="text-[10px] sm:text-xs">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-600/10 rounded-xl p-3 sm:p-4 border border-red-600/20">
              <p className="text-gray-400 text-[10px] sm:text-xs mb-1">
                Estimated Repair Cost
              </p>
              <p className="text-xl sm:text-2xl font-black text-white">
                {analysisResult.estimatedCost}
              </p>
              <p className="text-gray-500 text-[9px] sm:text-[10px] mt-1">
                *Final cost may vary after inspection
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-3 flex items-center gap-2 bg-red-600/10 border border-red-600/25 rounded-xl px-3 py-2.5 text-red-400 text-[10px] sm:text-xs">
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
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
      </div>
      <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t border-white/8 flex-shrink-0 bg-[#0a0a0a]">
        <button
          onClick={onClose}
          className="px-3 sm:px-5 py-2 sm:py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 font-semibold text-xs sm:text-sm transition-all duration-200"
        >
          Cancel
        </button>
        {!analysisResult ? (
          <button
            onClick={analyzeDamage}
            disabled={images.length === 0 || uploading}
            className="flex-1 py-2 sm:py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            {uploading ? (
              <>
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
                Analyzing...
              </>
            ) : (
              "Analyze Damage"
            )}
          </button>
        ) : (
          <button
            onClick={() =>
              onBack({ type: "booking", damageData: analysisResult })
            }
            className="flex-1 py-2 sm:py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            Proceed to Booking
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        )}
      </div>
    </SlidePanel>
  );
}

// ─── New Booking Modal ────────────────────────────────────────────────────────

function NewBookingModal({
  onClose,
  onSuccess,
  initialDamageData,
  initialServiceId = null,
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    services: [],
    branch: null,
    date: "",
    time: "",
    vehicle: "",
    plateNumber: "",
    notes: initialDamageData
      ? `Damage detected: ${initialDamageData.damages.map((d) => d.type).join(", ")}. Recommendations: ${initialDamageData.recommendations.join(", ")}`
      : "",
    damageData: initialDamageData,
    preferredEmployee: null,
  });
  const [bookingMode, setBookingMode] = useState("general");
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [branches, setBranches] = useState([]);
  const [branchLoading, setBranchLoading] = useState(true);
  const [branchError, setBranchError] = useState("");
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [availableSlots, setAvailableSlots] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityMeta, setAvailabilityMeta] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [userBookingsLoaded, setUserBookingsLoaded] = useState(false);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/`, {
      headers: authHeaders(),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setUserBookings(Array.isArray(data) ? data : (data.results ?? []));
        setUserBookingsLoaded(true);
      })
      .catch(() => setUserBookingsLoaded(true));
  }, []);

  useEffect(() => {
    if (!userBookingsLoaded) {
      setHasActiveBooking(false);
      return;
    }
    const activeExists = userBookings.some(
      (b) => b.status === "pending" || b.status === "confirmed",
    );
    setHasActiveBooking(activeExists);
    if (activeExists)
      setError(
        "You already have an active booking. Please complete or cancel it before creating a new one.",
      );
    else
      setError((prev) =>
        prev.includes("already have an active booking") ? "" : prev,
      );
  }, [userBookings, userBookingsLoaded]);

  useEffect(() => {
    if (!form.date || !form.branch) {
      setAvailableSlots(null);
      setAvailabilityMeta(null);
      return;
    }
    setForm((prev) => ({ ...prev, time: "" }));
    setAvailableSlots(null);
    setAvailabilityMeta(null);
    setCheckingAvailability(true);
    const params = new URLSearchParams({
      branch_id: String(form.branch.id),
      date: form.date,
    });
    if (bookingMode === "specific" && form.preferredEmployee?.id)
      params.set("preferred_employee_id", String(form.preferredEmployee.id));
    fetch(`${API_BASE}/api/bookings/available-slots/?${params.toString()}`, {
      headers: authHeaders(),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setAvailableSlots(data.available_slots ?? {});
        setAvailabilityMeta(data.meta ?? null);
      })
      .catch(() => {
        const f = {};
        TIME_SLOTS.forEach((s) => {
          f[s] = true;
        });
        setAvailableSlots(f);
      })
      .finally(() => setCheckingAvailability(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date, form.branch, bookingMode, form.preferredEmployee?.id]);

  useEffect(() => {
    setServicesLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/services/`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load services.");
        return r.json();
      })
      .then((data) =>
        setServices(
          (Array.isArray(data) ? data : (data.results ?? [])).filter(
            (s) => s.is_active !== false && (s.branches?.length ?? 0) > 0,
          ),
        ),
      )
      .catch((err) => setServicesError(err.message))
      .finally(() => setServicesLoading(false));
  }, []);

  useEffect(() => {
    if (!initialServiceId || services.length === 0) return;
    const matched = services.find(
      (s) => String(s.id) === String(initialServiceId),
    );
    if (!matched) return;
    setForm((prev) => ({ ...prev, services: [matched] }));
    setStep((prev) => (prev < 1 ? 1 : prev));
  }, [initialServiceId, services]);

  useEffect(() => {
    setCategoriesLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/services/categories/`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load categories.");
        return r.json();
      })
      .then((data) =>
        setCategories(Array.isArray(data) ? data : (data.results ?? [])),
      )
      .catch((err) => setCategoriesError(err.message))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    setBranchLoading(true);
    fetch(`${API_BASE}/branches/`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load branches.");
        return r.json();
      })
      .then((data) =>
        setBranches(Array.isArray(data) ? data : (data.results ?? [])),
      )
      .catch((err) => setBranchError(err.message))
      .finally(() => setBranchLoading(false));
  }, []);

  useEffect(() => {
    if (!form.branch?.id) {
      setEmployees([]);
      setEmployeesError("");
      setForm((prev) => ({ ...prev, preferredEmployee: null }));
      return;
    }
    setEmployeesLoading(true);
    setEmployeesError("");
    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/queue/employees/?branch_id=${form.branch.id}`,
      { headers: authHeaders() },
    )
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load employees.");
        return r.json();
      })
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setEmployees(rows);
        setForm((prev) => {
          if (!prev.preferredEmployee?.id) return prev;
          const ok = rows.some((e) => e.id === prev.preferredEmployee.id);
          return ok ? prev : { ...prev, preferredEmployee: null };
        });
      })
      .catch((err) => {
        setEmployees([]);
        setEmployeesError(err.message || "Failed to load employees.");
      })
      .finally(() => setEmployeesLoading(false));
  }, [form.branch?.id]);

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setError("");
    setFieldErrors((p) => ({ ...p, [key]: null }));
  };

  const isSlotAvailable = (slot) => {
    if (availableSlots === null) return false;
    return availableSlots[slot] === true;
  };

  const visibleTimeSlots = useMemo(() => {
    if (!availableSlots || typeof availableSlots !== "object")
      return TIME_SLOTS;
    const dynamic = Object.keys(availableSlots);
    if (dynamic.length === 0) return [];
    return dynamic.sort((a, b) =>
      formatTimeForAPI(a).localeCompare(formatTimeForAPI(b)),
    );
  }, [availableSlots]);

  const categoryOptions = useMemo(() => {
    const fromApi = categories
      .map((c) => (typeof c === "string" ? c : c?.name))
      .filter(Boolean);
    const fromServices = services.map((s) => s.category).filter(Boolean);
    return [...new Set([...fromApi, ...fromServices])];
  }, [categories, services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") return services;
    return services.filter(
      (s) =>
        String(s.category || "").toLowerCase() ===
        String(selectedCategory).toLowerCase(),
    );
  }, [services, selectedCategory]);

  const availableBranchesForSelectedServices = useMemo(() => {
    if (!form.services || form.services.length === 0) return branches;
    return branches.filter((b) =>
      form.services.every((service) =>
        service.branches?.some((sb) => sb.id === b.id),
      ),
    );
  }, [branches, form.services]);

      useEffect(() => {
    if (!form.branch || !form.services || form.services.length === 0) return;
    const stillAvailable = availableBranchesForSelectedServices.some(
      (b) => b.id === form.branch.id,
    );
    if (!stillAvailable) {
      set("branch", null);
      if (bookingMode === "specific") set("preferredEmployee", null);
    }
  }, [
    availableBranchesForSelectedServices,
    form.branch,
    form.services,
    bookingMode,
  ]);



  useEffect(() => {
    if (selectedCategory === "all") return;
    const exists = categoryOptions.some(
      (name) =>
        String(name).toLowerCase() === String(selectedCategory).toLowerCase(),
    );
    if (!exists) setSelectedCategory("all");
  }, [categoryOptions, selectedCategory]);

  const scheduleWindowText = useMemo(() => {
    if (!availabilityMeta || !form.date) return "";
    if (availabilityMeta.closed)
      return (
        availabilityMeta.closure_reason ||
        "This branch is closed on the selected date."
      );
    if (!availabilityMeta.open_start || !availabilityMeta.open_end) return "";
    let text = `Operating: ${availabilityMeta.open_start} - ${availabilityMeta.open_end}`;
    if (availabilityMeta.break_start && availabilityMeta.break_end)
      text += ` (break ${availabilityMeta.break_start} - ${availabilityMeta.break_end})`;
    if (availabilityMeta.slot_duration)
      text += ` · ${availabilityMeta.slot_duration}-min slots`;
    return text;
  }, [availabilityMeta, form.date]);

  const canAdvance = () => {
    setError("");
    if (step === 0) {
      if (!form.services || form.services.length === 0) {
        setError("Please select at least one service.");
        return false;
      }
      return true;
    }
    if (step === 1) {
      if (!form.branch) {
        setError("Please select a branch.");
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (bookingMode === "specific" && !form.preferredEmployee?.id) {
        setError("Please select a specific employee.");
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!form.date) {
        setError("Please select a date.");
        return false;
      }
      if (form.date < todayISO()) {
        setError(
          "Past dates are not allowed. Please select today or a later date.",
        );
        return false;
      }
      if (hasActiveBooking) {
        setError("You already have an active booking.");
        return false;
      }
      if (!form.time) {
        setError("Please select a time slot.");
        return false;
      }
      if (!isSlotAvailable(form.time)) {
        setError("The selected time slot is no longer available.");
        setForm((p) => ({ ...p, time: "" }));
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setFieldErrors({});
    try {
      if (!form.services || form.services.length === 0)
        throw new Error("Please select at least one service");
      if (!form.branch?.id) throw new Error("Please select a branch");
      if (!form.date || !form.time)
        throw new Error("Please select date and time");
      if (form.date < todayISO())
        throw new Error(
          "Past dates are not allowed. Please select today or a later date.",
        );
      if (hasActiveBooking)
        throw new Error(
          "You already have an active booking. Please complete or cancel it before creating a new one.",
        );
      if (!isSlotAvailable(form.time))
        throw new Error(
          "This time slot is no longer available. Please go back and select another time.",
        );
      const vehicle = (form.vehicle ?? "").trim();
      const plateNumber = (form.plateNumber ?? "").trim();
      if (!vehicle || !plateNumber)
        throw new Error("Please enter vehicle details");
      // Plate number validation
      if (!/^[a-zA-Z0-9]{1,8}$/.test(plateNumber))
        throw new Error(
          "Plate number must be alphanumeric and max 8 characters.",
        );
      if (bookingMode === "specific" && !form.preferredEmployee?.id)
        throw new Error("Please select a specific employee.");

      const selectedServiceNames = form.services.map((s) => s.name).join(", ");
      const selectedServicePrice = form.services.reduce(
        (sum, s) => sum + parseFloat(s.price ?? 0),
        0,
      );
      const payload = {
        service: selectedServiceNames,
        branch_id: parseInt(form.branch.id, 10),
        date: form.date,
        time: formatTimeForAPI(form.time),
        vehicle,
        plate_number: plateNumber,
        notes: form.notes || "",
        price: selectedServicePrice,
        preferred_employee_id:
          bookingMode === "specific"
            ? (form.preferredEmployee?.id ?? null)
            : null,
      };

      const res = await fetch(`${API_BASE}/api/bookings/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData && typeof errorData === "object") {
          const nfe = {};
          let em = "";
          Object.entries(errorData).forEach(([f, e]) => {
            if (f === "non_field_errors" || f === "detail")
              em = Array.isArray(e) ? e[0] : e;
            else nfe[f] = Array.isArray(e) ? e[0] : e;
          });
          if (Object.keys(nfe).length > 0) {
            setFieldErrors(nfe);
            throw new Error(Object.values(nfe)[0] || "Please check the form.");
          } else if (em) throw new Error(em);
          else throw new Error("Failed to create booking.");
        }
        throw new Error(`Error ${res.status}`);
      }
      onSuccess(await res.json());
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const availableCount = availableSlots
    ? Object.values(availableSlots).filter((v) => v === true).length
    : 0;

  return (
    <SlidePanel onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div>
          <h2 className="text-base sm:text-xl font-black text-white">
            Book an <span className="text-red-500">Appointment</span>
          </h2>
          <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
        <CloseBtn onClick={onClose} />
      </div>
      <StepIndicator current={step} />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
        {/* ── Step 0: Service ── */}
        {step === 0 && (
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Choose services
            </p>
            {!servicesLoading && !servicesError && (
              <div className="mb-3">
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">
                  Categories
                </p>
                {categoriesLoading ? (
                  <p className="text-[10px] text-gray-500">Loading…</p>
                ) : categoryOptions.length === 0 ? (
                  <p className="text-[10px] text-gray-500">No categories.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("all")}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] sm:text-xs font-semibold transition-all duration-200 ${selectedCategory === "all" ? "border-red-500 bg-red-600/20 text-red-300 shadow-sm shadow-red-600/20" : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/25"}`}
                    >
                      All
                    </button>
                    {categoryOptions.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] sm:text-xs font-semibold transition-all duration-200 ${String(selectedCategory).toLowerCase() === String(cat).toLowerCase() ? "border-red-500 bg-red-600/20 text-red-300 shadow-sm shadow-red-600/20" : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/25"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
                {categoriesError && (
                  <p className="mt-1.5 text-[10px] text-yellow-500">
                    {categoriesError}
                  </p>
                )}
              </div>
            )}
            {servicesLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-500 text-xs">
                <svg
                  className="w-4 h-4 animate-spin mr-2"
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
                Loading services…
              </div>
            ) : servicesError ? (
              <p className="text-center py-12 text-red-400 text-xs">
                {servicesError}
              </p>
            ) : filteredServices.length === 0 ? (
              <p className="text-center py-12 text-gray-500 text-xs">
                No services available.
              </p>
            ) : (
              <>
                {/* Mobile compact list */}
                <div className="flex flex-col gap-2 sm:hidden">
                  {filteredServices.map((s) => {
                    const active = form.services?.some(
                      (selected) => selected.id === s.id,
                    );
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          const alreadySelected = form.services?.some(
                            (selected) => selected.id === s.id,
                          );
                          set(
                            "services",
                            alreadySelected
                              ? form.services.filter(
                                  (selected) => selected.id !== s.id,
                                )
                              : [...(form.services || []), s],
                          );
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${active ? "border-red-500 bg-red-600/12 shadow-md shadow-red-600/15" : "border-white/8 bg-white/3 hover:border-red-500/40 hover:bg-red-600/8"}`}
                      >
                        <div className="text-lg shrink-0">
                          {CATEGORY_ICON[s.category] ?? "🔧"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-bold text-xs truncate ${active ? "text-white" : "text-gray-300"}`}
                          >
                            {s.name}
                          </div>
                          {s.category && (
                            <div className="text-gray-500 text-[9px]">
                              {s.category}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-red-400 font-black text-xs">
                            ₱{parseFloat(s.price || 0).toLocaleString()}
                          </div>
                          {s.duration && (
                            <div className="text-gray-600 text-[9px]">
                              ⏱ {s.duration}
                            </div>
                          )}
                        </div>
                        {active && <SelectedBadge size="sm" />}
                      </button>
                    );
                  })}
                </div>
                {/* Desktop 2-col card grid */}
                <div className="hidden sm:grid sm:grid-cols-2 gap-3">
                  {filteredServices.map((s) => {
                    const active = form.services?.some(
                      (selected) => selected.id === s.id,
                    );
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          const alreadySelected = form.services?.some(
                            (selected) => selected.id === s.id,
                          );
                          set(
                            "services",
                            alreadySelected
                              ? form.services.filter(
                                  (selected) => selected.id !== s.id,
                                )
                              : [...(form.services || []), s],
                          );
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all duration-200 relative ${active ? "border-red-500 bg-red-600/12 shadow-lg shadow-red-600/15 ring-1 ring-red-500/30" : "border-white/8 bg-white/3 hover:border-red-500/40 hover:bg-red-600/8"}`}
                      >
                        <div className="text-2xl mb-2">
                          {CATEGORY_ICON[s.category] ?? "🔧"}
                        </div>
                        <div
                          className={`font-bold text-sm mb-1 ${active ? "text-white" : "text-gray-300"}`}
                        >
                          {s.name}
                        </div>
                        <div className="text-red-400 font-black text-base">
                          ₱{parseFloat(s.price || 0).toLocaleString()}
                        </div>
                        {s.duration && (
                          <div className="text-gray-600 text-[10px] mt-1">
                            ⏱ {s.duration}
                          </div>
                        )}
                        {s.category && (
                          <div className="text-gray-600 text-[10px]">
                            {s.category}
                          </div>
                        )}
                        {active && (
                          <div className="absolute top-3 right-3">
                            <SelectedBadge />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 1: Branch ── */}
        {step === 1 && (
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Choose a Branch
            </p>
            {branchLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-500 text-xs">
                <svg
                  className="w-4 h-4 animate-spin mr-2"
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
                Loading branches…
              </div>
            ) : branchError ? (
              <p className="text-center py-12 text-red-400 text-xs">
                {branchError}
              </p>
            ) : (
              (() => {
                const availableBranches = availableBranchesForSelectedServices;
                if (availableBranches.length === 0)
                  return (
                    <p className="text-center py-12 text-gray-500 text-xs">
                      No branches available for the selected services.
                    </p>
                  );
                return (
                  <div className="space-y-2">
                    {availableBranches.map((b) => {
                      const active = form.branch?.id === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            set("branch", b);
                            if (bookingMode === "specific")
                              set("preferredEmployee", null);
                          }}
                          className={`w-full p-3 sm:p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 ${active ? "border-red-500 bg-red-600/12 shadow-md shadow-red-600/15 ring-1 ring-red-500/30" : "border-white/8 bg-white/3 hover:border-red-500/40 hover:bg-red-600/8"}`}
                        >
                          <div
                            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${active ? "bg-red-600 shadow-md shadow-red-600/40" : "bg-white/8"}`}
                          >
                            <svg
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${active ? "text-white" : "text-gray-500"}`}
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
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-bold text-xs sm:text-sm mb-0.5 ${active ? "text-white" : "text-gray-200"}`}
                            >
                              {b.name}
                            </div>
                            <div className="text-gray-500 text-[9px] sm:text-[10px] truncate">
                              {b.address}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              <span className="text-gray-600 text-[9px] sm:text-[10px]">
                                {b.hours}
                              </span>
                              <span className="text-green-400 text-[9px] sm:text-[10px] font-semibold">
                                {b.slots} slots open
                              </span>
                            </div>
                          </div>
                          {active && <SelectedBadge />}
                        </button>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* ── Step 2: Booking Mode ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
              Choose Booking Mode
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  key: "general",
                  label: "General Booking",
                  desc: "Any available employee will be assigned.",
                  accent: "emerald",
                },
                {
                  key: "specific",
                  label: "Book Specific Employee",
                  desc: "Choose the employee you want.",
                  accent: "red",
                },
              ].map(({ key, label, desc }) => {
                const active = bookingMode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setBookingMode(key);
                      if (key === "general") set("preferredEmployee", null);
                    }}
                    className={`relative p-3 sm:p-4 rounded-2xl border text-left transition-all duration-200 ${active ? "border-red-500 bg-red-600/12 shadow-md shadow-red-600/15 ring-1 ring-red-500/30" : "border-white/8 bg-white/3 hover:border-red-500/40 hover:bg-red-600/8"}`}
                  >
                    <div className="text-white font-bold text-sm sm:text-base pr-6">
                      {label}
                    </div>
                    <div className="text-gray-400 text-[10px] sm:text-xs mt-1">
                      {desc}
                    </div>
                    {active && (
                      <div className="absolute top-3 right-3">
                        <SelectedBadge size="sm" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {bookingMode === "specific" && (
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Select Employee
                </p>
                {employeesLoading ? (
                  <p className="text-gray-500 text-xs py-6">
                    Loading employees...
                  </p>
                ) : employeesError ? (
                  <p className="text-red-400 text-xs py-6">{employeesError}</p>
                ) : employees.length === 0 ? (
                  <p className="text-gray-500 text-xs py-6">
                    No active employees for this branch.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {employees.map((emp) => {
                      const active = form.preferredEmployee?.id === emp.id;
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => set("preferredEmployee", emp)}
                          className={`relative w-full p-3 rounded-xl border text-left transition-all duration-200 ${active ? "border-red-500 bg-red-600/12 ring-1 ring-red-500/30" : "border-white/8 bg-white/3 hover:border-red-500/40 hover:bg-red-600/8"}`}
                        >
                          <div
                            className={`font-semibold text-xs sm:text-sm pr-6 ${active ? "text-white" : "text-gray-200"}`}
                          >
                            {emp.full_name}
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            Branch:{" "}
                            {emp.branch || form.branch?.name || "Unassigned"}
                          </div>
                          {active && (
                            <div className="absolute top-1/2 right-3 -translate-y-1/2">
                              <SelectedBadge size="sm" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Schedule ── */}
        {step === 3 && (
          <div className="space-y-4 sm:space-y-5">
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 sm:mb-3">
                Pick a Date{" "}
                <span className="text-yellow-500 text-[8px] sm:text-[10px]">
                  (Tomorrow onward)
                </span>
              </p>
              <input
                type="date"
                min={tomorrowISO()}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 hover:border-white/20 transition-all duration-200 [color-scheme:dark]"
              />
              {form.date && form.date < tomorrowISO() && (
                <p className="text-yellow-500 text-[8px] sm:text-[10px] mt-1">
                  Past dates are not allowed. Please select a future date.
                </p>
              )}
              {hasActiveBooking && (
                <p className="text-red-400 text-[8px] sm:text-[10px] mt-1">
                  You already have an active booking. Please complete or cancel
                  it before creating a new one.
                </p>
              )}
              {scheduleWindowText && (
                <p className="text-gray-500 text-[8px] sm:text-[10px] mt-1">
                  {scheduleWindowText}
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Pick a Time Slot
                {checkingAvailability && (
                  <span className="ml-2 text-gray-500 font-normal normal-case text-[9px]">
                    (Checking…)
                  </span>
                )}
              </p>
              {form.date &&
                availableSlots === null &&
                !checkingAvailability && (
                  <p className="text-gray-500 text-[10px] sm:text-xs mb-2">
                    Select a date and branch to see slots.
                  </p>
                )}
              {availableSlots !== null && visibleTimeSlots.length === 0 && (
                <p className="text-gray-500 text-[10px] sm:text-xs mb-2">
                  No available slots for this date.
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                {visibleTimeSlots.map((t) => {
                  const active = form.time === t;
                  const slotsLoaded = availableSlots !== null;
                  const slotAvailable =
                    slotsLoaded && availableSlots[t] === true;
                  const dateValid = form.date && form.date >= todayISO();
                  const isDisabled =
                    !slotsLoaded ||
                    !slotAvailable ||
                    !dateValid ||
                    hasActiveBooking ||
                    checkingAvailability;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        if (!isDisabled) set("time", t);
                      }}
                      disabled={isDisabled}
                      title={
                        !dateValid
                          ? "Select a valid date first"
                          : hasActiveBooking
                            ? "You already have an active booking"
                            : !slotsLoaded || checkingAvailability
                              ? "Loading availability…"
                              : !slotAvailable
                                ? "This slot is fully booked"
                                : ""
                      }
                      className={`py-2 sm:py-3 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-200 ${
                        active && !isDisabled
                          ? "border-red-500 bg-red-600/20 text-white shadow-md shadow-red-600/20 ring-1 ring-red-500/40"
                          : isDisabled
                            ? "border-white/5 bg-white/3 text-gray-600 cursor-not-allowed opacity-40"
                            : "border-white/8 bg-white/3 text-gray-400 hover:border-red-500/40 hover:bg-red-600/8 hover:text-white cursor-pointer"
                      }`}
                    >
                      {t}
                      {isDisabled &&
                        slotsLoaded &&
                        !checkingAvailability &&
                        !hasActiveBooking &&
                        dateValid && (
                          <span className="block text-[8px] text-gray-600 font-normal">
                            Fully Booked
                          </span>
                        )}
                      {checkingAvailability && (
                        <span className="block text-[8px] text-gray-600 font-normal">
                          Loading…
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {form.date &&
                form.date >= todayISO() &&
                !checkingAvailability &&
                availableSlots !== null &&
                !hasActiveBooking && (
                  <p className="text-gray-500 text-[8px] sm:text-[10px] mt-2">
                    {availableCount > 0
                      ? `${availableCount} slot${availableCount !== 1 ? "s" : ""} available`
                      : "No slots available. Please choose another day."}
                  </p>
                )}
            </div>

            {form.date && form.time && (
              <div className="flex items-center gap-2 bg-white/4 rounded-xl px-3 py-2.5 border border-white/8">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-gray-300 text-[10px] sm:text-xs">
                  <span className="text-white font-semibold">{form.date}</span>{" "}
                  at{" "}
                  <span className="text-white font-semibold">{form.time}</span>{" "}
                  · <span className="text-gray-500">{form.branch?.name}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Details ── */}
        {step === 4 && (
          <div className="space-y-4">
            {form.damageData && (
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-4 h-4 text-blue-500"
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
                  <span className="text-blue-400 font-semibold text-[10px] sm:text-xs">
                    Damage Detection Data Included
                  </span>
                </div>
                <p className="text-gray-400 text-[9px] sm:text-[10px]">
                  AI analysis results will be attached to your booking
                </p>
              </div>
            )}

            {[
              {
                label: "Vehicle Type",
                key: "vehicle",
                placeholder: "e.g. Toyota Vios, Honda Civic...",
                apiKey: "vehicle",
              },
              {
                label: "Plate Number",
                key: "plateNumber",
                placeholder: "e.g. ABC1234 (max 8 chars)",
                apiKey: "plate_number",
              },
            ].map(({ label, key, placeholder, apiKey }) => (
              <div key={key}>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  {label} <span className="text-red-500">*</span>
                  {key === "plateNumber" && (
                    <span className="ml-2 text-gray-600 font-normal normal-case text-[9px]">
                      Letters & numbers only · max 8 chars
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={form[key]}
                  maxLength={key === "plateNumber" ? 8 : undefined}
                  onChange={(e) => {
                    if (key === "plateNumber") {
                      const sanitized = sanitizePlate(e.target.value);
                      set("plateNumber", sanitized);
                    } else {
                      set(key, e.target.value);
                    }
                  }}
                  className={`w-full bg-white/5 border rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 hover:border-white/20 transition-all duration-200 ${fieldErrors[apiKey] ? "border-red-500" : "border-white/10"}`}
                />
                {key === "plateNumber" && (
                  <div className="flex items-center justify-between mt-1">
                    <p
                      className={`text-[9px] sm:text-[10px] transition-colors ${form.plateNumber.length === 8 ? "text-yellow-500" : "text-gray-600"}`}
                    >
                      {form.plateNumber.length}/8
                    </p>
                    {fieldErrors[apiKey] && (
                      <p className="text-red-400 text-[9px] sm:text-[10px]">
                        {fieldErrors[apiKey]}
                      </p>
                    )}
                  </div>
                )}
                {key !== "plateNumber" && fieldErrors[apiKey] && (
                  <p className="text-red-400 text-[9px] sm:text-[10px] mt-1">
                    {fieldErrors[apiKey]}
                  </p>
                )}
              </div>
            ))}

            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Employee Assignment
              </label>
              <div className="w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm">
                {bookingMode === "specific"
                  ? form.preferredEmployee?.full_name ||
                    "Specific employee selected"
                  : "General (any available employee)"}
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Special Requests{" "}
                <span className="text-gray-600 font-normal normal-case">
                  (optional)
                </span>
              </label>
              <textarea
                rows={3}
                placeholder="Specific areas of concern, access instructions..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 hover:border-white/20 transition-all duration-200 resize-none"
              />
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
              <div className="px-3 sm:px-4 py-2.5 border-b border-white/8">
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Booking Summary
                </p>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  [
                    "Booking Type",
                    bookingMode === "specific"
                      ? "Specific Employee"
                      : "General Booking",
                  ],
                  [
                    "Service",
                    form.services && form.services.length > 0
                      ? form.services.map((s) => s.name).join(", ")
                      : "—",
                  ],
                  ["Branch", form.branch?.name],
                  ["Date", form.date],
                  ["Time", form.time],
                  [
                    "Employee",
                    form.preferredEmployee?.full_name || "No preference",
                  ],
                  [
                    "Price",
                    form.services && form.services.length > 0
                      ? `₱${form.services
                          .reduce((sum, s) => sum + parseFloat(s.price || 0), 0)
                          .toLocaleString()}`
                      : "—",
                    true,
                  ],
                ].map(([label, value, highlight]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-3 sm:px-4 py-2"
                  >
                    <span className="text-gray-500 text-[10px] sm:text-xs">
                      {label}
                    </span>
                    <span
                      className={`text-[10px] sm:text-xs font-semibold ${highlight ? "text-red-400 text-sm font-black" : "text-white"}`}
                    >
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 bg-red-600/10 border border-red-600/25 rounded-xl px-3 py-2.5 text-red-400 text-[10px] sm:text-xs">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t border-white/8 flex-shrink-0 bg-[#0a0a0a]">
        <button
          type="button"
          onClick={
            step > 0
              ? () => {
                  setStep((s) => s - 1);
                  setError("");
                  setFieldErrors({});
                }
              : onClose
          }
          className="px-3 sm:px-5 py-2 sm:py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 font-semibold text-xs sm:text-sm transition-all duration-200"
        >
          {step > 0 ? "Back" : "Cancel"}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-2 sm:py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/25 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            Continue
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 sm:py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/25 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
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
                Submitting...
              </>
            ) : (
              <>
                Confirm Booking
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
              </>
            )}
          </button>
        )}
      </div>
    </SlidePanel>
  );
}

// ─── Option Selector Modal ────────────────────────────────────────────────────

function OptionSelectorModal({ onClose, onSelectOption }) {
  const options = [
    {
      key: "booking",
      title: "Book an Appointment",
      desc: "Schedule a service for your vehicle",
      iconBg: "bg-red-600/20 group-hover:bg-red-600/30",
      iconColor: "text-red-500",
      ctaColor: "text-red-400",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      cta: "Get started",
    },
    {
      key: "damage",
      title: "Damage Detection",
      desc: "Use AI to analyze vehicle damage before booking",
      iconBg: "bg-blue-600/20 group-hover:bg-blue-600/30",
      iconColor: "text-blue-500",
      ctaColor: "text-blue-400",
      icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
      cta: "Upload photos",
    },
  ];
  return (
    <SlidePanel onClose={onClose}>
      <PanelHeader
        title="Choose Option"
        accent="Option"
        subtitle="Select what you'd like to do"
        onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="space-y-3">
          {options.map(
            ({ key, title, desc, iconBg, iconColor, ctaColor, icon, cta }) => (
              <button
                key={key}
                onClick={() => onSelectOption(key)}
                className="w-full p-4 sm:p-6 rounded-2xl border border-white/8 bg-gradient-to-br from-gray-900 to-black hover:border-white/20 transition-all duration-300 text-left group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl ${iconBg} flex items-center justify-center transition-colors shrink-0`}
                  >
                    <svg
                      className={`w-5 h-5 sm:w-7 sm:h-7 ${iconColor}`}
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2">
                      {title}
                    </h3>
                    <p className="text-gray-400 text-[10px] sm:text-xs mb-2">
                      {desc}
                    </p>
                    <div
                      className={`flex items-center gap-1.5 ${ctaColor} text-[10px] sm:text-xs font-semibold`}
                    >
                      {cta}
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            ),
          )}
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type = "success", onDismiss }) {
  const isSuccess = type === "success";
  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] flex items-center gap-2 ${isSuccess ? "bg-green-600 shadow-green-600/40" : "bg-red-600 shadow-red-600/40"} text-white px-3 sm:px-5 py-2.5 sm:py-4 rounded-2xl shadow-2xl max-w-[calc(100%-2rem)] sm:max-w-sm`}
      style={{ animation: "toastUp 0.3s ease-out" }}
    >
      <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        {isSuccess ? (
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4"
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
        )}
      </div>
      <span className="font-semibold text-[10px] sm:text-xs">{message}</span>
      <button
        onClick={onDismiss}
        className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
      >
        <svg
          className="w-3 h-3 sm:w-4 sm:h-4"
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
      <style>{`@keyframes toastUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}

// ─── Reschedule Response Modal ────────────────────────────────────────────────

function RescheduleResponseModal({ booking, onClose, onDecide }) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // Add this state declaration

  const options = booking.reschedule_options ?? [];

  const rawSvc = booking.service;
  const serviceName =
    booking.service_name ||
    booking.service_detail?.name ||
    (typeof rawSvc === "string" && rawSvc.trim() !== "" && isNaN(rawSvc)
      ? rawSvc
      : `Service #${rawSvc}`);

  const handleDecision = async (decision) => {
    if (decision === "accept" && options.length > 1 && !selected) return;
    setLoading(true);
    await onDecide(booking, decision, selected ?? options[0] ?? null);
    setLoading(false);
  };

  return (
    <CenterModal onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div className="min-w-0 mr-3">
          <h2 className="text-base sm:text-xl font-black text-white">
            Reschedule <span className="text-indigo-400">Proposal</span>
          </h2>
          <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 truncate max-w-[200px] sm:max-w-xs">
            {serviceName}
          </p>
        </div>
        <CloseBtn onClick={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* Info banner */}
        <div className="bg-indigo-600/10 rounded-xl border border-indigo-600/20 px-3 py-2.5 sm:p-4 flex items-start gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-indigo-300 text-xs sm:text-sm font-semibold mb-0.5">
              Staff proposed a new schedule
            </p>
            <p className="text-gray-400 text-[10px] sm:text-xs">
              Your original booking has been rescheduled. Please review and
              respond below.
            </p>
          </div>
        </div>

        {/* Original booking details */}
        <div className="bg-white/4 rounded-xl p-3 sm:p-4 border border-white/8">
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Original Booking
          </p>
          <div className="space-y-1 text-xs sm:text-sm">
            {[
              ["Date", booking.date],
              ["Time", toDisplayTime(booking.time)],
              booking.branch && [
                "Branch",
                typeof booking.branch === "object"
                  ? booking.branch.name
                  : booking.branch,
              ],
            ]
              .filter(Boolean)
              .map(([l, v]) => (
                <div key={l} className="flex justify-between gap-4">
                  <span className="text-gray-500">{l}:</span>
                  <span className="text-white font-semibold text-right line-through opacity-50">
                    {v}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Proposed options */}
        <div>
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Proposed{" "}
            {options.length > 1 ? "Options — Pick One" : "New Schedule"}
          </p>
          {options.length === 0 ? (
            <p className="text-gray-500 text-xs">
              No specific options provided. Contact the branch for details.
            </p>
          ) : (
            <div className="space-y-2">
              {options.map((opt, i) => {
                const isActive =
                  selected === opt || (options.length === 1 && i === 0);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelected(opt)}
                    className={`w-full p-3 sm:p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      isActive
                        ? "border-indigo-500 bg-indigo-600/12"
                        : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isActive
                          ? "border-indigo-500 bg-indigo-500"
                          : "border-white/30"
                      }`}
                    >
                      {isActive && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {typeof opt === "object" ? (
                        <>
                          <div className="text-white font-semibold text-xs sm:text-sm">
                            {opt.date}
                            {opt.time && (
                              <span className="text-indigo-300 ml-2">
                                @ {toDisplayTime(opt.time)}
                              </span>
                            )}
                          </div>
                          {opt.note && (
                            <div className="text-gray-500 text-[10px] mt-0.5">
                              {opt.note}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-white font-semibold text-xs sm:text-sm">
                          {String(opt)}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002-2z"
                        />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t border-white/8 flex-shrink-0 bg-[#0a0a0a]">
        <button
          onClick={() => handleDecision("decline")}
          disabled={loading}
          className="flex-1 py-2 sm:py-3 rounded-xl border border-red-600/40 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs sm:text-sm transition-all"
        >
          {loading ? "Submitting..." : "Decline"}
        </button>
        <button
          onClick={() => handleDecision("accept")}
          disabled={loading || (options.length > 1 && !selected)}
          className="flex-1 py-2 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <>
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
              Submitting...
            </>
          ) : (
            <>
              Accept Reschedule
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
            </>
          )}
        </button>
      </div>
    </CenterModal>
  );
}

// ─── Customer Reschedule Request Modal ───────────────────────────────────────

function CustomerRescheduleModal({ booking, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const rawSvc = booking.service;
  const serviceName =
    booking.service_name ||
    booking.service_detail?.name ||
    (typeof rawSvc === "string" && rawSvc.trim() !== "" && isNaN(rawSvc)
      ? rawSvc
      : `Service #${rawSvc}`);

  const validate = (value) => {
    if (!value.trim()) return "Please provide a reason.";
    if (value.trim().length < 10)
      return "Reason must be at least 10 characters.";
    if (value.trim().length > 300)
      return "Reason must be under 300 characters.";
    if (containsProfanity(value))
      return "Please keep your message professional — no profanity allowed.";
    return "";
  };

  const handleSubmit = async () => {
    const err = validate(reason);
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    await onSubmit(reason.trim());
    setLoading(false);
  };

  return (
    <CenterModal onClose={onClose}>
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div className="min-w-0 mr-3">
          <h2 className="text-base sm:text-xl font-black text-white">
            Request <span className="text-indigo-400">Reschedule</span>
          </h2>
          <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 truncate max-w-[200px] sm:max-w-xs">
            {serviceName}
          </p>
        </div>
        <CloseBtn onClick={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* Info banner */}
        <div className="bg-indigo-600/10 rounded-xl border border-indigo-600/20 px-3 py-2.5 sm:p-4 flex items-start gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400"
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
          </div>
          <div>
            <p className="text-indigo-300 text-xs sm:text-sm font-semibold mb-0.5">
              Notify staff of your request
            </p>
            <p className="text-gray-400 text-[10px] sm:text-xs">
              Staff will review your request and propose a new schedule for you
              to approve.
            </p>
          </div>
        </div>

        {/* Current booking info */}
        <div className="bg-white/4 rounded-xl p-3 sm:p-4 border border-white/8">
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Current Booking
          </p>
          <div className="space-y-1 text-xs sm:text-sm">
            {[
              ["Date", booking.date],
              ["Time", toDisplayTime(booking.time)],
              booking.branch && [
                "Branch",
                typeof booking.branch === "object"
                  ? booking.branch.name
                  : booking.branch,
              ],
            ]
              .filter(Boolean)
              .map(([l, v]) => (
                <div key={l} className="flex justify-between gap-4">
                  <span className="text-gray-500">{l}:</span>
                  <span className="text-white font-semibold text-right">
                    {v}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Reason textarea */}
        <div>
          <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            Reason for Reschedule <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            maxLength={300}
            placeholder="e.g. I have a conflict on this date and need to move the appointment..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
            className={`w-full bg-white/5 border rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none ${error ? "border-red-500" : "border-white/10"}`}
          />
          <div className="flex justify-between items-start mt-1">
            {error ? (
              <p className="text-red-400 text-[10px] sm:text-xs">{error}</p>
            ) : (
              <span />
            )}
            <p
              className={`text-[10px] ml-auto ${reason.length > 280 ? "text-yellow-400" : "text-gray-600"}`}
            >
              {reason.length}/300
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t border-white/8 flex-shrink-0 bg-[#0a0a0a]">
        <button
          onClick={onClose}
          className="flex-1 px-3 py-2 sm:py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white font-semibold text-xs sm:text-sm transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !reason.trim()}
          className="flex-1 py-2 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <>
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
              Sending...
            </>
          ) : (
            <>
              Send Request
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
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </CenterModal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function BookingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [showOptionModal, setShowOptionModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [prefillServiceId, setPrefillServiceId] = useState(null);
  const [damageData, setDamageData] = useState(null);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [customerRescheduleBooking, setCustomerRescheduleBooking] =
    useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/bookings/`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data) =>
        setBookings(Array.isArray(data) ? data : (data.results ?? [])),
      )
      .catch((err) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived: does user have an active booking? ──
  const hasActiveBooking = useMemo(
    () =>
      bookings.some((b) => b.status === "pending" || b.status === "confirmed"),
    [bookings],
  );

  useEffect(() => {
    const openBooking = location.state?.openBooking;
    const serviceId = location.state?.prefillServiceId;
    if (!openBooking) return;
    setShowOptionModal(false);
    setShowDamageModal(false);
    setDamageData(null);
    setPrefillServiceId(serviceId ?? null);
    setShowBookingModal(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const filtered = useMemo(
    () =>
      filter === "all" ? bookings : bookings.filter((b) => b.status === filter),
    [bookings, filter],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCancelConfirm = async (reason) => {
    const booking = cancelBooking;
    if (!booking) return;
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${booking.id}/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          status: "cancelled",
          cancellation_reason: reason,
        }),
      });
      if (!res.ok) throw new Error();
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, status: "cancelled" } : b,
        ),
      );
      showToast("Booking cancelled successfully.");
      setCancelBooking(null);
    } catch {
      showToast("Failed to cancel booking.", "error");
      setCancelBooking(null);
    }
  };

  const handleRescheduleDecision = async (
    booking,
    decision,
    selectedOption = null,
  ) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/bookings/${booking.id}/reschedule-response/`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            decision,
            selected_option: selectedOption,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Failed to submit response.");
      }
      setBookings((prev) => prev.map((b) => (b.id === data.id ? data : b)));
      setRescheduleBooking(null);
      showToast(
        decision === "accept"
          ? "Reschedule accepted successfully."
          : "Reschedule declined. Our team will follow up.",
      );
    } catch (e) {
      showToast(e.message || "Failed to send request.", "error");
    }
  };

  const handleCustomerRescheduleRequest = async (reason) => {
    const booking = customerRescheduleBooking;
    if (!booking) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/bookings/${booking.id}/request-reschedule/`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ reason }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to send request.");
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, ...data } : b)),
      );
      setCustomerRescheduleBooking(null);
      showToast("Reschedule request sent! Staff will follow up.");
    } catch (e) {
      showToast(e.message || "Failed to send request.", "error");
    }
  };

  const handleBookingSuccess = (newBooking) => {
    setBookings((prev) => [newBooking, ...prev]);
    setShowBookingModal(false);
    setShowDamageModal(false);
    setDamageData(null);
    setPrefillServiceId(null);
    setPage(1);
    showToast("Your booking was submitted successfully!");
  };

  const handleOptionSelect = (option) => {
    setShowOptionModal(false);
    if (option === "booking") {
      setPrefillServiceId(null);
      setShowBookingModal(true);
      return;
    }
    setShowDamageModal(true);
  };

  const handleDamageComplete = (data) => {
    if (data.type === "booking" && data.damageData) {
      setDamageData(data.damageData);
      setShowDamageModal(false);
      setShowBookingModal(true);
    }
  };

  // ── New Booking button: disabled + tooltip if user has an active booking ──
  const newBookingDisabled = !loading && hasActiveBooking;

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-3 sm:p-5 lg:p-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
              My <span className="text-red-600">Bookings</span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm">
              Manage and track all your appointments.
            </p>
          </div>

          {/* New Booking button — disabled with tooltip if active booking exists */}
          <div className="relative group self-start sm:self-auto">
            <button
              onClick={() => {
                if (!newBookingDisabled) setShowOptionModal(true);
              }}
              disabled={newBookingDisabled}
              className={`flex items-center gap-1.5 font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 shadow-xl ${
                newBookingDisabled
                  ? "bg-red-600/30 text-red-300/50 cursor-not-allowed shadow-none"
                  : "bg-red-600 hover:bg-red-500 text-white hover:scale-105 shadow-red-600/30"
              }`}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
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
              New Booking
            </button>
            {/* Tooltip shown on hover when disabled */}
            {newBookingDisabled && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-gray-900 border border-red-600/30 rounded-xl px-3 py-2 text-center shadow-xl">
                  <p className="text-red-400 text-[10px] font-semibold leading-tight">
                    Active booking in progress
                  </p>
                  <p className="text-gray-500 text-[9px] mt-0.5">
                    Please complete or cancel your current booking first.
                  </p>
                </div>
                <div className="w-2 h-2 bg-gray-900 border-r border-b border-red-600/30 rotate-45 mx-auto -mt-1" />
              </div>
            )}
          </div>
        </div>

        {/* ── Active booking banner ── */}
        {!loading && hasActiveBooking && (
          <div className="mb-5 sm:mb-6 flex items-center gap-3 bg-yellow-600/10 border border-yellow-600/25 rounded-2xl px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-600/20 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-yellow-500"
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
            </div>
            <div>
              <p className="text-yellow-400 font-semibold text-xs sm:text-sm">
                You have an active booking
              </p>
              <p className="text-gray-500 text-[10px] sm:text-xs">
                New bookings are blocked until your current one is completed or
                cancelled.
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: "Total", value: bookings.length, color: "text-white" },
            {
              label: "Confirmed",
              value: bookings.filter((b) => b.status === "confirmed").length,
              color: "text-green-400",
            },
            {
              label: "Pending",
              value: bookings.filter((b) => b.status === "pending").length,
              color: "text-yellow-400",
            },
            {
              label: "Completed",
              value: bookings.filter((b) => b.status === "done").length,
              color: "text-blue-400",
            },
            {
              label: "Cancelled",
              value: bookings.filter((b) => b.status === "cancelled").length,
              color: "text-red-400",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-xl p-3 sm:p-5 border border-white/5 text-center hover:border-white/10 transition-colors duration-200"
            >
              <div
                className={`text-xl sm:text-2xl lg:text-3xl font-black ${color} mb-0.5 sm:mb-1`}
              >
                {value}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
          {["all", "confirmed", "pending", "done", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl font-semibold text-[10px] sm:text-xs capitalize transition-all duration-200 ${
                filter === f
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-gray-900 text-gray-400 border border-white/10 hover:text-white hover:border-red-600/40 hover:bg-red-600/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Results meta */}
        {!loading && !fetchError && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 sm:mb-4">
            <p className="text-[10px] sm:text-xs text-gray-500">
              Showing{" "}
              <span className="text-white font-semibold">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="text-white font-semibold">
                {filtered.length}
              </span>
            </p>
            <p className="text-[10px] sm:text-xs text-gray-600">
              Page {page} of {totalPages}
            </p>
          </div>
        )}

        {/* ── Bookings List ── */}
        <div className="space-y-2.5 sm:space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-16 text-gray-500 text-xs">
              <svg
                className="w-5 h-5 animate-spin mr-2"
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
              Loading your bookings…
            </div>
          )}

          {!loading && fetchError && (
            <div className="flex items-center gap-2 bg-red-600/10 border border-red-600/25 rounded-2xl px-4 py-3 text-red-400 text-[10px] sm:text-xs">
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
              {fetchError}
            </div>
          )}

          {!loading &&
            !fetchError &&
            paginated.map((booking) => {
              const sc = statusConfig[booking.status] || statusConfig.pending;
              const rawSvc = booking.service;
              const serviceName =
                booking.service_name ||
                booking.service_detail?.name ||
                (typeof rawSvc === "string" &&
                rawSvc.trim() !== "" &&
                isNaN(rawSvc)
                  ? rawSvc
                  : typeof rawSvc === "number" ||
                      (typeof rawSvc === "string" && !isNaN(rawSvc))
                    ? `Service #${rawSvc}`
                    : String(rawSvc || "Unknown Service"));
              const displayTime = toDisplayTime(booking.time);
              const rawPrice = parseFloat(booking.price);
              const priceDisplay =
                !isNaN(rawPrice) &&
                booking.price != null &&
                booking.price !== ""
                  ? rawPrice > 0
                    ? `₱${rawPrice.toLocaleString("en-PH")}`
                    : "To be assessed"
                  : "—";

              return (
                <div
                  key={booking.id}
                  className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-4 sm:p-6 border border-white/5 hover:border-red-600/25 hover:bg-gradient-to-br hover:from-gray-900 hover:to-red-950/20 transition-all duration-200"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
                        <h3 className="text-base sm:text-lg lg:text-xl font-black text-white">
                          {serviceName}
                        </h3>
                        <span
                          className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold border ${sc.color}`}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-x-4 sm:gap-x-5 gap-y-1.5 sm:gap-y-2 text-gray-400 text-[10px] sm:text-xs">
                        {[
                          {
                            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                            text: booking.date,
                          },
                          {
                            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                            text: displayTime,
                          },
                          booking.staff && {
                            icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                            text: booking.staff,
                          },
                          booking.branch && {
                            icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
                            text:
                              typeof booking.branch === "object"
                                ? booking.branch.name
                                : booking.branch,
                          },
                        ]
                          .filter(Boolean)
                          .map(
                            ({ icon, text }) =>
                              text && (
                                <div
                                  key={icon}
                                  className="flex items-center gap-1 sm:gap-2"
                                >
                                  <svg
                                    className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 flex-shrink-0"
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
                                  <span className="truncate">{text}</span>
                                </div>
                              ),
                          )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-wrap">
                      <div className="text-lg sm:text-xl lg:text-2xl font-black text-white">
                        {priceDisplay}
                      </div>
                      {booking.status !== "cancelled" &&
                        booking.status !== "done" && (
                          <div className="flex gap-2">
                            {booking.status === "rescheduled" && (
                              <button
                                onClick={() => setRescheduleBooking(booking)}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-600/40 text-indigo-300 hover:text-white rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-200 flex items-center gap-1"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002-2z"
                                  />
                                </svg>
                                View & Respond
                              </button>
                            )}
                            {(booking.status === "pending" ||
                              booking.status === "confirmed") && (
                              <button
                                onClick={() =>
                                  setCustomerRescheduleBooking(booking)
                                }
                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-600/40 text-indigo-300 hover:text-white rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-200 flex items-center gap-1"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002-2z"
                                  />
                                </svg>
                                Request Reschedule
                              </button>
                            )}

                            <button
                              onClick={() => setCancelBooking(booking)}
                              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600/15 hover:bg-red-600 border border-red-600/40 hover:border-red-500 text-red-400 hover:text-white rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}

          {!loading && !fetchError && filtered.length === 0 && (
            <div className="text-center py-16 sm:py-24 text-gray-500">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 opacity-20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm sm:text-lg font-semibold">
                No bookings found
              </p>
            </div>
          )}
        </div>

        <Pagination current={page} total={totalPages} onChange={setPage} />
      </div>

      {/* Modals */}
      {showOptionModal && (
        <OptionSelectorModal
          onClose={() => setShowOptionModal(false)}
          onSelectOption={handleOptionSelect}
        />
      )}
      {showBookingModal && (
        <NewBookingModal
          onClose={() => {
            setShowBookingModal(false);
            setDamageData(null);
            setPrefillServiceId(null);
          }}
          onSuccess={handleBookingSuccess}
          initialDamageData={damageData}
          initialServiceId={prefillServiceId}
        />
      )}
      {showDamageModal && (
        <DamageDetectionModal
          onClose={() => setShowDamageModal(false)}
          onBack={handleDamageComplete}
        />
      )}
      {cancelBooking && (
        <CancelBookingModal
          booking={cancelBooking}
          onClose={() => setCancelBooking(null)}
          onConfirm={handleCancelConfirm}
        />
      )}
      {rescheduleBooking && (
        <RescheduleResponseModal
          booking={rescheduleBooking}
          onClose={() => setRescheduleBooking(null)}
          onDecide={handleRescheduleDecision}
        />
      )}
      {customerRescheduleBooking && (
        <CustomerRescheduleModal
          booking={customerRescheduleBooking}
          onClose={() => setCustomerRescheduleBooking(null)}
          onSubmit={handleCustomerRescheduleRequest}
        />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </CustomerLayout>
  );
}

export default BookingsPage;